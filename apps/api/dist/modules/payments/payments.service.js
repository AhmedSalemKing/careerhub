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
var PaymentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const stripe_service_1 = require("./stripe.service");
const notifications_service_1 = require("../notifications/notifications.service");
let PaymentsService = PaymentsService_1 = class PaymentsService {
    constructor(prisma, configService, stripeService, notificationsService) {
        this.prisma = prisma;
        this.configService = configService;
        this.stripeService = stripeService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(PaymentsService_1.name);
    }
    async createPaymentIntent(userId, paymentData) {
        // Validate item exists and get pricing
        let itemDetails;
        switch (paymentData.itemType) {
            case 'COURSE':
                itemDetails = await this.prisma.course.findUnique({
                    where: { id: paymentData.itemId },
                });
                if (!itemDetails) {
                    throw new common_1.NotFoundException('Course not found');
                }
                if (itemDetails.status !== 'PUBLISHED') {
                    throw new common_1.BadRequestException('Course is not available for purchase');
                }
                break;
            case 'COACHING_PACKAGE':
                // Mock package validation - would be stored in database
                const packages = await this.getCoachingPackages();
                itemDetails = packages.find(p => p.id === paymentData.itemId);
                if (!itemDetails) {
                    throw new common_1.NotFoundException('Coaching package not found');
                }
                break;
            case 'SUBSCRIPTION':
                // Mock subscription validation
                const plans = await this.getPricingPlans();
                itemDetails = plans.find(p => p.id === paymentData.itemId);
                if (!itemDetails) {
                    throw new common_1.NotFoundException('Subscription plan not found');
                }
                break;
            default:
                throw new common_1.BadRequestException('Invalid item type');
        }
        // Check if user already owns this item
        if (paymentData.itemType === 'COURSE') {
            const existingEnrollment = await this.prisma.enrollment.findUnique({
                where: {
                    userId_courseId: {
                        userId,
                        courseId: paymentData.itemId,
                    },
                },
            });
            if (existingEnrollment) {
                throw new common_1.BadRequestException('You are already enrolled in this course');
            }
        }
        // Create payment intent with Stripe
        const paymentIntent = await this.stripeService.createPaymentIntent({
            amount: paymentData.amount,
            currency: paymentData.currency,
            metadata: {
                userId,
                itemType: paymentData.itemType,
                itemId: paymentData.itemId,
                ...paymentData.metadata,
            },
        });
        // Store payment record
        const payment = await this.prisma.payment.create({
            data: {
                description: 'Payment',
                userId,
                amount: paymentData.amount,
                currency: paymentData.currency,
                status: 'PENDING',
                method: 'PAYMOB',
                transactionId: paymentIntent.id,
                itemType: paymentData.itemType,
                itemId: paymentData.itemId,
                metadata: paymentData.metadata || {},
            },
        });
        this.logger.log(`Payment intent created: ${paymentIntent.id} for user ${userId}`);
        return {
            paymentIntent,
            payment,
            itemDetails,
        };
    }
    async confirmPayment(userId, paymentIntentId) {
        // Get payment record
        const payment = await this.prisma.payment.findFirst({
            where: {
                userId,
                transactionId: paymentIntentId,
                status: 'PENDING',
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        // Confirm payment with Stripe
        const confirmedPayment = await this.stripeService.confirmPaymentIntent(paymentIntentId);
        if (confirmedPayment.status === 'succeeded') {
            // Update payment status
            const updatedPayment = await this.prisma.payment.update({
                where: { id: payment.id },
                data: {
                    status: 'COMPLETED',
                    completedAt: new Date(),
                },
            });
            // Fulfill the purchase
            await this.fulfillPurchase(userId, payment.itemType, payment.itemId, payment.id);
            this.logger.log(`Payment confirmed: ${paymentIntentId}`);
            return {
                payment: updatedPayment,
                status: 'completed',
            };
        }
        else {
            throw new common_1.BadRequestException('Payment confirmation failed');
        }
    }
    async purchaseCourse(userId, courseId, paymentMethodId, couponCode) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        if (course.status !== 'PUBLISHED') {
            throw new common_1.BadRequestException('Course is not available for purchase');
        }
        // Check if already enrolled
        const existingEnrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId,
                },
            },
        });
        if (existingEnrollment) {
            throw new common_1.BadRequestException('You are already enrolled in this course');
        }
        // Apply coupon if provided
        let finalPrice = course.price;
        let discount = 0;
        if (couponCode) {
            const couponValidation = await this.validateCoupon(userId, couponCode, 'COURSE', courseId);
            if (couponValidation.valid) {
                if ('coupon' in couponValidation && couponValidation.coupon) {
                    discount = couponValidation.coupon.discountAmount;
                }
                finalPrice = course.price - discount;
            }
        }
        // Create and confirm payment
        const paymentIntent = await this.createPaymentIntent(userId, {
            amount: Math.round(finalPrice * 100), // Convert to cents
            currency: course.currency,
            itemType: 'COURSE',
            itemId: courseId,
            metadata: {
                couponCode,
                discountAmount: discount,
                originalPrice: course.price,
            },
        });
        const result = await this.confirmPayment(userId, paymentIntent.paymentIntent.id);
        return {
            payment: result.payment,
            status: 'success',
            enrollment: null,
            purchase: null,
            discount,
            originalPrice: course.price,
            finalPrice,
        };
    }
    async purchaseCoachingPackage(userId, packageId, paymentMethodId) {
        const packages = await this.getCoachingPackages();
        const coachingPackage = packages.find(p => p.id === packageId);
        if (!coachingPackage) {
            throw new common_1.NotFoundException('Coaching package not found');
        }
        // Create and confirm payment
        const paymentIntent = await this.createPaymentIntent(userId, {
            amount: Math.round(coachingPackage.price * 100), // Convert to cents
            currency: coachingPackage.currency,
            itemType: 'COACHING_PACKAGE',
            itemId: packageId,
        });
        const result = await this.confirmPayment(userId, paymentIntent.paymentIntent.id);
        return {
            payment: result.payment,
            status: 'success',
            enrollment: null,
            purchase: null,
            package: coachingPackage,
        };
    }
    async createSubscription(userId, planId, paymentMethodId) {
        const plans = await this.getPricingPlans();
        const plan = plans.find(p => p.id === planId);
        if (!plan) {
            throw new common_1.NotFoundException('Subscription plan not found');
        }
        // Check if user already has active subscription
        const existingSubscription = await this.prisma.subscription.findFirst({
            where: {
                userId,
                status: 'ACTIVE',
            },
        });
        if (existingSubscription) {
            throw new common_1.BadRequestException('You already have an active subscription');
        }
        // Create subscription with Stripe
        const stripeSubscription = await this.stripeService.createSubscription({
            customerId: await this.getOrCreateStripeCustomer(userId),
            priceId: plan.stripePriceId,
            paymentMethodId,
        });
        // Store subscription
        const subscription = await this.prisma.subscription.create({
            data: {
                userId,
                plan: planId,
                status: 'ACTIVE',
                startDate: new Date(stripeSubscription.current_period_start * 1000),
                endDate: new Date(stripeSubscription.current_period_end * 1000),
            },
        });
        this.logger.log(`Subscription created: ${stripeSubscription.id} for user ${userId}`);
        return subscription;
    }
    async cancelSubscription(userId, subscriptionId, reason) {
        const subscription = await this.prisma.subscription.findFirst({
            where: {
                id: subscriptionId,
                userId,
            },
        });
        if (!subscription) {
            throw new common_1.NotFoundException('Subscription not found');
        }
        if (subscription.status !== 'ACTIVE') {
            throw new common_1.BadRequestException('Subscription is not active');
        }
        // Cancel in Stripe - simplified since we don't have stripeSubscriptionId
        // For now, just update local record
        const updatedSubscription = await this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                status: 'CANCELLED',
                endDate: new Date(),
            },
        });
        this.logger.log(`Subscription cancelled: ${subscriptionId}`);
        return updatedSubscription;
    }
    async getUserPayments(userId, options) {
        const { page, limit, status } = options;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (status) {
            where.status = status.toUpperCase();
        }
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.payment.count({ where }),
        ]);
        const transformedPayments = payments.map(payment => ({
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            itemType: payment.itemType,
            itemId: payment.itemId,
            transactionId: payment.transactionId,
            createdAt: payment.createdAt,
            completedAt: payment.completedAt,
            metadata: payment.metadata,
        }));
        return {
            payments: transformedPayments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async getUserSubscriptions(userId) {
        const subscriptions = await this.prisma.subscription.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        return subscriptions.map(subscription => ({
            id: subscription.id,
            plan: subscription.plan,
            status: subscription.status,
            startDate: subscription.startDate,
            endDate: subscription.endDate,
            createdAt: subscription.createdAt,
            updatedAt: subscription.updatedAt,
        }));
    }
    async getUserPaymentMethods(userId) {
        const stripeCustomerId = await this.getOrCreateStripeCustomer(userId);
        const paymentMethods = await this.stripeService.getCustomerPaymentMethods(stripeCustomerId);
        return paymentMethods.map(pm => ({
            id: pm.id,
            type: pm.type,
            card: pm.card,
            billing_details: pm.billing_details,
            isDefault: pm.metadata?.isDefault === 'true',
        }));
    }
    async addPaymentMethod(userId, paymentMethodData) {
        const stripeCustomerId = await this.getOrCreateStripeCustomer(userId);
        const paymentMethod = await this.stripeService.createPaymentMethod({
            type: paymentMethodData.type,
            card: paymentMethodData.card,
            billing_details: paymentMethodData.billing_details,
        });
        // Attach to customer
        await this.stripeService.attachPaymentMethodToCustomer(paymentMethod.id, stripeCustomerId);
        // Set as default if it's the first payment method
        const existingMethods = await this.stripeService.getCustomerPaymentMethods(stripeCustomerId);
        if (existingMethods.length === 0) {
            await this.stripeService.updateCustomer(stripeCustomerId, {
                invoice_settings: {
                    default_payment_method: paymentMethod.id,
                },
            });
            paymentMethod.metadata = { ...paymentMethod.metadata, isDefault: 'true' };
        }
        return paymentMethod;
    }
    async removePaymentMethod(userId, paymentMethodId) {
        const stripeCustomerId = await this.getOrCreateStripeCustomer(userId);
        // Check if it's the default payment method
        const paymentMethods = await this.stripeService.getCustomerPaymentMethods(stripeCustomerId);
        const isDefault = paymentMethods.some(pm => pm.id === paymentMethodId && pm.metadata?.isDefault === 'true');
        if (isDefault && paymentMethods.length > 1) {
            throw new common_1.BadRequestException('Cannot remove default payment method. Please set another payment method as default first.');
        }
        await this.stripeService.detachPaymentMethod(paymentMethodId);
    }
    async setDefaultPaymentMethod(userId, paymentMethodId) {
        const stripeCustomerId = await this.getOrCreateStripeCustomer(userId);
        await this.stripeService.updateCustomer(stripeCustomerId, {
            invoice_settings: {
                default_payment_method: paymentMethodId,
            },
        });
    }
    async getAdminPayments(options) {
        const where = {};
        if (options.status)
            where.status = options.status;
        if (options.search) {
            where.OR = [
                { transactionId: { contains: options.search, mode: 'insensitive' } },
                { user: { email: { contains: options.search, mode: 'insensitive' } } },
            ];
        }
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                include: { user: { include: { profile: true } } },
                orderBy: { createdAt: 'desc' },
                skip: (options.page - 1) * options.limit,
                take: options.limit,
            }),
            this.prisma.payment.count({ where }),
        ]);
        const stats = await this.prisma.payment.groupBy({
            by: ['currency', 'status'],
            _sum: { amount: true },
        });
        return { payments, total, stats, page: options.page, limit: options.limit };
    }
    async refundPayment(id) {
        const payment = await this.prisma.payment.findUnique({ where: { id } });
        if (!payment)
            throw new common_1.NotFoundException('Payment not found');
        if (payment.status !== 'COMPLETED')
            throw new common_1.BadRequestException('Only completed payments can be refunded');
        return await this.prisma.payment.update({
            where: { id },
            data: { status: 'REFUNDED' },
        });
    }
    async getUserInvoices(userId, options) {
        const stripeCustomerId = await this.getOrCreateStripeCustomer(userId);
        const invoices = await this.stripeService.getCustomerInvoices(stripeCustomerId, options);
        return {
            invoices: invoices.data.map(invoice => ({
                id: invoice.id,
                number: invoice.number,
                status: invoice.status,
                amount: invoice.total / 100,
                currency: invoice.currency,
                created: new Date(invoice.created * 1000),
                due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
                hosted_invoice_url: invoice.hosted_invoice_url,
                invoice_pdf: invoice.invoice_pdf,
            })),
            has_more: invoices.has_more,
        };
    }
    async getInvoice(userId, invoiceId) {
        const stripeCustomerId = await this.getOrCreateStripeCustomer(userId);
        const invoice = await this.stripeService.getInvoice(invoiceId);
        if (invoice.customer !== stripeCustomerId) {
            throw new common_1.ForbiddenException('Invoice does not belong to user');
        }
        return {
            id: invoice.id,
            number: invoice.number,
            status: invoice.status,
            amount: invoice.total / 100,
            currency: invoice.currency,
            created: new Date(invoice.created * 1000),
            due_date: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
            hosted_invoice_url: invoice.hosted_invoice_url,
            invoice_pdf: invoice.invoice_pdf,
            lines: invoice.lines.data.map(line => ({
                description: line.description,
                amount: line.amount / 100,
                quantity: line.quantity,
            })),
        };
    }
    async getInvoiceDownloadUrl(userId, invoiceId) {
        const invoice = await this.getInvoice(userId, invoiceId);
        return {
            downloadUrl: invoice.invoice_pdf,
            expiresAt: new Date(Date.now() + 3600 * 1000), // 1 hour
        };
    }
    async validateCoupon(userId, code, itemType, itemId) {
        // Mock coupon validation - would be stored in database
        const coupons = [
            {
                code: 'WELCOME10',
                discountType: 'PERCENTAGE',
                discountValue: 10,
                itemType: 'COURSE',
                itemId: null, // Applies to all courses
                maxUses: 100,
                currentUses: 45,
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            },
            {
                code: 'COACHING20',
                discountType: 'PERCENTAGE',
                discountValue: 20,
                itemType: 'COACHING_PACKAGE',
                itemId: null,
                maxUses: 50,
                currentUses: 12,
                expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            },
        ];
        const coupon = coupons.find(c => c.code.toLowerCase() === code.toLowerCase() &&
            c.itemType === itemType &&
            (c.itemId === null || c.itemId === itemId));
        if (!coupon) {
            return { valid: false, reason: 'Coupon not found' };
        }
        if (coupon.currentUses >= coupon.maxUses) {
            return { valid: false, reason: 'Coupon has been fully used' };
        }
        if (coupon.expiresAt < new Date()) {
            return { valid: false, reason: 'Coupon has expired' };
        }
        // Get item price
        let itemPrice = 0;
        if (itemType === 'COURSE') {
            const course = await this.prisma.course.findUnique({ where: { id: itemId } });
            itemPrice = course?.price || 0;
        }
        else if (itemType === 'COACHING_PACKAGE') {
            const packages = await this.getCoachingPackages();
            const pkg = packages.find(p => p.id === itemId);
            itemPrice = pkg?.price || 0;
        }
        let discountAmount = 0;
        if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (itemPrice * coupon.discountValue) / 100;
        }
        else {
            discountAmount = coupon.discountValue;
        }
        return {
            valid: true,
            coupon: {
                code: coupon.code,
                discountType: coupon.discountType,
                discountValue: coupon.discountValue,
                discountAmount,
            },
        };
    }
    async getPricingPlans() {
        // Mock pricing plans - would be stored in database
        return [
            {
                id: 'basic-monthly',
                name: 'Basic Monthly',
                price: 29.99,
                currency: 'USD',
                interval: 'month',
                features: [
                    'Access to all courses',
                    'Basic support',
                    'Mobile app access',
                ],
                stripePriceId: 'price_basic_monthly',
                popular: false,
            },
            {
                id: 'pro-monthly',
                name: 'Pro Monthly',
                price: 49.99,
                currency: 'USD',
                interval: 'month',
                features: [
                    'Access to all courses',
                    'Priority support',
                    'Mobile app access',
                    'Downloadable resources',
                    'Certificate of completion',
                ],
                stripePriceId: 'price_pro_monthly',
                popular: true,
            },
            {
                id: 'pro-yearly',
                name: 'Pro Yearly',
                price: 499.99,
                currency: 'USD',
                interval: 'year',
                features: [
                    'Access to all courses',
                    'Priority support',
                    'Mobile app access',
                    'Downloadable resources',
                    'Certificate of completion',
                    '2 months free',
                ],
                stripePriceId: 'price_pro_yearly',
                popular: false,
            },
        ];
    }
    async getUserPaymentStats(userId) {
        const [totalPayments, completedPayments, totalSpent, thisMonthSpent, activeSubscription,] = await Promise.all([
            this.prisma.payment.count({ where: { userId } }),
            this.prisma.payment.count({ where: { userId, status: 'COMPLETED' } }),
            this.prisma.payment.aggregate({
                where: { userId, status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            this.prisma.payment.aggregate({
                where: {
                    userId,
                    status: 'COMPLETED',
                    completedAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
                _sum: { amount: true },
            }),
            this.prisma.subscription.findFirst({
                where: { userId, status: 'ACTIVE' },
            }),
        ]);
        return {
            totalPayments,
            completedPayments,
            totalSpent: totalSpent._sum.amount || 0,
            thisMonthSpent: thisMonthSpent._sum.amount || 0,
            successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
            hasActiveSubscription: !!activeSubscription,
            activeSubscription,
        };
    }
    async getAllPayments(options) {
        const { page, limit, status, userId } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status.toUpperCase();
        }
        if (userId) {
            where.userId = userId;
        }
        const [payments, total] = await Promise.all([
            this.prisma.payment.findMany({
                where,
                include: {
                    user: {
                        include: { profile: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.payment.count({ where }),
        ]);
        return {
            payments,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async getPaymentAnalytics() {
        const [totalRevenue, totalPayments, completedPayments, thisMonthRevenue, revenueByMonth,] = await Promise.all([
            this.prisma.payment.aggregate({
                where: { status: 'COMPLETED' },
                _sum: { amount: true },
            }),
            this.prisma.payment.count(),
            this.prisma.payment.count({ where: { status: 'COMPLETED' } }),
            this.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    completedAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
                _sum: { amount: true },
            }),
            this.getRevenueByMonth(),
        ]);
        return {
            totalRevenue: totalRevenue._sum.amount || 0,
            totalPayments,
            completedPayments,
            successRate: totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0,
            thisMonthRevenue: thisMonthRevenue._sum.amount || 0,
            revenueByMonth,
        };
    }
    async getRevenueOverview(startDate, endDate) {
        const where = { status: 'COMPLETED' };
        if (startDate) {
            where.completedAt = { ...where.completedAt, gte: startDate };
        }
        if (endDate) {
            where.completedAt = { ...where.completedAt, lte: endDate };
        }
        const [totalRevenue, paymentsByType, paymentsByStatus,] = await Promise.all([
            this.prisma.payment.aggregate({
                where,
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.payment.groupBy({
                by: ['itemType'],
                where,
                _sum: { amount: true },
                _count: true,
            }),
            this.prisma.payment.groupBy({
                by: ['status'],
                where: startDate || endDate ? where : {},
                _sum: { amount: true },
                _count: true,
            }),
        ]);
        return {
            totalRevenue: totalRevenue._sum.amount || 0,
            totalTransactions: totalRevenue._count,
            averageTransactionValue: totalRevenue._count > 0
                ? (totalRevenue._sum.amount || 0) / totalRevenue._count
                : 0,
            revenueByType: paymentsByType,
            paymentsByStatus,
            period: {
                startDate,
                endDate,
            },
        };
    }
    async fulfillPurchase(userId, itemType, itemId, paymentId) {
        switch (itemType) {
            case 'COURSE':
                // Create enrollment
                const enrollment = await this.prisma.enrollment.create({
                    data: {
                        userId,
                        courseId: itemId,
                        status: 'ACTIVE',
                        progress: 0,
                        enrolledAt: new Date(),
                    },
                });
                // Send notification
                await this.notificationsService.createNotification({
                    userId,
                    type: 'COURSE_PURCHASED',
                    titleEn: 'Course Purchase Successful',
                    titleAr: 'ØªÙ… Ø´Ø±Ø§Ø¡ Ø§Ù„Ø¯ÙˆØ±Ø© Ø¨Ù†Ø¬Ø§Ø­',
                    contentEn: 'You have successfully enrolled in the course',
                    contentAr: 'Ù„Ù‚Ø¯ Ù‚Ù…Øª Ø¨Ø§Ù„ØªØ³Ø¬ÙŠÙ„ ÙÙŠ Ø§Ù„Ø¯ÙˆØ±Ø© Ø¨Ù†Ø¬Ø§Ø­',
                    data: {
                        type: 'course_purchase',
                        courseId: itemId,
                        paymentId,
                    },
                });
                return { enrollment };
            case 'COACHING_PACKAGE':
                // coaching credits via payments
                const packages = await this.getCoachingPackages();
                const pkg = packages.find(p => p.id === itemId);
                const paymentRecord = await this.prisma.payment.findUnique({ where: { id: paymentId } });
                const meta = paymentRecord?.metadata;
                const metaStr = typeof meta === 'string' ? meta : JSON.stringify(meta || '{}');
                const metadata = JSON.parse(metaStr);
                const purchase = await this.prisma.payment.update({
                    where: { id: paymentId },
                    data: {
                        metadata: {
                            ...metadata,
                            coachingSessions: pkg?.sessions || 0,
                        },
                    },
                });
                // Send notification
                await this.notificationsService.createNotification({
                    userId,
                    type: 'COACHING_PACKAGE_PURCHASED',
                    titleEn: 'Coaching Package Purchase Successful',
                    titleAr: 'ØªÙ… Ø´Ø±Ø§Ø¡ Ø­Ø²Ù…Ø© Ø§Ù„ØªØ¯Ø±ÙŠØ¨ Ø¨Ù†Ø¬Ø§Ø­',
                    contentEn: `You have purchased a coaching package with ${pkg?.sessions} sessions`,
                    contentAr: `Ù„Ù‚Ø¯ Ù‚Ù…Øª Ø¨Ø´Ø±Ø§Ø¡ Ø­Ø²Ù…Ø© ØªØ¯Ø±ÙŠØ¨ ØªØ­ØªÙˆÙŠ Ø¹Ù„Ù‰ ${pkg?.sessions} Ø¬Ù„Ø³Ø§Øª`,
                    data: {
                        type: 'coaching_package_purchase',
                        packageId: itemId,
                        paymentId,
                    },
                });
                return { purchase };
            default:
                throw new common_1.BadRequestException('Unknown item type for fulfillment');
        }
    }
    async getOrCreateStripeCustomer(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            include: { profile: true },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        if (user.stripeCustomerId) {
            return user.stripeCustomerId;
        }
        // Create Stripe customer
        const customer = await this.stripeService.createCustomer({
            email: user.email,
            name: user.profile ? `${user.profile.firstName} ${user.profile.lastName}` : user.email,
            metadata: {
                userId,
            },
        });
        // Update user with Stripe customer ID
        await this.prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customer.id },
        });
        return customer.id;
    }
    async getCoachingPackages() {
        // Mock implementation - would be stored in database
        return [
            {
                id: 'starter',
                name: 'Starter Package',
                price: 199,
                currency: 'USD',
                sessions: 3,
            },
            {
                id: 'professional',
                name: 'Professional Package',
                price: 499,
                currency: 'USD',
                sessions: 8,
            },
            {
                id: 'executive',
                name: 'Executive Package',
                price: 999,
                currency: 'USD',
                sessions: 12,
            },
        ];
    }
    async getRevenueByMonth() {
        const months = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const revenue = await this.prisma.payment.aggregate({
                where: {
                    status: 'COMPLETED',
                    completedAt: {
                        gte: date,
                        lt: nextMonth,
                    },
                },
                _sum: { amount: true },
            });
            months.push({
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                revenue: revenue._sum.amount || 0,
            });
        }
        return months;
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = PaymentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        stripe_service_1.StripeService,
        notifications_service_1.NotificationsService])
], PaymentsService);
