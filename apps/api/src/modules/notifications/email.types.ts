export type EmailTemplate = 'welcome' | 'password-reset' | 'enrollment-confirmation' | 'session-booking';

export interface EmailJob {
  to: string;
  template: EmailTemplate;
  context: Record<string, string>;
}

export const EMAIL_SUBJECTS: Record<EmailTemplate, string> = {
  'welcome': 'Welcome to CareerHub',
  'password-reset': 'Reset your password',
  'enrollment-confirmation': 'You are now enrolled in your course',
  'session-booking': 'Your coaching session is confirmed',
};
