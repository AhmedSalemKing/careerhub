import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { NotificationsService } from '../notifications/notifications.service';
export declare class AdminService {
    private prisma;
    private configService;
    private analyticsService;
    private notificationsService;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, analyticsService: AnalyticsService, notificationsService: NotificationsService);
    getDashboardOverview(): Promise<{
        stats: {
            totalUsers: any;
            activeCourses: any;
            monthlyRevenue: any;
            pendingSessions: any;
        };
        revenueLast12Months: {
            month: string;
            revenue: any;
        }[];
        newUsersLast30Days: {
            date: string;
            users: any;
        }[];
        recentUsers: any;
        recentPayments: any;
    }>;
    getPlatformStats(): Promise<{
        totalUsers: any;
        totalCourses: any;
        totalSessions: any;
        totalRevenue: any;
    }>;
    getUsers(options: {
        page: number;
        limit: number;
        search?: string;
        role?: string;
        status?: string;
    }): Promise<{
        users: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getUserDetails(id: string): Promise<any>;
    getUserById(id: string): Promise<any>;
    updateUser(id: string, updateData: any): Promise<any>;
    deleteUser(id: string): Promise<any>;
    suspendUser(id: string, reason?: string): Promise<any>;
    unsuspendUser(id: string): Promise<any>;
    getAdminCourses(options: {
        page: number;
        limit: number;
        search?: string;
        status?: string;
        level?: string;
    }): Promise<{
        courses: any;
        total: any;
        page: number;
        limit: number;
    }>;
    createCourse(courseData: any): Promise<any>;
    approveCourse(id: string): Promise<any>;
    rejectCourse(id: string, reason: string): Promise<any>;
    getPendingContent(): Promise<{
        courses: any;
        lessons: any[];
        assessments: any[];
    }>;
    approveContent(id: string): Promise<{
        success: boolean;
        id: string;
    }>;
    rejectContent(id: string, reason: string): Promise<{
        success: boolean;
        id: string;
        reason: string;
    }>;
    getReports(options: {
        page: number;
        limit: number;
        status?: string;
    }): Promise<{
        reports: any[];
        total: number;
        page: number;
        limit: number;
    }>;
    resolveReport(id: string, resolutionData: any): Promise<{
        success: boolean;
        id: string;
        resolutionData: any;
    }>;
    getRevenueAnalytics(startDate?: Date, endDate?: Date): Promise<{
        total: number;
        monthly: any[];
    }>;
    getEngagementAnalytics(startDate?: Date, endDate?: Date): Promise<{
        data: any[];
    }>;
    getCourseAnalyticsAll(): Promise<{
        enrollments: number;
    }>;
    getSystemHealth(): Promise<{
        status: string;
        uptime: number;
        memory: NodeJS.MemoryUsage;
        timestamp: Date;
    }>;
    getSystemLogs(level?: string, limit?: number): Promise<{
        logs: {
            id: string;
            level: string;
            message: string;
            timestamp: Date;
        }[];
        total: number;
    }>;
    createBackup(backupData: any): Promise<{
        id: string;
        type: any;
        createdAt: Date;
        status: string;
    }>;
    getBackups(): Promise<{
        id: string;
        type: string;
        createdAt: Date;
        status: string;
    }[]>;
    restoreBackup(backupId: string): Promise<{
        backupId: string;
        restoredAt: Date;
        status: string;
    }>;
    getSettings(): Promise<{
        siteName: string;
        maintenanceMode: boolean;
        registrationEnabled: boolean;
        emailNotifications: boolean;
    }>;
    updateSettings(settingsData: any): Promise<any>;
    uploadLogo(file: Express.Multer.File): Promise<{
        url: string;
        size: number;
        originalName: string;
    }>;
    broadcastNotification(notificationData: any): Promise<{
        sent: number;
        skipped: number;
    }>;
    getNotificationTemplates(): Promise<{
        id: string;
        name: string;
        type: string;
        subjectEn: string;
        subjectAr: string;
        contentEn: string;
        contentAr: string;
        variables: string[];
    }[]>;
    exportUsers(format: string): Promise<{
        users: any;
        format: string;
    }>;
    exportCourses(format: string): Promise<{
        courses: any;
        format: string;
    }>;
    importUsers(file: Express.Multer.File): Promise<{
        total: number;
        imported: number;
        failed: number;
        errors: any[];
    }>;
    getAuditLog(options: {
        page: number;
        limit: number;
        action?: string;
        userId?: string;
    }): Promise<{
        entries: {
            id: string;
            userId: string;
            action: string;
            timestamp: Date;
            details: {};
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    forcePasswordReset(data: any): Promise<{
        sent: number;
        message: any;
    }>;
    getActiveSessions(): Promise<{
        sessionId: string;
        userId: string;
        email: string;
        createdAt: Date;
        lastActivity: Date;
    }[]>;
    revokeSession(sessionId: string): Promise<{
        success: boolean;
        sessionId: string;
    }>;
    getPerformanceMetrics(): Promise<{
        cpu: number;
        memory: number;
        requests: number;
        responseTime: number;
        timestamp: Date;
    }>;
    getRecentErrors(limit?: number): Promise<{
        id: string;
        message: string;
        timestamp: Date;
        level: string;
    }[]>;
    getUsageStatistics(): Promise<{
        apiCalls: number;
        storageUsed: number;
        bandwidthUsed: number;
        activeConnections: number;
    }>;
}
