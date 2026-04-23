import { PrismaService } from '../../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    trackEvent(...a: any[]): Promise<{
        success: boolean;
    }>;
    trackBatchEvents(...a: any[]): Promise<{
        success: boolean;
    }>;
    getEvent(...a: any[]): Promise<{
        id: any;
    }>;
    getEvents(...a: any[]): Promise<{
        data: any[];
        total: number;
    }>;
    getOverview(...a: any[]): Promise<{
        users: number;
        revenue: number;
    }>;
    getFunnelData(...a: any[]): Promise<{
        data: any[];
    }>;
    getFunnelAnalytics(...a: any[]): Promise<{
        data: any[];
    }>;
    getRealtimeData(...a: any[]): Promise<{
        activeUsers: number;
    }>;
    getUserBehavior(...a: any[]): Promise<{
        data: any[];
    }>;
    getUserAnalytics(...a: any[]): Promise<{
        events: any[];
    }>;
    getUserDashboardAnalytics(...a: any[]): Promise<{
        data: any[];
    }>;
    getLearningProgressAnalytics(...a: any[]): Promise<{
        data: any[];
    }>;
    getAchievementsAnalytics(...a: any[]): Promise<{
        data: any[];
    }>;
    trackGoalProgress(...a: any[]): Promise<{
        success: boolean;
    }>;
    getPersonalizedInsights(...a: any[]): Promise<{
        data: any[];
    }>;
    getPersonalizedRecommendations(...a: any[]): Promise<{
        data: any[];
    }>;
    getCourseAnalytics(...a: any[]): Promise<{
        enrollments: number;
    }>;
    getPlatformAnalytics(...a: any[]): Promise<{
        totalUsers: number;
    }>;
    getRevenueAnalytics(...a: any[]): Promise<{
        total: number;
        monthly: any[];
    }>;
    getActiveUsers(...a: any[]): Promise<number>;
    getUserProgress(...a: any[]): Promise<{
        progress: number;
    }>;
    getUserAchievements(...a: any[]): Promise<{
        data: any[];
    }>;
    updateUserGoal(...a: any[]): Promise<{
        success: boolean;
    }>;
    getUserGoals(...a: any[]): Promise<{
        data: any[];
    }>;
    getTopCourses(...a: any[]): Promise<{
        data: any[];
    }>;
    getDashboardStats(...a: any[]): Promise<{
        users: number;
        courses: number;
        revenue: number;
    }>;
    getEngagementMetrics(...a: any[]): Promise<{
        data: any[];
    }>;
    getSystemHealth(...a: any[]): Promise<{
        status: string;
    }>;
    getPerformanceMetrics(...a: any[]): Promise<{
        data: any[];
    }>;
    generateCustomReport(...a: any[]): Promise<{
        data: any[];
    }>;
    exportAnalytics(...a: any[]): Promise<{
        url: string;
    }>;
    exportData(...a: any[]): Promise<{
        url: string;
    }>;
    getRetentionData(...a: any[]): Promise<{
        data: any[];
    }>;
    cleanupOldData(...a: any[]): Promise<{
        deleted: number;
    }>;
    getCourseEngagement(...a: any[]): Promise<{
        data: any[];
    }>;
    getUserLearningStats(...a: any[]): Promise<{
        data: any[];
    }>;
}
