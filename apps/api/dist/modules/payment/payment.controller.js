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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
const stripe_1 = __importDefault(require("stripe"));
let PaymentController = class PaymentController {
    constructor(prisma) {
        this.prisma = prisma;
        this.stripe = null;
        const key = process.env.STRIPE_SECRET_KEY;
        if (key && !key.includes('your-stripe')) {
            this.stripe = new stripe_1.default(key, { apiVersion: '2024-11-20.acacia' });
            console.log('[Payment] Stripe initialized ✅');
        }
        else {
            console.log('[Payment] No valid Stripe key — sandbox mode');
        }
    }
    // ─── GET CHECKOUT DATA ───────────────────────────────────────────────────
    async getCheckoutData(courseId, req) {
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
        if (!course)
            throw new common_1.NotFoundException('Course not found or not published');
        const alreadyEnrolled = await this.prisma.enrollment
            .findUnique({
            where: { userId_courseId: { userId: req.user.sub, courseId } },
        })
            .catch(() => null);
        return { success: true, data: { course, alreadyEnrolled: !!alreadyEnrolled } };
    }
    // ─── CREATE PAYMENT INTENT ────────────────────────────────────────────────
    async createPaymentIntent(req, body) {
        const userId = req.user.sub;
        const { courseId } = body;
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const enrolled = await this.prisma.enrollment
            .findUnique({ where: { userId_courseId: { userId, courseId } } })
            .catch(() => null);
        if (enrolled)
            throw new common_1.BadRequestException('Already enrolled in this course');
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
                },
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
    async confirmPayment(req, body) {
        const userId = req.user.sub;
        const { paymentIntentId, courseId } = body;
        if (!this.stripe)
            throw new common_1.InternalServerErrorException('Stripe not configured');
        const intent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
        if (intent.status !== 'succeeded') {
            throw new common_1.BadRequestException('Payment not completed yet');
        }
        await this.prisma.payment.updateMany({
            where: { stripeIntentId: paymentIntentId },
            data: { status: 'SUCCESS' },
        });
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const existing = await this.prisma.enrollment
            .findUnique({ where: { userId_courseId: { userId, courseId } } })
            .catch(() => null);
        if (!existing) {
            await this.doEnroll(userId, courseId, course, 'STRIPE_CARD', course.price, paymentIntentId);
        }
        return { success: true, data: { courseId } };
    }
    // ─── MY PAYMENTS ──────────────────────────────────────────────────────────
    async getMyPayments(req) {
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
    async doEnroll(userId, courseId, course, method, amount, txId) {
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
            },
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
            .catch(() => { });
        // Remove from cart
        const cart = await this.prisma.cart
            .findUnique({ where: { userId } })
            .catch(() => null);
        if (cart) {
            await this.prisma.cartItem
                .deleteMany({ where: { cartId: cart.id, courseId } })
                .catch(() => { });
        }
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Get)('checkout/:courseId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Param)('courseId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getCheckoutData", null);
__decorate([
    (0, common_1.Post)('create-intent'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "createPaymentIntent", null);
__decorate([
    (0, common_1.Post)('confirm'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "confirmPayment", null);
__decorate([
    (0, common_1.Get)('my-payments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getMyPayments", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payment'),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentController);
