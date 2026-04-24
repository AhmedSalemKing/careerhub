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
var VerificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let VerificationService = VerificationService_1 = class VerificationService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(VerificationService_1.name);
    }
    async submitVerification(userId, data) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.BadRequestException('User not found');
        }
        if (!['INSTRUCTOR', 'CONSULTANT'].includes(user.accountType)) {
            throw new common_1.ForbiddenException('التوثيق متاح فقط للمحاضرين والمستشارين');
        }
        if (user.isVerified) {
            throw new common_1.BadRequestException('حسابك موثق بالفعل');
        }
        if (user.idVerificationStatus === 'PENDING') {
            throw new common_1.BadRequestException('لديك طلب توثيق قيد المراجعة');
        }
        if (user.idVerificationStatus === 'REJECTED') {
            throw new common_1.BadRequestException('طلبك السابق مرفوض. يمكنك إعادة التقديم');
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                idFrontUrl: data.idFrontUrl,
                idBackUrl: data.idBackUrl,
                idVerificationStatus: 'PENDING',
            },
        });
        this.logger.log(`[Verification] Submitted by user: ${user.email}`);
        return { success: true, data: { status: 'PENDING' } };
    }
    async getVerificationStatus(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                idVerificationStatus: true,
                isVerified: true,
                idVerifiedAt: true,
                idRejectedReason: true,
                idFrontUrl: true,
                idBackUrl: true,
            },
        });
        return { success: true, data: user };
    }
    async getPendingVerifications() {
        const users = await this.prisma.user.findMany({
            where: { idVerificationStatus: 'PENDING' },
            select: {
                id: true,
                email: true,
                accountType: true,
                idFrontUrl: true,
                idBackUrl: true,
                createdAt: true,
                profile: { select: { firstName: true, lastName: true, avatar: true } },
            },
            orderBy: { createdAt: 'asc' },
        });
        return users;
    }
    async approveVerification(userId, adminId) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                idVerificationStatus: 'VERIFIED',
                isVerified: true,
                idVerifiedAt: new Date(),
                idRejectedReason: null,
            },
            include: { profile: true },
        });
        this.logger.log(`[Verification] Approved for user: ${user.email} by admin: ${adminId}`);
        return { success: true, data: user };
    }
    async rejectVerification(userId, reason, adminId) {
        const user = await this.prisma.user.update({
            where: { id: userId },
            data: {
                idVerificationStatus: 'REJECTED',
                isVerified: false,
                idRejectedReason: reason || 'الوثائق المقدمة غير واضحة أو غير مطابقة',
            },
            include: { profile: true },
        });
        this.logger.log(`[Verification] Rejected for user: ${user.email} by admin: ${adminId}`);
        return { success: true, data: user };
    }
};
exports.VerificationService = VerificationService;
exports.VerificationService = VerificationService = VerificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VerificationService);
//# sourceMappingURL=verification.service.js.map