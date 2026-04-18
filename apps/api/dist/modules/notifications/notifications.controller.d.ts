import { NotificationsService } from './notifications.service';
import { User } from '@prisma/client';
export declare class NotificationsController {
    private readonly notificationsService;
    constructor(notificationsService: NotificationsService);
    getNotifications(user: User, page?: number, limit?: number, type?: string, isRead?: boolean): Promise<{
        success: boolean;
        data: {
            notifications: {
                type: import(".prisma/client").$Enums.NotificationType;
                data: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                id: string;
                titleEn: string;
                titleAr: string;
                userId: string;
                contentEn: string;
                contentAr: string;
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
        };
    }>;
    getUnreadCount(user: User): Promise<{
        success: boolean;
        data: {
            count: number;
        };
    }>;
    getNotification(user: User, id: string): Promise<{
        success: boolean;
        data: {
            notification: {
                type: import(".prisma/client").$Enums.NotificationType;
                data: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                id: string;
                titleEn: string;
                titleAr: string;
                userId: string;
                contentEn: string;
                contentAr: string;
                isRead: boolean;
            };
        };
    }>;
    markAsRead(user: User, id: string): Promise<{
        success: boolean;
        message: string;
    }>;
    markAllAsRead(user: User): Promise<{
        success: boolean;
        message: string;
    }>;
    deleteNotification(user: User, id: string): Promise<void>;
    clearAllNotifications(user: User): Promise<void>;
    sendNotification(notificationData: {
        userId?: string;
        titleEn: string;
        titleAr: string;
        contentEn: string;
        contentAr: string;
        type: string;
        channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>;
        data?: Record<string, any>;
        sendToAll?: boolean;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            notification: any[];
        };
    }>;
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
        success: boolean;
        message: string;
        data: {
            sent: number;
            skipped: number;
        };
    }>;
    getNotificationSettings(user: User): Promise<{
        success: boolean;
        data: {
            settings: {
                notifications: {
                    type: import(".prisma/client").$Enums.NotificationType;
                    data: import("@prisma/client/runtime/library").JsonValue | null;
                    createdAt: Date;
                    id: string;
                    titleEn: string;
                    titleAr: string;
                    userId: string;
                    contentEn: string;
                    contentAr: string;
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
            };
        };
    }>;
    updateNotificationSettings(user: User, settingsData: {
        emailEnabled?: boolean;
        pushEnabled?: boolean;
        smsEnabled?: boolean;
        preferences?: Record<string, boolean>;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            settings: {
                emailEnabled?: boolean;
                pushEnabled?: boolean;
                smsEnabled?: boolean;
                preferences?: Record<string, boolean>;
                userId: string;
            };
        };
    }>;
    registerDeviceToken(user: User, tokenData: {
        token: string;
        platform: 'ios' | 'android' | 'web';
        deviceId?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    unregisterDeviceToken(user: User, token: string): Promise<void>;
    sendTestEmail(emailData: {
        to: string;
        subject?: string;
        message?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            sent: boolean;
            to: string;
            subject: string;
        };
    }>;
    sendTestPush(pushData: {
        userId: string;
        title: string;
        message: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            results: any[];
            sent: number;
        };
    }>;
    getNotificationTemplates(): Promise<{
        success: boolean;
        data: {
            templates: {
                id: string;
                name: string;
                type: string;
                subjectEn: string;
                subjectAr: string;
                contentEn: string;
                contentAr: string;
                variables: string[];
            }[];
        };
    }>;
    createNotificationTemplate(templateData: {
        name: string;
        type: string;
        subjectEn?: string;
        subjectAr?: string;
        contentEn: string;
        contentAr: string;
        variables?: string[];
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            template: {
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
            };
        };
    }>;
    getNotificationStats(): Promise<{
        success: boolean;
        data: {
            stats: {
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
            };
        };
    }>;
    getDeliveryStatus(notificationId: string): Promise<{
        success: boolean;
        data: {
            status: {
                notificationId: string;
                status: any;
                channels: any;
                deliveryAttempts: number;
                lastDeliveryAttempt: any;
                sentAt: any;
                readAt: any;
                isRead: boolean;
            };
        };
    }>;
    resendNotification(notificationId: string, resendData: {
        channels?: Array<'EMAIL' | 'PUSH' | 'SMS'>;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            notificationId: string;
            channels: any;
            resent: boolean;
        };
    }>;
    getAllNotifications(page?: number, limit?: number, userId?: string, type?: string, status?: string): Promise<{
        success: boolean;
        data: {
            notifications: ({
                user: {
                    profile: {
                        createdAt: Date;
                        id: string;
                        updatedAt: Date;
                        userId: string;
                        bio: string | null;
                        linkedinUrl: string | null;
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
                    createdAt: Date;
                    id: string;
                    status: string;
                    updatedAt: Date;
                    email: string;
                    password: string;
                    role: import(".prisma/client").$Enums.UserRole;
                    isActive: boolean;
                    accountType: string;
                    cvUrl: string | null;
                    bio: string | null;
                    experience: number | null;
                    speciality: string | null;
                    linkedinUrl: string | null;
                    hourlyRate: number | null;
                    meetingMethod: string | null;
                    stripeCustomerId: string | null;
                    approvedAt: Date | null;
                    rejectedAt: Date | null;
                    rejectedReason: string | null;
                    lastSeenAt: Date | null;
                    deletedAt: Date | null;
                };
            } & {
                type: import(".prisma/client").$Enums.NotificationType;
                data: import("@prisma/client/runtime/library").JsonValue | null;
                createdAt: Date;
                id: string;
                titleEn: string;
                titleAr: string;
                userId: string;
                contentEn: string;
                contentAr: string;
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
        };
    }>;
}
