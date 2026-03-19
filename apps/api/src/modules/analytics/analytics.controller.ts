import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('track')
  @ApiOperation({ summary: 'Track analytics event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(@Body() eventData: {
    event: string;
    userId?: string;
    sessionId?: string;
    properties?: Record<string, any>;
    timestamp?: Date;
    userAgent?: string;
    ip?: string;
    referrer?: string;
  }) {
    const result = await this.analyticsService.trackEvent(eventData);
    return {
      success: true,
      message: 'Event tracked successfully',
      data: result,
    };
  }

  @Post('track-batch')
  @ApiOperation({ summary: 'Track multiple analytics events' })
  @ApiResponse({ status: 201, description: 'Events tracked successfully' })
  async trackBatchEvents(@Body() batchData: {
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
  }) {
    const result = await this.analyticsService.trackBatchEvents(batchData.events);
    return {
      success: true,
      message: 'Batch events tracked successfully',
      data: result,
    };
  }

  @Get('events')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics events (Admin only)' })
  @ApiResponse({ status: 200, description: 'Events retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'event', required: false, description: 'Filter by event name' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getEvents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('event') event?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
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

  @Get('overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics overview (Admin only)' })
  @ApiResponse({ status: 200, description: 'Overview retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const overview = await this.analyticsService.getOverview(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { overview },
    };
  }

  @Get('funnel')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get conversion funnel data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Funnel data retrieved successfully' })
  @ApiQuery({ name: 'funnelName', required: false, description: 'Funnel name' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getFunnel(
    @Query('funnelName') funnelName?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const funnel = await this.analyticsService.getFunnelData(
      funnelName,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { funnel },
    };
  }

  @Get('retention')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user retention data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Retention data retrieved successfully' })
  @ApiQuery({ name: 'cohortType', required: false, description: 'Cohort type (daily/weekly/monthly)' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getRetention(
    @Query('cohortType') cohortType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const retention = await this.analyticsService.getRetentionData(
      cohortType || 'weekly',
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { retention },
    };
  }

  @Get('realtime')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get real-time analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Real-time data retrieved successfully' })
  async getRealtime() {
    const realtime = await this.analyticsService.getRealtimeData();
    return {
      success: true,
      data: { realtime },
    };
  }

  @Get('users/behavior')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user behavior analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'User behavior data retrieved successfully' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getUserBehavior(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const behavior = await this.analyticsService.getUserBehavior(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { behavior },
    };
  }

  @Get('courses/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get course analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course analytics retrieved successfully' })
  @ApiQuery({ name: 'courseId', required: false, description: 'Filter by course ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getCourseAnalytics(
    @Query('courseId') courseId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.analyticsService.getCourseAnalytics(
      courseId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { analytics },
    };
  }

  @Get('revenue/analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get revenue analytics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getRevenueAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.analyticsService.getRevenueAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { analytics },
    };
  }

  @Get('engagement')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get engagement metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Engagement metrics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getEngagementMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const metrics = await this.analyticsService.getEngagementMetrics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { metrics },
    };
  }

  @Get('performance')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get performance metrics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getPerformanceMetrics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const metrics = await this.analyticsService.getPerformanceMetrics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { metrics },
    };
  }

  @Get('reports/custom')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate custom report (Admin only)' })
  @ApiResponse({ status: 200, description: 'Custom report generated successfully' })
  @ApiQuery({ name: 'reportType', required: true, description: 'Report type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'format', required: false, description: 'Export format (json/csv/xlsx)' })
  async generateCustomReport(
    @Query('reportType') reportType: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format?: string,
  ) {
    const report = await this.analyticsService.generateCustomReport(
      reportType,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      format || 'json'
    );
    return {
      success: true,
      data: { report },
    };
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user dashboard analytics' })
  @ApiResponse({ status: 200, description: 'Dashboard analytics retrieved successfully' })
  async getDashboardAnalytics(@CurrentUser() user: User) {
    const analytics = await this.analyticsService.getUserDashboardAnalytics(user.id);
    return {
      success: true,
      data: { analytics },
    };
  }

  @Get('learning-progress')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get learning progress analytics' })
  @ApiResponse({ status: 200, description: 'Learning progress retrieved successfully' })
  async getLearningProgress(@CurrentUser() user: User) {
    const progress = await this.analyticsService.getLearningProgressAnalytics(user.id);
    return {
      success: true,
      data: { progress },
    };
  }

  @Get('achievements')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user achievements analytics' })
  @ApiResponse({ status: 200, description: 'Achievements analytics retrieved successfully' })
  async getAchievementsAnalytics(@CurrentUser() user: User) {
    const achievements = await this.analyticsService.getAchievementsAnalytics(user.id);
    return {
      success: true,
      data: { achievements },
    };
  }

  @Post('goals/track')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Track goal progress' })
  @ApiResponse({ status: 201, description: 'Goal progress tracked successfully' })
  async trackGoalProgress(
    @CurrentUser() user: User,
    @Body() goalData: {
      goalType: string;
      targetValue: number;
      currentValue: number;
      unit?: string;
      deadline?: Date;
    },
  ) {
    const result = await this.analyticsService.trackGoalProgress(user.id, goalData);
    return {
      success: true,
      message: 'Goal progress tracked successfully',
      data: result,
    };
  }

  @Get('goals')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user goals' })
  @ApiResponse({ status: 200, description: 'Goals retrieved successfully' })
  async getUserGoals(@CurrentUser() user: User) {
    const goals = await this.analyticsService.getUserGoals(user.id);
    return {
      success: true,
      data: { goals },
    };
  }

  @Get('insights')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized insights' })
  @ApiResponse({ status: 200, description: 'Insights retrieved successfully' })
  async getPersonalizedInsights(@CurrentUser() user: User) {
    const insights = await this.analyticsService.getPersonalizedInsights(user.id);
    return {
      success: true,
      data: { insights },
    };
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get personalized recommendations' })
  @ApiResponse({ status: 200, description: 'Recommendations retrieved successfully' })
  async getPersonalizedRecommendations(@CurrentUser() user: User) {
    const recommendations = await this.analyticsService.getPersonalizedRecommendations(user.id);
    return {
      success: true,
      data: { recommendations },
    };
  }

  // Admin specific endpoints
  @Get('admin/health')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get analytics system health (Admin only)' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getSystemHealth() {
    const health = await this.analyticsService.getSystemHealth();
    return {
      success: true,
      data: { health },
    };
  }

  @Post('admin/cleanup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cleanup old analytics data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Cleanup completed successfully' })
  async cleanupOldData(@Body('days') days: number = 90) {
    const result = await this.analyticsService.cleanupOldData(days);
    return {
      success: true,
      message: 'Cleanup completed successfully',
      data: result,
    };
  }

  @Get('admin/export')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Export analytics data (Admin only)' })
  @ApiResponse({ status: 200, description: 'Export completed successfully' })
  @ApiQuery({ name: 'type', required: true, description: 'Export type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'format', required: false, description: 'Export format' })
  async exportData(
    @Query('type') type: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('format') format?: string,
  ) {
    const exportResult = await this.analyticsService.exportData(
      type,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      format || 'csv'
    );
    return {
      success: true,
      data: exportResult,
    };
  }
}
