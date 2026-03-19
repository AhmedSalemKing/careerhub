import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { StripeService } from './stripe.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly stripeService: StripeService,
  ) { }

  @Post('create-payment-intent')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create payment intent' })
  @ApiResponse({ status: 201, description: 'Payment intent created successfully' })
  async createPaymentIntent(
    @CurrentUser() user: User,
    @Body() paymentData: {
      amount: number;
      currency: string;
      itemType: 'COURSE' | 'COACHING_PACKAGE' | 'SUBSCRIPTION';
      itemId: string;
      metadata?: Record<string, any>;
    },
  ) {
    const paymentIntent = await this.paymentsService.createPaymentIntent(
      user.id,
      paymentData
    );
    return {
      success: true,
      data: { paymentIntent },
    };
  }

  @Post('confirm-payment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm payment' })
  @ApiResponse({ status: 200, description: 'Payment confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Payment confirmation failed' })
  async confirmPayment(
    @CurrentUser() user: User,
    @Body() confirmData: {
      paymentIntentId: string;
      paymentMethodId?: string;
    },
  ) {
    const result = await this.paymentsService.confirmPayment(
      user.id,
      confirmData.paymentIntentId,

    );
    return {
      success: true,
      message: 'Payment confirmed successfully',
      data: result,
    };
  }

  @Post('purchase-course')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase a course' })
  @ApiResponse({ status: 201, description: 'Course purchased successfully' })
  @ApiResponse({ status: 400, description: 'Purchase failed' })
  async purchaseCourse(
    @CurrentUser() user: User,
    @Body() purchaseData: {
      courseId: string;
      paymentMethodId: string;
      couponCode?: string;
    },
  ) {
    const result = await this.paymentsService.purchaseCourse(
      user.id,
      purchaseData.courseId,
      purchaseData.paymentMethodId,
      purchaseData.couponCode
    );
    return {
      success: true,
      message: 'Course purchased successfully',
      data: result,
    };
  }

  @Post('purchase-coaching-package')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Purchase coaching package' })
  @ApiResponse({ status: 201, description: 'Package purchased successfully' })
  @ApiResponse({ status: 400, description: 'Purchase failed' })
  async purchaseCoachingPackage(
    @CurrentUser() user: User,
    @Body() purchaseData: {
      packageId: string;
      paymentMethodId: string;
    },
  ) {
    const result = await this.paymentsService.purchaseCoachingPackage(
      user.id,
      purchaseData.packageId,
      purchaseData.paymentMethodId
    );
    return {
      success: true,
      message: 'Coaching package purchased successfully',
      data: result,
    };
  }

  @Post('subscribe')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create subscription' })
  @ApiResponse({ status: 201, description: 'Subscription created successfully' })
  @ApiResponse({ status: 400, description: 'Subscription creation failed' })
  async createSubscription(
    @CurrentUser() user: User,
    @Body() subscriptionData: {
      planId: string;
      paymentMethodId: string;
    },
  ) {
    const subscription = await this.paymentsService.createSubscription(
      user.id,
      subscriptionData.planId,
      subscriptionData.paymentMethodId
    );
    return {
      success: true,
      message: 'Subscription created successfully',
      data: { subscription },
    };
  }

  @Post('cancel-subscription')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel subscription' })
  @ApiResponse({ status: 200, description: 'Subscription cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cancellation failed' })
  async cancelSubscription(
    @CurrentUser() user: User,
    @Body('subscriptionId') subscriptionId: string,
    @Body('reason') reason?: string,
  ) {
    const result = await this.paymentsService.cancelSubscription(
      user.id,
      subscriptionId,
      reason
    );
    return {
      success: true,
      message: 'Subscription cancelled successfully',
      data: result,
    };
  }

  @Get('my-payments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment history' })
  @ApiResponse({ status: 200, description: 'Payment history retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  async getMyPayments(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const payments = await this.paymentsService.getUserPayments(user.id, {
      page: page || 1,
      limit: limit || 10,
      status,
    });
    return {
      success: true,
      data: payments,
    };
  }

  @Get('my-subscriptions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user subscriptions' })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async getMySubscriptions(@CurrentUser() user: User) {
    const subscriptions = await this.paymentsService.getUserSubscriptions(user.id);
    return {
      success: true,
      data: { subscriptions },
    };
  }

  @Get('payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment methods' })
  @ApiResponse({ status: 200, description: 'Payment methods retrieved successfully' })
  async getPaymentMethods(@CurrentUser() user: User) {
    const paymentMethods = await this.paymentsService.getUserPaymentMethods(user.id);
    return {
      success: true,
      data: { paymentMethods },
    };
  }

  @Post('payment-methods')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add payment method' })
  @ApiResponse({ status: 201, description: 'Payment method added successfully' })
  async addPaymentMethod(
    @CurrentUser() user: User,
    @Body() paymentMethodData: {
      type: 'card';
      card: {
        number: string;
        exp_month: number;
        exp_year: number;
        cvc: string;
      };
      billing_details?: {
        name: string;
        email: string;
        phone?: string;
        address?: {
          line1: string;
          line2?: string;
          city: string;
          state: string;
          postal_code: string;
          country: string;
        };
      };
    },
  ) {
    const paymentMethod = await this.paymentsService.addPaymentMethod(
      user.id,
      paymentMethodData
    );
    return {
      success: true,
      message: 'Payment method added successfully',
      data: { paymentMethod },
    };
  }

  @Delete('payment-methods/:paymentMethodId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove payment method' })
  @ApiResponse({ status: 204, description: 'Payment method removed successfully' })
  @ApiParam({ name: 'paymentMethodId', description: 'Payment method ID' })
  async removePaymentMethod(
    @CurrentUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    await this.paymentsService.removePaymentMethod(user.id, paymentMethodId);
  }

  @Post('payment-methods/:paymentMethodId/set-default')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set default payment method' })
  @ApiResponse({ status: 200, description: 'Default payment method updated' })
  @ApiParam({ name: 'paymentMethodId', description: 'Payment method ID' })
  async setDefaultPaymentMethod(
    @CurrentUser() user: User,
    @Param('paymentMethodId') paymentMethodId: string,
  ) {
    await this.paymentsService.setDefaultPaymentMethod(user.id, paymentMethodId);
    return {
      success: true,
      message: 'Default payment method updated',
    };
  }

  @Post('refunds/:paymentId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process refund (Admin only)' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  @ApiParam({ name: 'paymentId', description: 'Payment ID' })
  async processRefund(
    @Param('paymentId') paymentId: string,
    @Body() refundData: {
      amount?: number;
      reason: string;
    },
  ) {
    const refund = await this.paymentsService.processRefund(
      paymentId,
      String(refundData.amount) as any,
      refundData.amount
    );
    return {
      success: true,
      message: 'Refund processed successfully',
      data: { refund },
    };
  }

  @Get('invoices')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user invoices' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  async getInvoices(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const invoices = await this.paymentsService.getUserInvoices(user.id, {
      page: page || 1,
      limit: limit || 10,
    });
    return {
      success: true,
      data: invoices,
    };
  }

  @Get('invoices/:invoiceId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invoice details' })
  @ApiResponse({ status: 200, description: 'Invoice retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  async getInvoice(
    @CurrentUser() user: User,
    @Param('invoiceId') invoiceId: string,
  ) {
    const invoice = await this.paymentsService.getInvoice(user.id, invoiceId);
    return {
      success: true,
      data: { invoice },
    };
  }

  @Get('invoices/:invoiceId/download')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Download invoice PDF' })
  @ApiResponse({ status: 200, description: 'Invoice download URL generated' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  async downloadInvoice(
    @CurrentUser() user: User,
    @Param('invoiceId') invoiceId: string,
  ) {
    const downloadUrl = await this.paymentsService.getInvoiceDownloadUrl(user.id, invoiceId);
    return {
      success: true,
      data: { downloadUrl },
    };
  }

  @Post('coupons/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate coupon code' })
  @ApiResponse({ status: 200, description: 'Coupon validation result' })
  @ApiResponse({ status: 400, description: 'Invalid coupon' })
  async validateCoupon(
    @CurrentUser() user: User,
    @Body() couponData: {
      code: string;
      itemType: 'COURSE' | 'COACHING_PACKAGE';
      itemId: string;
    },
  ) {
    const validation = await this.paymentsService.validateCoupon(
      user.id,
      couponData.code,
      couponData.itemType,
      couponData.itemId
    );
    return {
      success: true,
      data: validation,
    };
  }

  @Get('pricing-plans')
  @ApiOperation({ summary: 'Get available pricing plans' })
  @ApiResponse({ status: 200, description: 'Pricing plans retrieved successfully' })
  async getPricingPlans() {
    const plans = await this.paymentsService.getPricingPlans();
    return {
      success: true,
      data: { plans },
    };
  }

  @Get('stats/my-stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user payment statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getMyStats(@CurrentUser() user: User) {
    const stats = await this.paymentsService.getUserPaymentStats(user.id);
    return {
      success: true,
      data: { stats },
    };
  }

  // Stripe webhook endpoint
  @Post('webhook/stripe')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook handler' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleStripeWebhook(@Body() webhookData: any) {
    await this.stripeService.handleWebhook(webhookData);
    return {
      success: true,
      message: 'Webhook processed',
    };
  }

  // Admin endpoints
  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all payments (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getAllPayments(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
    @Query('userId') userId?: string,
  ) {
    const payments = await this.paymentsService.getAllPayments({
      page: page || 1,
      limit: limit || 20,
      status,
      userId,
    });
    return {
      success: true,
      data: payments,
    };
  }

  @Get('admin/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get payment analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Analytics retrieved successfully' })
  async getAnalytics() {
    const analytics = await this.paymentsService.getPaymentAnalytics();
    return {
      success: true,
      data: { analytics },
    };
  }

  @Post('admin/refunds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Process refund (Admin only)' })
  @ApiResponse({ status: 200, description: 'Refund processed successfully' })
  async adminProcessRefund(@Body() refundData: {
    paymentId: string;
    amount?: number;
    reason: string;
  }) {
    const refund = await this.paymentsService.processRefund(
      refundData.paymentId,
      String(refundData.amount) as any,
      refundData.amount
    );
    return {
      success: true,
      message: 'Refund processed successfully',
      data: { refund },
    };
  }

  @Get('admin/revenue')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revenue overview (Admin only)' })
  @ApiResponse({ status: 200, description: 'Revenue data retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getRevenueOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const revenue = await this.paymentsService.getRevenueOverview(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { revenue },
    };
  }
}




