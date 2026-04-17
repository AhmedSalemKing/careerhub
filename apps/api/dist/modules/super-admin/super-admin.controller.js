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
exports.SuperAdminController = exports.SuperAdminBootstrapController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const super_admin_service_1 = require("./super-admin.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const activity_service_1 = require("../activity/activity.service");
let SuperAdminBootstrapController = class SuperAdminBootstrapController {
    constructor(superAdminService) {
        this.superAdminService = superAdminService;
    }
    async bootstrapSuperAdmin(secret, body) {
        if (secret !== 'DEVEWAY_BOOTSTRAP_2026')
            throw new common_1.UnauthorizedException('Invalid secret');
        return { success: true, data: await this.superAdminService.bootstrapSuperAdmin(body.email, body.password) };
    }
};
exports.SuperAdminBootstrapController = SuperAdminBootstrapController;
__decorate([
    (0, common_1.Post)('init'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Headers)('x-bootstrap-secret')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminBootstrapController.prototype, "bootstrapSuperAdmin", null);
exports.SuperAdminBootstrapController = SuperAdminBootstrapController = __decorate([
    (0, swagger_1.ApiTags)('Super Admin Bootstrap'),
    (0, common_1.Controller)('super-admin/bootstrap'),
    __metadata("design:paramtypes", [super_admin_service_1.SuperAdminService])
], SuperAdminBootstrapController);
let SuperAdminController = class SuperAdminController {
    constructor(superAdminService, activityService) {
        this.superAdminService = superAdminService;
        this.activityService = activityService;
    }
    async getDashboardStats() {
        const stats = await this.superAdminService.getDashboardStats();
        return { success: true, data: stats };
    }
    async getLiveActivity(limit) {
        const data = await this.superAdminService.getLiveActivity(limit ? parseInt(limit) : 100);
        return { success: true, data };
    }
    async getActivity(userId, action, entity, from, to, page, limit) {
        const data = await this.superAdminService.getActivityFiltered({
            userId,
            action,
            entity,
            from,
            to,
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 50,
        });
        return { success: true, data };
    }
    async getActivityStats() {
        const data = await this.activityService.getActivityStats();
        return { success: true, data };
    }
    async getUsers(page, limit, search, role, status, accountType) {
        const data = await this.superAdminService.getUsers({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            search,
            role,
            status,
            accountType,
        });
        return { success: true, data };
    }
    async getUserById(id) {
        const data = await this.superAdminService.getUserById(id);
        return { success: true, data };
    }
    async getUserActivity(id, limit) {
        const data = await this.superAdminService.getUserActivity(id, limit ? parseInt(limit) : 100);
        return { success: true, data };
    }
    async createUser(body, actor) {
        const data = await this.superAdminService.createUser(body);
        await this.activityService.log({
            userId: actor.id,
            action: 'admin.user_created',
            entity: 'User',
            entityId: data.id,
            metadata: { email: body.email, accountType: body.accountType },
        });
        return { success: true, message: 'User created successfully', data };
    }
    async updateUserRole(id, body, actor) {
        const data = await this.superAdminService.updateUserRole(id, body.accountType, actor.id);
        return { success: true, message: 'Role updated', data };
    }
    async setCredentials(id, body, actor) {
        const data = await this.superAdminService.setUserCredentials(id, body, actor.id);
        return { success: true, message: 'Credentials updated', data };
    }
    async updateUser(id, body) {
        const data = await this.superAdminService.updateUser(id, body);
        return { success: true, message: 'User updated', data };
    }
    async getCourses(page, limit, status) {
        const data = await this.superAdminService.getAllCourses({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            status,
        });
        return { success: true, data };
    }
    async createCourse(body, actor) {
        const data = await this.superAdminService.createCourse(body, actor.id);
        return { success: true, message: 'Course created and published', data };
    }
    async getSessions(page, limit, status) {
        const data = await this.superAdminService.getAllSessions({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            status,
        });
        return { success: true, data };
    }
    async createSession(body, actor) {
        const data = await this.superAdminService.createSession(body, actor.id);
        return { success: true, message: 'Session created', data };
    }
    async getRevenue(from, to) {
        const data = await this.superAdminService.getRevenueAnalytics({ from, to });
        return { success: true, data };
    }
    async getSystemLogs(limit) {
        const data = await this.superAdminService.getSystemLogs(limit ? parseInt(limit) : 100);
        return { success: true, data };
    }
    async getSystemHealth() {
        const data = await this.superAdminService.getSystemHealth();
        return { success: true, data };
    }
};
exports.SuperAdminController = SuperAdminController;
__decorate([
    (0, common_1.Get)('dashboard/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get real-time dashboard statistics' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('activity/live'),
    (0, swagger_1.ApiOperation)({ summary: 'Get live activity feed (latest 100 actions)' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getLiveActivity", null);
__decorate([
    (0, common_1.Get)('activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get filtered activity log with pagination' }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'action', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'entity', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('userId')),
    __param(1, (0, common_1.Query)('action')),
    __param(2, (0, common_1.Query)('entity')),
    __param(3, (0, common_1.Query)('from')),
    __param(4, (0, common_1.Query)('to')),
    __param(5, (0, common_1.Query)('page')),
    __param(6, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getActivity", null);
__decorate([
    (0, common_1.Get)('activity/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get activity statistics summary' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getActivityStats", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users with filters and stats' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'accountType', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('role')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('accountType')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getUsers", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full user profile with stats' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Get)('users/:id/activity'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific user activity timeline' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getUserActivity", null);
__decorate([
    (0, common_1.Post)('users/create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create user with credentials (bypasses registration)' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)('users/:id/role'),
    (0, swagger_1.ApiOperation)({ summary: 'Change user role instantly' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Patch)('users/:id/credentials'),
    (0, swagger_1.ApiOperation)({ summary: 'Set user email/password credentials' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "setCredentials", null);
__decorate([
    (0, common_1.Patch)('users/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user status/flags' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'User ID' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('courses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all courses with instructor info and stats' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getCourses", null);
__decorate([
    (0, common_1.Post)('courses/create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create and publish course as Super Admin' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createCourse", null);
__decorate([
    (0, common_1.Get)('sessions'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all consulting sessions' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getSessions", null);
__decorate([
    (0, common_1.Post)('sessions/create'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create consulting session as Super Admin' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('analytics/revenue'),
    (0, swagger_1.ApiOperation)({ summary: 'Get revenue analytics with transaction history' }),
    (0, swagger_1.ApiQuery)({ name: 'from', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'to', required: false }),
    __param(0, (0, common_1.Query)('from')),
    __param(1, (0, common_1.Query)('to')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getRevenue", null);
__decorate([
    (0, common_1.Get)('logs/system'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system admin and audit logs' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getSystemLogs", null);
__decorate([
    (0, common_1.Get)('system/health'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system health and resource usage' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SuperAdminController.prototype, "getSystemHealth", null);
exports.SuperAdminController = SuperAdminController = __decorate([
    (0, swagger_1.ApiTags)('Super Admin'),
    (0, common_1.Controller)('super-admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('SUPER_ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [super_admin_service_1.SuperAdminService,
        activity_service_1.ActivityService])
], SuperAdminController);
//# sourceMappingURL=super-admin.controller.js.map