import { Controller, Post, Get, Param, Request, UseGuards, Headers, RawBodyRequest, Req, Body, Res, Query } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PaymentsService } from './payments.service'
import { Response } from 'express'

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  // Create checkout for course
  @Post('checkout/course/:courseId')
  @UseGuards(JwtAuthGuard)
  async courseCheckout(
    @Param('courseId') courseId: string,
    @Request() req: any,
    @Body() body: { locale?: string; currency?: string }
  ) {
    // Prefer explicit currency from the client (its `market` cookie), then the
    // market cookie on the request, then IP country headers.
    const country = String(req.headers?.['x-vercel-ip-country'] || req.headers?.['cf-ipcountry'] || '').toUpperCase()
    const market =
      body.currency ||
      req.cookies?.market ||
      (country ? (country === 'EG' ? 'EGP' : 'SAR') : 'SAR')
    return this.paymentsService.createCourseCheckoutSession(
      courseId,
      req.user.id,
      body.locale || 'ar',
      market
    )
  }

  // Create checkout for a track package
  @Post('checkout/package/:packageId')
  @UseGuards(JwtAuthGuard)
  async packageCheckout(
    @Param('packageId') packageId: string,
    @Request() req: any,
    @Body() body: { locale?: string; currency?: string }
  ) {
    const country = String(req.headers?.['x-vercel-ip-country'] || req.headers?.['cf-ipcountry'] || '').toUpperCase()
    const market = body.currency || req.cookies?.market || (country ? (country === 'EG' ? 'EGP' : 'SAR') : 'SAR')
    return this.paymentsService.createPackageCheckoutSession(packageId, req.user.id, body.locale || 'ar', market)
  }

  // Stripe success_url for packages: verifies the session server-side, enrols, then sends the buyer to their courses
  @Get('confirm-package')
  async confirmPackage(@Query() q: Record<string, string>, @Res() res: any) {
    const locale = q.locale === 'en' ? 'en' : 'ar'
    try {
      if (q.session_id) await this.paymentsService.confirmPackageSession(q.session_id)
    } catch (e: any) {
      console.error('[CONFIRM-PACKAGE] Error:', e?.message)
    }
    return res.redirect(302, `https://deveway-teal.vercel.app/${locale}/dashboard`)
  }

  // Create checkout for consulting session
  @Post('checkout/consulting/:sessionId')
  @UseGuards(JwtAuthGuard)
  async consultingCheckout(
    @Param('sessionId') sessionId: string,
    @Request() req: any,
    @Body() body: { locale?: string }
  ) {
    return this.paymentsService.createConsultingCheckoutSession(
      sessionId,
      req.user.id,
      body.locale || 'ar'
    )
  }

  // Verify payment on success page redirect (when webhook is unreliable)
  @Post('verify-payment')
  @UseGuards(JwtAuthGuard)
  async verifyPayment(@Body() body: { stripeSessionId?: string }, @Request() req: any) {
    return this.paymentsService.verifyStripePayment(body.stripeSessionId || '', req.user.id)
  }

  // Unified invoice/payment history for the authenticated student
  @Get('my/invoices')
  @UseGuards(JwtAuthGuard)
  async getMyInvoices(
    @Request() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.paymentsService.getMyInvoices(
      req.user.id,
      parseInt(page || '1', 10),
      parseInt(limit || '20', 10),
    )
  }

  // Stripe Webhook - NO AUTH
  @Post('webhook')
  async stripeWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature: string
  ) {
    return this.paymentsService.handleWebhook(
      req.rawBody as Buffer,
      signature
    )
  }

  // Confirm payment. Legacy mode redirects (old Stripe success_urls). With format=json (used by the
  // web payment callback) it answers 200 on success or an error status the caller can act on.
  @Get('confirm')
  async confirmPayment(@Query() q: Record<string,string>, @Res() res: any) {
    const { session_id, courseId, userId, courseType = 'recorded', locale = 'ar', format } = q
    const asJson = format === 'json'

    console.log('[CONFIRM] Called with:', JSON.stringify(q))

    const webBase = 'https://deveway-teal.vercel.app'
    const successUrl = `${webBase}/${locale}/payment/success?type=course&courseId=${courseId}&courseType=${courseType}&locale=${locale}&session_id=${session_id}`

    let failure: { status: number; reason: string } | null = null
    try {
      if (!session_id || session_id === 'test') {
        console.warn('[CONFIRM] Invalid or test session_id, skipping Stripe verification')
        failure = { status: 400, reason: 'invalid_session' }
      } else if (!courseId || !userId) {
        console.error('[CONFIRM] Missing courseId or userId')
        failure = { status: 400, reason: 'missing_params' }
      } else {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        console.log('[CONFIRM] Retrieving Stripe session:', session_id)
        const session = await stripe.checkout.sessions.retrieve(session_id)
        console.log('[CONFIRM] Payment status:', session.payment_status)

        const meta = session.metadata || {}
        if ((meta.userId && meta.userId !== userId) || (meta.courseId && meta.courseId !== courseId)) {
          console.error('[CONFIRM] Session does not belong to this user/course')
          failure = { status: 403, reason: 'session_mismatch' }
        } else if (session.payment_status === 'paid') {
          await this.paymentsService.enrollUserInCourse(courseId, userId, courseType)
          console.log('[CONFIRM] Enrollment saved!')
        } else {
          console.warn('[CONFIRM] Payment not completed, status:', session.payment_status)
          failure = { status: 402, reason: 'not_paid' }
        }
      }
    } catch(e: any) {
      console.error('[CONFIRM] Error:', e.message)
      failure = { status: 500, reason: 'confirm_error' }
    }

    if (asJson) {
      if (failure) return res.status(failure.status).json({ success: false, reason: failure.reason })
      return res.status(200).json({ success: true })
    }
    console.log('[CONFIRM] Redirecting to:', successUrl)
    return res.redirect(302, successUrl)
  }

  // Test enrollment endpoint (for debugging)
  @Post('test-enroll/:courseId')
  @UseGuards(JwtAuthGuard)
  async testEnroll(@Param('courseId') courseId: string, @Request() req: any) {
    await this.paymentsService.handleCourseEnrollment({
      courseId,
      userId: req.user.id,
      courseType: 'recorded',
      locale: 'ar',
    })
    return { success: true, message: 'Enrollment created' }
  }
}
