"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const payments_service_1 = require("./payments.service");
const stripe_service_1 = require("./stripe.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let PaymentsController = class PaymentsController {
    constructor(paymentsService, stripeService) {
        this.paymentsService = paymentsService;
        this.stripeService = stripeService;
    }
    async createPaymentIntent(user, paymentData) {
        const paymentIntent = await this.paymentsService.createPaymentIntent(user.id, paymentData);
        return {
            success: true,
            data: { paymentIntent },
        };
    }
    async confirmPayment(user, confirmData) {
        const result = await this.paymentsService.confirmPayment(user.id, confirmData.paymentIntentId);
        return {
            success: true,
            message: 'Payment confirmed successfully',
            data: result,
        };
    }
    async purchaseCourse(user, purchaseData) {
        const result = await this.paymentsService.purchaseCourse(user.id, purchaseData.courseId, purchaseData.paymentMethodId, purchaseData.couponCode);
        return {
            success: true,
            message: 'Course purchased successfully',
            data: result,
        };
    }
    async purchaseCoachingPackage(user, purchaseData) {
        const result = await this.paymentsService.purchaseCoachingPackage(user.id, purchaseData.packageId, purchaseData.paymentMethodId);
        return {
            success: true,
            message: 'Coaching package purchased successfully',
            data: result,
        };
    }
    async createSubscription(user, subscriptionData) {
        const subscription = await this.paymentsService.createSubscription(user.id, subscriptionData.planId, subscriptionData.paymentMethodId);
        return {
            success: true,
            message: 'Subscription created successfully',
            data: { subscription },
        };
    }
    async cancelSubscription(user, subscriptionId, reason) {
        const result = await this.paymentsService.cancelSubscription(user.id, subscriptionId, reason);
        return {
            success: true,
            message: 'Subscription cancelled successfully',
            data: result,
        };
    }
    async getMyPayments(user, page, limit, status) {
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
    async getMySubscriptions(user) {
        const subscriptions = await this.paymentsService.getUserSubscriptions(user.id);
        return {
            success: true,
            data: { subscriptions },
        };
    }
    async getPaymentMethods(user) {
        const paymentMethods = await this.paymentsService.getUserPaymentMethods(user.id);
        return {
            success: true,
            data: { paymentMethods },
        };
    }
    async addPaymentMethod(user, paymentMethodData) {
        const paymentMethod = await this.paymentsService.addPaymentMethod(user.id, paymentMethodData);
        return {
            success: true,
            message: 'Payment method added successfully',
            data: { paymentMethod },
        };
    }
    async removePaymentMethod(user, paymentMethodId) {
        await this.paymentsService.removePaymentMethod(user.id, paymentMethodId);
    }
    async setDefaultPaymentMethod(user, paymentMethodId) {
        await this.paymentsService.setDefaultPaymentMethod(user.id, paymentMethodId);
        return {
            success: true,
            message: 'Default payment method updated',
        };
    }
    async getAdminPayments(page, limit, status, search) {
        return await this.paymentsService.getAdminPayments({
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            status,
            search,
        });
    }
    async refundPayment(id) {
        return await this.paymentsService.refundPayment(id);
    }
    async processRefund(paymentId, refundData) {
        const refund = await this.paymentsService.refundPayment(paymentId);
        return {
            success: true,
            message: 'Refund processed successfully',
            data: { refund },
        };
    }
    async getInvoices(user, page, limit) {
        const invoices = await this.paymentsService.getUserInvoices(user.id, {
            page: page || 1,
            limit: limit || 10,
        });
        return {
            success: true,
            data: invoices,
        };
    }
    async getInvoice(user, invoiceId) {
        const invoice = await this.paymentsService.getInvoice(user.id, invoiceId);
        return {
            success: true,
            data: { invoice },
        };
    }
    async downloadInvoice(user, invoiceId) {
        const downloadUrl = await this.paymentsService.getInvoiceDownloadUrl(user.id, invoiceId);
        return {
            success: true,
            data: { downloadUrl },
        };
    }
    async validateCoupon(user, couponData) {
        const validation = await this.paymentsService.validateCoupon(user.id, couponData.code, couponData.itemType, couponData.itemId);
        return {
            success: true,
            data: validation,
        };
    }
    async getPricingPlans() {
        const plans = await this.paymentsService.getPricingPlans();
        return {
            success: true,
            data: { plans },
        };
    }
    async getMyStats(user) {
        const stats = await this.paymentsService.getUserPaymentStats(user.id);
        return {
            success: true,
            data: { stats },
        };
    }
    // Stripe webhook endpoint
    async handleStripeWebhook(webhookData) {
        await this.stripeService.handleWebhook(webhookData);
        return {
            success: true,
            message: 'Webhook processed',
        };
    }
    // Admin endpoints
    async getAllPayments(page, limit, status, userId) {
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
    async getAnalytics() {
        const analytics = await this.paymentsService.getPaymentAnalytics();
        return {
            success: true,
            data: { analytics },
        };
    }
    async adminProcessRefund(refundData) {
        const refund = await this.paymentsService.refundPayment(refundData.paymentId);
        return {
            success: true,
            message: 'Refund processed successfully',
            data: { refund },
        };
    }
    async getRevenueOverview(startDate, endDate) {
        const revenue = await this.paymentsService.getRevenueOverview(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { revenue },
        };
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, common_1.Post)('create-payment-intent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create payment intent' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payment intent created successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createPaymentIntent", null);
__decorate([
    (0, common_1.Post)('confirm-payment'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Confirm payment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment confirmed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Payment confirmation failed' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.Post)('purchase-course'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Purchase a course' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Course purchased successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Purchase failed' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "purchaseCourse", null);
__decorate([
    (0, common_1.Post)('purchase-coaching-package'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Purchase coaching package' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Package purchased successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Purchase failed' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "purchaseCoachingPackage", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create subscription' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Subscription created successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Subscription creation failed' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "createSubscription", null);
__decorate([
    (0, common_1.Post)('cancel-subscription'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel subscription' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription cancelled successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Cancellation failed' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('subscriptionId')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Get)('my-payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user payment history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment history retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getMyPayments", null);
__decorate([
    (0, common_1.Get)('my-subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user subscriptions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscriptions retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getMySubscriptions", null);
__decorate([
    (0, common_1.Get)('payment-methods'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user payment methods' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment methods retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPaymentMethods", null);
__decorate([
    (0, common_1.Post)('payment-methods'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Add payment method' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Payment method added successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "addPaymentMethod", null);
__decorate([
    (0, common_1.Delete)('payment-methods/:paymentMethodId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Remove payment method' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Payment method removed successfully' }),
    (0, swagger_1.ApiParam)({ name: 'paymentMethodId', description: 'Payment method ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('paymentMethodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "removePaymentMethod", null);
__decorate([
    (0, common_1.Post)('payment-methods/:paymentMethodId/set-default'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Set default payment method' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Default payment method updated' }),
    (0, swagger_1.ApiParam)({ name: 'paymentMethodId', description: 'Payment method ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('paymentMethodId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "setDefaultPaymentMethod", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payments (Admin)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getAdminPayments", null);
__decorate([
    (0, common_1.Post)('admin/:id/refund'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Refund payment (Admin)' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "refundPayment", null);
__decorate([
    (0, common_1.Post)('refunds/:paymentId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Process refund (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Refund processed successfully' }),
    (0, swagger_1.ApiParam)({ name: 'paymentId', description: 'Payment ID' }),
    __param(0, (0, common_1.Param)('paymentId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "processRefund", null);
__decorate([
    (0, common_1.Get)('invoices'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user invoices' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoices retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getInvoices", null);
__decorate([
    (0, common_1.Get)('invoices/:invoiceId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get invoice details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoice retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    (0, swagger_1.ApiParam)({ name: 'invoiceId', description: 'Invoice ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('invoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Get)('invoices/:invoiceId/download'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Download invoice PDF' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Invoice download URL generated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Invoice not found' }),
    (0, swagger_1.ApiParam)({ name: 'invoiceId', description: 'Invoice ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('invoiceId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "downloadInvoice", null);
__decorate([
    (0, common_1.Post)('coupons/validate'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Validate coupon code' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Coupon validation result' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid coupon' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "validateCoupon", null);
__decorate([
    (0, common_1.Get)('pricing-plans'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available pricing plans' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pricing plans retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getPricingPlans", null);
__decorate([
    (0, common_1.Get)('stats/my-stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user payment statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getMyStats", null);
__decorate([
    (0, common_1.Post)('webhook/stripe'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Stripe webhook handler' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Webhook processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "handleStripeWebhook", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payments (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payments retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getAllPayments", null);
__decorate([
    (0, common_1.Get)('admin/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment analytics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Analytics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getAnalytics", null);
__decorate([
    (0, common_1.Post)('admin/refunds'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Process refund (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Refund processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "adminProcessRefund", null);
__decorate([
    (0, common_1.Get)('admin/revenue'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get revenue overview (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Revenue data retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], PaymentsController.prototype, "getRevenueOverview", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, swagger_1.ApiTags)('Payments'),
    (0, common_1.Controller)('payments'),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService,
        stripe_service_1.StripeService])
], PaymentsController);
