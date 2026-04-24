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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const stripe_1 = __importDefault(require("stripe"));
let WalletService = class WalletService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    getStripe() {
        const secretKey = process.env.STRIPE_SECRET_KEY;
        if (!secretKey) {
            throw new common_1.BadRequestException('Stripe is not configured');
        }
        return new stripe_1.default(secretKey);
    }
    async getWallet(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true }
        });
        const transactions = await this.prisma.walletTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 20,
        });
        return {
            balance: (user === null || user === void 0 ? void 0 : user.walletBalance) || 0,
            transactions,
        };
    }
    async createTopupIntent(userId, amount) {
        const stripe = this.getStripe();
        if (amount < 10)
            throw new common_1.BadRequestException('الحد الأدنى للشحن 10 ريال');
        if (amount > 10000)
            throw new common_1.BadRequestException('الحد الأقصى للشحن 10,000 ريال');
        const amountInHalala = Math.round(amount * 100);
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInHalala,
            currency: 'sar',
            metadata: {
                userId,
                type: 'WALLET_TOPUP',
                amountSAR: amount.toString(),
            },
        });
        return {
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id,
        };
    }
    async confirmTopup(userId, paymentIntentId) {
        const stripe = this.getStripe();
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            throw new common_1.BadRequestException('لم يتم تأكيد الدفع');
        }
        if (paymentIntent.metadata.userId !== userId) {
            throw new common_1.ForbiddenException('غير مصرح');
        }
        const amount = parseFloat(paymentIntent.metadata.amountSAR);
        const existing = await this.prisma.walletTransaction.findFirst({
            where: { stripePaymentIntentId: paymentIntentId }
        });
        if (existing)
            return { balance: (await this.getWallet(userId)).balance };
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { walletBalance: { increment: amount } }
        });
        await this.prisma.walletTransaction.create({
            data: {
                userId,
                type: 'TOPUP',
                amount,
                description: `شحن رصيد - ${amount} ريال`,
                status: 'SUCCESS',
                stripePaymentIntentId: paymentIntentId,
            }
        });
        return { balance: updated.walletBalance };
    }
    async payWithWallet(userId, courseId) {
        const course = await this.prisma.course.findUnique({ where: { id: courseId } });
        if (!course)
            throw new common_1.NotFoundException('الكورس غير موجود');
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { walletBalance: true }
        });
        const price = course.price || 0;
        if (price === 0) {
            await this.prisma.enrollment.upsert({
                where: { userId_courseId: { userId, courseId } },
                create: { userId, courseId },
                update: {},
            });
            return { success: true, message: 'تم الاشتراك مجاناً' };
        }
        if (((user === null || user === void 0 ? void 0 : user.walletBalance) || 0) < price) {
            throw new common_1.BadRequestException({
                message: 'رصيد المحفظة غير كافٍ',
                code: 'INSUFFICIENT_BALANCE',
                required: price,
                current: (user === null || user === void 0 ? void 0 : user.walletBalance) || 0,
            });
        }
        const enrolled = await this.prisma.enrollment.findFirst({
            where: { userId, courseId }
        });
        if (enrolled)
            throw new common_1.BadRequestException('أنت مشترك بالفعل في هذا الكورس');
        await this.prisma.user.update({
            where: { id: userId },
            data: { walletBalance: { decrement: price } }
        });
        await this.prisma.walletTransaction.create({
            data: {
                userId,
                type: 'PAYMENT',
                amount: -price,
                description: `شراء كورس: ${course.titleAr || course.titleEn}`,
                status: 'SUCCESS',
                courseId,
            }
        });
        await this.prisma.enrollment.create({
            data: { userId, courseId }
        });
        return { success: true, message: 'تم الاشتراك بنجاح' };
    }
    async transferFromEarnings(userId, amount) {
        var _a;
        if (amount <= 0)
            throw new common_1.BadRequestException('المبلغ يجب أن يكون أكبر من صفر');
        const sessions = await this.prisma.consultingSession.findMany({
            where: { consultantId: userId, status: 'COMPLETED' }
        }).catch(() => []);
        const totalEarnings = sessions.reduce((sum, s) => sum + (s.price || 0), 0);
        const transferred = await this.prisma.walletTransaction.aggregate({
            where: { userId, type: 'EARNINGS_TRANSFER' },
            _sum: { amount: true }
        }).catch(() => ({ _sum: { amount: 0 } }));
        const availableEarnings = totalEarnings - (((_a = transferred._sum) === null || _a === void 0 ? void 0 : _a.amount) || 0);
        if (amount > availableEarnings) {
            throw new common_1.BadRequestException({
                message: `أرباحك المتاحة: ${availableEarnings.toFixed(2)} ر.س`,
                code: 'INSUFFICIENT_EARNINGS',
            });
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: { walletBalance: { increment: amount } }
        });
        await this.prisma.walletTransaction.create({
            data: {
                userId,
                type: 'EARNINGS_TRANSFER',
                amount,
                description: `تحويل من الأرباح - ${amount} ر.س`,
                status: 'SUCCESS',
            }
        });
        return { success: true, newBalance: updated.walletBalance };
    }
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map