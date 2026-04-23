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
}