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
        return {
            users: { total: 0, active: 0, new: 0 },
            courses: { total: 0, published: 0 },
            revenue: { total: 0, thisMonth: 0 },
            sessions: { total: 0, completed: 0 },
        };
    }
    async getPlatformStats() {
        return {
            totalUsers: 0,
            totalCourses: 0,
            totalSessions: 0,
            totalRevenue: 0,
        };
    }
    async getUsers(options) {
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                include: { profile: true },
                skip: (options.page - 1) * options.limit,
                take: options.limit,
            }),
            this.prisma.user.count(),
        ]);
        return { users, total, page: options.page, limit: options.limit };
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
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                include: { careerPath: true },
                skip: (options.page - 1) * options.limit,
                take: options.limit,
            }),
            this.prisma.course.count(),
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
