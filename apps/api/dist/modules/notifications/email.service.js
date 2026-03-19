"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
let EmailService = EmailService_1 = class EmailService {
    constructor() {
        this.logger = new common_1.Logger(EmailService_1.name);
    }
    async sendEmail(to, subject, html) {
        this.logger.log(`Email stub: ${JSON.stringify(to)}`);
        return { success: true, messageId: 'stub-' + Date.now() };
    }
    async sendWelcomeEmail(e, n) { return { success: true }; }
    async sendPasswordReset(e, t) { return { success: true }; }
    async sendPasswordChangedNotification(e, n, l) { return { success: true }; }
    async sendAccountDeletionConfirmation(e, n, l) { return { success: true }; }
    async sendBookingConfirmation(e, d) { return { success: true }; }
    async sendCertificateIssued(e, d) { return { success: true }; }
    async sendCourseEnrollment(e, d) { return { success: true }; }
    async sendPaymentConfirmation(e, d) { return { success: true }; }
    async sendSubscriptionRenewal(e, d) { return { success: true }; }
    async sendSubscriptionRenewalNotification(e, n, d, l) { return { success: true }; }
    async sendBulkEmail(d) { return { success: true, total: 0 }; }
    async sendBulkEmails(e, d) { return { success: true }; }
    async sendSystemNotification(e, d) { return { success: true }; }
    async sendCustomEmail(e, d) { return { success: true }; }
    async sendNewsletter(e, d) { return { success: true }; }
    async sendQuizResult(e, d) { return { success: true }; }
    async sendCourseCompletion(e, d) { return { success: true }; }
    async sendAssignmentFeedback(e, d) { return { success: true }; }
    async testEmailConfiguration() { return { success: true }; }
    async getEmailStats(s, e) { return { sent: 0, delivered: 0 }; }
    async getEmailSettings() { return { smtp: 'stub' }; }
    async updateEmailSettings(d) { return { success: true }; }
    async getEmailTemplate(id) { return { id, html: '' }; }
    async updateEmailTemplate(id, d) { return { success: true }; }
    async deleteEmailTemplate(id) { return { success: true }; }
    async listEmailTemplates() { return { templates: [] }; }
    async getEmailLogs(o) { return { logs: [] }; }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)()
], EmailService);
