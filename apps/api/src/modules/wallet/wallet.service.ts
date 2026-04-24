import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class WalletService {
  constructor(
    private prisma: PrismaService,
  ) {}

  private getStripe(): Stripe {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('Stripe is not configured');
    }
    return new Stripe(secretKey);
  }

  async getWallet(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true }
    })
    
    const transactions = await this.prisma.walletTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    })
    
    return {
      balance: user?.walletBalance || 0,
      transactions,
    }
  }

  async createTopupIntent(userId: string, amount: number) {
    const stripe = this.getStripe();
    
    if (amount < 10) throw new BadRequestException('الحد الأدنى للشحن 10 ريال')
    if (amount > 10000) throw new BadRequestException('الحد الأقصى للشحن 10,000 ريال')
    
    const amountInHalala = Math.round(amount * 100);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInHalala,
      currency: 'sar',
      metadata: {
        userId,
        type: 'WALLET_TOPUP',
        amountSAR: amount.toString(),
      },
    })
    
    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    }
  }

  async confirmTopup(userId: string, paymentIntentId: string) {
    const stripe = this.getStripe();
    
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      throw new BadRequestException('لم يتم تأكيد الدفع');
    }
    
    if (paymentIntent.metadata.userId !== userId) {
      throw new ForbiddenException('غير مصرح');
    }
    
    const amount = parseFloat(paymentIntent.metadata.amountSAR);
    
    const existing = await this.prisma.walletTransaction.findFirst({
      where: { stripePaymentIntentId: paymentIntentId }
    });
    if (existing) return { balance: (await this.getWallet(userId)).balance };
    
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } }
    });
    
    await this.prisma.walletTransaction.create({
      data: {
        userId,
        type: 'TOPUP',
        amount,
        description: `شحن رصيد - ${amount} ريال`,
        status: 'SUCCESS',
        stripePaymentIntentId: paymentIntentId,
      }
    });

    await this.prisma.userActivity.create({
      data: {
        userId,
        action: 'WALLET_TOPUP',
        entity: 'Wallet',
        metadata: { amountSAR: amount },
      },
    }).catch(() => {});

    return { balance: updated.walletBalance };
  }

  async payWithWallet(userId: string, courseId: string) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('الكورس غير موجود');
    
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { walletBalance: true }
    });
    
    const price = course.price || 0;
    
    if (price === 0) {
      await this.prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId } },
        create: { userId, courseId },
        update: {},
      });
      return { success: true, message: 'تم الاشتراك مجاناً' };
    }
    
    if ((user?.walletBalance || 0) < price) {
      throw new BadRequestException({
        message: 'رصيد المحفظة غير كافٍ',
        code: 'INSUFFICIENT_BALANCE',
        required: price,
        current: user?.walletBalance || 0,
      });
    }
    
    const enrolled = await this.prisma.enrollment.findFirst({
      where: { userId, courseId }
    });
    if (enrolled) throw new BadRequestException('أنت مشترك بالفعل في هذا الكورس');
    
    await this.prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { decrement: price } }
    });
    
    await this.prisma.walletTransaction.create({
      data: {
        userId,
        type: 'PAYMENT',
        amount: -price,
        description: `شراء كورس: ${course.titleAr || course.titleEn}`,
        status: 'SUCCESS',
        courseId,
      }
    });
    
    await this.prisma.enrollment.create({
      data: { userId, courseId }
    });
    
    return { success: true, message: 'تم الاشتراك بنجاح' };
  }

  async transferFromEarnings(userId: string, amount: number) {
    if (amount <= 0) throw new BadRequestException('المبلغ يجب أن يكون أكبر من صفر')
    
    let totalEarnings = 0
    
    // Check ConsultingSession (consultants)
    try {
      const sessions = await this.prisma.consultingSession.findMany({
        where: { consultantId: userId, status: 'COMPLETED' }
      })
      totalEarnings = sessions.reduce((s: number, p: any) => s + (p.price || 0), 0)
      console.log('[Wallet] consultingSession earnings:', totalEarnings)
    } catch(e) {
      console.log('[Wallet] consultingSession error:', e.message)
    }
    
    // Check CoachingSession (coaches) - need to find coach by userId
    if (totalEarnings === 0) {
      try {
        const coach = await this.prisma.coach.findUnique({ where: { userId } })
        if (coach) {
          const sessions = await this.prisma.coachingSession.findMany({
            where: { coachId: coach.id, status: 'COMPLETED' }
          })
          totalEarnings = sessions.reduce((s: number, p: any) => s + (p.price || 0), 0)
          console.log('[Wallet] coachingSession earnings:', totalEarnings)
        }
      } catch(e) {
        console.log('[Wallet] coachingSession error:', e.message)
      }
    }
    
    // Check course payments for instructors
    if (totalEarnings === 0) {
      try {
        const courses = await this.prisma.course.findMany({
          where: { instructorId: userId },
          select: { id: true }
        })
        const courseIds = courses.map((c: any) => c.id)
        if (courseIds.length > 0) {
          const payments = await this.prisma.payment.findMany({
            where: { courseId: { in: courseIds }, status: 'SUCCESS' }
          })
          totalEarnings = payments.reduce((s: number, p: any) => s + (p.amount || 0), 0)
          console.log('[Wallet] payments earnings:', totalEarnings)
        }
      } catch(e) {
        console.log('[Wallet] payments error:', e.message)
      }
    }
    
    console.log('[Wallet] Total earnings found:', totalEarnings)
    
    const transferred = await this.prisma.walletTransaction.aggregate({
      where: { userId, type: 'EARNINGS_TRANSFER' },
      _sum: { amount: true }
    }).catch(() => ({ _sum: { amount: 0 } }))
    
    const alreadyTransferred = transferred._sum?.amount || 0
    const available = totalEarnings - alreadyTransferred
    
    console.log('[Wallet] Already transferred:', alreadyTransferred, 'Available:', available)
    
    if (amount > available) {
      throw new BadRequestException(`أرباحك المتاحة للتحويل: ${available.toFixed(2)} ر.س`)
    }
    
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { walletBalance: { increment: amount } }
    })
    
    await this.prisma.walletTransaction.create({
      data: {
        userId,
        type: 'EARNINGS_TRANSFER',
        amount,
        description: `تحويل من الأرباح - ${amount} ر.س`,
        status: 'SUCCESS',
      }
    })
    
    return { success: true, newBalance: updated.walletBalance, transferred: amount }
  }
}