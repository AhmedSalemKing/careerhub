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
    @Body() body: { locale?: string }
  ) {
    return this.paymentsService.createCourseCheckoutSession(
      courseId,
      req.user.id,
      body.locale || 'ar'
    )
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

  // Confirm payment and redirect (used as success_url from Stripe)
  @Get('confirm')
  async confirmPayment(@Query() q: Record<string,string>, @Res() res: any) {
    const { session_id, courseId, userId, courseType = 'recorded', locale = 'ar' } = q

    console.log('[CONFIRM] Called with:', JSON.stringify(q))

    const webBase = 'https://deveway-teal.vercel.app'
    const successUrl = `${webBase}/${locale}/payment/success?type=course&courseId=${courseId}&courseType=${courseType}&locale=${locale}&session_id=${session_id}`

    try {
      if (!session_id || session_id === 'test') {
        console.warn('[CONFIRM] Invalid or test session_id, skipping Stripe verification')
      } else if (!courseId || !userId) {
        console.error('[CONFIRM] Missing courseId or userId')
      } else {
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
        console.log('[CONFIRM] Retrieving Stripe session:', session_id)
        const session = await stripe.checkout.sessions.retrieve(session_id)
        console.log('[CONFIRM] Payment status:', session.payment_status)

        if (session.payment_status === 'paid') {
          await this.paymentsService.enrollUserInCourse(courseId, userId, courseType)
          console.log('[CONFIRM] Enrollment saved!')
        } else {
          console.warn('[CONFIRM] Payment not completed, status:', session.payment_status)
        }
      }
    } catch(e: any) {
      console.error('[CONFIRM] Error:', e.message)
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
