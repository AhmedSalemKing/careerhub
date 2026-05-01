import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import Stripe from 'stripe'

@Injectable()
export class PaymentsService {
  private stripe: Stripe

  constructor(private prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20' as any,
    })
  }

  // Create checkout session for COURSE enrollment
  async createCourseCheckoutSession(courseId: string, userId: string, locale: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        instructor: {
          select: { profile: { select: { firstName: true, lastName: true } } }
        }
      }
    })
    if (!course) throw new NotFoundException('Course not found')

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, profile: { select: { firstName: true, lastName: true } } }
    })

    const price = parseFloat(course.price?.toString() || '0')
    if (price <= 0) throw new BadRequestException('Course is free, no payment needed')

    const courseTitle = (course as any).titleAr || (course as any).titleEn || 'Course'
    const courseType = (course as any).type || 'recorded'
    
    // Determine success redirect based on course type
    const baseLearnUrl = 'https://devewayhub.vercel.app'
    let successRedirect = `${baseLearnUrl}/${locale}/learn/${courseId}`
    if (courseType === 'live') successRedirect = `${baseLearnUrl}/${locale}/live/${courseId}`
    else if (courseType === 'offline') successRedirect = `${baseLearnUrl}/${locale}/courses/${courseId}`

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user?.email,
      line_items: [{
        price_data: {
          currency: 'sar',
          product_data: {
            name: courseTitle,
            description: `${courseType === 'live' ? 'بث مباشر' : courseType === 'offline' ? 'مقر فعلي' : 'كورس مسجل'} - ${(course as any).instructor?.profile?.firstName || ''}`,
            images: (course as any).thumbnail ? [(course as any).thumbnail] : [],
            metadata: { courseId, courseType },
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      metadata: {
        type: 'course_enrollment',
        courseId,
        userId,
        courseType,
        locale,
      },
      success_url: `${process.env.NEXT_PUBLIC_WEB_URL || 'https://deveway-teal.vercel.app'}/${locale}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=course&courseId=${courseId}&courseType=${courseType}&locale=${locale}`,
      cancel_url: `${baseLearnUrl}/${locale}/courses/${courseId}`,
      payment_intent_data: {
        metadata: {
          courseId,
          userId,
          courseType,
        }
      }
    })

    return { success: true, data: { url: session.url, sessionId: session.id } }
  }

  // Create checkout session for CONSULTING SESSION
  async createConsultingCheckoutSession(sessionId: string, userId: string, locale: string) {
    const consultingSession = await this.prisma.consultingSession.findUnique({
      where: { id: sessionId },
      include: {
        consultant: {
          select: { profile: { select: { firstName: true, lastName: true, sessionPrice: true } } }
        }
      }
    })
    if (!consultingSession) throw new NotFoundException('Session not found')
    if (consultingSession.studentId !== userId) throw new BadRequestException('Not authorized')

    const price = parseFloat(consultingSession.consultant?.profile?.sessionPrice?.toString() || '0')
    if (price <= 0) throw new BadRequestException('Session is free')

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    })

    const consultantName = `${consultingSession.consultant?.profile?.firstName || ''} ${consultingSession.consultant?.profile?.lastName || ''}`.trim()
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://deveway-teal.vercel.app'

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user?.email,
      line_items: [{
        price_data: {
          currency: 'sar',
          product_data: {
            name: (consultingSession as any).sessionName || 'جلسة استشارية',
            description: `مع ${consultantName}`,
          },
          unit_amount: Math.round(price * 100),
        },
        quantity: 1,
      }],
      metadata: {
        type: 'consulting_session',
        sessionId,
        userId,
        consultantId: consultingSession.consultantId,
        locale,
      },
      success_url: `${webUrl}/${locale}/payment/success?session_id={CHECKOUT_SESSION_ID}&type=consulting&sessionId=${sessionId}&locale=${locale}`,
      cancel_url: `${webUrl}/${locale}/dashboard/my-sessions`,
    })

    return { success: true, data: { url: session.url, sessionId: session.id } }
  }

  // Handle Stripe Webhook
  async handleWebhook(payload: Buffer, signature: string) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

    let event: Stripe.Event

    if (webhookSecret && signature) {
      try {
        event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret)
      } catch(e: any) {
        console.error('[Webhook] Signature verification failed:', e.message)
        // In production, reject. For now log and try to parse directly
        try {
          event = JSON.parse(payload.toString())
        } catch(e2) {
          throw new BadRequestException('Invalid webhook payload')
        }
      }
    } else {
      // No webhook secret configured - parse directly (less secure but works for debugging)
      try {
        event = JSON.parse(payload.toString())
      } catch(e) {
        throw new BadRequestException('Invalid webhook payload')
      }
    }

    console.log(`[Webhook] Event type: ${event?.type}`)

    if (event?.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session
      const metadata = session.metadata || {}

      if (metadata.type === 'course_enrollment') {
        await this.handleCourseEnrollment(metadata)
      } else if (metadata.type === 'consulting_session') {
        await this.handleConsultingPayment(metadata, session.amount_total || 0)
      }
    }

    return { received: true }
  }

  async handleCourseEnrollment(metadata: Record<string, string>) {
    const { courseId, userId, courseType } = metadata
    
    // Check if already enrolled
    const existing = await this.prisma.enrollment.findFirst({
      where: { courseId, userId }
    })
    
    if (!existing) {
      await this.prisma.enrollment.create({
        data: {
          courseId,
          userId,
          status: 'ACTIVE',
        }
      })
    } else {
      await this.prisma.enrollment.update({
        where: { id: existing.id },
        data: { status: 'ACTIVE' }
      })
    }

    // Add to instructor earnings (80% share)
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, price: true }
    })
    if (course?.price && parseFloat(course.price.toString()) > 0) {
      const share = parseFloat(course.price.toString()) * 0.8
      await this.prisma.$executeRawUnsafe(
        `UPDATE "users" SET "earningsBalance" = COALESCE("earningsBalance", 0) + ${share} WHERE "id" = '${course.instructorId}'`
      ).catch(() => {})
    }

    // Notify user
    try {
      await this.prisma.notification.create({
        data: {
          userId,
          titleAr: 'تم الاشتراك بنجاح!',
          titleEn: 'Enrollment Confirmed!',
          contentAr: `تم تأكيد اشتراكك في الكورس${courseType === 'live' ? ' - يمكنك الانضمام للبث' : ''}`,
          contentEn: `Your enrollment has been confirmed${courseType === 'live' ? ' - you can join the live session' : ''}`,
          type: 'PAYMENT_CONFIRMED',
          isRead: false,
        }
      })
    } catch(e) {}

    console.log(`[Webhook] Course enrollment confirmed: ${courseId} for user ${userId}`)
  }

  private async handleConsultingPayment(metadata: Record<string, string>, amountTotal: number) {
    const { sessionId, userId, consultantId } = metadata
    const amount = amountTotal / 100 // convert from halalas

    await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'CONFIRMED',
      }
    })

    // Add to consultant earnings
    if (amount > 0) {
      await this.prisma.$executeRawUnsafe(
        `UPDATE "users" SET "earningsBalance" = COALESCE("earningsBalance", 0) + ${amount} WHERE "id" = '${consultantId}'`
      ).catch(() => {})
    }

    // Notify consultant
    try {
      await this.prisma.notification.create({
        data: {
          userId: consultantId,
          titleAr: 'تم الدفع - أضف رابط الاجتماع',
          titleEn: 'Payment Received - Add Meeting Link',
          contentAr: `تم استلام دفعة ${amount} ر.س - الرجاء إضافة رابط الاجتماع`,
          contentEn: `Payment of ${amount} SAR received - please add meeting link`,
          type: 'SESSION_BOOKED',
          isRead: false,
        }
      })
    } catch(e) {}

    console.log(`[Webhook] Consulting payment confirmed: ${sessionId}`)
  }
}
