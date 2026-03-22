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
var CoachingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CoachingService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const zoom_service_1 = require("./zoom.service");
let CoachingService = CoachingService_1 = class CoachingService {
    constructor(prisma, configService, zoomService) {
        this.prisma = prisma;
        this.configService = configService;
        this.zoomService = zoomService;
        this.logger = new common_1.Logger(CoachingService_1.name);
        this.cacheTtlMs = 30_000;
        this.cache = new Map();
    }
    async getCoaches(specialization, language = 'en') {
        const cacheKey = `coaches:${specialization || ''}:${language}`;
        const cached = this.cache.get(cacheKey);
        if (cached && cached.expiresAt > Date.now()) {
            return cached.data;
        }
        const where = {
            user: {
                isActive: true,
            },
        };
        if (specialization) {
            where.specialties = {
                has: specialization,
            };
        }
        const coaches = await this.prisma.coach.findMany({
            where,
            select: {
                id: true,
                hourlyRate: true,
                rating: true,
                specialties: true,
                user: {
                    select: {
                        profile: {
                            select: {
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
        const data = coaches.map(coach => ({
            id: coach.id,
            hourlyRate: coach.hourlyRate,
            rating: coach.rating,
            specialties: coach.specialties,
            user: {
                firstName: coach.user.profile?.firstName,
                lastName: coach.user.profile?.lastName,
                avatar: coach.user.profile?.avatar,
            },
        }));
        this.cache.set(cacheKey, {
            expiresAt: Date.now() + this.cacheTtlMs,
            data,
        });
        return data;
    }
    async getCoach(id, language = 'en') {
        const coach = await this.prisma.coach.findUnique({
            where: { id },
            include: {
                user: {
                    include: { profile: true },
                },
                coachingSessions: {
                    where: {
                        status: 'COMPLETED',
                    },
                    include: {
                        reviews: true,
                        user: {
                            include: { profile: true },
                        },
                    },
                },
                _count: {
                    select: {
                        coachingSessions: {
                            where: {
                                status: 'COMPLETED',
                            },
                        },
                        reviews: true,
                    },
                },
            },
        });
        if (!coach) {
            throw new common_1.NotFoundException('Coach not found');
        }
        const totalReviews = coach._count.reviews;
        const averageRating = totalReviews > 0
            ? coach.coachingSessions.reduce((sum, session) => {
                const sessionRating = session.reviews.reduce((reviewSum, review) => reviewSum + review.rating, 0);
                return sum + (sessionRating / session.reviews.length || 0);
            }, 0) / coach.coachingSessions.length
            : 0;
        const reviews = coach.coachingSessions
            .flatMap(session => session.reviews)
            .map(review => ({
            id: review.id,
            rating: review.rating,
            comment: review.comment,
            createdAt: review.createdAt,
            user: {
                firstName: review.user.profile?.firstName,
                lastName: review.user.profile?.lastName,
                avatar: review.user.profile?.avatar,
            },
        }));
        return {
            id: coach.id,
            user: {
                id: coach.user.id,
                firstName: coach.user.profile?.firstName,
                lastName: coach.user.profile?.lastName,
                avatar: coach.user.profile?.avatar,
                email: coach.user.email,
            },
            bio: language === 'ar' ? coach.bioAr : coach.bioEn,
            specialties: coach.specializations,
            hourlyRate: coach.hourlyRate,
            experience: coach.experience,
            rating: Math.round(averageRating * 10) / 10,
            totalSessions: coach._count.coachingSessions,
            totalReviews: totalReviews,
            reviews,
            availability: this.getMockAvailability(coach.id),
            education: coach.education ? JSON.parse(coach.education) : [],
            certifications: coach.certifications ? JSON.parse(coach.certifications) : [],
        };
    }
    async getUserSessions(userId, options) {
        const { page, limit, status } = options;
        const skip = (page - 1) * limit;
        const where = { userId };
        if (status) {
            where.status = status.toUpperCase();
        }
        const [sessions, total] = await Promise.all([
            this.prisma.coachingSession.findMany({
                where,
                include: {
                    coach: {
                        include: {
                            user: {
                                include: { profile: true },
                            },
                        },
                    },
                    reviews: true,
                },
                orderBy: { startTime: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.coachingSession.count({ where }),
        ]);
        const transformedSessions = sessions.map(session => ({
            id: session.id,
            sessionType: session.sessionType,
            status: session.status,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            price: session.price,
            currency: session.currency,
            notes: session.notes,
            meetingUrl: session.meetingUrl,
            meetingId: session.meetingId,
            coach: {
                id: session.coach.id,
                firstName: session.coach?.user?.profile?.firstName,
                lastName: session.coach?.user?.profile?.lastName,
                avatar: session.coach?.user?.profile?.avatar,
                specialties: session.coach.specializations,
            },
            review: session.reviews[0] || null,
            canReschedule: this.canReschedule(session),
            canCancel: this.canCancel(session),
        }));
        return {
            sessions: transformedSessions,
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
    async getSession(userId, sessionId) {
        const session = await this.prisma.coachingSession.findFirst({
            where: {
                id: sessionId,
                userId,
            },
            include: {
                coach: {
                    include: {
                        user: {
                            include: { profile: true },
                        },
                    },
                },
                reviews: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        return {
            id: session.id,
            sessionType: session.sessionType,
            status: session.status,
            startTime: session.startTime,
            endTime: session.endTime,
            duration: session.duration,
            price: session.price,
            currency: session.currency,
            notes: session.notes,
            meetingUrl: session.meetingUrl,
            meetingId: session.meetingId,
            coach: {
                id: session.coach.id,
                firstName: session.coach?.user?.profile?.firstName,
                lastName: session.coach?.user?.profile?.lastName,
                avatar: session.coach?.user?.profile?.avatar,
                email: session.coach.user.email,
                specialties: session.coach.specializations,
                hourlyRate: session.coach.hourlyRate,
            },
            review: session.reviews[0] || null,
            canReschedule: this.canReschedule(session),
            canCancel: this.canCancel(session),
            canJoin: this.canJoin(session),
        };
    }
    async joinSession(userId, sessionId) {
        const session = await this.prisma.coachingSession.findFirst({
            where: {
                id: sessionId,
                userId,
            },
            include: {
                coach: {
                    include: { user: true },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (!this.canJoin(session)) {
            throw new common_1.BadRequestException('Cannot join session at this time');
        }
        // Generate Zoom join URL
        if (session.meetingId) {
            const joinUrl = await this.zoomService.getMeetingJoinUrl(session.meetingId, userId);
            return {
                joinUrl,
                meetingId: session.meetingId,
                startTime: session.startTime,
                endTime: session.endTime,
                coachName: `${session.coach?.user?.profile?.firstName} ${session.coach?.user?.profile?.lastName}`,
            };
        }
        throw new common_1.BadRequestException('Meeting not available');
    }
    async completeSession(coachId, sessionId, completionData) {
        const session = await this.prisma.coachingSession.findFirst({
            where: {
                id: sessionId,
                coachId,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.status !== 'SCHEDULED') {
            throw new common_1.BadRequestException('Session cannot be completed');
        }
        const updatedSession = await this.prisma.coachingSession.update({
            where: { id: sessionId },
            data: {
                status: 'COMPLETED',
                notes: completionData.notes,
            },
        });
        // Update coach availability
        await this.updateCoachAvailabilityAfterSession(session.coachId, session.startTime, session.endTime);
        this.logger.log(`Session completed: ${sessionId}`);
        return updatedSession;
    }
    async submitReview(userId, sessionId, reviewData) {
        const session = await this.prisma.coachingSession.findFirst({
            where: {
                id: sessionId,
                userId,
                status: 'COMPLETED',
            },
            include: {
                reviews: true,
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found or not completed');
        }
        if (session.reviews.length > 0) {
            throw new common_1.BadRequestException('Review already submitted for this session');
        }
        const review = await this.prisma.coachReview.create({
            data: {
                sessionId,
                userId,
                coachId: session.coachId,
                rating: reviewData.rating,
                comment: reviewData.comment,
            },
        });
        this.logger.log(`Review submitted for session: ${sessionId}`);
        return review;
    }
    async getCoachReviews(coachId, options) {
        const { page, limit } = options;
        const skip = (page - 1) * limit;
        const [reviews, total] = await Promise.all([
            this.prisma.coachReview.findMany({
                where: { coachId },
                include: {
                    user: {
                        include: { profile: true },
                    },
                    session: {
                        select: {
                        // sessionType: true,
                        // completedAt: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.coachReview.count({ where: { coachId } }),
        ]);
        return {
            reviews,
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
    async getPackages(language = 'en') {
        // Mock packages - in a real app, these would be stored in the database
        return [
            {
                id: 'starter',
                name: 'Starter Package',
                description: 'Perfect for getting started with career coaching',
                price: 199,
                currency: 'USD',
                sessions: 3,
                duration: '3 weeks',
                features: [
                    '3 one-on-one sessions',
                    'Career assessment',
                    'Personalized action plan',
                    'Email support',
                ],
                popular: false,
            },
            {
                id: 'professional',
                name: 'Professional Package',
                description: 'Comprehensive coaching for career advancement',
                price: 499,
                currency: 'USD',
                sessions: 8,
                duration: '2 months',
                features: [
                    '8 one-on-one sessions',
                    'Career assessment',
                    'Personalized action plan',
                    'Interview preparation',
                    'Resume review',
                    'Priority email support',
                ],
                popular: true,
            },
            {
                id: 'executive',
                name: 'Executive Package',
                description: 'Premium coaching for senior professionals',
                price: 999,
                currency: 'USD',
                sessions: 12,
                duration: '3 months',
                features: [
                    '12 one-on-one sessions',
                    'Career assessment',
                    'Personalized action plan',
                    'Leadership development',
                    'Executive presence coaching',
                    'Interview preparation',
                    'Resume and LinkedIn review',
                    '24/7 priority support',
                ],
                popular: false,
            },
        ];
    }
    async purchasePackage(userId, packageId, purchaseData) {
        // Mock implementation - would integrate with payment service
        const packages = await this.getPackages();
        const coachingPackage = packages.find(p => p.id === packageId);
        if (!coachingPackage) {
            throw new common_1.NotFoundException('Package not found');
        }
        const purchase = await this.prisma.payment.create({
            data: {
                description: 'Coaching package',
                userId,
                amount: coachingPackage.price,
                currency: coachingPackage.currency,
                status: 'COMPLETED',
                method: "CREDIT_CARD",
                transactionId: `txn_${Date.now()}`,
                metadata: {
                    type: 'COACHING_PACKAGE',
                    packageId,
                    sessions: coachingPackage.sessions,
                },
            },
        });
        // Create coaching credits
        await this.prisma.coachingCredit.create({
            data: {
                userId,
                packageId,
                sessionsRemaining: coachingPackage.sessions,
                expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days
            },
        });
        this.logger.log(`Coaching package purchased: ${packageId} by user ${userId}`);
        return {
            purchase,
            package: coachingPackage,
            credits: coachingPackage.sessions,
        };
    }
    async getUserStats(userId) {
        const [totalSessions, completedSessions, totalSpent, averageRating,] = await Promise.all([
            this.prisma.coachingSession.count({ where: { userId } }),
            this.prisma.coachingSession.count({
                where: { userId, status: 'COMPLETED' },
            }),
            this.prisma.coachingSession.aggregate({
                where: { userId, status: 'COMPLETED' },
                _sum: { price: true }
            }),
            this.prisma.coachReview.aggregate({
                where: { userId },
                _avg: { rating: true },
            }),
        ]);
        return {
            totalSessions,
            completedSessions,
            totalSpent: totalSpent?._sum?.amount || 0,
            averageRating: averageRating._avg.rating || 0,
            completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
        };
    }
    async getCoachDashboard(coachId) {
        const [totalSessions, completedSessions, upcomingSessions, totalEarnings, averageRating, thisMonthSessions,] = await Promise.all([
            this.prisma.coachingSession.count({ where: { coachId } }),
            this.prisma.coachingSession.count({
                where: { coachId, status: 'COMPLETED' },
            }),
            this.prisma.coachingSession.count({
                where: {
                    coachId,
                    status: 'SCHEDULED',
                    startTime: { gt: new Date() },
                },
            }),
            this.prisma.coachingSession.aggregate({
                where: { coachId, status: 'COMPLETED' },
                _sum: { price: true }
            }),
            this.prisma.coachReview.aggregate({
                where: { coachId },
                _avg: { rating: true },
            }),
            this.prisma.coachingSession.count({
                where: {
                    coachId,
                    startTime: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
        ]);
        return {
            totalSessions,
            completedSessions,
            upcomingSessions,
            totalEarnings: totalEarnings?._sum?.amount || 0,
            averageRating: averageRating._avg.rating || 0,
            thisMonthSessions,
            recentSessions: await this.getRecentSessions(coachId),
        };
    }
    async getCoachSchedule(coachId, startDate, endDate) {
        const sessions = await this.prisma.coachingSession.findMany({
            where: {
                coachId,
                startTime: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                user: {
                    include: { profile: true },
                },
            },
            orderBy: { startTime: 'asc' },
        });
        return sessions.map(session => ({
            id: session.id,
            title: `Session with ${session.user.profile?.firstName} ${session.user.profile?.lastName}`,
            start: session.startTime,
            end: session.endTime,
            status: session.status,
            sessionType: session.sessionType,
            user: {
                id: session.user.id,
                name: `${session.user.profile?.firstName} ${session.user.profile?.lastName}`,
                avatar: session.user.profile?.avatar,
            },
        }));
    }
    async createCoach(coachData) {
        const coach = await this.prisma.coach.create({
            data: {
                userId: coachData.userId,
                bioEn: coachData.bio,
                bioAr: coachData.bio,
                specialties: coachData.specialties,
                hourlyRate: coachData.hourlyRate,
                experience: coachData.experience,
                availability: {},
            },
        });
        this.logger.log(`Coach created: ${coachData.userId}`);
        return coach;
    }
    async getAllCoaches(options) {
        const { page, limit, status } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (status === 'active') {
            where.user = { isActive: true };
        }
        else if (status === 'inactive') {
            where.user = { isActive: false };
        }
        const [coachesRaw, total] = await Promise.all([
            this.prisma.coach.findMany({
                where,
                include: {
                    user: {
                        include: { profile: true },
                    },
                    coachingSessions: {
                        where: { status: 'COMPLETED' },
                        select: { reviews: { select: { rating: true } } },
                    },
                    _count: {
                        select: {
                            coachingSessions: true,
                            reviews: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.coach.count({ where }),
        ]);
        const coaches = coachesRaw.map((coach) => {
            const allReviews = coach.coachingSessions.flatMap((s) => s.reviews);
            const avgRating = allReviews.length > 0
                ? allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length
                : 0;
            return {
                ...coach,
                rating: Math.round(avgRating * 10) / 10,
                totalSessions: coach._count.coachingSessions,
                totalReviews: coach._count.reviews,
            };
        });
        return {
            coaches,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }
    async getAllSessions(options) {
        const { page, limit, status, coachId } = options;
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status.toUpperCase();
        }
        if (coachId) {
            where.coachId = coachId;
        }
        const [sessions, total] = await Promise.all([
            this.prisma.coachingSession.findMany({
                where,
                include: {
                    user: {
                        include: { profile: true },
                    },
                    coach: {
                        include: {
                            user: {
                                include: { profile: true },
                            },
                        },
                    },
                },
                orderBy: { startTime: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.coachingSession.count({ where }),
        ]);
        return {
            sessions,
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
    async getAnalytics() {
        const totalRevenue = await this.prisma.coachingSession.aggregate({
            where: { status: 'COMPLETED' },
            _sum: { price: true }
        });
        const [totalSessions, completedSessions, totalCoaches, averageRating, sessionsByMonth,] = await Promise.all([
            this.prisma.coachingSession.count(),
            this.prisma.coachingSession.count({ where: { status: 'COMPLETED' } }),
            this.prisma.coach.count(),
            this.prisma.coachReview.aggregate({ _avg: { rating: true } }),
            this.getSessionsByMonth(),
        ]);
        return {
            totalSessions,
            completedSessions,
            totalRevenue: totalRevenue._sum?.price || 0,
            totalCoaches,
            averageRating: averageRating._avg.rating || 0,
            completionRate: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
            sessionsByMonth,
        };
    }
    getMockAvailability(coachId) {
        // Mock availability - would be calculated from actual availability data
        return {
            monday: ['09:00-12:00', '14:00-17:00'],
            tuesday: ['09:00-12:00', '14:00-17:00'],
            wednesday: ['09:00-12:00', '14:00-17:00'],
            thursday: ['09:00-12:00', '14:00-17:00'],
            friday: ['09:00-12:00', '14:00-17:00'],
            saturday: [],
            sunday: [],
        };
    }
    canReschedule(session) {
        const now = new Date();
        const sessionStart = new Date(session.startTime);
        const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);
        return session.status === 'SCHEDULED' && hoursUntilSession > 24;
    }
    canCancel(session) {
        const now = new Date();
        const sessionStart = new Date(session.startTime);
        const hoursUntilSession = (sessionStart.getTime() - now.getTime()) / (1000 * 60 * 60);
        return session.status === 'SCHEDULED' && hoursUntilSession > 48;
    }
    canJoin(session) {
        const now = new Date();
        const sessionStart = new Date(session.startTime);
        const sessionEnd = new Date(session.endTime);
        return session.status === 'SCHEDULED' && now >= sessionStart && now <= sessionEnd;
    }
    async updateCoachAvailabilityAfterSession(coachId, startTime, endTime) {
        // This would update the coach's availability after a session
        // For now, it's a placeholder
        this.logger.log(`Updating availability for coach ${coachId} after session`);
    }
    async getRecentSessions(coachId) {
        const sessions = await this.prisma.coachingSession.findMany({
            where: { coachId },
            include: {
                user: {
                    include: { profile: true },
                },
            },
            orderBy: { startTime: 'desc' },
            take: 5,
        });
        return sessions.map(session => ({
            id: session.id,
            user: {
                name: `${session.user.profile?.firstName} ${session.user.profile?.lastName}`,
                avatar: session.user.profile?.avatar,
            },
            startTime: session.startTime,
            status: session.status,
        }));
    }
    async getSessionsByMonth() {
        // Get sessions grouped by month for the last 12 months
        const months = [];
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
            const count = await this.prisma.coachingSession.count({
                where: {
                    startTime: {
                        gte: date,
                        lt: nextMonth,
                    },
                },
            });
            months.push({
                month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                sessions: count,
            });
        }
        return months;
    }
};
exports.CoachingService = CoachingService;
exports.CoachingService = CoachingService = CoachingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        zoom_service_1.ZoomService])
], CoachingService);
