export declare class EmailService {
    constructor();
    private send;
    private template;
    sendWelcome(email: string, name: string): Promise<void>;
    sendApproval(email: string, name: string, role: string): Promise<void>;
    sendRejection(email: string, name: string, reason?: string): Promise<void>;
    sendCourseApproved(email: string, name: string, courseTitle: string): Promise<void>;
    sendEnrollmentConfirm(email: string, name: string, courseTitle: string): Promise<void>;
    sendCertificate(email: string, name: string, courseTitle: string, certUrl: string): Promise<void>;
    sendSessionConfirmed(email: string, name: string, consultantName: string, date: Date): Promise<void>;
    sendSessionBooking(email: string, consultantName: string, studentName: string, topic: string): Promise<void>;
}
