import { ConfigService } from '@nestjs/config';
export declare class SmsService {
    private configService;
    private readonly logger;
    private readonly apiKey;
    private readonly apiSecret;
    private readonly sender;
    private readonly provider;
    constructor(configService: ConfigService);
    sendSms(smsData: {
        to: string;
        message: string;
        countryCode?: string;
        priority?: 'high' | 'normal';
        scheduleTime?: Date;
    }): Promise<{
        success: boolean;
        messageId: any;
        to: string;
        sentAt: Date;
        provider: string;
    }>;
    sendBulkSms(bulkData: {
        recipients: Array<{
            to: string;
            message?: string;
            countryCode?: string;
        }>;
        message?: string;
        priority?: 'high' | 'normal';
        delay?: number;
    }): Promise<{
        total: number;
        successful: number;
        failed: number;
        results: any[];
    }>;
    sendVerificationCode(phoneNumber: string, code: string, language?: string): Promise<{
        success: boolean;
        messageId: any;
        to: string;
        sentAt: Date;
        provider: string;
    }>;
    sendPasswordResetSms(phoneNumber: string, resetToken: string, language?: string): Promise<{
        success: boolean;
        messageId: any;
        to: string;
        sentAt: Date;
        provider: string;
    }>;
    sendAppointmentReminder(phoneNumber: string, appointmentData: {
        serviceName: string;
        dateTime: Date;
        location?: string;
    }, language?: string): Promise<{
        success: boolean;
        messageId: any;
        to: string;
        sentAt: Date;
        provider: string;
    }>;
    sendCourseUpdateSms(phoneNumber: string, courseData: {
        courseTitle: string;
        updateType: 'NEW_LESSON' | 'ASSIGNMENT' | 'ANNOUNCEMENT';
        updateTitle: string;
    }, language?: string): Promise<{
        success: boolean;
        messageId: any;
        to: string;
        sentAt: Date;
        provider: string;
    }>;
    sendPaymentConfirmationSms(phoneNumber: string, paymentData: {
        amount: number;
        currency: string;
        itemName: string;
    }, language?: string): Promise<{
        success: boolean;
        messageId: any;
        to: string;
        sentAt: Date;
        provider: string;
    }>;
    sendMarketingSms(phoneNumber: string, campaignData: {
        campaignName: string;
        message: string;
        unsubscribeKeyword?: string;
    }, language?: string): Promise<{
        success: boolean;
        messageId: any;
        to: string;
        sentAt: Date;
        provider: string;
    }>;
    getSmsDeliveryStatus(messageId: string): Promise<any>;
    getSmsStats(startDate?: Date, endDate?: Date): Promise<{
        totalSent: number;
        totalDelivered: number;
        totalFailed: number;
        deliveryRate: number;
        averageCost: number;
        totalCost: number;
        period: {
            startDate: Date;
            endDate: Date;
        };
    }>;
    validatePhoneNumber(phoneNumber: string): Promise<boolean>;
    formatPhoneNumber(phoneNumber: string, countryCode?: string): Promise<string>;
    testSmsConfiguration(): Promise<boolean>;
    private sendViaTwilio;
    private sendViaMessageBird;
    private sendViaNexmo;
    private getTwilioDeliveryStatus;
    private getMessageBirdDeliveryStatus;
    private getNexmoDeliveryStatus;
    handleWebhook(webhookData: any, provider: string): Promise<{
        messageId: any;
        status: any;
        recipient: any;
    } | {
        messageId: any;
        status: any;
        from: any;
        to: any;
    }>;
    private handleTwilioWebhook;
    private handleMessageBirdWebhook;
    private handleNexmoWebhook;
}
