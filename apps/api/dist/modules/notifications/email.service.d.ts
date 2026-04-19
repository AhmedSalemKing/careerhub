export declare class EmailService {
    private readonly logger;
    sendEmail(to: any, subject?: any, html?: any): Promise<{
        success: boolean;
        messageId: string;
    }>;
    sendWelcomeEmail(e: any, n?: any): Promise<{
        success: boolean;
    }>;
    sendPasswordReset(e: any, t?: any): Promise<{
        success: boolean;
    }>;
    sendPasswordChangedNotification(e: any, n?: any, l?: any): Promise<{
        success: boolean;
    }>;
    sendAccountDeletionConfirmation(e: any, n?: any, l?: any): Promise<{
        success: boolean;
    }>;
    sendBookingConfirmation(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendCertificateIssued(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendCourseEnrollment(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendPaymentConfirmation(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendSubscriptionRenewal(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendSubscriptionRenewalNotification(e: any, n?: any, d?: any, l?: any): Promise<{
        success: boolean;
    }>;
    sendBulkEmail(d: any): Promise<{
        success: boolean;
        total: number;
    }>;
    sendBulkEmails(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendSystemNotification(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendCustomEmail(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendNewsletter(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendQuizResult(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendCourseCompletion(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    sendAssignmentFeedback(e: any, d?: any): Promise<{
        success: boolean;
    }>;
    testEmailConfiguration(): Promise<{
        success: boolean;
    }>;
    getEmailStats(s?: any, e?: any): Promise<{
        sent: number;
        delivered: number;
    }>;
    getEmailSettings(): Promise<{
        smtp: string;
    }>;
    updateEmailSettings(d: any): Promise<{
        success: boolean;
    }>;
    getEmailTemplate(id: any): Promise<{
        id: any;
        html: string;
    }>;
    updateEmailTemplate(id: any, d: any): Promise<{
        success: boolean;
    }>;
    deleteEmailTemplate(id: any): Promise<{
        success: boolean;
    }>;
    listEmailTemplates(): Promise<{
        templates: any[];
    }>;
    getEmailLogs(o: any): Promise<{
        logs: any[];
    }>;
}
