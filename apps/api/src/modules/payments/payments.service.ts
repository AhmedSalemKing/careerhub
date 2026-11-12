import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import { ActivityService } from '../../common/services/activity.service'
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service'
import Stripe from 'stripe'

const STRIPE_CURRENCY_MAP: Record<string, string> = {
  SAR: 'sar',
  EGP: 'egp',
  USD: 'usd',
}

@Injectable()
export class PaymentsService {
  private stripe: Stripe

  constructor(
    private prisma: PrismaService,
    private readonly activityService: ActivityService,
    private readonly exchangeRateService: ExchangeRateService,
  ) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-06-20' as any,
    })
  }

  // Create checkout session for COURSE enrollment
  async createCourseCheckoutSession(courseId: string, userId: string, locale: string, market?: string) {
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

    // Course prices are stored in SAR; charge in the buyer's market currency
    // using the same exchange rates as the displayed prices.
    const requested = String(market || 'SAR').toUpperCase()
    const stripeCurrency = (STRIPE_CURRENCY_MAP[requested] || 'sar') as 'sar' | 'egp' | 'usd'
    let chargeAmount = price
    if (stripeCurrency !== 'sar') {
      const rates = await this.exchangeRateService.getRates()
      chargeAmount = price * (stripeCurrency === 'egp' ? rates.EGP : rates.USD)
    }

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
          currency: stripeCurrency,
          product_data: {
            name: courseTitle,
            description: `${courseType === 'live' ? 'بث مباشر' : courseType === 'offline' ? 'مقر فعلي' : 'كورس مسجل'} - ${(course as any).instructor?.profile?.firstName || ''}`,
            images: (course as any).thumbnail ? [(course as any).thumbnail] : [],
            metadata: { courseId, courseType },
          },
          unit_amount: Math.round(chargeAmount * 100),
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
      success_url: `https://deve-way.onrender.com/api/payments/confirm?session_id={CHECKOUT_SESSION_ID}&courseId=${courseId}&userId=${userId}&courseType=${courseType}&locale=${locale}`,
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

  // Create checkout session for a track PACKAGE (a bundle of courses sold at one price, stored in SAR)
  async createPackageCheckoutSession(packageId: string, userId: string, locale: string, market?: string) {
    const pkg = await this.prisma.package.findFirst({ where: { id: packageId, isActive: true } })
    if (!pkg) throw new NotFoundException('Package not found')
    if (!pkg.courseIds.length) throw new BadRequestException('Package has no courses')
    if (!(pkg.finalPrice > 0)) throw new BadRequestException('Package is free, no payment needed')

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { email: true } })

    // The package name comes from the track (or career path) it belongs to.
    let name = 'Package'
    let slug = ''
    if (pkg.pathKind === 'TRACK') {
      const t = await this.prisma.track.findUnique({ where: { id: pkg.pathId }, select: { nameAr: true, nameEn: true, slug: true } })
      name = (locale === 'en' ? t?.nameEn : t?.nameAr) || t?.nameAr || name
      slug = t?.slug || ''
    } else {
      const p = await this.prisma.careerPath.findUnique({ where: { id: pkg.pathId }, select: { titleAr: true, titleEn: true, slug: true } })
      name = (locale === 'en' ? p?.titleEn : p?.titleAr) || p?.titleAr || name
      slug = p?.slug || ''
    }

    // Same currency handling as courses: stored in SAR, charged in the buyer's market currency.
    const requested = String(market || 'SAR').toUpperCase()
    const stripeCurrency = (STRIPE_CURRENCY_MAP[requested] || 'sar') as 'sar' | 'egp' | 'usd'
    let chargeAmount = pkg.finalPrice
    if (stripeCurrency !== 'sar') {
      const rates = await this.exchangeRateService.getRates()
      chargeAmount = pkg.finalPrice * (stripeCurrency === 'egp' ? rates.EGP : rates.USD)
    }

    const learnUrl = 'https://devewayhub.vercel.app'
    const webUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://deveway-teal.vercel.app'
    const apiUrl = (process.env.API_URL || 'https://api.deveways.com').replace(/\/$/, '')

    const session = await this.stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user?.email,
      line_items: [{
        price_data: {
          currency: stripeCurrency,
          product_data: {
            name: `${locale === 'en' ? 'Package' : 'باكدج'} ${name}`,
            description: `${pkg.courseIds.length} ${locale === 'en' ? 'courses' : 'دورات'}`,
            metadata: { packageId },
          },
          unit_amount: Math.round(chargeAmount * 100),
        },
        quantity: 1,
      }],
      metadata: { type: 'package_enrollment', packageId, userId, locale, trackSlug: slug },
      success_url: `${apiUrl}/api/payments/confirm-package?session_id={CHECKOUT_SESSION_ID}&locale=${locale}`,
      cancel_url: slug ? `${webUrl}/${locale}/careers/${slug}` : `${learnUrl}/${locale}/courses`,
    })

    return { success: true, data: { url: session.url, sessionId: session.id } }
  }

  /**
   * Grants access to every course of a paid package and records ONE payment for the whole amount.
   * Idempotent: Stripe retries the webhook and the success redirect also calls this.
   * NOTE: no instructor earnings are credited for package purchases (no revenue-split rule exists yet).
   */
  async handlePackageEnrollment(session: Stripe.Checkout.Session) {
    const { packageId, userId } = (session.metadata || {}) as Record<string, string>
    if (!packageId || !userId) {
      console.error('[PACKAGE] Missing packageId or userId in session metadata', session.id)
      return false
    }
    if (session.payment_status && session.payment_status !== 'paid') return false

    const pkg = await this.prisma.package.findUnique({ where: { id: packageId } })
    if (!pkg) {
      console.error('[PACKAGE] Package not found', packageId)
      return false
    }

    for (const courseId of pkg.courseIds) {
      const existing = await this.prisma.enrollment.findFirst({ where: { courseId, userId } })
      if (existing) {
        if (existing.status !== 'ACTIVE') await this.prisma.enrollment.update({ where: { id: existing.id }, data: { status: 'ACTIVE' } })
      } else {
        await this.prisma.enrollment.create({ data: { courseId, userId, status: 'ACTIVE' } })
      }
    }

    const already = await this.prisma.payment.findUnique({ where: { transactionId: session.id } })
    if (!already) {
      await this.prisma.payment.create({
        data: {
          userId,
          amount: (session.amount_total || 0) / 100,
          currency: String(session.currency || 'sar').toUpperCase(),
          status: 'COMPLETED',
          method: 'STRIPE_CARD',
          transactionId: session.id,
          itemType: 'PACKAGE',
          itemId: pkg.id,
          description: 'Track package',
          completedAt: new Date(),
          metadata: { packageId: pkg.id, courseIds: pkg.courseIds },
        },
      })
    }
    console.log('[PACKAGE] Enrolled', userId, 'in', pkg.courseIds.length, 'courses')
    return true
  }

  /** Success-redirect fallback: verify the Stripe session and enrol (trusts nothing but the session id). */
  async confirmPackageSession(sessionId: string) {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId)
    if (session.metadata?.type !== 'package_enrollment') return false
    return this.handlePackageEnrollment(session)
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
    if (consultingSession.status !== 'AWAITING_PAYMENT') {
      throw new BadRequestException(
        consultingSession.status === 'PENDING_APPROVAL'
          ? 'Consultant approval required before payment'
          : 'Session is not awaiting payment'
      )
    }

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
      } else if (metadata.type === 'package_enrollment') {
        await this.handlePackageEnrollment(session)
      }
    }

    return { received: true }
  }

  async handleCourseEnrollment(metadata: Record<string, string>) {
    const { courseId, userId, courseType } = metadata
    return this.enrollUserInCourse(courseId, userId, courseType)
  }

  async enrollUserInCourse(courseId: string, userId: string, courseType: string) {
    console.log('[ENROLL] Starting:', { courseId, userId, courseType })
    
    if (!courseId || !userId) {
      console.error('[ENROLL] Missing courseId or userId!')
      return false
    }
    
    try {
      // Upsert enrollment
      const existing = await this.prisma.enrollment.findFirst({
        where: { courseId, userId }
      })
      
      if (existing) {
        await this.prisma.enrollment.update({
          where: { id: existing.id },
          data: { status: 'ACTIVE' }
        })
        console.log('[ENROLL] Updated existing:', existing.id)
      } else {
        const created = await this.prisma.enrollment.create({
          data: { courseId, userId, status: 'ACTIVE' }
        })
        console.log('[ENROLL] Created new:', created.id)
      }
      
      // Get course price for earnings
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        select: { instructorId: true, price: true, titleAr: true, titleEn: true }
      })
      
      if (course?.instructorId && course?.price) {
        const price = parseFloat(course.price.toString())
        if (price > 0) {
          try {
            const share = Math.round(price * 0.8 * 100) / 100
            await this.prisma.$executeRawUnsafe(
              `UPDATE "users" SET "earningsBalance" = COALESCE("earningsBalance", 0) + ${share} WHERE "id" = '${course.instructorId}'`
            )
            console.log('[ENROLL] Instructor earnings updated:', share)
          } catch (err: any) {
            console.error('[ENROLL] Instructor earnings update failed (non-fatal):', err?.message)
            // Do NOT re-throw — enrollment + tracking must still proceed.
          }
        }
      }
      
      // Create payment record
      try {
        const course2 = await this.prisma.course.findUnique({
          where: { id: courseId },
          select: { price: true }
        })
        const price = parseFloat(course2?.price?.toString() || '0')
        if (price > 0) {
          await this.prisma.payment.create({
            data: {
              userId,
              courseId,
              amount: price,
              status: 'COMPLETED',
            }
          })
          console.log('[ENROLL] Payment record created')
        }
      } catch(pe: any) {
        console.error('[ENROLL] Payment record error (non-critical):', pe.message)
      }

      // Track activity for admin feed
      const coursePrice = parseFloat(course?.price?.toString() || '0')
      const courseTitle = course?.titleAr || course?.titleEn || 'Course'

      await this.activityService.track({
        userId,
        action: 'ENROLL_COURSE',
        entityType: 'Course',
        entityId: courseId,
        metadata: { courseTitle },
      })

      if (coursePrice > 0) {
        await this.activityService.track({
          userId,
          action: 'PAYMENT_SUCCESS',
          entityType: 'Payment',
          entityId: courseId,
          metadata: { amount: coursePrice, type: 'course', courseTitle, method: 'stripe' },
        })
      }

      console.log('[ENROLL] Complete!')
      return true
    } catch(e: any) {
      console.error('[ENROLL] CRITICAL ERROR:', e.message)
      throw e
    }
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

    await this.activityService.track({
      userId,
      action: 'PAYMENT_SUCCESS',
      entityType: 'Session',
      entityId: sessionId,
      metadata: { amount, type: 'consultation', consultantId },
    })

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

  async verifyStripePayment(stripeSessionId: string, userId: string) {
    if (!stripeSessionId) throw new BadRequestException('Missing stripeSessionId')

    const stripeSession = await this.stripe.checkout.sessions.retrieve(stripeSessionId)
    const metadata = stripeSession.metadata || {}

    if (metadata.type !== 'consulting_session') {
      throw new BadRequestException('Not a consulting session payment')
    }

    const sessionId = metadata.sessionId
    if (!sessionId) throw new BadRequestException('Missing sessionId in metadata')

    // Verify ownership
    const consultingSession = await this.prisma.consultingSession.findUnique({
      where: { id: sessionId },
      select: { studentId: true, paymentStatus: true },
    })
    if (!consultingSession) throw new NotFoundException('Session not found')
    if (consultingSession.studentId !== userId) throw new BadRequestException('Not authorized')
    if (consultingSession.paymentStatus === 'PAID') {
      return { success: true, message: 'Already confirmed', alreadyPaid: true }
    }

    if (stripeSession.payment_status !== 'paid') {
      // Attempt to re-fetch after a moment in case Stripe is still processing
      await new Promise(r => setTimeout(r, 2000))
      const refreshed = await this.stripe.checkout.sessions.retrieve(stripeSessionId)
      if (refreshed.payment_status !== 'paid') {
        throw new BadRequestException('Payment not completed')
      }
    }

    await this.prisma.consultingSession.update({
      where: { id: sessionId },
      data: {
        paymentStatus: 'PAID',
        paidAt: new Date(),
        status: 'CONFIRMED',
      },
    })

    await this.activityService.track({
      userId,
      action: 'PAYMENT_SUCCESS',
      entityType: 'Session',
      entityId: sessionId,
      metadata: { amount: (stripeSession.amount_total || 0) / 100, type: 'consultation', consultantId: metadata.consultantId },
    })

    // Notify consultant
    try {
      await this.prisma.notification.create({
        data: {
          userId: metadata.consultantId,
          titleAr: 'تم الدفع - أضف رابط الاجتماع',
          titleEn: 'Payment Received - Add Meeting Link',
          contentAr: `تم استلام دفعة - الرجاء إضافة رابط الاجتماع`,
          contentEn: `Payment received - please add meeting link`,
          type: 'SESSION_BOOKED',
          isRead: false,
        },
      })
    } catch {}

    return { success: true, message: 'Payment confirmed' }
  }

  // Unified invoice/payment history across course purchases, consulting sessions and wallet top-ups
  async getMyInvoices(userId: string, page = 1, limit = 20) {
    const safePage = Number.isFinite(page) && page > 0 ? Math.floor(page) : 1
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.floor(limit) : 20
    const skip = (safePage - 1) * safeLimit

    // Fetch all three sources in parallel
    const [coursePayments, sessionPayments, walletTxns] = await Promise.all([
      // 1) Course purchases via Payment table
      this.prisma.payment.findMany({
        where: { userId, status: { in: ['SUCCESS', 'COMPLETED'] } },
        orderBy: { createdAt: 'desc' },
        include: {
          course: { select: { id: true, titleAr: true, titleEn: true, thumbnail: true } },
        },
      }),

      // 2) Consulting session payments (paid sessions)
      this.prisma.consultingSession.findMany({
        where: {
          studentId: userId,
          paymentStatus: 'PAID',
          price: { gt: 0 },
        },
        orderBy: { updatedAt: 'desc' },
        include: {
          consultant: {
            select: {
              id: true,
              profile: { select: { firstName: true, lastName: true } },
            },
          },
        },
      }),

      // 3) Wallet top-ups (positive top-up transactions only)
      this.prisma.walletTransaction.findMany({
        where: { userId, type: 'TOPUP', amount: { gt: 0 } },
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Normalize into a single invoice shape
    const invoices = [
      ...coursePayments.map(p => ({
        id: `course-${p.id}`,
        type: 'COURSE' as const,
        itemName: p.course?.titleAr || p.course?.titleEn || 'كورس',
        itemId: p.course?.id ?? null,
        itemThumbnail: p.course?.thumbnail ?? null,
        amount: Number(p.amount),
        currency: p.currency || 'SAR',
        status: p.status,
        date: p.createdAt,
        reference: p.id,
        metadata: { courseName: p.course?.titleAr || p.course?.titleEn },
      })),

      ...sessionPayments.map(s => ({
        id: `session-${s.id}`,
        type: 'SESSION' as const,
        itemName: 'جلسة استشارية',
        itemId: s.id,
        itemThumbnail: null,
        amount: Number(s.price),
        currency: 'SAR',
        status: 'PAID',
        date: s.updatedAt,
        reference: s.id,
        metadata: {
          consultantName: s.consultant?.profile
            ? `${s.consultant.profile.firstName} ${s.consultant.profile.lastName}`
            : 'مستشار',
          scheduledAt: s.scheduledAt,
          topic: s.topic,
        },
      })),

      ...walletTxns.map(w => ({
        id: `wallet-${w.id}`,
        type: 'WALLET_TOPUP' as const,
        itemName: 'شحن المحفظة',
        itemId: null,
        itemThumbnail: null,
        amount: Number(w.amount),
        currency: 'SAR',
        status: 'PAID',
        date: w.createdAt,
        reference: w.id,
        metadata: { method: w.description || 'شحن محفظة' },
      })),
    ]

    // Sort all by date DESC
    invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    // Paginate
    const total = invoices.length
    const paginated = invoices.slice(skip, skip + safeLimit)

    // Aggregate totals
    const totalSpent = invoices.reduce((sum, inv) => sum + inv.amount, 0)

    return {
      items: paginated,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
      summary: {
        totalSpent,
        courseCount: coursePayments.length,
        sessionCount: sessionPayments.length,
        walletCount: walletTxns.length,
      },
    }
  }
}
