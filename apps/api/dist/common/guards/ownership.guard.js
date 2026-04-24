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
Object.defineProperty(exports, "__esModule", { value: true });
exports.OwnershipGuard = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const prisma_service_1 = require("../../prisma/prisma.service");
let OwnershipGuard = class OwnershipGuard {
    constructor(reflector, prisma) {
        this.reflector = reflector;
        this.prisma = prisma;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user) {
            throw new common_1.ForbiddenException('User not authenticated');
        }
        const resourceType = this.reflector.get('resourceType', context.getHandler());
        const resourceId = request.params.id || request.params.courseId || request.params.lessonId;
        if (!resourceType || !resourceId) {
            return true;
        }
        if (user.role === 'ADMIN') {
            return true;
        }
        const isOwner = await this.checkOwnership(user.id, resourceType, resourceId);
        if (!isOwner) {
            throw new common_1.ForbiddenException('You do not have permission to access this resource');
        }
        return true;
    }
    async checkOwnership(userId, resourceType, resourceId) {
        switch (resourceType) {
            case 'course':
                return this.checkCourseOwnership(userId, resourceId);
            case 'lesson':
                return this.checkLessonOwnership(userId, resourceId);
            case 'enrollment':
                return this.checkEnrollmentOwnership(userId, resourceId);
            case 'certificate':
                return this.checkCertificateOwnership(userId, resourceId);
            case 'payment':
                return this.checkPaymentOwnership(userId, resourceId);
            case 'notification':
                return this.checkNotificationOwnership(userId, resourceId);
            case 'file':
                return this.checkFileOwnership(userId, resourceId);
            case 'coachingSession':
                return this.checkCoachingSessionOwnership(userId, resourceId);
            default:
                return false;
        }
    }
    async checkCourseOwnership(userId, courseId) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            select: { id: true },
        });
        return true;
    }
    async checkLessonOwnership(userId, lessonId) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            select: {
                module: {
                    select: {
                        course: {
                            select: { id: true },
                        },
                    },
                },
            },
        });
        return true;
    }
    async checkEnrollmentOwnership(userId, enrollmentId) {
        const enrollment = await this.prisma.enrollment.findUnique({
            where: { id: enrollmentId },
            select: { userId: true },
        });
        return (enrollment === null || enrollment === void 0 ? void 0 : enrollment.userId) === userId;
    }
    async checkCertificateOwnership(userId, certificateId) {
        const certificate = await this.prisma.certificate.findUnique({
            where: { id: certificateId },
            select: { userId: true },
        });
        return (certificate === null || certificate === void 0 ? void 0 : certificate.userId) === userId;
    }
    async checkPaymentOwnership(userId, paymentId) {
        const payment = await this.prisma.payment.findUnique({
            where: { id: paymentId },
            select: { userId: true },
        });
        return (payment === null || payment === void 0 ? void 0 : payment.userId) === userId;
    }
    async checkNotificationOwnership(userId, notificationId) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
            select: { userId: true },
        });
        return (notification === null || notification === void 0 ? void 0 : notification.userId) === userId;
    }
    async checkFileOwnership(userId, fileId) {
        const file = await this.prisma.uploadedFile.findUnique({
            where: { id: fileId },
            select: { userId: true },
        });
        return (file === null || file === void 0 ? void 0 : file.userId) === userId;
    }
    async checkCoachingSessionOwnership(userId, sessionId) {
        const session = await this.prisma.coachingSession.findUnique({
            where: { id: sessionId },
            select: { userId: true, coachId: true },
        });
        return (session === null || session === void 0 ? void 0 : session.userId) === userId || (session === null || session === void 0 ? void 0 : session.coachId) === userId;
    }
};
exports.OwnershipGuard = OwnershipGuard;
exports.OwnershipGuard = OwnershipGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        prisma_service_1.PrismaService])
], OwnershipGuard);
//# sourceMappingURL=ownership.guard.js.map