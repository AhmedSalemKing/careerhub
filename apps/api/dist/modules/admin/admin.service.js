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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const analytics_service_1 = require("../analytics/analytics.service");
const notifications_service_1 = require("../notifications/notifications.service");
let AdminService = AdminService_1 = class AdminService {
    constructor(prisma, configService, analyticsService, notificationsService) {
        this.prisma = prisma;
        this.configService = configService;
        this.analyticsService = analyticsService;
        this.notificationsService = notificationsService;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async getDashboardOverview() {
        const [totalUsers, activeCourses, monthlyRevenue, pendingSessions, recentUsers, recentPayments,] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.course.count({ where: { status: 'PUBLISHED' } }),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: 'COMPLETED',
                    createdAt: {
                        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                    },
                },
            }),
            this.prisma.session.count({ where: { status: 'PENDING' } }),
            this.prisma.user.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { profile: true },
            }),
            this.prisma.payment.findMany({
                take: 10,
                orderBy: { createdAt: 'desc' },
                include: { user: { include: { profile: true } } },
            }),
        ]);
        // Calculate real historical data for charts
        const now = new Date();
        const months = Array.from({ length: 12 }, (_, i) => {
            const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
            return d;
        });
        const revenueLast12Months = await Promise.all(months.map(async (d) => {
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
            const result = await this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: {
                    status: 'COMPLETED',
                    createdAt: { gte: start, lte: end },
                },
            });
            return {
                month: d.toLocaleString('default', { month: 'short' }),
                revenue: result._sum.amount || 0,
            };
        }));
        const days = Array.from({ length: 30 }, (_, i) => {
            const d = new Date();
            d.setDate(d.getDate() - (29 - i));
            d.setHours(0, 0, 0, 0);
            return d;
        });
        const newUsersLast30Days = await Promise.all(days.map(async (d) => {
            const start = d;
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            const count = await this.prisma.user.count({
                where: {
                    createdAt: { gte: start, lte: end },
                },
            });
            return {
                date: d.toISOString().split('T')[0],
                users: count,
            };
        }));
        return {
            stats: {
                totalUsers,
                activeCourses,
                monthlyRevenue: monthlyRevenue._sum.amount || 0,
                pendingSessions,
            },
            revenueLast12Months,
            newUsersLast30Days,
            recentUsers,
            recentPayments,
        };
    }
    async getPlatformStats() {
        const [totalUsers, totalCourses, totalSessions, revenueStats] = await Promise.all([
            this.prisma.user.count(),
            this.prisma.course.count(),
            this.prisma.session.count(),
            this.prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'COMPLETED' }
            })
        ]);
        return {
            totalUsers,
            totalCourses,
            totalSessions,
            totalRevenue: revenueStats._sum.amount || 0,
        };
    }
    async getUsers(options) {
        const where = {};
        if (options.search) {
            where.OR = [
                { email: { contains: options.search, mode: 'insensitive' } },
                { profile: { firstName: { contains: options.search, mode: 'insensitive' } } },
                { profile: { lastName: { contains: options.search, mode: 'insensitive' } } },
            ];
        }
        if (options.role) {
            where.role = options.role;
        }
        if (options.status) {
            where.isActive = options.status === 'ACTIVE';
        }
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                where,
                include: {
                    profile: true,
                    _count: {
                        select: {
                            enrollments: true,
                            sessions: true,
                            payments: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (options.page - 1) * options.limit,
                take: options.limit,
            }),
            this.prisma.user.count({ where }),
        ]);
        return { users, total, page: options.page, limit: options.limit };
    }
    async getUserDetails(id) {
        return await this.prisma.user.findUnique({
            where: { id },
            include: {
                profile: true,
                enrollments: { include: { course: true }, take: 5, orderBy: { createdAt: 'desc' } },
                sessions: { include: { coach: { include: { user: { include: { profile: true } } } } }, take: 5, orderBy: { createdAt: 'desc' } },
                payments: { take: 5, orderBy: { createdAt: 'desc' } },
            },
        });
    }
    async getUserById(id) {
        return await this.prisma.user.findUnique({
            where: { id },
            include: { profile: true },
        });
    }
    async updateUser(id, updateData) {
        return await this.prisma.user.update({
            where: { id },
            data: updateData,
        });
    }
    async deleteUser(id) {
        return await this.prisma.user.delete({
            where: { id },
        });
    }
    async suspendUser(id, reason) {
        return await this.prisma.user.update({
            where: { id },
            data: { isActive: false },
        });
    }
    async unsuspendUser(id) {
        return await this.prisma.user.update({
            where: { id },
            data: { isActive: true },
        });
    }
    async getAdminCourses(options) {
        const where = {};
        if (options.status) {
            where.status = options.status;
        }
        if (options.search) {
            where.OR = [
                { titleEn: { contains: options.search, mode: 'insensitive' } },
                { titleAr: { contains: options.search, mode: 'insensitive' } },
            ];
        }
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                include: {
                    careerPath: true,
                    _count: {
                        select: { enrollments: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip: (options.page - 1) * options.limit,
                take: options.limit,
            }),
            this.prisma.course.count({ where }),
        ]);
        return { courses, total, page: options.page, limit: options.limit };
    }
    async createCourse(courseData) {
        return await this.prisma.course.create({
            data: {
                ...courseData,
                slug: courseData.titleEn?.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                status: 'DRAFT',
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
    async approveCourse(id) {
        return await this.prisma.course.update({
            where: { id },
            data: { status: 'PUBLISHED', updatedAt: new Date() },
        });
    }
    async rejectCourse(id, reason) {
        return await this.prisma.course.update({
            where: { id },
            data: { status: 'DRAFT', updatedAt: new Date() },
        });
    }
    async getPendingContent() {
        return {
            courses: await this.prisma.course.findMany({
                where: { status: 'DRAFT' },
                take: 10,
            }),
            lessons: [],
            assessments: [],
        };
    }
    async approveContent(id) {
        return { success: true, id };
    }
    async rejectContent(id, reason) {
        return { success: true, id, reason };
    }
    async getReports(options) {
        return {
            reports: [],
            total: 0,
            page: options.page,
            limit: options.limit,
        };
    }
    async resolveReport(id, resolutionData) {
        return { success: true, id, resolutionData };
    }
    async getRevenueAnalytics(startDate, endDate) {
        return this.analyticsService.getRevenueAnalytics();
    }
    async getEngagementAnalytics(startDate, endDate) {
        return this.analyticsService.getEngagementMetrics();
    }
    async getCourseAnalyticsAll() {
        return this.analyticsService.getCourseAnalytics("all");
    }
    async getSystemHealth() {
        return {
            status: 'ok',
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            timestamp: new Date(),
        };
    }
    async getSystemLogs(level, limit) {
        return {
            logs: [
                {
                    id: '1',
                    level: 'INFO',
                    message: 'System health check completed',
                    timestamp: new Date(),
                },
            ],
            total: 1,
        };
    }
    async createBackup(backupData) {
        return {
            id: `backup_${Date.now()}`,
            type: backupData.type,
            createdAt: new Date(),
            status: 'COMPLETED',
        };
    }
    async getBackups() {
        return [
            {
                id: 'backup_1',
                type: 'FULL',
                createdAt: new Date(),
                status: 'COMPLETED',
            },
        ];
    }
    async restoreBackup(backupId) {
        return {
            backupId,
            restoredAt: new Date(),
            status: 'SUCCESS',
        };
    }
    async getSettings() {
        return {
            siteName: 'CareerHub',
            maintenanceMode: false,
            registrationEnabled: true,
            emailNotifications: true,
        };
    }
    async updateSettings(settingsData) {
        return { ...settingsData, updatedAt: new Date() };
    }
    async uploadLogo(file) {
        return {
            url: `/uploads/logo_${Date.now()}.${file.originalname.split('.').pop()}`,
            size: file.size,
            originalName: file.originalname,
        };
    }
    async broadcastNotification(notificationData) {
        return await this.notificationsService.broadcastNotification(notificationData);
    }
    async getNotificationTemplates() {
        return this.notificationsService.getNotificationTemplates();
    }
    async exportUsers(format) {
        const users = await this.prisma.user.findMany({
            include: { profile: true },
        });
        return { users, format };
    }
    async exportCourses(format) {
        const courses = await this.prisma.course.findMany({
            include: { careerPath: true },
        });
        return { courses, format };
    }
    async importUsers(file) {
        return {
            total: 0,
            imported: 0,
            failed: 0,
            errors: [],
        };
    }
    async getAuditLog(options) {
        return {
            entries: [
                {
                    id: '1',
                    userId: 'user_1',
                    action: 'USER_LOGIN',
                    timestamp: new Date(),
                    details: {},
                },
            ],
            total: 1,
            page: options.page,
            limit: options.limit,
        };
    }
    async forcePasswordReset(data) {
        return {
            sent: 0,
            message: data.message || 'Password reset required',
        };
    }
    async getActiveSessions() {
        return [
            {
                sessionId: 'sess_1',
                userId: 'user_1',
                email: 'user@example.com',
                createdAt: new Date(),
                lastActivity: new Date(),
            },
        ];
    }
    async revokeSession(sessionId) {
        return { success: true, sessionId };
    }
    async getPerformanceMetrics() {
        return {
            cpu: 0,
            memory: 0,
            requests: 0,
            responseTime: 0,
            timestamp: new Date(),
        };
    }
    async getRecentErrors(limit) {
        return [
            {
                id: 'error_1',
                message: 'Database connection timeout',
                timestamp: new Date(),
                level: 'ERROR',
            },
        ];
    }
    async getUsageStatistics() {
        return {
            apiCalls: 125000,
            storageUsed: 45.6,
            bandwidthUsed: 125.3,
            activeConnections: 450,
        };
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        analytics_service_1.AnalyticsService,
        notifications_service_1.NotificationsService])
], AdminService);
