import { Controller, Post, Get, Param, Request, UseGuards, Headers, RawBodyRequest, Req, Body } from '@nestjs/common'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { PaymentsService } from './payments.service'

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
}
