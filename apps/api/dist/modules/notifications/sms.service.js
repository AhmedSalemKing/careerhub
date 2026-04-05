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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var SmsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let SmsService = SmsService_1 = class SmsService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SmsService_1.name);
        this.provider = this.configService.get('SMS_PROVIDER') || 'twilio';
        this.apiKey = this.configService.get('SMS_API_KEY');
        this.apiSecret = this.configService.get('SMS_API_SECRET');
        this.sender = this.configService.get('SMS_SENDER') || 'DeveWay';
    }
    async sendSms(smsData) {
        try {
            let result;
            switch (this.provider.toLowerCase()) {
                case 'twilio':
                    result = await this.sendViaTwilio(smsData);
                    break;
                case 'messagebird':
                    result = await this.sendViaMessageBird(smsData);
                    break;
                case 'nexmo':
                    result = await this.sendViaNexmo(smsData);
                    break;
                default:
                    throw new Error(`Unsupported SMS provider: ${this.provider}`);
            }
            this.logger.log(`SMS sent successfully to ${smsData.to}: ${result.messageId}`);
            return {
                success: true,
                messageId: result.messageId,
                to: smsData.to,
                sentAt: new Date(),
                provider: this.provider,
            };
        }
        catch (error) {
            this.logger.error(`Failed to send SMS to ${smsData.to}: ${error.message}`);
            throw new Error('Failed to send SMS');
        }
    }
    async sendBulkSms(bulkData) {
        const results = [];
        const delay = bulkData.delay || 1000; // Default 1 second delay for SMS
        for (const recipient of bulkData.recipients) {
            try {
                const message = recipient.message || bulkData.message;
                if (!message) {
                    results.push({ to: recipient.to, success: false, error: 'No message provided' });
                    continue;
                }
                const result = await this.sendSms({
                    to: recipient.to,
                    message,
                    countryCode: recipient.countryCode,
                    priority: bulkData.priority,
                });
                results.push({ to: recipient.to, success: true, messageId: result.messageId });
            }
            catch (error) {
                results.push({ to: recipient.to, success: false, error: error.message });
            }
            // Add delay to avoid rate limiting
            if (delay > 0) {
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        this.logger.log(`Bulk SMS sent: ${successful} successful, ${failed} failed`);
        return {
            total: bulkData.recipients.length,
            successful,
            failed,
            results,
        };
    }
    async sendVerificationCode(phoneNumber, code, language = 'en') {
        const message = language === 'ar'
            ? `رمز التحقق الخاص بـ DeveWay هو: ${code}. صالح لمدة 5 دقائق.`
            : `Your DeveWay verification code is: ${code}. Valid for 5 minutes.`;
        return this.sendSms({
            to: phoneNumber,
            message,
            priority: 'high',
        });
    }
    async sendPasswordResetSms(phoneNumber, resetToken, language = 'en') {
        const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
        const message = language === 'ar'
            ? ` DeveWay: إعادة تعيين كلمة المرور. استخدم الرابط: ${resetUrl}`
            : `DeveWay: Password reset. Use this link: ${resetUrl}`;
        return this.sendSms({
            to: phoneNumber,
            message,
            priority: 'high',
        });
    }
    async sendAppointmentReminder(phoneNumber, appointmentData, language = 'en') {
        const formattedDate = appointmentData.dateTime.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
        const location = appointmentData.location ? ` at ${appointmentData.location}` : '';
        const message = language === 'ar'
            ? `تذكير من DeveWay: لديك موعد ${appointmentData.serviceName} في ${formattedDate}${location}`
            : `Reminder from DeveWay: You have an appointment for ${appointmentData.serviceName} at ${formattedDate}${location}`;
        return this.sendSms({
            to: phoneNumber,
            message,
            priority: 'high',
        });
    }
    async sendCourseUpdateSms(phoneNumber, courseData, language = 'en') {
        const updateTypeText = {
            'NEW_LESSON': language === 'ar' ? 'درس جديد' : 'New lesson',
            'ASSIGNMENT': language === 'ar' ? 'واجب جديد' : 'New assignment',
            'ANNOUNCEMENT': language === 'ar' ? 'إعلان' : 'Announcement',
        };
        const message = language === 'ar'
            ? `DeveWay: ${updateTypeText[courseData.updateType]} في دورة ${courseData.courseTitle}: ${courseData.updateTitle}`
            : `DeveWay: ${updateTypeText[courseData.updateType]} in ${courseData.courseTitle}: ${courseData.updateTitle}`;
        return this.sendSms({
            to: phoneNumber,
            message,
        });
    }
    async sendPaymentConfirmationSms(phoneNumber, paymentData, language = 'en') {
        const message = language === 'ar'
            ? `DeveWay: تم تأكيد دفعتك بمبلغ ${paymentData.amount} ${paymentData.currency} لشراء ${paymentData.itemName}`
            : `DeveWay: Your payment of ${paymentData.amount} ${paymentData.currency} for ${paymentData.itemName} has been confirmed`;
        return this.sendSms({
            to: phoneNumber,
            message,
            priority: 'high',
        });
    }
    async sendMarketingSms(phoneNumber, campaignData, language = 'en') {
        const unsubscribeText = campaignData.unsubscribeKeyword
            ? (language === 'ar' ? ` أرسل ${campaignData.unsubscribeKeyword} لإلغاء الاشتراك` : ` Reply ${campaignData.unsubscribeKeyword} to unsubscribe`)
            : '';
        const message = `${campaignData.message}${unsubscribeText}`;
        return this.sendSms({
            to: phoneNumber,
            message,
            priority: 'normal',
        });
    }
    async getSmsDeliveryStatus(messageId) {
        try {
            let status;
            switch (this.provider.toLowerCase()) {
                case 'twilio':
                    status = await this.getTwilioDeliveryStatus(messageId);
                    break;
                case 'messagebird':
                    status = await this.getMessageBirdDeliveryStatus(messageId);
                    break;
                case 'nexmo':
                    status = await this.getNexmoDeliveryStatus(messageId);
                    break;
                default:
                    throw new Error(`Unsupported SMS provider: ${this.provider}`);
            }
            return status;
        }
        catch (error) {
            this.logger.error(`Failed to get SMS delivery status: ${error.message}`);
            throw new Error('Failed to get delivery status');
        }
    }
    async getSmsStats(startDate, endDate) {
        // Mock implementation - would integrate with SMS provider analytics
        return {
            totalSent: 1250,
            totalDelivered: 1180,
            totalFailed: 70,
            deliveryRate: 94.4,
            averageCost: 0.045,
            totalCost: 56.25,
            period: {
                startDate,
                endDate,
            },
        };
    }
    async validatePhoneNumber(phoneNumber) {
        try {
            // Basic phone number validation
            const phoneRegex = /^\+?[1-9]\d{1,14}$/;
            return phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''));
        }
        catch (error) {
            return false;
        }
    }
    async formatPhoneNumber(phoneNumber, countryCode = 'US') {
        try {
            // Remove all non-digit characters
            let cleaned = phoneNumber.replace(/\D/g, '');
            // Add country code if missing
            if (!cleaned.startsWith('+')) {
                const countryCodes = {
                    'US': '1',
                    'GB': '44',
                    'AE': '971',
                    'SA': '966',
                    'EG': '20',
                };
                const code = countryCodes[countryCode.toUpperCase()];
                if (code && !cleaned.startsWith(code)) {
                    cleaned = code + cleaned;
                }
                cleaned = '+' + cleaned;
            }
            return cleaned;
        }
        catch (error) {
            throw new Error('Failed to format phone number');
        }
    }
    async testSmsConfiguration() {
        try {
            // Send a test SMS to validate configuration
            const testNumber = this.configService.get('SMS_TEST_NUMBER');
            if (!testNumber) {
                this.logger.warn('No test number configured for SMS');
                return false;
            }
            await this.sendSms({
                to: testNumber,
                message: 'Test SMS from DeveWay',
            });
            return true;
        }
        catch (error) {
            this.logger.error('SMS configuration test failed', error);
            return false;
        }
    }
    async sendViaTwilio(smsData) {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.apiKey}/Messages.json`;
        const data = {
            From: this.sender,
            To: smsData.to,
            Body: smsData.message,
            Priority: smsData.priority || 'normal',
            ScheduleTime: smsData.scheduleTime?.toISOString(),
        };
        const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
        const response = await axios_1.default.post(url, data, {
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });
        return {
            messageId: response.data.sid,
            status: response.data.status,
        };
    }
    async sendViaMessageBird(smsData) {
        const url = 'https://rest.messagebird.com/messages';
        const data = {
            originator: this.sender,
            recipients: [smsData.to],
            body: smsData.message,
            priority: smsData.priority || 'normal',
            scheduledDatetime: smsData.scheduleTime?.toISOString(),
        };
        const response = await axios_1.default.post(url, data, {
            headers: {
                'Authorization': `AccessKey ${this.apiKey}`,
                'Content-Type': 'application/json',
            },
        });
        return {
            messageId: response.data.id,
            status: response.data.status,
        };
    }
    async sendViaNexmo(smsData) {
        const url = 'https://rest.nexmo.com/sms/json';
        const data = {
            from: this.sender,
            to: smsData.to,
            text: smsData.message,
            'message-class': smsData.priority === 'high' ? '0' : '1',
            'schedule-time': smsData.scheduleTime?.toISOString(),
        };
        const response = await axios_1.default.post(url, data, {
            auth: {
                username: this.apiKey,
                password: this.apiSecret,
            },
        });
        return {
            messageId: response.data.messages[0]['message-id'],
            status: response.data.messages[0].status,
        };
    }
    async getTwilioDeliveryStatus(messageId) {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${this.apiKey}/Messages/${messageId}.json`;
        const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');
        const response = await axios_1.default.get(url, {
            headers: {
                'Authorization': `Basic ${auth}`,
            },
        });
        return {
            messageId: response.data.sid,
            status: response.data.status,
            errorCode: response.data.error_code,
            errorMessage: response.data.error_message,
            dateCreated: response.data.date_created,
            dateUpdated: response.data.date_updated,
        };
    }
    async getMessageBirdDeliveryStatus(messageId) {
        const url = `https://rest.messagebird.com/messages/${messageId}`;
        const response = await axios_1.default.get(url, {
            headers: {
                'Authorization': `AccessKey ${this.apiKey}`,
            },
        });
        return {
            messageId: response.data.id,
            status: response.data.status,
            recipient: response.data.recipients[0]?.status,
            dateCreated: response.data.createdDatetime,
            dateUpdated: response.data.updatedDatetime,
        };
    }
    async getNexmoDeliveryStatus(messageId) {
        const url = 'https://rest.nexmo.com/search/message';
        const response = await axios_1.default.get(url, {
            params: { id: messageId },
            auth: {
                username: this.apiKey,
                password: this.apiSecret,
            },
        });
        return {
            messageId: response.data.messages[0]['message-id'],
            status: response.data.messages[0].status,
            network: response.data.messages[0].network,
            dateReceived: response.data.messages[0]['date-received'],
            finalStatus: response.data.messages[0]['final-status'],
        };
    }
    async handleWebhook(webhookData, provider) {
        this.logger.log(`Received SMS webhook from ${provider}`);
        switch (provider.toLowerCase()) {
            case 'twilio':
                return this.handleTwilioWebhook(webhookData);
            case 'messagebird':
                return this.handleMessageBirdWebhook(webhookData);
            case 'nexmo':
                return this.handleNexmoWebhook(webhookData);
            default:
                throw new Error(`Unsupported webhook provider: ${provider}`);
        }
    }
    handleTwilioWebhook(webhookData) {
        // Handle Twilio webhook for delivery status and replies
        return {
            messageId: webhookData.MessageSid,
            status: webhookData.MessageStatus,
            from: webhookData.From,
            to: webhookData.To,
            body: webhookData.Body,
        };
    }
    handleMessageBirdWebhook(webhookData) {
        // Handle MessageBird webhook
        return {
            messageId: webhookData.message?.id,
            status: webhookData.message?.status,
            recipient: webhookData.message?.recipients?.[0],
        };
    }
    handleNexmoWebhook(webhookData) {
        // Handle Nexmo webhook
        return {
            messageId: webhookData['message-id'],
            status: webhookData.status,
            from: webhookData.from,
            to: webhookData.to,
        };
    }
};
exports.SmsService = SmsService;
exports.SmsService = SmsService = SmsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SmsService);
