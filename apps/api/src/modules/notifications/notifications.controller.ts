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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) { }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user notifications' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by type' })
  @ApiQuery({ name: 'isRead', required: false, description: 'Filter by read status' })
  async getNotifications(
    @CurrentUser() user: User,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('isRead') isRead?: boolean,
  ) {
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

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notifications count' })
  @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
  async getUnreadCount(@CurrentUser() user: User) {
    const count = await this.notificationsService.getUnreadCount(user.id);
    return {
      success: true,
      data: { count },
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({ status: 200, description: 'Notification retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async getNotification(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    const notification = await this.notificationsService.getNotification(user.id, id);
    return {
      success: true,
      data: { notification },
    };
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async markAsRead(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.notificationsService.markAsRead(user.id, id);
    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  @Patch('mark-all-read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read' })
  async markAllAsRead(@CurrentUser() user: User) {
    await this.notificationsService.markAllAsRead(user.id);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete notification' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  async deleteNotification(
    @CurrentUser() user: User,
    @Param('id') id: string,
  ) {
    await this.notificationsService.deleteNotification(user.id, id);
  }

  @Delete('clear-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Clear all notifications' })
  @ApiResponse({ status: 204, description: 'All notifications cleared' })
  async clearAllNotifications(@CurrentUser() user: User) {
    await this.notificationsService.clearAllNotifications(user.id);
  }

  @Post('send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send notification (Admin only)' })
  @ApiResponse({ status: 201, description: 'Notification sent successfully' })
  async sendNotification(@Body() notificationData: {
    userId?: string;
    titleEn: string;
    titleAr: string;
    contentEn: string;
    contentAr: string;
    type: string;
    channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>;
    data?: Record<string, any>;
    sendToAll?: boolean;
  }) {
    const notification = await this.notificationsService.createNotification(notificationData);
    return {
      success: true,
      message: 'Notification sent successfully',
      data: { notification },
    };
  }

  @Post('broadcast')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Broadcast notification to all users (Admin only)' })
  @ApiResponse({ status: 201, description: 'Notification broadcasted successfully' })
  async broadcastNotification(@Body() broadcastData: {
    titleEn: string;
    titleAr: string;
    contentEn: string;
    contentAr: string;
    type: string;
    channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>;
    data?: Record<string, any>;
    userFilter?: {
      role?: string;
      isActive?: boolean;
      hasEnrollment?: boolean;
    };
  }) {
    const result = await this.notificationsService.broadcastNotification(broadcastData);
    return {
      success: true,
      message: 'Notification broadcasted successfully',
      data: result,
    };
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user notification settings' })
  @ApiResponse({ status: 200, description: 'Settings retrieved successfully' })
  async getNotificationSettings(@CurrentUser() user: User) {
    const settings = await this.notificationsService.getUserNotifications(user.id, { page: 1, limit: 10 });
    return {
      success: true,
      data: { settings },
    };
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification settings' })
  @ApiResponse({ status: 200, description: 'Settings updated successfully' })
  async updateNotificationSettings(
    @CurrentUser() user: User,
    @Body() settingsData: {
      emailEnabled?: boolean;
      pushEnabled?: boolean;
      smsEnabled?: boolean;
      preferences?: Record<string, boolean>;
    },
  ) {
    const settings = await this.notificationsService.updateNotificationSettings(
      user.id,
      settingsData
    );
    return {
      success: true,
      message: 'Settings updated successfully',
      data: { settings },
    };
  }

  @Post('device-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Register device token for push notifications' })
  @ApiResponse({ status: 201, description: 'Device token registered successfully' })
  async registerDeviceToken(
    @CurrentUser() user: User,
    @Body() tokenData: {
      token: string;
      platform: 'ios' | 'android' | 'web';
      deviceId?: string;
    },
  ) {
    await this.notificationsService.registerDeviceToken(user.id, tokenData);
    return {
      success: true,
      message: 'Device token registered successfully',
    };
  }

  @Delete('device-token/:token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Unregister device token' })
  @ApiResponse({ status: 204, description: 'Device token unregistered successfully' })
  @ApiParam({ name: 'token', description: 'Device token' })
  async unregisterDeviceToken(
    @CurrentUser() user: User,
    @Param('token') token: string,
  ) {
    await this.notificationsService.unregisterDeviceToken(user.id, token);
  }

  @Post('test-email')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send test email (Admin only)' })
  @ApiResponse({ status: 200, description: 'Test email sent successfully' })
  async sendTestEmail(@Body() emailData: {
    to: string;
    subject?: string;
    message?: string;
  }) {
    const result = await this.notificationsService.sendTestEmail(emailData);
    return {
      success: true,
      message: 'Test email sent successfully',
      data: result,
    };
  }

  @Post('test-push')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Send test push notification (Admin only)' })
  @ApiResponse({ status: 200, description: 'Test push notification sent successfully' })
  async sendTestPush(@Body() pushData: {
    userId: string;
    title: string;
    message: string;
  }) {
    const result = await this.notificationsService.sendTestPush(pushData);
    return {
      success: true,
      message: 'Test push notification sent successfully',
      data: result,
    };
  }

  @Get('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification templates (Admin only)' })
  @ApiResponse({ status: 200, description: 'Templates retrieved successfully' })
  async getNotificationTemplates() {
    const templates = await this.notificationsService.getNotificationTemplates();
    return {
      success: true,
      data: { templates },
    };
  }

  @Post('templates')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create notification template (Admin only)' })
  @ApiResponse({ status: 201, description: 'Template created successfully' })
  async createNotificationTemplate(@Body() templateData: {
    name: string;
    type: string;
    subjectEn?: string;
    subjectAr?: string;
    contentEn: string;
    contentAr: string;
    variables?: string[];
  }) {
    const template = await this.notificationsService.createNotificationTemplate(templateData);
    return {
      success: true,
      message: 'Template created successfully',
      data: { template },
    };
  }

  @Get('stats/overview')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification statistics (Admin only)' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getNotificationStats() {
    const stats = await this.notificationsService.getNotificationStats();
    return {
      success: true,
      data: { stats },
    };
  }

  @Get('delivery-status/:notificationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification delivery status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Delivery status retrieved successfully' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  async getDeliveryStatus(@Param('notificationId') notificationId: string) {
    const status = await this.notificationsService.getDeliveryStatus(notificationId);
    return {
      success: true,
      data: { status },
    };
  }

  @Post('resend/:notificationId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Resend notification (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notification resent successfully' })
  @ApiParam({ name: 'notificationId', description: 'Notification ID' })
  async resendNotification(
    @Param('notificationId') notificationId: string,
    @Body() resendData: {
      channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>;
    },
  ) {
    const result = await this.notificationsService.resendNotification(
      notificationId,
      resendData.channels
    );
    return {
      success: true,
      message: 'Notification resent successfully',
      data: result,
    };
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all notifications (Admin only)' })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  async getAllNotifications(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
  ) {
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
}

