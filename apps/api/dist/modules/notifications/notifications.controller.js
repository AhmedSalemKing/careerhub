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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notifications_service_1 = require("./notifications.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let NotificationsController = class NotificationsController {
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async getNotifications(user, page, limit, type, isRead) {
        const notifications = await this.notificationsService.getUserNotifications(user.id, {
            page: page || 1,
            limit: limit || 20,
            type,
            isRead,
        });
        return {
            success: true,
            data: notifications,
        };
    }
    async getUnreadCount(user) {
        const count = await this.notificationsService.getUnreadCount(user.id);
        return {
            success: true,
            data: { count },
        };
    }
    async getNotification(user, id) {
        const notification = await this.notificationsService.getNotification(user.id, id);
        return {
            success: true,
            data: { notification },
        };
    }
    async markAsRead(user, id) {
        await this.notificationsService.markAsRead(user.id, id);
        return {
            success: true,
            message: 'Notification marked as read',
        };
    }
    async markAllAsRead(user) {
        await this.notificationsService.markAllAsRead(user.id);
        return {
            success: true,
            message: 'All notifications marked as read',
        };
    }
    async deleteNotification(user, id) {
        await this.notificationsService.deleteNotification(user.id, id);
    }
    async clearAllNotifications(user) {
        await this.notificationsService.clearAllNotifications(user.id);
    }
    async sendNotification(notificationData) {
        const notification = await this.notificationsService.createNotification(notificationData);
        return {
            success: true,
            message: 'Notification sent successfully',
            data: { notification },
        };
    }
    async broadcastNotification(broadcastData) {
        const result = await this.notificationsService.broadcastNotification(broadcastData);
        return {
            success: true,
            message: 'Notification broadcasted successfully',
            data: result,
        };
    }
    async getNotificationSettings(user) {
        const settings = await this.notificationsService.getUserNotifications(user.id, { page: 1, limit: 10 });
        return {
            success: true,
            data: { settings },
        };
    }
    async updateNotificationSettings(user, settingsData) {
        const settings = await this.notificationsService.updateNotificationSettings(user.id, settingsData);
        return {
            success: true,
            message: 'Settings updated successfully',
            data: { settings },
        };
    }
    async registerDeviceToken(user, tokenData) {
        await this.notificationsService.registerDeviceToken(user.id, tokenData);
        return {
            success: true,
            message: 'Device token registered successfully',
        };
    }
    async unregisterDeviceToken(user, token) {
        await this.notificationsService.unregisterDeviceToken(user.id, token);
    }
    async sendTestEmail(emailData) {
        const result = await this.notificationsService.sendTestEmail(emailData);
        return {
            success: true,
            message: 'Test email sent successfully',
            data: result,
        };
    }
    async sendTestPush(pushData) {
        const result = await this.notificationsService.sendTestPush(pushData);
        return {
            success: true,
            message: 'Test push notification sent successfully',
            data: result,
        };
    }
    async getNotificationTemplates() {
        const templates = await this.notificationsService.getNotificationTemplates();
        return {
            success: true,
            data: { templates },
        };
    }
    async createNotificationTemplate(templateData) {
        const template = await this.notificationsService.createNotificationTemplate(templateData);
        return {
            success: true,
            message: 'Template created successfully',
            data: { template },
        };
    }
    async getNotificationStats() {
        const stats = await this.notificationsService.getNotificationStats();
        return {
            success: true,
            data: { stats },
        };
    }
    async getDeliveryStatus(notificationId) {
        const status = await this.notificationsService.getDeliveryStatus(notificationId);
        return {
            success: true,
            data: { status },
        };
    }
    async resendNotification(notificationId, resendData) {
        const result = await this.notificationsService.resendNotification(notificationId, resendData.channels);
        return {
            success: true,
            message: 'Notification resent successfully',
            data: result,
        };
    }
    async getAllNotifications(page, limit, userId, type, status) {
        const notifications = await this.notificationsService.getAllNotifications({
            page: page || 1,
            limit: limit || 20,
            userId,
            type,
            status,
        });
        return {
            success: true,
            data: notifications,
        };
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user notifications' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by type' }),
    (0, swagger_1.ApiQuery)({ name: 'isRead', required: false, description: 'Filter by read status' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('isRead')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String, Boolean]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotifications", null);
__decorate([
    (0, common_1.Get)('unread-count'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get unread notifications count' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Unread count retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getUnreadCount", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notification retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Notification not found' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Notification ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotification", null);
__decorate([
    (0, common_1.Patch)(':id/read'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mark notification as read' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notification marked as read' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Notification ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)('mark-all-read'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mark all notifications as read' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'All notifications marked as read' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete notification' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Notification deleted successfully' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Notification ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "deleteNotification", null);
__decorate([
    (0, common_1.Delete)('clear-all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Clear all notifications' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'All notifications cleared' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "clearAllNotifications", null);
__decorate([
    (0, common_1.Post)('send'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send notification (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notification sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "sendNotification", null);
__decorate([
    (0, common_1.Post)('broadcast'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Broadcast notification to all users (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notification broadcasted successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "broadcastNotification", null);
__decorate([
    (0, common_1.Get)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user notification settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotificationSettings", null);
__decorate([
    (0, common_1.Patch)('settings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update notification settings' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Settings updated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "updateNotificationSettings", null);
__decorate([
    (0, common_1.Post)('device-token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Register device token for push notifications' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Device token registered successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "registerDeviceToken", null);
__decorate([
    (0, common_1.Delete)('device-token/:token'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Unregister device token' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'Device token unregistered successfully' }),
    (0, swagger_1.ApiParam)({ name: 'token', description: 'Device token' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('token')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "unregisterDeviceToken", null);
__decorate([
    (0, common_1.Post)('test-email'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send test email (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Test email sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "sendTestEmail", null);
__decorate([
    (0, common_1.Post)('test-push'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Send test push notification (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Test push notification sent successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "sendTestPush", null);
__decorate([
    (0, common_1.Get)('templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification templates (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Templates retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotificationTemplates", null);
__decorate([
    (0, common_1.Post)('templates'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create notification template (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Template created successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "createNotificationTemplate", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getNotificationStats", null);
__decorate([
    (0, common_1.Get)('delivery-status/:notificationId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get notification delivery status (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Delivery status retrieved successfully' }),
    (0, swagger_1.ApiParam)({ name: 'notificationId', description: 'Notification ID' }),
    __param(0, (0, common_1.Param)('notificationId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getDeliveryStatus", null);
__decorate([
    (0, common_1.Post)('resend/:notificationId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Resend notification (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notification resent successfully' }),
    (0, swagger_1.ApiParam)({ name: 'notificationId', description: 'Notification ID' }),
    __param(0, (0, common_1.Param)('notificationId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "resendNotification", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all notifications (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('type')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getAllNotifications", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)('Notifications'),
    (0, common_1.Controller)('notifications'),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
