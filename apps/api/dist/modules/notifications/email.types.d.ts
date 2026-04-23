export type EmailTemplate = 'welcome' | 'password-reset' | 'enrollment-confirmation' | 'session-booking';
export interface EmailJob {
    to: string;
    template: EmailTemplate;
    context: Record<string, string>;
}
export declare const EMAIL_SUBJECTS: Record<EmailTemplate, string>;
