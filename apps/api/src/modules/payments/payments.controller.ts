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
  async confirmPayment(
    @Query('session_id') sessionId: string,
    @Query('courseId') courseId: string,
    @Query('userId') userId: string,
    @Query('courseType') courseType: string,
    @Query('locale') locale: string,
    @Res() res: any,
  ) {
    console.log('[Confirm] Received:', { sessionId, courseId, userId, courseType, locale })

    try {
      const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      console.log('[Confirm] Payment status:', session.payment_status)

      if (session.payment_status === 'paid') {
        await this.paymentsService.enrollUserInCourse(courseId, userId, courseType)
        console.log('[Confirm] Enrollment saved for user:', userId, 'course:', courseId)
      }
    } catch(e: any) {
      console.error('[Confirm] Error:', e.message)
    }

    const webBase = 'https://deveway-teal.vercel.app'
    const redirectUrl = `${webBase}/${locale || 'ar'}/payment/success?type=course&courseId=${courseId}&courseType=${courseType}&locale=${locale || 'ar'}`
    return res.redirect(redirectUrl)
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
