import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  Req,
  InternalServerErrorException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { CreateCourseAdminDto } from './dto/create-course-admin.dto';
import { CreateUserAdminDto } from './dto/create-user-admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get admin dashboard overview' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard() {
    const dashboard = await this.adminService.getDashboardOverview();
    return {
      success: true,
      data: { dashboard },
    };
  }

  @Get('stats/overview')
  @ApiOperation({ summary: 'Get platform statistics overview' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStatsOverview() {
    const stats = await this.adminService.getPlatformStats();
    return {
      success: true,
      data: { stats },
    };
  }

  // User Management
  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'search', required: false, description: 'Search query' })
  async getUsers(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    const users = await this.adminService.getUsers({
      page: page || 1,
      limit: limit || 20,
      role,
      status,
      search,
    });
    return {
      success: true,
      data: users,
    };
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async getUser(@Param('id') id: string) {
    const user = await this.adminService.getUserById(id);
    return {
      success: true,
      data: { user },
    };
  }

  @Patch('users/:id')
  @ApiOperation({ summary: 'Update user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async updateUser(
    @Param('id') id: string,
    @Body() updateData: {
      role?: string;
      isActive?: boolean;
      email?: string;
      profile?: {
        firstName?: string;
        lastName?: string;
        phone?: string;
        bio?: string;
      };
    },
  ) {
    const user = await this.adminService.updateUser(id, updateData);
    return {
      success: true,
      message: 'User updated successfully',
      data: { user },
    };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async deleteUserRecord(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User suspended successfully' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async suspendUser(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const user = await this.adminService.suspendUser(id, reason);
    return {
      success: true,
      message: 'User suspended successfully',
      data: { user },
    };
  }

  @Post('users/:id/unsuspend')
  @ApiOperation({ summary: 'Unsuspend user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User unsuspended successfully' })
  @ApiParam({ name: 'id', description: 'User ID' })
  async unsuspendUser(@Param('id') id: string) {
    const user = await this.adminService.unsuspendUser(id);
    return {
      success: true,
      message: 'User unsuspended successfully',
      data: { user },
    };
  }

  // ═══════════════════════════════════════════════════════════════════
  // 🎯 COURSE MANAGEMENT - IMPORTANT: Specific routes FIRST!
  // ═══════════════════════════════════════════════════════════════════

  // ── Create Course (Admin) - MUST be before @Get/@Post('courses') ──
  @Post('courses/create')
  @ApiOperation({ summary: 'Create new course (Admin only) - Full Version' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourseAdmin(
    @Body() body: CreateCourseAdminDto,
    @Req() req: any,
  ) {
    try {
      console.log('[Admin] Creating course:', body.titleEn, 'admin:', req.user?.sub || req.user?.id);

      const result = await this.adminService.createCourseAdminFull(body, req.user?.sub || req.user?.id);

      return {
        success: true,
        message: 'Course created successfully',
        data: result,
      };
    } catch (e: any) {
      console.error('[Admin Controller] createCourse error:', e.code, e.message, e.meta || '');
      throw new InternalServerErrorException(e.message || 'Failed to create course');
    }
  }

  // ── Create Course WITH File Uploads ──
  @Post('courses/create-with-files')
  @UseInterceptors(FilesInterceptor('files', 10))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create new course with thumbnail and videos (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully with files' })
  async createCourseWithFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: any,
    @Req() req: any,
  ) {
    let courseData: any = {};
    try {
      if (body.titleEn) courseData.titleEn = body.titleEn;
      if (body.titleAr) courseData.titleAr = body.titleAr;
      if (body.descriptionEn) courseData.descriptionEn = body.descriptionEn;
      if (body.descriptionAr) courseData.descriptionAr = body.descriptionAr;
      if (body.price) courseData.price = parseFloat(body.price);
      if (body.currency) courseData.currency = body.currency;
      if (body.duration) courseData.duration = parseInt(body.duration);
      if (body.level) courseData.level = body.level;
      if (body.status) courseData.status = body.status;
      if (body.careerPathId && body.careerPathId !== 'null' && body.careerPathId !== 'undefined') courseData.careerPathId = body.careerPathId;
      if (body.categoryId && body.categoryId !== 'null' && body.categoryId !== 'undefined') courseData.categoryId = body.categoryId;
      if (body.isInstructor === 'true' || body.isInstructor === true) courseData.isInstructor = true;
      if (body.instructorId) courseData.instructorId = body.instructorId;
      
      if (body.videoTitles) {
        try { courseData.videoTitles = JSON.parse(body.videoTitles); } catch { courseData.videoTitles = []; }
      }
    } catch (e) {
      console.error('Error parsing course data:', e);
    }

    const result = await this.adminService.createCourseWithUploads(courseData, files, req.user?.sub || req.user?.id);
    return {
      success: true,
      message: 'Course created successfully with files',
      data: result,
    };
  }

  // Course Management - General Routes
  @Get('courses')
  @ApiOperation({ summary: 'Get all courses for admin' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  async getAdminCourses(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const courses = await this.adminService.getAdminCourses({
      page: page || 1,
      limit: limit || 20,
      status,
    });
    return {
      success: true,
      data: courses,
    };
  }

  // ── Create Course (Simple/Base Version) ──
  @Post('courses')
  @ApiOperation({ summary: 'Create new course - Base version (Admin only)' })
  @ApiResponse({ status: 201, description: 'Course created successfully' })
  async createCourseBase(@Body() courseData: {
    titleEn: string;
    titleAr?: string;
    descriptionEn?: string;
    descriptionAr?: string;
    careerPathId?: string;
    price?: number;
    currency?: string;
    duration?: number;
    level?: string;
    thumbnail?: string;
    tags?: string[];
  }, @Req() req: any) {
    if (courseData.careerPathId === 'null' || courseData.careerPathId === 'undefined') (courseData as any).careerPathId = undefined;
    if ((courseData as any).categoryId === 'null' || (courseData as any).categoryId === 'undefined') (courseData as any).categoryId = undefined;
    const course = await this.adminService.createCourse(courseData, req.user?.sub || req.user?.id);
    return {
      success: true,
      message: 'Course created successfully',
      data: { course },
    };
  }

  @Patch('courses/:id/approve')
  @ApiOperation({ summary: 'Approve course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course approved successfully' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async approveCourse(@Param('id') id: string) {
    const course = await this.adminService.approveCourse(id);
    return {
      success: true,
      message: 'Course approved successfully',
      data: { course },
    };
  }

  @Patch('courses/:id/reject')
  @ApiOperation({ summary: 'Reject course (Admin only)' })
  @ApiResponse({ status: 200, description: 'Course rejected successfully' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async rejectCourse(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const course = await this.adminService.rejectCourse(id, reason);
    return {
      success: true,
      message: 'Course rejected successfully',
      data: { course },
    };
  }

  // Content Management
  @Get('content/pending')
  @ApiOperation({ summary: 'Get pending content for review' })
  @ApiResponse({ status: 200, description: 'Pending content retrieved successfully' })
  async getPendingContent() {
    const content = await this.adminService.getPendingContent();
    return {
      success: true,
      data: { content },
    };
  }

  @Post('content/:id/approve')
  @ApiOperation({ summary: 'Approve content (Admin only)' })
  @ApiResponse({ status: 200, description: 'Content approved successfully' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  async approveContent(@Param('id') id: string) {
    const content = await this.adminService.approveContent(id);
    return {
      success: true,
      message: 'Content approved successfully',
      data: { content },
    };
  }

  @Post('content/:id/reject')
  @ApiOperation({ summary: 'Reject content (Admin only)' })
  @ApiResponse({ status: 200, description: 'Content rejected successfully' })
  @ApiParam({ name: 'id', description: 'Content ID' })
  async rejectContent(
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    const content = await this.adminService.rejectContent(id, reason);
    return {
      success: true,
      message: 'Content rejected successfully',
      data: { content },
    };
  }

  // Reports and Moderation
  @Get('reports')
  @ApiOperation({ summary: 'Get all reports' })
  @ApiResponse({ status: 200, description: 'Reports retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  async getReports(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    const reports = await this.adminService.getReports({
      page: page || 1,
      limit: limit || 20,
      status,
    });
    return {
      success: true,
      data: reports,
    };
  }

  @Post('reports/:id/resolve')
  @ApiOperation({ summary: 'Resolve report (Admin only)' })
  @ApiResponse({ status: 200, description: 'Report resolved successfully' })
  @ApiParam({ name: 'id', description: 'Report ID' })
  async resolveReport(
    @Param('id') id: string,
    @Body() resolutionData: {
      action: 'IGNORE' | 'WARNING' | 'SUSPEND' | 'DELETE_CONTENT';
      notes?: string;
    },
  ) {
    const report = await this.adminService.resolveReport(id, resolutionData);
    return {
      success: true,
      message: 'Report resolved successfully',
      data: { report },
    };
  }

  // Analytics and Reports
  @Get('analytics/revenue')
  @ApiOperation({ summary: 'Get revenue analytics' })
  @ApiResponse({ status: 200, description: 'Revenue analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getRevenueAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.adminService.getRevenueAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { analytics },
    };
  }

  @Get('analytics/engagement')
  @ApiOperation({ summary: 'Get engagement analytics' })
  @ApiResponse({ status: 200, description: 'Engagement analytics retrieved successfully' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' })
  async getEngagementAnalytics(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const analytics = await this.adminService.getEngagementAnalytics(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );
    return {
      success: true,
      data: { analytics },
    };
  }

  @Get('analytics/courses')
  @ApiOperation({ summary: 'Get course analytics' })
  @ApiResponse({ status: 200, description: 'Course analytics retrieved successfully' })
  async getCourseAnalytics() {
    const analytics = await this.adminService.getCourseAnalyticsAll();
    return {
      success: true,
      data: { analytics },
    };
  }

  // System Management
  @Get('system/health')
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({ status: 200, description: 'System health retrieved successfully' })
  async getSystemHealth() {
    const health = await this.adminService.getSystemHealth();
    return {
      success: true,
      data: { health },
    };
  }

  @Get('system/logs')
  @ApiOperation({ summary: 'Get system logs' })
  @ApiResponse({ status: 200, description: 'System logs retrieved successfully' })
  @ApiQuery({ name: 'level', required: false, description: 'Log level' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of logs' })
  async getSystemLogs(
    @Query('level') level?: string,
    @Query('limit') limit?: number,
  ) {
    const logs = await this.adminService.getSystemLogs(level, limit || 100);
    return {
      success: true,
      data: { logs },
    };
  }

  @Post('system/backup')
  @ApiOperation({ summary: 'Create system backup' })
  @ApiResponse({ status: 201, description: 'Backup created successfully' })
  async createBackup(@Body() backupData: {
    type: 'FULL' | 'INCREMENTAL';
    includeFiles?: boolean;
  }) {
    const backup = await this.adminService.createBackup(backupData);
    return {
      success: true,
      message: 'Backup created successfully',
      data: { backup },
    };
  }

  @Get('system/backups')
  @ApiOperation({ summary: 'Get system backups' })
  @ApiResponse({ status: 200, description: 'Backups retrieved successfully' })
  async getBackups() {
    const backups = await this.adminService.getBackups();
    return {
      success: true,
      data: { backups },
    };
  }

  @Post('system/restore')
  @ApiOperation({ summary: 'Restore from backup' })
  @ApiResponse({ status: 200, description: 'System restored successfully' })
  async restoreBackup(@Body('backupId') backupId: string) {
    const result = await this.adminService.restoreBackup(backupId);
    return {
      success: true,
      message: 'System restored successfully',
      data: result,
    };
  }

  // Settings and Configuration
  @Get('settings')
  @ApiOperation({ summary: 'Get system settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getSettings() {
    const settings = await this.adminService.getSettings();
    return {
      success: true,
      data: { settings },
    };
  }

  @Patch('settings')
  @ApiOperation({ summary: 'Update system settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateSettings(@Body() settingsData: {
    siteName?: string;
    siteDescription?: string;
    maintenanceMode?: boolean;
    registrationEnabled?: boolean;
    emailNotifications?: boolean;
    maxUploadSize?: number;
    allowedFileTypes?: string[];
  }) {
    const settings = await this.adminService.updateSettings(settingsData);
    return {
      success: true,
      message: 'Settings updated successfully',
      data: { settings },
    };
  }

  @Post('settings/upload-logo')
  @UseInterceptors(FileInterceptor('logo'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload site logo' })
  @ApiResponse({ status: 200, description: 'Logo uploaded successfully' })
  async uploadLogo(@UploadedFile() file: Express.Multer.File) {
    const result = await this.adminService.uploadLogo(file);
    return {
      success: true,
      message: "Logo uploaded successfully",
      data: result,
    };
  }

  // Notifications
  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Broadcast notification to all users' })
  @ApiResponse({ status: 201, description: 'Notification broadcasted successfully' })
  async broadcastNotification(@Body() notificationData: {
    titleEn: string;
    titleAr: string;
    contentEn: string;
    contentAr: string;
    type: string;
    channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>;
    sendToAll?: boolean;
    userRoles?: string[];
  }) {
    const result = await this.adminService.broadcastNotification(notificationData);
    return {
      success: true,
      message: 'Notification broadcasted successfully',
      data: result,
    };
  }

  @Get('notifications/templates')
  @ApiOperation({ summary: 'Get notification templates' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getNotificationTemplates() {
    const templates = await this.adminService.getNotificationTemplates();
    return {
      success: true,
      data: { templates },
    };
  }

  // Export and Import
  @Get('export/users')
  @ApiOperation({ summary: 'Export users data' })
  @ApiResponse({ status: 200, description: 'Users data exported successfully' })
  @ApiQuery({ name: 'format', required: false, description: 'Export format (csv/xlsx/json)' })
  async exportUsers(@Query('format') format?: string) {
    const result = await this.adminService.exportUsers(format || 'csv');
    return {
      success: true,
      data: result,
    };
  }

  @Get('export/courses')
  @ApiOperation({ summary: 'Export courses data' })
  @ApiResponse({ status: 200, description: 'Courses data exported successfully' })
  @ApiQuery({ name: 'format', required: false, description: 'Export format (csv/xlsx/json)' })
  async exportCourses(@Query('format') format?: string) {
    const result = await this.adminService.exportCourses(format || 'csv');
    return {
      success: true,
      data: result,
    };
  }

  @Post('import/users')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Import users data' })
  @ApiResponse({ status: 201, description: 'Users data imported successfully' })
  async importUsers(@UploadedFile() file: Express.Multer.File) {
    const result = await this.adminService.importUsers(file);
    return {
      success: true,
      message: 'Users imported successfully',
      data: result,
    };
  }

  // Security
  @Get('security/audit-log')
  @ApiOperation({ summary: 'Get security audit log' })
  @ApiResponse({ status: 200, description: 'Audit log retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'action', required: false, description: 'Filter by action' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  async getAuditLog(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('action') action?: string,
    @Query('userId') userId?: string,
  ) {
    const auditLog = await this.adminService.getAuditLog({
      page: page || 1,
      limit: limit || 20,
      action,
      userId,
    });
    return {
      success: true,
      data: auditLog,
    };
  }

  @Post('security/force-password-reset')
  @ApiOperation({ summary: 'Force password reset for all users' })
  @ApiResponse({ status: 200, description: 'Password reset initiated successfully' })
  async forcePasswordReset(@Body() data: {
    message?: string;
    excludeRoles?: string[];
  }) {
    const result = await this.adminService.forcePasswordReset(data);
    return {
      success: true,
      message: 'Password reset initiated successfully',
      data: result,
    };
  }

  @Get('security/sessions')
  @ApiOperation({ summary: 'Get active user sessions' })
  @ApiResponse({ status: 200, description: 'Active sessions retrieved successfully' })
  async getActiveSessions() {
    const sessions = await this.adminService.getActiveSessions();
    return {
      success: true,
      data: { sessions },
    };
  }

  @Delete('security/sessions/:sessionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke user session' })
  @ApiResponse({ status: 204, description: 'Session revoked successfully' })
  @ApiParam({ name: 'sessionId', description: 'Session ID' })
  async revokeSession(@Param('sessionId') sessionId: string) {
    await this.adminService.revokeSession(sessionId);
  }

  // Monitoring
  @Get('monitoring/performance')
  @ApiOperation({ summary: 'Get performance metrics' })
  @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
  async getPerformanceMetrics() {
    const metrics = await this.adminService.getPerformanceMetrics();
    return {
      success: true,
      data: { metrics },
    };
  }

  @Get('monitoring/errors')
  @ApiOperation({ summary: 'Get recent errors' })
  @ApiResponse({ status: 200, description: 'Recent errors retrieved successfully' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of errors' })
  async getRecentErrors(@Query('limit') limit?: number) {
    const errors = await this.adminService.getRecentErrors(limit || 50);
    return {
      success: true,
      data: { errors },
    };
  }

  @Get('monitoring/usage')
  @ApiOperation({ summary: 'Get system usage statistics' })
  @ApiResponse({ status: 200, description: 'Usage statistics retrieved successfully' })
  async getUsageStatistics() {
    const stats = await this.adminService.getUsageStatistics();
    return {
      success: true,
      data: { stats },
    };
  }

  // ── Course Approval ─────────────────────────────────────────────────────

  @Get('pending-courses')
  @ApiOperation({ summary: 'Get courses pending review' })
  @ApiResponse({ status: 200, description: 'Pending courses retrieved successfully' })
  async getPendingCourses() {
    try {
      return await this.adminService.getPendingCourses();
    } catch (e: any) {
      console.error('[Admin Controller] pending-courses error:', e.message, e.stack);
      return { success: true, data: [] };
    }
  }

  @Post('courses/:id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve and publish a course' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async postApproveCourse(@Param('id') id: string) {
    const course = await this.adminService.approveCourse(id);
    return { success: true, message: 'Course approved and published', data: { course } };
  }

  @Post('courses/:id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject a course submission' })
  @ApiParam({ name: 'id', description: 'Course ID' })
  async postRejectCourse(
    @Param('id') id: string,
    @Body() body: { reason?: string },
  ) {
    const course = await this.adminService.rejectCourse(id, body.reason);
    return { success: true, message: 'Course rejected', data: { course } };
  }

  // ── Approval system ────────────────────────────────────────────────────────

  @Get('pending-approvals')
  @ApiOperation({ summary: 'Get pending instructor/consultant approvals' })
  @ApiResponse({ status: 200, description: 'Pending approvals retrieved successfully' })
  async getPendingApprovals() {
    try {
      const users = await this.adminService.getPendingApprovals();
      return { success: true, data: users };
    } catch (e: any) {
      console.error('[Admin Controller] pending-approvals error:', e.message, e.stack);
      return { success: true, data: [] };
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get dashboard stats (safe)' })
  async getDashboardStats() {
    try {
      const stats = await this.adminService.getDashboardStats();
      return { success: true, data: stats };
    } catch (e: any) {
      console.error('[Admin Controller] stats error:', e.message, e.stack);
      throw new InternalServerErrorException(e.message);
    }
  }

  @Delete('clear-seed-data')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear seed/test data (ADMIN only)' })
  async clearSeedData() {
    return this.adminService.clearSeedData();
  }

  @Post('approve/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve user account' })
  @ApiParam({ name: 'userId', description: 'User ID to approve' })
  async approveUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: User,
  ) {
    const user = await this.adminService.approveUser(userId, admin.id);
    return { success: true, message: 'User approved', data: { user } };
  }

  @Post('reject/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject user application' })
  @ApiParam({ name: 'userId', description: 'User ID to reject' })
  async rejectUser(
    @Param('userId') userId: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser() admin: User,
  ) {
    const user = await this.adminService.rejectUser(userId, reason, admin.id);
    return { success: true, message: 'User rejected', data: { user } };
  }

  @Post('users/:userId/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban a user' })
  @ApiParam({ name: 'userId', description: 'User ID to ban' })
  async banUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: User,
  ) {
    const user = await this.adminService.banUser(userId, admin.id);
    return { success: true, message: 'User banned', data: { user } };
  }

  @Post('users/:userId/unban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Unban a user' })
  @ApiParam({ name: 'userId', description: 'User ID to unban' })
  async unbanUser(
    @Param('userId') userId: string,
    @CurrentUser() admin: User,
  ) {
    const user = await this.adminService.unbanUser(userId, admin.id);
    return { success: true, message: 'User unbanned', data: user };
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  @Get('payments')
  @ApiOperation({ summary: 'Get all CONFIRMED payments only (revenue)' })
  async getAllPayments() {
    return this.adminService.getAllConfirmedPayments();
  }

  // ── Security Logs ──────────────────────────────────────────────────────────

  @Get('security-logs')
  @ApiOperation({ summary: 'Get security log entries' })
  @ApiQuery({ name: 'event', required: false, description: 'Filter by event type' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  async getSecurityLogs(
    @Query('event') event?: string,
    @Query('limit') limit = '50',
    @Query('page') page = '1',
  ) {
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const where = event ? { event } : {}

    const [logs, total] = await Promise.all([
      this.prisma.securityLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip,
      }),
      this.prisma.securityLog.count({ where }),
    ])

    return { success: true, data: { logs, total, page: parseInt(page) } }
  }

  // ── Audit Logs ─────────────────────────────────────────────────────────────

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get audit log entries' })
  @ApiQuery({ name: 'limit', required: false })
  async getAuditLogs(@Query('limit') limit?: string) {
    const logs = await this.adminService.getAuditLogs(limit ? parseInt(limit) : 50);
    return { success: true, data: { logs } };
  }

  // ── Site Settings ─────────────────────────────────────────────────────────

  @Get('site-settings')
  @Public()
  @ApiOperation({ summary: 'Get site settings (public)' })
  async getSiteSettings() {
    const settings = await this.adminService.getSiteSettings();
    return { success: true, data: { settings } };
  }

  @Get('sessions')
  @ApiOperation({ summary: 'Get all consulting sessions (Admin)' })
  async getAllSessions() {
    return this.adminService.getAllSessions();
  }

  @Patch('site-settings')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update site settings' })
  async updateSiteSettings(
    @Body() body: { primaryColor?: string; backgroundColor?: string; buttonColor?: string; logoUrl?: string; siteName?: string },
  ) {
    const settings = await this.adminService.updateSiteSettings(body);
    return { success: true, data: { settings } };
  }

  @Post('users/create')
  async createUser(@Body() body: CreateUserAdminDto) {
    const result = await this.adminService.createUser(body);
    return { success: true, data: result };
  }

  @Patch('users/:userId/role')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change user role' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async changeRole(@Param('userId') userId: string, @Body() body: { accountType: string }, @CurrentUser() admin: User) {
    const result = await this.adminService.changeUserRole(userId, body.accountType, admin.id);
    return { success: true, data: result };
  }

  @Patch('users/:id/status-update')
  async changeStatus(@Param('id') id: string, @Body() body: { status: string }) {
    const result = await this.adminService.changeUserStatus(id, body.status);
    return { success: true, data: result };
  }

  @Get('users/:id/detail')
  async getUserDetail(@Param('id') id: string) {
    const result = await this.adminService.getUserDetail(id);
    return { success: true, data: result };
  }

  @Get('users/:id/financials')
  async getUserFinancials(@Param('id') id: string) {
    return this.adminService.getUserFinancials(id);
  }

  @Get('users/:id/activity')
  async getUserActivity(@Param('id') id: string, @Query('filter') filter = 'all') {
    const result = await this.adminService.getUserActivity(id, filter);
    return { success: true, data: result };
  }

  // ── Create Session WITH Image ──
  @Post('sessions/create')
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create new session with optional image' })
  async createSessionWithImage(
    @UploadedFile() image: Express.Multer.File | null,
    @Body() body: any,
  ) {
    const sessionData: any = {};
    if (body.studentId) sessionData.studentId = body.studentId;
    if (body.consultantId) sessionData.consultantId = body.consultantId;
    if (body.topic) sessionData.topic = body.topic;
    if (body.scheduledAt) sessionData.scheduledAt = body.scheduledAt;
    if (body.price) sessionData.price = Number(body.price) || 0;
    if (body.meetingMethod) sessionData.meetingMethod = body.meetingMethod;
    if (body.duration) sessionData.duration = Number(body.duration) || 60;

    // Add image URL if provided
    if (image) {
      (sessionData as any).imageUrl = `/uploads/admin/${image.filename}`;
    }

    const result = await this.adminService.createSessionWithImage(sessionData, image);
    return { success: true, data: result };
  }

  @Get('activity/live')
  async getLiveActivity(@Query('limit') limit = '50') {
    const result = await this.adminService.getLiveActivity(+limit);
    return { success: true, data: result };
  }

  @Get('activity/stats')
  async getActivityStats() {
    const result = await this.adminService.getActivityStats();
    return { success: true, data: result };
  }

  @Post('run-migrations')
  @ApiOperation({ summary: 'Run pending database migrations (one-time admin tool)' })
  async runMigrations() {
    try {
      await this.prisma.$executeRaw`
        ALTER TABLE consulting_sessions 
        ADD COLUMN IF NOT EXISTS price DOUBLE PRECISION NOT NULL DEFAULT 0
      `
      return { success: true, message: 'Migration applied' }
    } catch (e: any) {
      return { success: false, error: e.message }
    }
  }
}