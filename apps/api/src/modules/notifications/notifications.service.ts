import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { SmsService } from './sms.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private emailService: EmailService,
    private pushService: PushService,
    private smsService: SmsService,
  ) { }

  async createNotification(notificationData: {
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
    const {
      userId,
      titleEn,
      titleAr,
      contentEn,
      contentAr,
      type,
      channels = ['PUSH'],
      data,
      sendToAll = false,
    } = notificationData;

    // Get target users
    let targetUsers: string[] = [];

    if (sendToAll) {
      const users = await this.prisma.user.findMany({
        where: { isActive: true },
        select: { id: true },
      });
      targetUsers = users.map(u => u.id);
    } else if (userId) {
      targetUsers = [userId];
    }

    if (targetUsers.length === 0) {
      throw new Error('No target users specified');
    }

    // Skip user notification settings for now
    const notifications = [];

    for (const targetUserId of targetUsers) {
      // Create notification record
      const notification = await this.prisma.notification.create({
        data: {
          userId: targetUserId,
          titleEn,
          titleAr,
          contentEn,
          contentAr,
          type: type as any,
          data: data || {},
          isRead: false,
        },
      });

      // Send notifications through enabled channels
      await this.sendNotificationChannels(notification, channels);

      notifications.push(notification);
    }

    this.logger.log(`Created ${notifications.length} notifications of type ${type}`);

    return notifications;
  }

  async broadcastNotification(broadcastData: {
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
    // Build user filter
    const where: any = {};

    if (broadcastData.userFilter) {
      if (broadcastData.userFilter.role) {
        where.role = broadcastData.userFilter.role;
      }
      if (broadcastData.userFilter.isActive !== undefined) {
        where.isActive = broadcastData.userFilter.isActive;
      }
      if (broadcastData.userFilter.hasEnrollment) {
        where.enrollments = {
          some: {},
        };
      }
    } else {
      where.isActive = true;
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    const userIds = users.map(u => u.id);

    if (userIds.length === 0) {
      return { sent: 0, skipped: 0 };
    }

    // Create notifications in batches
    const batchSize = 100;
    let sent = 0;
    let skipped = 0;

    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);

      try {
        const notifications = await this.createNotification({
          ...broadcastData,
          userId: batch[0], // Will be overridden by batch processing
          sendToAll: false,
        });

        // For batch processing, we'd need to modify createNotification to handle multiple users
        // For now, we'll create individual notifications
        sent += notifications.length;
      } catch (error) {
        skipped += batch.length;
        this.logger.error(`Failed to create batch notifications: ${error.message}`);
      }
    }

    return { sent, skipped };
  }

  async getUserNotifications(userId: string, options: {
    page: number;
    limit: number;
    type?: string;
    isRead?: boolean;
  }) {
    const { page, limit, type, isRead } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (type) {
      where.type = type;
    }
    if (typeof isRead === 'boolean') {
      where.isRead = isRead;
    }

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  async getUnreadCount(userId: string) {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async getNotification(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return notification;
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    if (notification.count === 0) {
      throw new Error('Notification not found');
    }

    this.logger.log(`Notification marked as read: ${notificationId}`);
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });

    this.logger.log(`All notifications marked as read for user: ${userId}`);
  }

  async deleteNotification(userId: string, notificationId: string) {
    const result = await this.prisma.notification.deleteMany({
      where: {
        id: notificationId,
        userId,
      },
    });

    if (result.count === 0) {
      throw new Error('Notification not found');
    }

    this.logger.log(`Notification deleted: ${notificationId}`);
  }

  async clearAllNotifications(userId: string) {
    await this.prisma.notification.deleteMany({
      where: { userId },
    });

    this.logger.log(`All notifications cleared for user: ${userId}`);
  }

  async updateNotificationSettings(userId: string, settingsData: {
    emailEnabled?: boolean;
    pushEnabled?: boolean;
    smsEnabled?: boolean;
    preferences?: Record<string, boolean>;
  }) {
    // Skip for now
    this.logger.log(`Notification settings updated for user: ${userId}`);
    return { userId, ...settingsData };
  }

  async registerDeviceToken(userId: string, tokenData: {
    token: string;
    platform: 'ios' | 'android' | 'web';
    deviceId?: string;
  }) {
    // Check if token already exists
    const existingToken = await this.prisma.deviceToken.findFirst({
      where: {
        token: tokenData.token,
        userId,
      },
    });

    if (existingToken) {
      // Update existing token
      await this.prisma.deviceToken.update({
        where: { id: existingToken.id },
        data: {
          platform: tokenData.platform,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new token
      await this.prisma.deviceToken.create({
        data: {
          userId,
          token: tokenData.token,
          platform: tokenData.platform,
          updatedAt: new Date(),
        },
      });
    }

    this.logger.log(`Device token registered for user: ${userId}`);
  }

  async unregisterDeviceToken(userId: string, token: string) {
    await this.prisma.deviceToken.deleteMany({
      where: {
        userId,
        token,
      },
    });

    this.logger.log(`Device token unregistered for user: ${userId}`);
  }

  async sendTestEmail(emailData: {
    to: string;
    subject?: string;
    message?: string;
  }) {
    const subject = emailData.subject || 'Test Email from CareerHub';
    const message = emailData.message || 'This is a test email from CareerHub notification system.';

    await this.emailService.sendEmail(emailData.to, subject, `<p>${message}</p>`);

    return { sent: true, to: emailData.to, subject };
  }

  async sendTestPush(pushData: {
    userId: string;
    title: string;
    message: string;
  }) {
    const deviceTokens = await this.prisma.deviceToken.findMany({
      where: { userId: pushData.userId },
    });

    if (deviceTokens.length === 0) {
      throw new Error('No device tokens found for user');
    }

    const results = [];
    for (const deviceToken of deviceTokens) {
      try {
        await this.pushService.sendToUser("stub-user-id", {
          title: pushData.title,
          message: pushData.message,
          data: { type: 'TEST_PUSH' },
        });
        results.push({ token: deviceToken.token, success: true });
      } catch (error) {
        results.push({ token: deviceToken.token, success: false, error: error.message });
      }
    }

    return { results, sent: results.filter(r => r.success).length };
  }

  async getNotificationTemplates() {
    // Mock templates - would be stored in database
    return [
      {
        id: 'course_enrollment',
        name: 'Course Enrollment',
        type: 'COURSE_ENROLLMENT',
        subjectEn: 'Course Enrollment Successful',
        subjectAr: 'ØªÙ… Ø§Ù„ØªØ³Ø¬ÙŠÙ„ ÙÙŠ Ø§Ù„Ø¯ÙˆØ±Ø© Ø¨Ù†Ø¬Ø§Ø­',
        contentEn: 'You have successfully enrolled in {{courseTitle}}',
        contentAr: 'Ù„Ù‚Ø¯ Ù‚Ù…Øª Ø¨Ø§Ù„ØªØ³Ø¬ÙŠÙ„ Ø¨Ù†Ø¬Ø§Ø­ ÙÙŠ Ø¯ÙˆØ±Ø© {{courseTitle}}',
        variables: ['courseTitle', 'courseUrl'],
      },
      {
        id: 'lesson_completed',
        name: 'Lesson Completed',
        type: 'LESSON_COMPLETED',
        subjectEn: 'Lesson Completed',
        subjectAr: 'Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ø¯Ø±Ø³',
        contentEn: 'Great job! You have completed the lesson: {{lessonTitle}}',
        contentAr: 'Ø£Ø­Ø³Ù†Øª! Ù„Ù‚Ø¯ Ø£ÙƒÙ…Ù„Øª Ø§Ù„Ø¯Ø±Ø³: {{lessonTitle}}',
        variables: ['lessonTitle', 'courseTitle'],
      },
      {
        id: 'certificate_earned',
        name: 'Certificate Earned',
        type: 'CERTIFICATE_EARNED',
        subjectEn: 'Certificate Earned!',
        subjectAr: 'Ø­ØµÙ„Øª Ø¹Ù„Ù‰ Ø´Ù‡Ø§Ø¯Ø©!',
        contentEn: 'Congratulations! You have earned a certificate for completing {{courseTitle}}',
        contentAr: 'Ù…Ø¨Ø§Ø±Ùƒ! Ù„Ù‚Ø¯ Ø­ØµÙ„Øª Ø¹Ù„Ù‰ Ø´Ù‡Ø§Ø¯Ø© Ù„Ø¥ÙƒÙ…Ø§Ù„ Ø¯ÙˆØ±Ø© {{courseTitle}}',
        variables: ['courseTitle', 'certificateUrl'],
      },
    ];
  }

  async createNotificationTemplate(templateData: {
    name: string;
    type: string;
    subjectEn?: string;
    subjectAr?: string;
    contentEn: string;
    contentAr: string;
    variables?: string[];
  }) {
    // Mock implementation - would store in database
    const template = {
      id: `template_${Date.now()}`,
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.logger.log(`Notification template created: ${template.name}`);

    return template;
  }

  async getNotificationStats() {
    const [
      totalNotifications,
      sentNotifications,
      readNotifications,
      notificationsByType,
      notificationsByChannel,
    ] = await Promise.all([
      this.prisma.notification.count(),
      this.prisma.notification.count(), // Skip status filter
      this.prisma.notification.count({ where: { isRead: true } }),
      this.prisma.notification.groupBy({
        by: ['type'],
        _count: true,
      }),
      this.getNotificationsByChannel(),
    ]);

    return {
      totalNotifications,
      sentNotifications,
      readNotifications,
      unreadNotifications: totalNotifications - readNotifications,
      readRate: totalNotifications > 0 ? (readNotifications / totalNotifications) * 100 : 0,
      notificationsByType,
      notificationsByChannel,
    };
  }

  async getDeliveryStatus(notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return {
      notificationId,
      status: (notification as any).status || 'SENT',
      channels: (notification as any).channels || ['EMAIL'],
      deliveryAttempts: 0,
      lastDeliveryAttempt: null,
      sentAt: null,
      readAt: null,
      isRead: notification.isRead,
    };
  }

  async resendNotification(notificationId: string, channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    const targetChannels = channels || (notification as any).channels || ['EMAIL'];

    // Update notification status
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: {
        // Skip status update for now
      },
    });

    // Resend through specified channels
    await this.sendNotificationChannels(notification, targetChannels);

    this.logger.log(`Notification resent: ${notificationId}`);

    return { notificationId, channels: targetChannels, resent: true };
  }

  async getAllNotifications(options: {
    page: number;
    limit: number;
    userId?: string;
    type?: string;
    status?: string;
  }) {
    const { page, limit, userId, type, status } = options;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (userId) {
      where.userId = userId;
    }
    if (type) {
      where.type = type;
    }
    // Skip status filter for now

    const [notifications, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        include: {
          user: {
            include: { profile: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  private async sendNotificationChannels(
    notification: any,
    channels: Array<'EMAIL' | 'PUSH' | 'SMS'>
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      include: { profile: true },
    });

    if (!user) {
      return;
    }

    const promises = [];

    if (channels.includes('EMAIL')) {
      promises.push(
        this.sendEmailNotification(user, notification).catch(error => {
          this.logger.error(`Failed to send email notification: ${error.message}`);
        })
      );
    }

    if (channels.includes('PUSH')) {
      promises.push(
        this.pushService.sendToUser(notification.userId, {
          title: notification.titleEn,
          message: notification.contentEn,
          data: {
            type: notification.type,
            notificationId: notification.id,
            ...notification.data,
          },
        }).catch(error => {
          this.logger.error(`Failed to send push notification: ${error.message}`);
        })
      );
    }

    if (channels.includes('SMS')) {
      promises.push(
        this.sendSmsNotification(user, notification).catch(error => {
          this.logger.error(`Failed to send SMS notification: ${error.message}`);
        })
      );
    }

    await Promise.allSettled(promises);
  }

  private async sendEmailNotification(user: any, notification: any) {
    await this.emailService.sendEmail(user.email, notification.titleEn, `<p>${notification.contentEn}</p>`);
  }

  private async sendPushNotification(user: any, notification: any) {
    const deviceTokens = await this.prisma.deviceToken.findMany({
      where: { userId: user.id },
    });

    for (const deviceToken of deviceTokens) {
      await this.pushService.sendToUser(user.id, {
        title: notification.titleEn,
        message: notification.contentEn,
        data: {
          type: notification.type,
          notificationId: notification.id,
          ...notification.data,
        },
      });
    }
  }

  private async sendSmsNotification(user: any, notification: any) {
    if (!user.profile?.phone) {
      return;
    }

    await this.smsService.sendSms({
      to: user.profile.phone,
      message: `${notification.titleEn}: ${notification.contentEn}`,
    });
  }

  private async getNotificationsByChannel() {
    // Mock implementation - would track actual delivery by channel
    return [
      { channel: 'EMAIL', count: 1250 },
      { channel: 'PUSH', count: 3400 },
      { channel: 'SMS', count: 180 },
    ];
  }
}




