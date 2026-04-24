import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from './email.service';
import { PushService } from './push.service';
import { SmsService } from './sms.service';
import { EmailJob } from './email.types';
export declare class NotificationsService {
    private prisma;
    private configService;
    private emailService;
    private pushService;
    private smsService;
    private readonly emailQueue;
    private readonly logger;
    constructor(prisma: PrismaService, configService: ConfigService, emailService: EmailService, pushService: PushService, smsService: SmsService, emailQueue: Queue);
    queueEmail(job: EmailJob): Promise<void>;
    createNotification(notificationData: {
        userId?: string;
        titleEn: string;
        titleAr: string;
        contentEn: string;
        contentAr: string;
        type: string;
        channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>;
        data?: Record<string, any>;
        sendToAll?: boolean;
    }): Promise<any[]>;
    broadcastNotification(broadcastData: {
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
    }): Promise<{
        sent: number;
        skipped: number;
    }>;
    getUserNotifications(userId: string, options: {
        page: number;
        limit: number;
        type?: string;
        isRead?: boolean;
    }): Promise<{
        notifications: {
            data: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            userId: string;
            titleEn: string;
            titleAr: string;
            contentEn: string;
            contentAr: string;
            type: import(".prisma/client").$Enums.NotificationType;
            isRead: boolean;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    getUnreadCount(userId: string): Promise<number>;
    getNotification(userId: string, notificationId: string): Promise<{
        data: import("@prisma/client/runtime/library").JsonValue | null;
        id: string;
        createdAt: Date;
        userId: string;
        titleEn: string;
        titleAr: string;
        contentEn: string;
        contentAr: string;
        type: import(".prisma/client").$Enums.NotificationType;
        isRead: boolean;
    }>;
    markAsRead(userId: string, notificationId: string): Promise<void>;
    markAllAsRead(userId: string): Promise<void>;
    deleteNotification(userId: string, notificationId: string): Promise<void>;
    clearAllNotifications(userId: string): Promise<void>;
    updateNotificationSettings(userId: string, settingsData: {
        emailEnabled?: boolean;
        pushEnabled?: boolean;
        smsEnabled?: boolean;
        preferences?: Record<string, boolean>;
    }): Promise<{
        emailEnabled?: boolean;
        pushEnabled?: boolean;
        smsEnabled?: boolean;
        preferences?: Record<string, boolean>;
        userId: string;
    }>;
    registerDeviceToken(userId: string, tokenData: {
        token: string;
        platform: 'ios' | 'android' | 'web';
        deviceId?: string;
    }): Promise<void>;
    unregisterDeviceToken(userId: string, token: string): Promise<void>;
    sendTestEmail(emailData: {
        to: string;
        subject?: string;
        message?: string;
    }): Promise<{
        sent: boolean;
        to: string;
        subject: string;
    }>;
    sendTestPush(pushData: {
        userId: string;
        title: string;
        message: string;
    }): Promise<{
        results: any[];
        sent: number;
    }>;
    getNotificationTemplates(): Promise<{
        id: string;
        name: string;
        type: string;
        subjectEn: string;
        subjectAr: string;
        contentEn: string;
        contentAr: string;
        variables: string[];
    }[]>;
    createNotificationTemplate(templateData: {
        name: string;
        type: string;
        subjectEn?: string;
        subjectAr?: string;
        contentEn: string;
        contentAr: string;
        variables?: string[];
    }): Promise<{
        createdAt: Date;
        updatedAt: Date;
        name: string;
        type: string;
        subjectEn?: string;
        subjectAr?: string;
        contentEn: string;
        contentAr: string;
        variables?: string[];
        id: string;
    }>;
    getNotificationStats(): Promise<{
        totalNotifications: number;
        sentNotifications: number;
        readNotifications: number;
        unreadNotifications: number;
        readRate: number;
        notificationsByType: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.NotificationGroupByOutputType, "type"[]> & {
            _count: number;
        })[];
        notificationsByChannel: {
            channel: string;
            count: number;
        }[];
    }>;
    getDeliveryStatus(notificationId: string): Promise<{
        notificationId: string;
        status: any;
        channels: any;
        deliveryAttempts: number;
        lastDeliveryAttempt: any;
        sentAt: any;
        readAt: any;
        isRead: boolean;
    }>;
    resendNotification(notificationId: string, channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>): Promise<{
        notificationId: string;
        channels: any;
        resent: boolean;
    }>;
    getAllNotifications(options: {
        page: number;
        limit: number;
        userId?: string;
        type?: string;
        status?: string;
    }): Promise<{
        notifications: ({
            user: {
                profile: {
                    id: string;
                    createdAt: Date;
                    userId: string;
                    bio: string | null;
                    linkedinUrl: string | null;
                    updatedAt: Date;
                    firstName: string;
                    lastName: string;
                    phone: string | null;
                    dateOfBirth: Date | null;
                    gender: import(".prisma/client").$Enums.Gender | null;
                    nationality: string | null;
                    country: string | null;
                    city: string | null;
                    avatar: string | null;
                    timezone: string;
                    language: string;
                };
            } & {
                id: string;
                createdAt: Date;
                email: string;
                googleId: string | null;
                password: string;
                role: import(".prisma/client").$Enums.UserRole;
                isActive: boolean;
                accountType: string;
                status: string;
                cvUrl: string | null;
                bio: string | null;
                experience: number | null;
                speciality: string | null;
                linkedinUrl: string | null;
                hourlyRate: number | null;
                meetingMethod: string | null;
                provider: string;
                stripeCustomerId: string | null;
                approvedAt: Date | null;
                rejectedAt: Date | null;
                rejectedReason: string | null;
                lastSeenAt: Date | null;
                idVerificationStatus: string;
                idFrontUrl: string | null;
                idBackUrl: string | null;
                idVerifiedAt: Date | null;
                idRejectedReason: string | null;
                isVerified: boolean;
                walletBalance: number;
                updatedAt: Date;
                deletedAt: Date | null;
            };
        } & {
            data: import("@prisma/client/runtime/library").JsonValue | null;
            id: string;
            createdAt: Date;
            userId: string;
            titleEn: string;
            titleAr: string;
            contentEn: string;
            contentAr: string;
            type: import(".prisma/client").$Enums.NotificationType;
            isRead: boolean;
        })[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    private sendNotificationChannels;
    private sendEmailNotification;
    private sendPushNotification;
    private sendSmsNotification;
    private getNotificationsByChannel;
}
