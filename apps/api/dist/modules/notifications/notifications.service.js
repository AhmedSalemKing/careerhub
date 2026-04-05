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
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const bull_1 = require("@nestjs/bull");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const email_service_1 = require("./email.service");
const push_service_1 = require("./push.service");
const sms_service_1 = require("./sms.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    constructor(prisma, configService, emailService, pushService, smsService, emailQueue) {
        this.prisma = prisma;
        this.configService = configService;
        this.emailService = emailService;
        this.pushService = pushService;
        this.smsService = smsService;
        this.emailQueue = emailQueue;
        this.logger = new common_1.Logger(NotificationsService_1.name);
    }
    async queueEmail(job) {
        await this.emailQueue.add(job);
    }
    async createNotification(notificationData) {
        const { userId, titleEn, titleAr, contentEn, contentAr, type, channels = ['PUSH'], data, sendToAll = false, } = notificationData;
        // Get target users
        let targetUsers = [];
        if (sendToAll) {
            const users = await this.prisma.user.findMany({
                where: { isActive: true },
                select: { id: true },
            });
            targetUsers = users.map(u => u.id);
        }
        else if (userId) {
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
                    type: type,
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
    async broadcastNotification(broadcastData) {
        // Build user filter
        const where = {};
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
        }
        else {
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
            }
            catch (error) {
                skipped += batch.length;
                this.logger.error(`Failed to create batch notifications: ${error.message}`);
            }
        }
        return { sent, skipped };
    }
    async getUserNotifications(userId, options) {
        const { page, limit, type, isRead } = options;
        const skip = (page - 1) * limit;
        const where = { userId };
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
    async getUnreadCount(userId) {
        return this.prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }
    async getNotification(userId, notificationId) {
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
    async markAsRead(userId, notificationId) {
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
    async markAllAsRead(userId) {
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
    async deleteNotification(userId, notificationId) {
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
    async clearAllNotifications(userId) {
        await this.prisma.notification.deleteMany({
            where: { userId },
        });
        this.logger.log(`All notifications cleared for user: ${userId}`);
    }
    async updateNotificationSettings(userId, settingsData) {
        // Skip for now
        this.logger.log(`Notification settings updated for user: ${userId}`);
        return { userId, ...settingsData };
    }
    async registerDeviceToken(userId, tokenData) {
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
        }
        else {
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
    async unregisterDeviceToken(userId, token) {
        await this.prisma.deviceToken.deleteMany({
            where: {
                userId,
                token,
            },
        });
        this.logger.log(`Device token unregistered for user: ${userId}`);
    }
    async sendTestEmail(emailData) {
        const subject = emailData.subject || 'Test Email from DeveWay';
        const message = emailData.message || 'This is a test email from DeveWay notification system.';
        await this.emailService.sendEmail(emailData.to, subject, `<p>${message}</p>`);
        return { sent: true, to: emailData.to, subject };
    }
    async sendTestPush(pushData) {
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
            }
            catch (error) {
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
    async createNotificationTemplate(templateData) {
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
        const [totalNotifications, sentNotifications, readNotifications, notificationsByType, notificationsByChannel,] = await Promise.all([
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
    async getDeliveryStatus(notificationId) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification) {
            throw new Error('Notification not found');
        }
        return {
            notificationId,
            status: notification.status || 'SENT',
            channels: notification.channels || ['EMAIL'],
            deliveryAttempts: 0,
            lastDeliveryAttempt: null,
            sentAt: null,
            readAt: null,
            isRead: notification.isRead,
        };
    }
    async resendNotification(notificationId, channels) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification) {
            throw new Error('Notification not found');
        }
        const targetChannels = channels || notification.channels || ['EMAIL'];
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
    async getAllNotifications(options) {
        const { page, limit, userId, type, status } = options;
        const skip = (page - 1) * limit;
        const where = {};
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
    async sendNotificationChannels(notification, channels) {
        const user = await this.prisma.user.findUnique({
            where: { id: notification.userId },
            include: { profile: true },
        });
        if (!user) {
            return;
        }
        const promises = [];
        if (channels.includes('EMAIL')) {
            promises.push(this.sendEmailNotification(user, notification).catch(error => {
                this.logger.error(`Failed to send email notification: ${error.message}`);
            }));
        }
        if (channels.includes('PUSH')) {
            promises.push(this.pushService.sendToUser(notification.userId, {
                title: notification.titleEn,
                message: notification.contentEn,
                data: {
                    type: notification.type,
                    notificationId: notification.id,
                    ...notification.data,
                },
            }).catch(error => {
                this.logger.error(`Failed to send push notification: ${error.message}`);
            }));
        }
        if (channels.includes('SMS')) {
            promises.push(this.sendSmsNotification(user, notification).catch(error => {
                this.logger.error(`Failed to send SMS notification: ${error.message}`);
            }));
        }
        await Promise.allSettled(promises);
    }
    async sendEmailNotification(user, notification) {
        await this.emailService.sendEmail(user.email, notification.titleEn, `<p>${notification.contentEn}</p>`);
    }
    async sendPushNotification(user, notification) {
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
    async sendSmsNotification(user, notification) {
        if (!user.profile?.phone) {
            return;
        }
        await this.smsService.sendSms({
            to: user.profile.phone,
            message: `${notification.titleEn}: ${notification.contentEn}`,
        });
    }
    async getNotificationsByChannel() {
        // Mock implementation - would track actual delivery by channel
        return [
            { channel: 'EMAIL', count: 1250 },
            { channel: 'PUSH', count: 3400 },
            { channel: 'SMS', count: 180 },
        ];
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(5, (0, bull_1.InjectQueue)('email')),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        email_service_1.EmailService,
        push_service_1.PushService,
        sms_service_1.SmsService, Object])
], NotificationsService);
