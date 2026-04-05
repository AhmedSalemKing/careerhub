import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Request,
  UseGuards,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../../prisma/prisma.service';
import Stripe from 'stripe';

@Controller('payment')
export class PaymentController {
  private stripe: Stripe | null = null;

  constructor(private readonly prisma: PrismaService) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (key && !key.includes('your-stripe')) {
      this.stripe = new Stripe(key, { apiVersion: '2024-11-20.acacia' as any });
      console.log('[Payment] Stripe initialized ✅');
    } else {
      console.log('[Payment] No valid Stripe key — sandbox mode');
    }
  }

  // ─── GET CHECKOUT DATA ───────────────────────────────────────────────────
  @Get('checkout/:courseId')
  @UseGuards(JwtAuthGuard)
  async getCheckoutData(
    @Param('courseId') courseId: string,
    @Request() req: any,
  ) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId, status: 'PUBLISHED' },
      include: {
        instructor: {
          select: {
            profile: { select: { firstName: true, lastName: true } },
          },
        },
        category: { select: { nameAr: true, nameEn: true } },
        _count: { select: { enrollments: true, sections: true } },
      },
    });
    if (!course) throw new NotFoundException('Course not found or not published');

    const alreadyEnrolled = await this.prisma.enrollment
      .findUnique({
        where: { userId_courseId: { userId: req.user.sub, courseId } },
      })
      .catch(() => null);

    return { success: true, data: { course, alreadyEnrolled: !!alreadyEnrolled } };
  }

  // ─── CREATE PAYMENT INTENT ────────────────────────────────────────────────
  @Post('create-intent')
  @UseGuards(JwtAuthGuard)
  async createPaymentIntent(
    @Request() req: any,
    @Body() body: { courseId: string },
  ) {
    const userId = req.user.sub;
    const { courseId } = body;

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const enrolled = await this.prisma.enrollment
      .findUnique({ where: { userId_courseId: { userId, courseId } } })
      .catch(() => null);
    if (enrolled) throw new BadRequestException('Already enrolled in this course');

    // FREE COURSE
    if (course.price === 0) {
      const txId = `FREE_${Date.now()}`;
      await this.doEnroll(userId, courseId, course, 'FREE', 0, txId);
      return { success: true, data: { free: true, courseId } };
    }

    // STRIPE MODE
    if (this.stripe) {
      const courseTitle = course.titleAr || course.titleEn || 'Course';
      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: Math.round(course.price * 100),
        currency: 'sar',
        metadata: { userId, courseId, courseName: courseTitle },
        description: `DeveWay: ${courseTitle}`,
      });

      await this.prisma.payment.create({
        data: {
          userId,
          courseId,
          amount: course.price,
          currency: 'SAR',
          method: 'STRIPE_CARD',
          status: 'PENDING',
          transactionId: paymentIntent.id,
          stripeIntentId: paymentIntent.id,
        } as any,
      });

      return {
        success: true,
        data: {
          clientSecret: paymentIntent.client_secret,
          amount: course.price,
          currency: 'SAR',
          mode: 'stripe',
        },
      };
    }

    // SANDBOX MODE (no Stripe key)
    const txId = `SANDBOX_${Date.now()}_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    await this.doEnroll(userId, courseId, course, 'SANDBOX', course.price, txId);
    return { success: true, data: { sandbox: true, courseId, txId } };
  }

  // ─── CONFIRM STRIPE PAYMENT ───────────────────────────────────────────────
  @Post('confirm')
  @UseGuards(JwtAuthGuard)
  async confirmPayment(
    @Request() req: any,
    @Body() body: { paymentIntentId: string; courseId: string },
  ) {
    const userId = req.user.sub;
    const { paymentIntentId, courseId } = body;

    if (!this.stripe) throw new InternalServerErrorException('Stripe not configured');

    const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
    if (intent.status !== 'succeeded') {
      throw new BadRequestException('Payment not completed yet');
    }

    await this.prisma.payment.updateMany({
      where: { stripeIntentId: paymentIntentId } as any,
      data: { status: 'SUCCESS' },
    });

    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.prisma.enrollment
      .findUnique({ where: { userId_courseId: { userId, courseId } } })
      .catch(() => null);

    if (!existing) {
      await this.doEnroll(userId, courseId, course, 'STRIPE_CARD', course.price, paymentIntentId);
    }

    return { success: true, data: { courseId } };
  }

  // ─── MY PAYMENTS ──────────────────────────────────────────────────────────
  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  async getMyPayments(@Request() req: any) {
    const payments = await this.prisma.payment.findMany({
      where: { userId: req.user.sub },
      include: {
        course: { select: { id: true, titleAr: true, titleEn: true, thumbnail: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { success: true, data: payments };
  }

  // ─── HELPER: ENROLL USER ──────────────────────────────────────────────────
  private async doEnroll(
    userId: string,
    courseId: string,
    course: any,
    method: string,
    amount: number,
    txId: string,
  ) {
    const courseTitle = course.titleAr || course.titleEn || 'الكورس';

    // Payment record (upsert to avoid duplicates)
    await this.prisma.payment.upsert({
      where: { transactionId: txId },
      update: { status: 'SUCCESS' },
      create: {
        userId,
        courseId,
        amount,
        currency: 'SAR',
        method,
        status: 'SUCCESS',
        transactionId: txId,
      } as any,
    });

    // Enrollment
    await this.prisma.enrollment.upsert({
      where: { userId_courseId: { userId, courseId } },
      update: {},
      create: { userId, courseId },
    });

    // Notification
    await this.prisma.notification
      .create({
        data: {
          userId,
          type: 'PAYMENT_CONFIRMED',
          titleEn: 'Course Enrollment Successful',
          titleAr: 'تم الاشتراك في الكورس بنجاح',
          contentEn: `You can now access the course "${course.titleEn || courseTitle}". Start your learning journey!`,
          contentAr: `يمكنك الآن الوصول إلى كورس "${courseTitle}". ابدأ رحلتك التعليمية!`,
          isRead: false,
        },
      })
      .catch(() => {});

    // Remove from cart
    const cart = await this.prisma.cart
      .findUnique({ where: { userId } })
      .catch(() => null);
    if (cart) {
      await this.prisma.cartItem
        .deleteMany({ where: { cartId: cart.id, courseId } })
        .catch(() => {});
    }
  }
}
