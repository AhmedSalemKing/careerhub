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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_service_1 = require("./analytics.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    async trackEvent(eventData) {
        const result = await this.analyticsService.trackEvent(eventData);
        return {
            success: true,
            message: 'Event tracked successfully',
            data: result,
        };
    }
    async trackBatchEvents(batchData) {
        const result = await this.analyticsService.trackBatchEvents(batchData.events);
        return {
            success: true,
            message: 'Batch events tracked successfully',
            data: result,
        };
    }
    async getEvents(page, limit, event, userId, startDate, endDate) {
        const events = await this.analyticsService.getEvents({
            page: page || 1,
            limit: limit || 50,
            event,
            userId,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: endDate ? new Date(endDate) : undefined,
        });
        return {
            success: true,
            data: events,
        };
    }
    async getOverview(startDate, endDate) {
        const overview = await this.analyticsService.getOverview(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { overview },
        };
    }
    async getFunnel(funnelName, startDate, endDate) {
        const funnel = await this.analyticsService.getFunnelData(funnelName, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { funnel },
        };
    }
    async getRetention(cohortType, startDate, endDate) {
        const retention = await this.analyticsService.getRetentionData(cohortType || 'weekly', startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { retention },
        };
    }
    async getRealtime() {
        const realtime = await this.analyticsService.getRealtimeData();
        return {
            success: true,
            data: { realtime },
        };
    }
    async getUserBehavior(userId, startDate, endDate) {
        const behavior = await this.analyticsService.getUserBehavior(userId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { behavior },
        };
    }
    async getCourseAnalytics(courseId, startDate, endDate) {
        const analytics = await this.analyticsService.getCourseAnalytics(courseId, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { analytics },
        };
    }
    async getRevenueAnalytics(startDate, endDate) {
        const analytics = await this.analyticsService.getRevenueAnalytics(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { analytics },
        };
    }
    async getEngagementMetrics(startDate, endDate) {
        const metrics = await this.analyticsService.getEngagementMetrics(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { metrics },
        };
    }
    async getPerformanceMetrics(startDate, endDate) {
        const metrics = await this.analyticsService.getPerformanceMetrics(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { metrics },
        };
    }
    async generateCustomReport(reportType, startDate, endDate, format) {
        const report = await this.analyticsService.generateCustomReport(reportType, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, format || 'json');
        return {
            success: true,
            data: { report },
        };
    }
    async getDashboardAnalytics(user) {
        const analytics = await this.analyticsService.getUserDashboardAnalytics(user.id);
        return {
            success: true,
            data: { analytics },
        };
    }
    async getLearningProgress(user) {
        const progress = await this.analyticsService.getLearningProgressAnalytics(user.id);
        return {
            success: true,
            data: { progress },
        };
    }
    async getAchievementsAnalytics(user) {
        const achievements = await this.analyticsService.getAchievementsAnalytics(user.id);
        return {
            success: true,
            data: { achievements },
        };
    }
    async trackGoalProgress(user, goalData) {
        const result = await this.analyticsService.trackGoalProgress(user.id, goalData);
        return {
            success: true,
            message: 'Goal progress tracked successfully',
            data: result,
        };
    }
    async getUserGoals(user) {
        const goals = await this.analyticsService.getUserGoals(user.id);
        return {
            success: true,
            data: { goals },
        };
    }
    async getPersonalizedInsights(user) {
        const insights = await this.analyticsService.getPersonalizedInsights(user.id);
        return {
            success: true,
            data: { insights },
        };
    }
    async getPersonalizedRecommendations(user) {
        const recommendations = await this.analyticsService.getPersonalizedRecommendations(user.id);
        return {
            success: true,
            data: { recommendations },
        };
    }
    async getSystemHealth() {
        const health = await this.analyticsService.getSystemHealth();
        return {
            success: true,
            data: { health },
        };
    }
    async cleanupOldData(days = 90) {
        const result = await this.analyticsService.cleanupOldData(days);
        return {
            success: true,
            message: 'Cleanup completed successfully',
            data: result,
        };
    }
    async exportData(type, startDate, endDate, format) {
        const exportResult = await this.analyticsService.exportData(type, startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined, format || 'csv');
        return {
            success: true,
            data: exportResult,
        };
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)('track'),
    (0, swagger_1.ApiOperation)({ summary: 'Track analytics event' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Event tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEvent", null);
__decorate([
    (0, common_1.Post)('track-batch'),
    (0, swagger_1.ApiOperation)({ summary: 'Track multiple analytics events' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Events tracked successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackBatchEvents", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics events (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Events retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'event', required: false, description: 'Filter by event name' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Filter by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('event')),
    __param(3, (0, common_1.Query)('userId')),
    __param(4, (0, common_1.Query)('startDate')),
    __param(5, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('overview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics overview (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Overview retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getOverview", null);
__decorate([
    (0, common_1.Get)('funnel'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get conversion funnel data (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Funnel data retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'funnelName', required: false, description: 'Funnel name' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('funnelName')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getFunnel", null);
__decorate([
    (0, common_1.Get)('retention'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user retention data (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Retention data retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'cohortType', required: false, description: 'Cohort type (daily/weekly/monthly)' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('cohortType')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRetention", null);
__decorate([
    (0, common_1.Get)('realtime'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get real-time analytics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Real-time data retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRealtime", null);
__decorate([
    (0, common_1.Get)('users/behavior'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user behavior analytics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User behavior data retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Filter by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserBehavior", null);
__decorate([
    (0, common_1.Get)('courses/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get course analytics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course analytics retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'courseId', required: false, description: 'Filter by course ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('courseId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCourseAnalytics", null);
__decorate([
    (0, common_1.Get)('revenue/analytics'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get revenue analytics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Revenue analytics retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getRevenueAnalytics", null);
__decorate([
    (0, common_1.Get)('engagement'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get engagement metrics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Engagement metrics retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getEngagementMetrics", null);
__decorate([
    (0, common_1.Get)('performance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get performance metrics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Performance metrics retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPerformanceMetrics", null);
__decorate([
    (0, common_1.Get)('reports/custom'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate custom report (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Custom report generated successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'reportType', required: true, description: 'Report type' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'format', required: false, description: 'Export format (json/csv/xlsx)' }),
    __param(0, (0, common_1.Query)('reportType')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "generateCustomReport", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user dashboard analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard analytics retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboardAnalytics", null);
__decorate([
    (0, common_1.Get)('learning-progress'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get learning progress analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Learning progress retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getLearningProgress", null);
__decorate([
    (0, common_1.Get)('achievements'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user achievements analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Achievements analytics retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAchievementsAnalytics", null);
__decorate([
    (0, common_1.Post)('goals/track'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Track goal progress' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Goal progress tracked successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackGoalProgress", null);
__decorate([
    (0, common_1.Get)('goals'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user goals' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Goals retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserGoals", null);
__decorate([
    (0, common_1.Get)('insights'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get personalized insights' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Insights retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPersonalizedInsights", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get personalized recommendations' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recommendations retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getPersonalizedRecommendations", null);
__decorate([
    (0, common_1.Get)('admin/health'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get analytics system health (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System health retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSystemHealth", null);
__decorate([
    (0, common_1.Post)('admin/cleanup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cleanup old analytics data (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cleanup completed successfully' }),
    __param(0, (0, common_1.Body)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "cleanupOldData", null);
__decorate([
    (0, common_1.Get)('admin/export'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Export analytics data (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Export completed successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: true, description: 'Export type' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'format', required: false, description: 'Export format' }),
    __param(0, (0, common_1.Query)('type')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "exportData", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map