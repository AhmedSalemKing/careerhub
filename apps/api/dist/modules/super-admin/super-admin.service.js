"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const activity_service_1 = require("../activity/activity.service");
const bcrypt = __importStar(require("bcrypt"));
let SuperAdminService = class SuperAdminService {
    constructor(prisma, activityService) {
        this.prisma = prisma;
        this.activityService = activityService;
    }
    async bootstrapSuperAdmin(email, password) {
        const hash = await bcrypt.hash(password, 12);
        const existing = await this.prisma.user.findUnique({ where: { email } });
        if (existing) {
            return await this.prisma.user.update({
                where: { email },
                data: { password: hash, role: 'SUPER_ADMIN', accountType: 'SUPER_ADMIN', isActive: true, status: 'ACTIVE' },
                select: { id: true, email: true, role: true, accountType: true },
            });
        }
        return await this.prisma.user.create({
            data: {
                email, password: hash,
                role: 'SUPER_ADMIN', accountType: 'SUPER_ADMIN',
                isActive: true, status: 'ACTIVE',
            },
            select: { id: true, email: true, role: true, accountType: true },
        });
    }
    async getDashboardStats() {
        var _a, _b, _c;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const [totalUsers, newUsersToday, newUsersThisWeek, totalCourses, publishedCourses, totalEnrollments, totalRevenue, monthlyRevenue, todayRevenue, pendingSessions, activeSessions, totalActivities, activitiesToday, usersByRole,] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.user.count({ where: { createdAt: { gte: todayStart }, deletedAt: null } }),
            this.prisma.user.count({ where: { createdAt: { gte: weekStart }, deletedAt: null } }),
            this.prisma.course.count(),
            this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.enrollment.count(),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: { in: ['SUCCESS', 'COMPLETED'] } },
            }),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: { in: ['SUCCESS', 'COMPLETED'] },
                    createdAt: { gte: monthStart },
                },
            }),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: { in: ['SUCCESS', 'COMPLETED'] },
                    createdAt: { gte: todayStart },
                },
            }),
            this.prisma.consultingSession.count({ where: { status: 'PENDING' } }),
            this.prisma.consultingSession.count({
                where: { status: 'IN_PROGRESS' },
            }),
            this.prisma.userActivity.count(),
            this.prisma.userActivity.count({ where: { createdAt: { gte: todayStart } } }),
            this.prisma.user.groupBy({
                by: ['accountType'],
                _count: { accountType: true },
                where: { deletedAt: null },
            }),
        ]);
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            return d;
        });
        const revenueChart = await Promise.all(months.map(async (d) => {
            var _a;
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const result = await this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: { in: ['SUCCESS', 'COMPLETED'] },
                    createdAt: { gte: start, lte: end },
                },
            });
            return {
                month: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
                revenue: (_a = result._sum.amount) !== null && _a !== void 0 ? _a : 0,
            };
        }));
        const userGrowth = await Promise.all(Array.from({ length: 7 }, (_, i) => {
            const d = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
            const start = new Date(d.getFullYear(), d.getMonth(), d.getDate());
            const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59);
            return this.prisma.user
                .count({ where: { createdAt: { gte: start, lte: end } } })
                .then((count) => ({
                day: d.toLocaleDateString('default', { weekday: 'short' }),
                count,
            }));
        }));
        return {
            users: {
                total: totalUsers,
                newToday: newUsersToday,
                newThisWeek: newUsersThisWeek,
                byRole: Object.fromEntries(usersByRole.map((r) => [r.accountType, r._count.accountType])),
            },
            courses: {
                total: totalCourses,
                published: publishedCourses,
                draft: totalCourses - publishedCourses,
            },
            enrollments: { total: totalEnrollments },
            revenue: {
                total: (_a = totalRevenue._sum.amount) !== null && _a !== void 0 ? _a : 0,
                monthly: (_b = monthlyRevenue._sum.amount) !== null && _b !== void 0 ? _b : 0,
                today: (_c = todayRevenue._sum.amount) !== null && _c !== void 0 ? _c : 0,
            },
            sessions: {
                pending: pendingSessions,
                active: activeSessions,
            },
            activity: {
                total: totalActivities,
                today: activitiesToday,
            },
            charts: {
                revenue: revenueChart,
                userGrowth,
            },
        };
    }
    async getUsers(opts) {
        const { page = 1, limit = 20, search, role, status, accountType } = opts;
        const where = { deletedAt: null };
        if (search) {
            where.OR = [
                { email: { contains: search, mode: 'insensitive' } },
                { profile: { firstName: { contains: search, mode: 'insensitive' } } },
                { profile: { lastName: { contains: search, mode: 'insensitive' } } },
            ];
        }
        if (role)
            where.role = role;
        if (status)
            where.status = status;
        if (accountType)
            where.accountType = accountType;
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    email: true,
                    role: true,
                    accountType: true,
                    status: true,
                    isActive: true,
                    createdAt: true,
                    updatedAt: true,
                    profile: {
                        select: {
                            firstName: true,
                            lastName: true,
                            avatar: true,
                            phone: true,
                            country: true,
                        },
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            payments: true,
                            instructorCourses: true,
                            activities: true,
                        },
                    },
                },
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total, page, pages: Math.ceil(total / limit) };
    }
    async getUserById(id) {
        const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                role: true,
                accountType: true,
                status: true,
                isActive: true,
                bio: true,
                experience: true,
                speciality: true,
                linkedinUrl: true,
                hourlyRate: true,
                meetingMethod: true,
                stripeCustomerId: true,
                approvedAt: true,
                rejectedAt: true,
                rejectedReason: true,
                createdAt: true,
                updatedAt: true,
                profile: true,
                _count: {
                    select: {
                        enrollments: true,
                        payments: true,
                        instructorCourses: true,
                        activities: true,
                        coachingSessions: true,
                        studentSessions: true,
                    },
                },
                payments: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, amount: true, currency: true, status: true, createdAt: true },
                },
                enrollments: {
                    take: 5,
                    orderBy: { enrolledAt: 'desc' },
                    include: { course: { select: { id: true, titleEn: true, thumbnail: true } } },
                },
            },
        });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return user;
    }
    async createUser(dto) {
        var _a;
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing)
            throw new common_1.ConflictException('Email already in use');
        const roleMap = {
            STUDENT: 'USER',
            INSTRUCTOR: 'USER',
            CONSULTANT: 'COACH',
            ADMIN: 'ADMIN',
            SUPER_ADMIN: 'SUPER_ADMIN',
        };
        const hashedPassword = await bcrypt.hash(dto.password, 12);
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                accountType: dto.accountType,
                role: ((_a = roleMap[dto.accountType]) !== null && _a !== void 0 ? _a : 'USER'),
                status: 'ACTIVE',
                isActive: true,
                approvedAt: new Date(),
                profile: {
                    create: {
                        firstName: dto.firstName,
                        lastName: dto.lastName,
                        phone: dto.phone,
                    },
                },
            },
            select: {
                id: true,
                email: true,
                role: true,
                accountType: true,
                status: true,
                createdAt: true,
                profile: { select: { firstName: true, lastName: true } },
            },
        });
        return user;
    }
    async updateUserRole(userId, newAccountType, actorId) {
        var _a;
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const roleMap = {
            STUDENT: 'USER',
            INSTRUCTOR: 'USER',
            CONSULTANT: 'COACH',
            ADMIN: 'ADMIN',
            SUPER_ADMIN: 'SUPER_ADMIN',
        };
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                accountType: newAccountType,
                role: ((_a = roleMap[newAccountType]) !== null && _a !== void 0 ? _a : 'USER'),
                approvedAt: new Date(),
                status: 'ACTIVE',
            },
            select: {
                id: true,
                email: true,
                role: true,
                accountType: true,
                status: true,
                profile: { select: { firstName: true, lastName: true } },
            },
        });
        await this.activityService.log({
            userId: actorId,
            action: 'admin.role_changed',
            entity: 'User',
            entityId: userId,
            metadata: {
                targetUserId: userId,
                oldRole: user.accountType,
                newRole: newAccountType,
            },
        });
        return updated;
    }
    async setUserCredentials(userId, dto, actorId) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        const updateData = {};
        if (dto.email) {
            const exists = await this.prisma.user.findFirst({
                where: { email: dto.email, id: { not: userId } },
            });
            if (exists)
                throw new common_1.ConflictException('Email already in use');
            updateData.email = dto.email;
        }
        if (dto.password) {
            updateData.password = await bcrypt.hash(dto.password, 12);
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: { id: true, email: true, accountType: true, role: true },
        });
        await this.activityService.log({
            userId: actorId,
            action: 'admin.credentials_updated',
            entity: 'User',
            entityId: userId,
        });
        return updated;
    }
    async updateUser(userId, data) {
        const user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            throw new common_1.NotFoundException('User not found');
        return this.prisma.user.update({
            where: { id: userId },
            data,
            select: { id: true, email: true, role: true, accountType: true, status: true, isActive: true },
        });
    }
    async getLiveActivity(limit = 100) {
        return this.activityService.getLiveActivity(limit);
    }
    async getUserActivity(userId, limit = 100) {
        return this.activityService.getUserActivity(userId, limit);
    }
    async getActivityFiltered(opts) {
        return this.activityService.getActivityFiltered({
            ...opts,
            from: opts.from ? new Date(opts.from) : undefined,
            to: opts.to ? new Date(opts.to) : undefined,
        });
    }
    async createCourse(dto, actorId) {
        var _a, _b, _c;
        const slug = dto.titleEn
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .concat('-', Date.now().toString());
        const course = await this.prisma.course.create({
            data: {
                slug,
                titleEn: dto.titleEn,
                titleAr: dto.titleAr,
                descriptionEn: dto.descriptionEn,
                descriptionAr: dto.descriptionAr,
                price: (_a = dto.price) !== null && _a !== void 0 ? _a : 0,
                currency: (_b = dto.currency) !== null && _b !== void 0 ? _b : 'SAR',
                level: (_c = dto.level) !== null && _c !== void 0 ? _c : 'BEGINNER',
                thumbnail: dto.thumbnail,
                status: 'PUBLISHED',
                instructorId: actorId,
                categoryId: dto.categoryId,
                careerPathId: dto.careerPathId,
            },
        });
        await this.activityService.log({
            userId: actorId,
            action: 'admin.course_created',
            entity: 'Course',
            entityId: course.id,
            metadata: { title: dto.titleEn },
        });
        return course;
    }
    async getAllCourses(opts) {
        const { page = 1, limit = 20, status } = opts;
        const where = {};
        if (status)
            where.status = status;
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    instructor: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { firstName: true, lastName: true } },
                        },
                    },
                    _count: { select: { enrollments: true, sections: true } },
                },
            }),
            this.prisma.course.count({ where }),
        ]);
        return { courses, total, page, pages: Math.ceil(total / limit) };
    }
    async getRevenueAnalytics(opts) {
        const where = {
            status: { in: ['SUCCESS', 'COMPLETED'] },
        };
        if (opts.from || opts.to) {
            where.createdAt = {};
            if (opts.from)
                where.createdAt.gte = new Date(opts.from);
            if (opts.to)
                where.createdAt.lte = new Date(opts.to);
        }
        const [total, payments, byMethod, topCourses,] = await Promise.all([
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                _count: { id: true },
                where,
            }),
            this.prisma.payment.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: {
                    user: {
                        select: {
                            email: true,
                            profile: { select: { firstName: true, lastName: true } },
                        },
                    },
                    course: { select: { id: true, titleEn: true } },
                },
            }),
            this.prisma.payment.groupBy({
                by: ['method'],
                _sum: { amount: true },
                _count: { id: true },
                where,
            }),
            this.prisma.payment.groupBy({
                by: ['courseId'],
                _sum: { amount: true },
                _count: { id: true },
                where: { ...where, courseId: { not: null } },
                orderBy: { _sum: { amount: 'desc' } },
                take: 10,
            }),
        ]);
        return { total, payments, byMethod, topCourses };
    }
    async getAllSessions(opts) {
        const { page = 1, limit = 20, status } = opts;
        const where = {};
        if (status)
            where.status = status;
        const [sessions, total] = await Promise.all([
            this.prisma.consultingSession.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { firstName: true, lastName: true, avatar: true } },
                        },
                    },
                    consultant: {
                        select: {
                            id: true,
                            email: true,
                            profile: { select: { firstName: true, lastName: true, avatar: true } },
                        },
                    },
                },
            }),
            this.prisma.consultingSession.count({ where }),
        ]);
        return { sessions, total, page, pages: Math.ceil(total / limit) };
    }
    async createSession(dto, actorId) {
        var _a, _b, _c;
        const session = await this.prisma.consultingSession.create({
            data: {
                studentId: dto.studentId,
                consultantId: dto.consultantId,
                scheduledAt: new Date(dto.scheduledAt),
                duration: (_a = dto.duration) !== null && _a !== void 0 ? _a : 60,
                topic: dto.topic,
                meetingMethod: (_b = dto.meetingMethod) !== null && _b !== void 0 ? _b : 'ZOOM',
                price: (_c = dto.price) !== null && _c !== void 0 ? _c : 0,
                status: 'PENDING',
                paymentStatus: 'UNPAID',
            },
            include: {
                student: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
                consultant: { select: { email: true, profile: { select: { firstName: true, lastName: true } } } },
            },
        });
        await this.activityService.log({
            userId: actorId,
            action: 'admin.session_created',
            entity: 'Session',
            entityId: session.id,
        });
        return session;
    }
    async getSystemLogs(limit = 100) {
        const [adminLogs, auditLogs] = await Promise.all([
            this.prisma.adminLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
                include: {
                    admin: {
                        select: {
                            email: true,
                            profile: { select: { firstName: true, lastName: true } },
                        },
                    },
                },
            }),
            this.prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
        ]);
        return { adminLogs, auditLogs };
    }
    async getSystemHealth() {
        const [userCount, activeSessionCount, paymentCount, activityCount,] = await Promise.all([
            this.prisma.user.count({ where: { deletedAt: null } }),
            this.prisma.session.count({ where: { expiresAt: { gte: new Date() } } }),
            this.prisma.payment.count({ where: { status: { in: ['SUCCESS', 'COMPLETED'] } } }),
            this.prisma.userActivity.count(),
        ]);
        return {
            status: 'healthy',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: {
                users: userCount,
                activeSessions: activeSessionCount,
                payments: paymentCount,
                activityLogs: activityCount,
            },
            timestamp: new Date().toISOString(),
        };
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], SuperAdminService);
//# sourceMappingURL=super-admin.service.js.map