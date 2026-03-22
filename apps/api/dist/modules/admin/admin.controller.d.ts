import { AdminService } from './admin.service';
export declare class AdminController {
    private readonly adminService;
    constructor(adminService: AdminService);
    getDashboard(): Promise<{
        success: boolean;
        data: {
            dashboard: {
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
            };
        };
    }>;
    getStatsOverview(): Promise<{
        success: boolean;
        data: {
            stats: {
                totalUsers: any;
                totalCourses: any;
                totalSessions: any;
                totalRevenue: any;
            };
        };
    }>;
    getUsers(page?: number, limit?: number, role?: string, status?: string, search?: string): Promise<{
        success: boolean;
        data: {
            users: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    getUser(id: string): Promise<{
        success: boolean;
        data: {
            user: any;
        };
    }>;
    updateUser(id: string, updateData: {
        role?: string;
        isActive?: boolean;
        email?: string;
        profile?: {
            firstName?: string;
            lastName?: string;
            phone?: string;
            bio?: string;
        };
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            user: any;
        };
    }>;
    deleteUser(id: string): Promise<void>;
    suspendUser(id: string, reason: string): Promise<{
        success: boolean;
        message: string;
        data: {
            user: any;
        };
    }>;
    unsuspendUser(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            user: any;
        };
    }>;
    getAdminCourses(page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: {
            courses: any;
            total: any;
            page: number;
            limit: number;
        };
    }>;
    createCourse(courseData: {
        titleEn: string;
        titleAr: string;
        descriptionEn: string;
        descriptionAr: string;
        careerPathId: string;
        price: number;
        currency: string;
        duration: number;
        level: string;
        thumbnail?: string;
        tags?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            course: any;
        };
    }>;
    approveCourse(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            course: any;
        };
    }>;
    rejectCourse(id: string, reason: string): Promise<{
        success: boolean;
        message: string;
        data: {
            course: any;
        };
    }>;
    getPendingContent(): Promise<{
        success: boolean;
        data: {
            content: {
                courses: any;
                lessons: any[];
                assessments: any[];
            };
        };
    }>;
    approveContent(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            content: {
                success: boolean;
                id: string;
            };
        };
    }>;
    rejectContent(id: string, reason: string): Promise<{
        success: boolean;
        message: string;
        data: {
            content: {
                success: boolean;
                id: string;
                reason: string;
            };
        };
    }>;
    getReports(page?: number, limit?: number, status?: string): Promise<{
        success: boolean;
        data: {
            reports: any[];
            total: number;
            page: number;
            limit: number;
        };
    }>;
    resolveReport(id: string, resolutionData: {
        action: 'IGNORE' | 'WARNING' | 'SUSPEND' | 'DELETE_CONTENT';
        notes?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            report: {
                success: boolean;
                id: string;
                resolutionData: any;
            };
        };
    }>;
    getRevenueAnalytics(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            analytics: {
                total: number;
                monthly: any[];
            };
        };
    }>;
    getEngagementAnalytics(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            analytics: {
                data: any[];
            };
        };
    }>;
    getCourseAnalytics(): Promise<{
        success: boolean;
        data: {
            analytics: {
                enrollments: number;
            };
        };
    }>;
    getSystemHealth(): Promise<{
        success: boolean;
        data: {
            health: {
                status: string;
                uptime: number;
                memory: NodeJS.MemoryUsage;
                timestamp: Date;
            };
        };
    }>;
    getSystemLogs(level?: string, limit?: number): Promise<{
        success: boolean;
        data: {
            logs: {
                logs: {
                    id: string;
                    level: string;
                    message: string;
                    timestamp: Date;
                }[];
                total: number;
            };
        };
    }>;
    createBackup(backupData: {
        type: 'FULL' | 'INCREMENTAL';
        includeFiles?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            backup: {
                id: string;
                type: any;
                createdAt: Date;
                status: string;
            };
        };
    }>;
    getBackups(): Promise<{
        success: boolean;
        data: {
            backups: {
                id: string;
                type: string;
                createdAt: Date;
                status: string;
            }[];
        };
    }>;
    restoreBackup(backupId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            backupId: string;
            restoredAt: Date;
            status: string;
        };
    }>;
    getSettings(): Promise<{
        success: boolean;
        data: {
            settings: {
                siteName: string;
                maintenanceMode: boolean;
                registrationEnabled: boolean;
                emailNotifications: boolean;
            };
        };
    }>;
    updateSettings(settingsData: {
        siteName?: string;
        siteDescription?: string;
        maintenanceMode?: boolean;
        registrationEnabled?: boolean;
        emailNotifications?: boolean;
        maxUploadSize?: number;
        allowedFileTypes?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            settings: any;
        };
    }>;
    uploadLogo(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            url: string;
            size: number;
            originalName: string;
        };
    }>;
    broadcastNotification(notificationData: {
        titleEn: string;
        titleAr: string;
        contentEn: string;
        contentAr: string;
        type: string;
        channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>;
        sendToAll?: boolean;
        userRoles?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            sent: number;
            skipped: number;
        };
    }>;
    getNotificationTemplates(): Promise<{
        success: boolean;
        data: {
            templates: {
                id: string;
                name: string;
                type: string;
                subjectEn: string;
                subjectAr: string;
                contentEn: string;
                contentAr: string;
                variables: string[];
            }[];
        };
    }>;
    exportUsers(format?: string): Promise<{
        success: boolean;
        data: {
            users: any;
            format: string;
        };
    }>;
    exportCourses(format?: string): Promise<{
        success: boolean;
        data: {
            courses: any;
            format: string;
        };
    }>;
    importUsers(file: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            total: number;
            imported: number;
            failed: number;
            errors: any[];
        };
    }>;
    getAuditLog(page?: number, limit?: number, action?: string, userId?: string): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    forcePasswordReset(data: {
        message?: string;
        excludeRoles?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            sent: number;
            message: any;
        };
    }>;
    getActiveSessions(): Promise<{
        success: boolean;
        data: {
            sessions: {
                sessionId: string;
                userId: string;
                email: string;
                createdAt: Date;
                lastActivity: Date;
            }[];
        };
    }>;
    revokeSession(sessionId: string): Promise<void>;
    getPerformanceMetrics(): Promise<{
        success: boolean;
        data: {
            metrics: {
                cpu: number;
                memory: number;
                requests: number;
                responseTime: number;
                timestamp: Date;
            };
        };
    }>;
    getRecentErrors(limit?: number): Promise<{
        success: boolean;
        data: {
            errors: {
                id: string;
                message: string;
                timestamp: Date;
                level: string;
            }[];
        };
    }>;
    getUsageStatistics(): Promise<{
        success: boolean;
        data: {
            stats: {
                apiCalls: number;
                storageUsed: number;
                bandwidthUsed: number;
                activeConnections: number;
            };
        };
    }>;
}
