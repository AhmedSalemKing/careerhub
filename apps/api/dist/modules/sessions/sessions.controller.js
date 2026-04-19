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
exports.SessionsController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../../prisma/prisma.service");
let SessionsController = class SessionsController {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getConsultants() {
        console.log('[Sessions] Fetching consultants...');
        const consultants = await this.prisma.user.findMany({
            where: {
                accountType: 'CONSULTANT',
                status: { in: ['ACTIVE', 'PENDING'] },
            },
            select: {
                id: true,
                email: true,
                hourlyRate: true,
                meetingMethod: true,
                bio: true,
                speciality: true,
                experience: true,
                linkedinUrl: true,
                profile: {
                    select: { firstName: true, lastName: true, avatar: true, country: true }
                },
                _count: { select: { consultantSessions: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        console.log('[Sessions] Found consultants:', consultants.length);
        return { success: true, data: consultants };
    }
    async getConsultant(id) {
        const consultant = await this.prisma.user.findFirst({
            where: { id, accountType: 'CONSULTANT', status: { in: ['ACTIVE', 'PENDING'] } },
            select: {
                id: true,
                hourlyRate: true,
                meetingMethod: true,
                bio: true,
                speciality: true,
                experience: true,
                linkedinUrl: true,
                profile: { select: { firstName: true, lastName: true, avatar: true, country: true } },
                _count: { select: { consultantSessions: true } },
            }
        });
        if (!consultant)
            throw new common_1.NotFoundException('Consultant not found');
        return { success: true, data: consultant };
    }
    async bookSession(req, body) {
        var _a, _b;
        const studentId = req.user.sub;
        const consultant = await this.prisma.user.findFirst({
            where: { id: body.consultantId, accountType: 'CONSULTANT' },
            include: { profile: true }
        });
        if (!consultant)
            throw new common_1.NotFoundException('Consultant not found');
        const scheduledAt = new Date(body.scheduledAt);
        if (scheduledAt <= new Date()) {
            throw new common_1.BadRequestException('Session must be scheduled in the future');
        }
        const conflict = await this.prisma.consultingSession.findFirst({
            where: {
                consultantId: body.consultantId,
                status: { in: ['PENDING', 'CONFIRMED'] },
                scheduledAt: {
                    gte: new Date(scheduledAt.getTime() - 60 * 60 * 1000),
                    lte: new Date(scheduledAt.getTime() + 60 * 60 * 1000),
                }
            }
        });
        if (conflict)
            throw new common_1.BadRequestException('This time slot is not available');
        const price = consultant.hourlyRate || 0;
        const duration = body.duration || 60;
        const session = await this.prisma.consultingSession.create({
            data: {
                studentId,
                consultantId: body.consultantId,
                scheduledAt,
                duration,
                meetingMethod: body.meetingMethod,
                topic: body.topic,
                notes: body.notes,
                status: 'PENDING',
                paymentStatus: price > 0 ? 'UNPAID' : 'PAID',
                price,
            },
            include: {
                consultant: { include: { profile: true } },
                student: { include: { profile: true } },
            }
        });
        const student = await this.prisma.user.findUnique({
            where: { id: studentId },
            include: { profile: true }
        });
        const studentName = `${((_a = student === null || student === void 0 ? void 0 : student.profile) === null || _a === void 0 ? void 0 : _a.firstName) || ''} ${((_b = student === null || student === void 0 ? void 0 : student.profile) === null || _b === void 0 ? void 0 : _b.lastName) || ''}`.trim();
        const dateStr = scheduledAt.toLocaleDateString('ar-SA');
        await this.prisma.notification.create({
            data: {
                userId: body.consultantId,
                type: 'SYSTEM_ANNOUNCEMENT',
                titleEn: 'New Consultation Request',
                titleAr: 'طلب استشارة جديد',
                contentEn: `${studentName} requests a consultation on ${dateStr} - ${body.topic || 'Career Consultation'}`,
                contentAr: `${studentName} يطلب استشارة بتاريخ ${dateStr} - ${body.topic || 'استشارة مهنية'}`,
                isRead: false,
            }
        }).catch(() => { });
        return { success: true, data: session };
    }
    async getMySessions(req, status) {
        const userId = req.user.sub;
        console.log('[Sessions] getMySessions userId:', userId);
        const where = {
            OR: [{ studentId: userId }, { consultantId: userId }]
        };
        if (status && status !== 'ALL') {
            where.status = status;
        }
        const sessions = await this.prisma.consultingSession.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { firstName: true, lastName: true, avatar: true } }
                    }
                },
                consultant: {
                    select: {
                        id: true,
                        email: true,
                        speciality: true,
                        hourlyRate: true,
                        profile: { select: { firstName: true, lastName: true, avatar: true } }
                    }
                },
            },
            orderBy: { scheduledAt: 'desc' }
        });
        console.log('[Sessions] Found sessions:', sessions.length, 'for userId:', userId);
        return { success: true, data: sessions };
    }
    async confirmSession(id, req, body) {
        var _a, _b;
        const session = await this.prisma.consultingSession.findFirst({
            where: { id, consultantId: req.user.sub },
            include: {
                student: { include: { profile: true } },
                consultant: { include: { profile: true } }
            }
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        const updated = await this.prisma.consultingSession.update({
            where: { id },
            data: { status: 'CONFIRMED', meetingLink: body.meetingLink }
        });
        const consultantName = `${((_a = session.consultant.profile) === null || _a === void 0 ? void 0 : _a.firstName) || ''} ${((_b = session.consultant.profile) === null || _b === void 0 ? void 0 : _b.lastName) || ''}`.trim();
        const dateStr = session.scheduledAt.toLocaleDateString('ar-SA');
        await this.prisma.notification.create({
            data: {
                userId: session.studentId,
                type: 'SYSTEM_ANNOUNCEMENT',
                titleEn: 'Consultation Confirmed',
                titleAr: 'تم تأكيد استشارتك',
                contentEn: `${consultantName} has confirmed your consultation on ${dateStr}.${body.meetingLink ? ` Meeting link: ${body.meetingLink}` : ''}`,
                contentAr: `قبل ${consultantName} طلب استشارتك بتاريخ ${dateStr}. ${body.meetingLink ? `رابط الاجتماع: ${body.meetingLink}` : ''}`,
                isRead: false,
            }
        }).catch(() => { });
        return { success: true, data: updated };
    }
    async rejectSession(id, req, body) {
        var _a, _b;
        const session = await this.prisma.consultingSession.findFirst({
            where: { id, consultantId: req.user.sub },
            include: { consultant: { include: { profile: true } } }
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        await this.prisma.consultingSession.update({
            where: { id },
            data: { status: 'REJECTED' }
        });
        const consultantName = `${((_a = session.consultant.profile) === null || _a === void 0 ? void 0 : _a.firstName) || ''} ${((_b = session.consultant.profile) === null || _b === void 0 ? void 0 : _b.lastName) || ''}`.trim();
        await this.prisma.notification.create({
            data: {
                userId: session.studentId,
                type: 'SYSTEM_ANNOUNCEMENT',
                titleEn: 'Consultation Request Declined',
                titleAr: 'تم رفض طلب الاستشارة',
                contentEn: `${consultantName} declined the consultation.${body.reason ? ` Reason: ${body.reason}` : ' You can choose another time or consultant.'}`,
                contentAr: `اعتذر ${consultantName} عن الاستشارة. ${body.reason ? `السبب: ${body.reason}` : 'يمكنك اختيار موعد آخر أو مستشار آخر.'}`,
                isRead: false,
            }
        }).catch(() => { });
        return { success: true };
    }
    async rescheduleSession(id, req, body) {
        var _a, _b;
        const session = await this.prisma.consultingSession.findFirst({
            where: { id, consultantId: req.user.sub },
            include: { consultant: { include: { profile: true } } }
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        const proposedTime = new Date(body.proposedTime);
        await this.prisma.consultingSession.update({
            where: { id },
            data: {
                status: 'RESCHEDULED',
                proposedTime,
                proposedAt: new Date(),
            }
        });
        const consultantName = `${((_a = session.consultant.profile) === null || _a === void 0 ? void 0 : _a.firstName) || ''} ${((_b = session.consultant.profile) === null || _b === void 0 ? void 0 : _b.lastName) || ''}`.trim();
        const dateStr = proposedTime.toLocaleDateString('ar-SA');
        const timeStr = proposedTime.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' });
        await this.prisma.notification.create({
            data: {
                userId: session.studentId,
                type: 'SYSTEM_ANNOUNCEMENT',
                titleEn: 'New Time Proposed for Consultation',
                titleAr: 'اقتراح موعد جديد للاستشارة',
                contentEn: `${consultantName} proposes a new time: ${dateStr} ${timeStr}.${body.message ? ` ${body.message}` : ''}`,
                contentAr: `${consultantName} يقترح موعداً جديداً: ${dateStr} ${timeStr}. ${body.message || ''}`,
                isRead: false,
            }
        }).catch(() => { });
        return { success: true };
    }
    async acceptReschedule(id, req) {
        var _a, _b;
        const session = await this.prisma.consultingSession.findFirst({
            where: { id, studentId: req.user.sub, status: 'RESCHEDULED' },
            include: { student: { include: { profile: true } } }
        });
        if (!session || !session.proposedTime)
            throw new common_1.NotFoundException('Session not found');
        await this.prisma.consultingSession.update({
            where: { id },
            data: {
                status: 'CONFIRMED',
                scheduledAt: session.proposedTime,
                proposedTime: null,
            }
        });
        const studentName = `${((_a = session.student.profile) === null || _a === void 0 ? void 0 : _a.firstName) || ''} ${((_b = session.student.profile) === null || _b === void 0 ? void 0 : _b.lastName) || ''}`.trim();
        await this.prisma.notification.create({
            data: {
                userId: session.consultantId,
                type: 'SYSTEM_ANNOUNCEMENT',
                titleEn: 'Student Accepted New Time',
                titleAr: 'قبل الطالب الموعد الجديد',
                contentEn: `${studentName} accepted the new consultation time.`,
                contentAr: `${studentName} وافق على الموعد الجديد للاستشارة.`,
                isRead: false,
            }
        }).catch(() => { });
        return { success: true };
    }
    async paySession(id, req) {
        var _a;
        const userId = req.user.sub;
        const session = await this.prisma.consultingSession.findFirst({
            where: { id, studentId: userId },
            include: {
                consultant: { include: { profile: true } },
                student: { include: { profile: true } },
            }
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        if (session.paymentStatus === 'PAID')
            throw new common_1.BadRequestException('Already paid');
        const price = session.price || 0;
        if (price === 0) {
            await this.doPaySession(session, userId, 'FREE', `FREE_${Date.now()}`);
            return { success: true, data: { free: true } };
        }
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (stripeKey) {
            const Stripe = require('stripe');
            const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });
            const intent = await stripe.paymentIntents.create({
                amount: Math.round(price * 100),
                currency: 'sar',
                metadata: {
                    userId,
                    sessionId: session.id,
                    type: 'SESSION',
                },
                description: `DeveWay: استشارة مع ${((_a = session.consultant.profile) === null || _a === void 0 ? void 0 : _a.firstName) || ''}`,
            });
            await this.prisma.payment.create({
                data: {
                    userId,
                    amount: price,
                    method: 'STRIPE_CARD',
                    status: 'PENDING',
                    transactionId: intent.id,
                    stripeIntentId: intent.id,
                    itemType: 'SESSION',
                    itemId: session.id,
                }
            }).catch(() => { });
            return {
                success: true,
                data: {
                    clientSecret: intent.client_secret,
                    amount: price,
                    sessionId: session.id,
                    mode: 'stripe',
                }
            };
        }
        const txId = `SESSION_SANDBOX_${Date.now()}`;
        await this.doPaySession(session, userId, 'SANDBOX', txId);
        return { success: true, data: { sandbox: true, sessionId: session.id } };
    }
    async confirmSessionPayment(id, req, body) {
        const stripeKey = process.env.STRIPE_SECRET_KEY;
        if (!stripeKey)
            throw new common_1.BadRequestException('Stripe not configured');
        const Stripe = require('stripe');
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });
        const intent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
        if (intent.status !== 'succeeded')
            throw new common_1.BadRequestException('Payment not completed');
        const session = await this.prisma.consultingSession.findFirst({
            where: { id, studentId: req.user.sub },
            include: { consultant: { include: { profile: true } } }
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        await this.prisma.payment.updateMany({
            where: { transactionId: body.paymentIntentId },
            data: { status: 'SUCCESS' }
        });
        await this.doPaySession(session, req.user.sub, 'STRIPE', body.paymentIntentId);
        return { success: true };
    }
    async doPaySession(session, userId, method, txId) {
        var _a;
        await this.prisma.payment.upsert({
            where: { transactionId: txId },
            update: { status: 'SUCCESS' },
            create: {
                userId,
                amount: session.price || 0,
                method,
                status: 'SUCCESS',
                transactionId: txId,
                itemType: 'SESSION',
                itemId: session.id,
            }
        }).catch(() => { });
        const payment = await this.prisma.payment.findFirst({
            where: { transactionId: txId }
        });
        await this.prisma.consultingSession.update({
            where: { id: session.id },
            data: {
                paymentStatus: 'PAID',
                ...(payment ? { paymentId: payment.id } : {}),
            }
        });
        const consultantName = ((_a = session.consultant) === null || _a === void 0 ? void 0 : _a.profile)
            ? `${session.consultant.profile.firstName || ''} ${session.consultant.profile.lastName || ''}`.trim()
            : 'المستشار';
        const dateStr = new Date(session.scheduledAt).toLocaleDateString('ar-SA');
        await this.prisma.notification.create({
            data: {
                userId,
                type: 'PAYMENT_CONFIRMED',
                titleEn: 'Payment Successful',
                titleAr: 'تم الدفع بنجاح',
                contentEn: `Payment of ${session.price} SAR for consultation with ${consultantName} on ${dateStr}.`,
                contentAr: `تم دفع ${session.price} ريال لاستشارة مع ${consultantName} بتاريخ ${dateStr}`,
                isRead: false,
            }
        }).catch(() => { });
    }
    async cancelSession(id, req) {
        const session = await this.prisma.consultingSession.findFirst({
            where: {
                id,
                OR: [{ studentId: req.user.sub }, { consultantId: req.user.sub }]
            }
        });
        if (!session)
            throw new common_1.NotFoundException('Session not found');
        await this.prisma.consultingSession.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
        const notifyUserId = req.user.sub === session.studentId
            ? session.consultantId
            : session.studentId;
        await this.prisma.notification.create({
            data: {
                userId: notifyUserId,
                type: 'SYSTEM_ANNOUNCEMENT',
                titleEn: 'Consultation Cancelled',
                titleAr: 'تم إلغاء الاستشارة',
                contentEn: 'The consultation appointment has been cancelled.',
                contentAr: 'تم إلغاء موعد الاستشارة.',
                isRead: false,
            }
        }).catch(() => { });
        return { success: true };
    }
};
exports.SessionsController = SessionsController;
__decorate([
    (0, common_1.Get)('consultants'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getConsultants", null);
__decorate([
    (0, common_1.Get)('consultants/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getConsultant", null);
__decorate([
    (0, common_1.Post)('book'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "bookSession", null);
__decorate([
    (0, common_1.Get)('my-sessions'),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "getMySessions", null);
__decorate([
    (0, common_1.Patch)(':id/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "confirmSession", null);
__decorate([
    (0, common_1.Patch)(':id/reject'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "rejectSession", null);
__decorate([
    (0, common_1.Patch)(':id/reschedule'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "rescheduleSession", null);
__decorate([
    (0, common_1.Patch)(':id/accept-reschedule'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "acceptReschedule", null);
__decorate([
    (0, common_1.Post)(':id/pay'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "paySession", null);
__decorate([
    (0, common_1.Post)(':id/confirm-payment'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "confirmSessionPayment", null);
__decorate([
    (0, common_1.Patch)(':id/cancel'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionsController.prototype, "cancelSession", null);
exports.SessionsController = SessionsController = __decorate([
    (0, common_1.Controller)('sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SessionsController);
//# sourceMappingURL=sessions.controller.js.map