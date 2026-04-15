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
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let AdminController = class AdminController {
    constructor(adminService) {
        this.adminService = adminService;
    }
    async getDashboard() {
        const dashboard = await this.adminService.getDashboardOverview();
        return {
            success: true,
            data: { dashboard },
        };
    }
    async getStatsOverview() {
        const stats = await this.adminService.getPlatformStats();
        return {
            success: true,
            data: { stats },
        };
    }
    async getUsers(page, limit, role, status, search) {
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
    async getUser(id) {
        const user = await this.adminService.getUserById(id);
        return {
            success: true,
            data: { user },
        };
    }
    async updateUser(id, updateData) {
        const user = await this.adminService.updateUser(id, updateData);
        return {
            success: true,
            message: 'User updated successfully',
            data: { user },
        };
    }
    async deleteUser(id) {
        await this.adminService.deleteUser(id);
    }
    async suspendUser(id, reason) {
        const user = await this.adminService.suspendUser(id, reason);
        return {
            success: true,
            message: 'User suspended successfully',
            data: { user },
        };
    }
    async unsuspendUser(id) {
        const user = await this.adminService.unsuspendUser(id);
        return {
            success: true,
            message: 'User unsuspended successfully',
            data: { user },
        };
    }
    async getAdminCourses(page, limit, status) {
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
    async createCourse(courseData) {
        const course = await this.adminService.createCourse(courseData);
        return {
            success: true,
            message: 'Course created successfully',
            data: { course },
        };
    }
    async approveCourse(id) {
        const course = await this.adminService.approveCourse(id);
        return {
            success: true,
            message: 'Course approved successfully',
            data: { course },
        };
    }
    async rejectCourse(id, reason) {
        const course = await this.adminService.rejectCourse(id, reason);
        return {
            success: true,
            message: 'Course rejected successfully',
            data: { course },
        };
    }
    async getPendingContent() {
        const content = await this.adminService.getPendingContent();
        return {
            success: true,
            data: { content },
        };
    }
    async approveContent(id) {
        const content = await this.adminService.approveContent(id);
        return {
            success: true,
            message: 'Content approved successfully',
            data: { content },
        };
    }
    async rejectContent(id, reason) {
        const content = await this.adminService.rejectContent(id, reason);
        return {
            success: true,
            message: 'Content rejected successfully',
            data: { content },
        };
    }
    async getReports(page, limit, status) {
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
    async resolveReport(id, resolutionData) {
        const report = await this.adminService.resolveReport(id, resolutionData);
        return {
            success: true,
            message: 'Report resolved successfully',
            data: { report },
        };
    }
    async getRevenueAnalytics(startDate, endDate) {
        const analytics = await this.adminService.getRevenueAnalytics(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { analytics },
        };
    }
    async getEngagementAnalytics(startDate, endDate) {
        const analytics = await this.adminService.getEngagementAnalytics(startDate ? new Date(startDate) : undefined, endDate ? new Date(endDate) : undefined);
        return {
            success: true,
            data: { analytics },
        };
    }
    async getCourseAnalytics() {
        const analytics = await this.adminService.getCourseAnalyticsAll();
        return {
            success: true,
            data: { analytics },
        };
    }
    async getSystemHealth() {
        const health = await this.adminService.getSystemHealth();
        return {
            success: true,
            data: { health },
        };
    }
    async getSystemLogs(level, limit) {
        const logs = await this.adminService.getSystemLogs(level, limit || 100);
        return {
            success: true,
            data: { logs },
        };
    }
    async createBackup(backupData) {
        const backup = await this.adminService.createBackup(backupData);
        return {
            success: true,
            message: 'Backup created successfully',
            data: { backup },
        };
    }
    async getBackups() {
        const backups = await this.adminService.getBackups();
        return {
            success: true,
            data: { backups },
        };
    }
    async restoreBackup(backupId) {
        const result = await this.adminService.restoreBackup(backupId);
        return {
            success: true,
            message: 'System restored successfully',
            data: result,
        };
    }
    async getSettings() {
        const settings = await this.adminService.getSettings();
        return {
            success: true,
            data: { settings },
        };
    }
    async updateSettings(settingsData) {
        const settings = await this.adminService.updateSettings(settingsData);
        return {
            success: true,
            message: 'Settings updated successfully',
            data: { settings },
        };
    }
    async uploadLogo(file) {
        const result = await this.adminService.uploadLogo(file);
        return {
            success: true,
            message: 'Logo uploaded successfully',
            data: result,
        };
    }
    async broadcastNotification(notificationData) {
        const result = await this.adminService.broadcastNotification(notificationData);
        return {
            success: true,
            message: 'Notification broadcasted successfully',
            data: result,
        };
    }
    async getNotificationTemplates() {
        const templates = await this.adminService.getNotificationTemplates();
        return {
            success: true,
            data: { templates },
        };
    }
    async exportUsers(format) {
        const result = await this.adminService.exportUsers(format || 'csv');
        return {
            success: true,
            data: result,
        };
    }
    async exportCourses(format) {
        const result = await this.adminService.exportCourses(format || 'csv');
        return {
            success: true,
            data: result,
        };
    }
    async importUsers(file) {
        const result = await this.adminService.importUsers(file);
        return {
            success: true,
            message: 'Users imported successfully',
            data: result,
        };
    }
    async getAuditLog(page, limit, action, userId) {
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
    async forcePasswordReset(data) {
        const result = await this.adminService.forcePasswordReset(data);
        return {
            success: true,
            message: 'Password reset initiated successfully',
            data: result,
        };
    }
    async getActiveSessions() {
        const sessions = await this.adminService.getActiveSessions();
        return {
            success: true,
            data: { sessions },
        };
    }
    async revokeSession(sessionId) {
        await this.adminService.revokeSession(sessionId);
    }
    async getPerformanceMetrics() {
        const metrics = await this.adminService.getPerformanceMetrics();
        return {
            success: true,
            data: { metrics },
        };
    }
    async getRecentErrors(limit) {
        const errors = await this.adminService.getRecentErrors(limit || 50);
        return {
            success: true,
            data: { errors },
        };
    }
    async getUsageStatistics() {
        const stats = await this.adminService.getUsageStatistics();
        return {
            success: true,
            data: { stats },
        };
    }
    async getPendingCourses() {
        return this.adminService.getPendingCourses();
    }
    async postApproveCourse(id) {
        const course = await this.adminService.approveCourse(id);
        return { success: true, message: 'Course approved and published', data: { course } };
    }
    async postRejectCourse(id, body) {
        const course = await this.adminService.rejectCourse(id, body.reason);
        return { success: true, message: 'Course rejected', data: { course } };
    }
    async getPendingApprovals() {
        const users = await this.adminService.getPendingApprovals();
        return { success: true, data: users };
    }
    async getDashboardStats() {
        const stats = await this.adminService.getDashboardStats();
        return { success: true, data: stats };
    }
    async clearSeedData() {
        return this.adminService.clearSeedData();
    }
    async approveUser(userId, admin) {
        const user = await this.adminService.approveUser(userId, admin.id);
        return { success: true, message: 'User approved', data: { user } };
    }
    async rejectUser(userId, reason, admin) {
        const user = await this.adminService.rejectUser(userId, reason, admin.id);
        return { success: true, message: 'User rejected', data: { user } };
    }
    async banUser(userId, admin) {
        const user = await this.adminService.banUser(userId, admin.id);
        return { success: true, message: 'User banned', data: { user } };
    }
    async unbanUser(userId, admin) {
        const user = await this.adminService.unbanUser(userId, admin.id);
        return { success: true, message: 'User unbanned', data: { user } };
    }
    async getAllPayments() {
        return this.adminService.getAllPayments();
    }
    async getAuditLogs(limit) {
        const logs = await this.adminService.getAuditLogs(limit ? parseInt(limit) : 50);
        return { success: true, data: { logs } };
    }
    async getSiteSettings() {
        const settings = await this.adminService.getSiteSettings();
        return { success: true, data: { settings } };
    }
    async getAllSessions() {
        return this.adminService.getAllSessions();
    }
    async updateSiteSettings(body) {
        const settings = await this.adminService.updateSiteSettings(body);
        return { success: true, data: { settings } };
    }
    async createUser(body) {
        const result = await this.adminService.createUser(body);
        return { success: true, data: result };
    }
    async changeRole(id, body) {
        const result = await this.adminService.changeUserRole(id, body.accountType);
        return { success: true, data: result };
    }
    async changeStatus(id, body) {
        const result = await this.adminService.changeUserStatus(id, body.status);
        return { success: true, data: result };
    }
    async deleteUser(id) {
        return this.adminService.deleteUser(id);
    }
    async getUserDetail(id) {
        const result = await this.adminService.getUserDetail(id);
        return { success: true, data: result };
    }
    async createCourse(body, req) {
        var _a, _b;
        const result = await this.adminService.createCourse(body, ((_a = req.user) === null || _a === void 0 ? void 0 : _a.sub) || ((_b = req.user) === null || _b === void 0 ? void 0 : _b.id));
        return { success: true, data: result };
    }
    async createSession(body) {
        const result = await this.adminService.createSession(body);
        return { success: true, data: result };
    }
    async getLiveActivity(limit = '50') {
        const result = await this.adminService.getLiveActivity(+limit);
        return { success: true, data: result };
    }
    async getActivityStats() {
        const result = await this.adminService.getActivityStats();
        return { success: true, data: result };
    }
    async getUserActivity(id, limit = '30') {
        const result = await this.adminService.getUserActivity(id, +limit);
        return { success: true, data: result };
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get admin dashboard overview' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard data retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, swagger_1.ApiOperation)({ summary: 'Get platform statistics overview' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStatsOverview", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, description: 'Filter by role' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, description: 'Search query' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'User not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUser", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'User deleted successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('users/:id/suspend'),
    (0, swagger_1.ApiOperation)({ summary: 'Suspend user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User suspended successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "suspendUser", null);
__decorate([
    (0, common_1.Post)('users/:id/unsuspend'),
    (0, swagger_1.ApiOperation)({ summary: 'Unsuspend user (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User unsuspended successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unsuspendUser", null);
__decorate([
    (0, common_1.Get)('courses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all courses for admin' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Courses retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAdminCourses", null);
__decorate([
    (0, common_1.Post)('courses'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new course (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Course created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCourse", null);
__decorate([
    (0, common_1.Patch)('courses/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve course (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course approved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveCourse", null);
__decorate([
    (0, common_1.Patch)('courses/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject course (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course rejected successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectCourse", null);
__decorate([
    (0, common_1.Get)('content/pending'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending content for review' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pending content retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingContent", null);
__decorate([
    (0, common_1.Post)('content/:id/approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Approve content (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Content approved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Content ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveContent", null);
__decorate([
    (0, common_1.Post)('content/:id/reject'),
    (0, swagger_1.ApiOperation)({ summary: 'Reject content (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Content rejected successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Content ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectContent", null);
__decorate([
    (0, common_1.Get)('reports'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all reports' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Reports retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, description: 'Filter by status' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getReports", null);
__decorate([
    (0, common_1.Post)('reports/:id/resolve'),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve report (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Report resolved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Report ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "resolveReport", null);
__decorate([
    (0, common_1.Get)('analytics/revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Get revenue analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Revenue analytics retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRevenueAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/engagement'),
    (0, swagger_1.ApiOperation)({ summary: 'Get engagement analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Engagement analytics retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date (YYYY-MM-DD)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date (YYYY-MM-DD)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getEngagementAnalytics", null);
__decorate([
    (0, common_1.Get)('analytics/courses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get course analytics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Course analytics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getCourseAnalytics", null);
__decorate([
    (0, common_1.Get)('system/health'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System health retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemHealth", null);
__decorate([
    (0, common_1.Get)('system/logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system logs' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System logs retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'level', required: false, description: 'Log level' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of logs' }),
    __param(0, (0, common_1.Query)('level')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSystemLogs", null);
__decorate([
    (0, common_1.Post)('system/backup'),
    (0, swagger_1.ApiOperation)({ summary: 'Create system backup' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Backup created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createBackup", null);
__decorate([
    (0, common_1.Get)('system/backups'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system backups' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Backups retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBackups", null);
__decorate([
    (0, common_1.Post)('system/restore'),
    (0, swagger_1.ApiOperation)({ summary: 'Restore from backup' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System restored successfully' }),
    __param(0, (0, common_1.Body)('backupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "restoreBackup", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update system settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings updated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)('settings/upload-logo'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('logo')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload site logo' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Logo uploaded successfully' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "uploadLogo", null);
__decorate([
    (0, common_1.Post)('notifications/broadcast'),
    (0, swagger_1.ApiOperation)({ summary: 'Broadcast notification to all users' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notification broadcasted successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "broadcastNotification", null);
__decorate([
    (0, common_1.Get)('notifications/templates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification templates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Templates retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getNotificationTemplates", null);
__decorate([
    (0, common_1.Get)('export/users'),
    (0, swagger_1.ApiOperation)({ summary: 'Export users data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users data exported successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'format', required: false, description: 'Export format (csv/xlsx/json)' }),
    __param(0, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportUsers", null);
__decorate([
    (0, common_1.Get)('export/courses'),
    (0, swagger_1.ApiOperation)({ summary: 'Export courses data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Courses data exported successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'format', required: false, description: 'Export format (csv/xlsx/json)' }),
    __param(0, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportCourses", null);
__decorate([
    (0, common_1.Post)('import/users'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Import users data' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Users data imported successfully' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "importUsers", null);
__decorate([
    (0, common_1.Get)('security/audit-log'),
    (0, swagger_1.ApiOperation)({ summary: 'Get security audit log' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Audit log retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false, description: 'Filter by action' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Filter by user ID' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('action')),
    __param(3, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLog", null);
__decorate([
    (0, common_1.Post)('security/force-password-reset'),
    (0, swagger_1.ApiOperation)({ summary: 'Force password reset for all users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Password reset initiated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "forcePasswordReset", null);
__decorate([
    (0, common_1.Get)('security/sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get active user sessions' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active sessions retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getActiveSessions", null);
__decorate([
    (0, common_1.Delete)('security/sessions/:sessionId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Revoke user session' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Session revoked successfully' }),
    (0, swagger_1.ApiParam)({ name: 'sessionId', description: 'Session ID' }),
    __param(0, (0, common_1.Param)('sessionId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "revokeSession", null);
__decorate([
    (0, common_1.Get)('monitoring/performance'),
    (0, swagger_1.ApiOperation)({ summary: 'Get performance metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Performance metrics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPerformanceMetrics", null);
__decorate([
    (0, common_1.Get)('monitoring/errors'),
    (0, swagger_1.ApiOperation)({ summary: 'Get recent errors' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Recent errors retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Number of errors' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getRecentErrors", null);
__decorate([
    (0, common_1.Get)('monitoring/usage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system usage statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Usage statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUsageStatistics", null);
__decorate([
    (0, common_1.Get)('pending-courses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get courses pending review' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pending courses retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingCourses", null);
__decorate([
    (0, common_1.Post)('courses/:id/approve'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Approve and publish a course' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "postApproveCourse", null);
__decorate([
    (0, common_1.Post)('courses/:id/reject'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reject a course submission' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Course ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "postRejectCourse", null);
__decorate([
    (0, common_1.Get)('pending-approvals'),
    (0, swagger_1.ApiOperation)({ summary: 'Get pending instructor/consultant approvals' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Pending approvals retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPendingApprovals", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard stats (safe)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Delete)('clear-seed-data'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Clear seed/test data (ADMIN only)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "clearSeedData", null);
__decorate([
    (0, common_1.Post)('approve/:userId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Approve user account' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to approve' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "approveUser", null);
__decorate([
    (0, common_1.Post)('reject/:userId'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reject user application' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to reject' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)('reason')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "rejectUser", null);
__decorate([
    (0, common_1.Post)('users/:userId/ban'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Ban a user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to ban' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banUser", null);
__decorate([
    (0, common_1.Post)('users/:userId/unban'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Unban a user' }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID to unban' }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "unbanUser", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payments with revenue total' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllPayments", null);
__decorate([
    (0, common_1.Get)('audit-logs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get audit log entries' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAuditLogs", null);
__decorate([
    (0, common_1.Get)('site-settings'),
    (0, public_decorator_1.Public)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get site settings (public)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getSiteSettings", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all consulting sessions (Admin)' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllSessions", null);
__decorate([
    (0, common_1.Patch)('site-settings'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Update site settings' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateSiteSettings", null);
__decorate([
    (0, common_1.Post)('users/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeRole", null);
__decorate([
    (0, common_1.Patch)('users/:id/status-update'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "changeStatus", null);
__decorate([
    (0, common_1.Delete)('users/:id/delete'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Get)('users/:id/detail'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserDetail", null);
__decorate([
    (0, common_1.Post)('courses/create'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createCourse", null);
__decorate([
    (0, common_1.Post)('sessions/create'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('activity/live'),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getLiveActivity", null);
__decorate([
    (0, common_1.Get)('activity/stats'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getActivityStats", null);
__decorate([
    (0, common_1.Get)('users/:id/activity'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserActivity", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('Admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map