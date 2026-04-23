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
exports.UsersController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const users_service_1 = require("./users.service");
const update_profile_dto_1 = require("./dto/update-profile.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let UsersController = class UsersController {
    constructor(usersService) {
        this.usersService = usersService;
    }
    async getProfile(user) {
        const profile = await this.usersService.getProfile(user.id);
        return {
            success: true,
            data: { profile },
        };
    }
    async updateProfile(user, updateProfileDto) {
        const profile = await this.usersService.updateProfile(user.id, updateProfileDto);
        return {
            success: true,
            message: 'Profile updated successfully',
            data: { profile },
        };
    }
    async uploadAvatar(user, file) {
        const avatarUrl = await this.usersService.uploadAvatar(user.id, file);
        return {
            success: true,
            message: 'Avatar uploaded successfully',
            data: { avatarUrl },
        };
    }
    async getDashboard(user) {
        const dashboard = await this.usersService.getDashboard(user.id);
        return {
            success: true,
            data: dashboard,
        };
    }
    async getEnrollments(user, page, limit, status) {
        const enrollments = await this.usersService.getEnrollments(user.id, {
            page: page || 1,
            limit: limit || 10,
            status,
        });
        return {
            success: true,
            data: enrollments,
        };
    }
    async getCertificates(user, page, limit) {
        const certificates = await this.usersService.getCertificates(user.id, {
            page: page || 1,
            limit: limit || 10,
        });
        return {
            success: true,
            data: certificates,
        };
    }
    async getProgress(user) {
        const progress = await this.usersService.getProgress(user.id);
        return {
            success: true,
            data: progress,
        };
    }
    async getAchievements(user) {
        const achievements = await this.usersService.getAchievements(user.id);
        return {
            success: true,
            data: { achievements },
        };
    }
    async getNotifications(user, page, limit, unread) {
        const notifications = await this.usersService.getNotifications(user.id, {
            page: page || 1,
            limit: limit || 20,
            unread,
        });
        return {
            success: true,
            data: notifications,
        };
    }
    async markNotificationsRead(user, notificationIds) {
        await this.usersService.markNotificationsRead(user.id, notificationIds);
        return {
            success: true,
            message: 'Notifications marked as read',
        };
    }
    async getSettings(user) {
        const settings = await this.usersService.getSettings(user.id);
        return {
            success: true,
            data: { settings },
        };
    }
    async updateSettings(user, settings) {
        const updatedSettings = await this.usersService.updateSettings(user.id, settings);
        return {
            success: true,
            message: 'Settings updated successfully',
            data: { settings: updatedSettings },
        };
    }
    async deleteAccount(user, password) {
        await this.usersService.deleteAccount(user.id, password);
        return {
            success: true,
            message: 'Account deleted successfully',
        };
    }
    async getStats(user) {
        const stats = await this.usersService.getStats(user.id);
        return {
            success: true,
            data: stats,
        };
    }
};
exports.UsersController = UsersController;
__decorate([
    (0, common_1.Get)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User profile retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProfile", null);
__decorate([
    (0, common_1.Patch)('profile'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profile updated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload user avatar' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Avatar uploaded successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)(new common_1.ParseFilePipe({
        validators: [
            new common_1.MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
            new common_1.FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
    }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user dashboard data' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard data retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('enrollments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user enrollments' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Enrollments retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getEnrollments", null);
__decorate([
    (0, common_1.Get)('certificates'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user certificates' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Certificates retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getCertificates", null);
__decorate([
    (0, common_1.Get)('progress'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user learning progress' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Progress data retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getProgress", null);
__decorate([
    (0, common_1.Get)('achievements'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user achievements' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Achievements retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getAchievements", null);
__decorate([
    (0, common_1.Get)('notifications'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user notifications' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('unread')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, Boolean]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Patch)('notifications/read'),
    (0, swagger_1.ApiOperation)({ summary: 'Mark notifications as read' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications marked as read' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('notificationIds')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "markNotificationsRead", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getSettings", null);
__decorate([
    (0, common_1.Patch)('settings'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings updated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Delete)('account'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user account' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Account deleted successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)('password')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "deleteAccount", null);
__decorate([
    (0, common_1.Get)('stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UsersController.prototype, "getStats", null);
exports.UsersController = UsersController = __decorate([
    (0, swagger_1.ApiTags)('Users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [users_service_1.UsersService])
], UsersController);
//# sourceMappingURL=users.controller.js.map