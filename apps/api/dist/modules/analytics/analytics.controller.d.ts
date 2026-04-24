import { AnalyticsService } from './analytics.service';
import { User } from '@prisma/client';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    trackEvent(eventData: {
        event: string;
        userId?: string;
        sessionId?: string;
        properties?: Record<string, any>;
        timestamp?: Date;
        userAgent?: string;
        ip?: string;
        referrer?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
        };
    }>;
    trackBatchEvents(batchData: {
        events: Array<{
            event: string;
            userId?: string;
            sessionId?: string;
            properties?: Record<string, any>;
            timestamp?: Date;
            userAgent?: string;
            ip?: string;
            referrer?: string;
        }>;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
        };
    }>;
    getEvents(page?: number, limit?: number, event?: string, userId?: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            data: any[];
            total: number;
        };
    }>;
    getOverview(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            overview: {
                users: number;
                revenue: number;
            };
        };
    }>;
    getFunnel(funnelName?: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            funnel: {
                data: any[];
            };
        };
    }>;
    getRetention(cohortType?: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            retention: {
                data: any[];
            };
        };
    }>;
    getRealtime(): Promise<{
        success: boolean;
        data: {
            realtime: {
                activeUsers: number;
            };
        };
    }>;
    getUserBehavior(userId?: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            behavior: {
                data: any[];
            };
        };
    }>;
    getCourseAnalytics(courseId?: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            analytics: {
                enrollments: number;
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
    getEngagementMetrics(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            metrics: {
                data: any[];
            };
        };
    }>;
    getPerformanceMetrics(startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            metrics: {
                data: any[];
            };
        };
    }>;
    generateCustomReport(reportType: string, startDate?: string, endDate?: string, format?: string): Promise<{
        success: boolean;
        data: {
            report: {
                data: any[];
            };
        };
    }>;
    getDashboardAnalytics(user: User): Promise<{
        success: boolean;
        data: {
            analytics: {
                data: any[];
            };
        };
    }>;
    getLearningProgress(user: User): Promise<{
        success: boolean;
        data: {
            progress: {
                data: any[];
            };
        };
    }>;
    getAchievementsAnalytics(user: User): Promise<{
        success: boolean;
        data: {
            achievements: {
                data: any[];
            };
        };
    }>;
    trackGoalProgress(user: User, goalData: {
        goalType: string;
        targetValue: number;
        currentValue: number;
        unit?: string;
        deadline?: Date;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            success: boolean;
        };
    }>;
    getUserGoals(user: User): Promise<{
        success: boolean;
        data: {
            goals: {
                data: any[];
            };
        };
    }>;
    getPersonalizedInsights(user: User): Promise<{
        success: boolean;
        data: {
            insights: {
                data: any[];
            };
        };
    }>;
    getPersonalizedRecommendations(user: User): Promise<{
        success: boolean;
        data: {
            recommendations: {
                data: any[];
            };
        };
    }>;
    getSystemHealth(): Promise<{
        success: boolean;
        data: {
            health: {
                status: string;
            };
        };
    }>;
    cleanupOldData(days?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            deleted: number;
        };
    }>;
    exportData(type: string, startDate?: string, endDate?: string, format?: string): Promise<{
        success: boolean;
        data: {
            url: string;
        };
    }>;
}
