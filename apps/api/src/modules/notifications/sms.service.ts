import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);
  private readonly apiKey: string;
  private readonly apiSecret: string;
  private readonly sender: string;
  private readonly provider: string;

  constructor(private configService: ConfigService) {
    this.provider = this.configService.get('SMS_PROVIDER') || 'twilio';
    this.apiKey = this.configService.get('SMS_API_KEY');
    this.apiSecret = this.configService.get('SMS_API_SECRET');
    this.sender = this.configService.get('SMS_SENDER') || 'CareerHub';
  }

  async sendSms(smsData: {
    to: string;
    message: string;
    countryCode?: string;
    priority?: 'high' | 'normal';
    scheduleTime?: Date;
  }) {
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
    } catch (error) {
      this.logger.error(`Failed to send SMS to ${smsData.to}: ${error.message}`);
      throw new Error('Failed to send SMS');
    }
  }

  async sendBulkSms(bulkData: {
    recipients: Array<{
      to: string;
      message?: string;
      countryCode?: string;
    }>;
    message?: string; // Default message if not provided per recipient
    priority?: 'high' | 'normal';
    delay?: number; // Delay between sends in milliseconds
  }) {
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
      } catch (error) {
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

  async sendVerificationCode(phoneNumber: string, code: string, language: string = 'en') {
    const message = language === 'ar' 
      ? `رمز التحقق الخاص بـ CareerHub هو: ${code}. صالح لمدة 5 دقائق.`
      : `Your CareerHub verification code is: ${code}. Valid for 5 minutes.`;

    return this.sendSms({
      to: phoneNumber,
      message,
      priority: 'high',
    });
  }

  async sendPasswordResetSms(phoneNumber: string, resetToken: string, language: string = 'en') {
    const resetUrl = `${this.configService.get('FRONTEND_URL')}/reset-password?token=${resetToken}`;
    const message = language === 'ar'
      ? ` CareerHub: إعادة تعيين كلمة المرور. استخدم الرابط: ${resetUrl}`
      : `CareerHub: Password reset. Use this link: ${resetUrl}`;

    return this.sendSms({
      to: phoneNumber,
      message,
      priority: 'high',
    });
  }

  async sendAppointmentReminder(phoneNumber: string, appointmentData: {
    serviceName: string;
    dateTime: Date;
    location?: string;
  }, language: string = 'en') {
    const formattedDate = appointmentData.dateTime.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US');
    const location = appointmentData.location ? ` at ${appointmentData.location}` : '';
    
    const message = language === 'ar'
      ? `تذكير من CareerHub: لديك موعد ${appointmentData.serviceName} في ${formattedDate}${location}`
      : `Reminder from CareerHub: You have an appointment for ${appointmentData.serviceName} at ${formattedDate}${location}`;

    return this.sendSms({
      to: phoneNumber,
      message,
      priority: 'high',
    });
  }

  async sendCourseUpdateSms(phoneNumber: string, courseData: {
    courseTitle: string;
    updateType: 'NEW_LESSON' | 'ASSIGNMENT' | 'ANNOUNCEMENT';
    updateTitle: string;
  }, language: string = 'en') {
    const updateTypeText = {
      'NEW_LESSON': language === 'ar' ? 'درس جديد' : 'New lesson',
      'ASSIGNMENT': language === 'ar' ? 'واجب جديد' : 'New assignment',
      'ANNOUNCEMENT': language === 'ar' ? 'إعلان' : 'Announcement',
    };

    const message = language === 'ar'
      ? `CareerHub: ${updateTypeText[courseData.updateType]} في دورة ${courseData.courseTitle}: ${courseData.updateTitle}`
      : `CareerHub: ${updateTypeText[courseData.updateType]} in ${courseData.courseTitle}: ${courseData.updateTitle}`;

    return this.sendSms({
      to: phoneNumber,
      message,
    });
  }

  async sendPaymentConfirmationSms(phoneNumber: string, paymentData: {
    amount: number;
    currency: string;
    itemName: string;
  }, language: string = 'en') {
    const message = language === 'ar'
      ? `CareerHub: تم تأكيد دفعتك بمبلغ ${paymentData.amount} ${paymentData.currency} لشراء ${paymentData.itemName}`
      : `CareerHub: Your payment of ${paymentData.amount} ${paymentData.currency} for ${paymentData.itemName} has been confirmed`;

    return this.sendSms({
      to: phoneNumber,
      message,
      priority: 'high',
    });
  }

  async sendMarketingSms(phoneNumber: string, campaignData: {
    campaignName: string;
    message: string;
    unsubscribeKeyword?: string;
  }, language: string = 'en') {
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

  async getSmsDeliveryStatus(messageId: string) {
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
    } catch (error) {
      this.logger.error(`Failed to get SMS delivery status: ${error.message}`);
      throw new Error('Failed to get delivery status');
    }
  }

  async getSmsStats(startDate?: Date, endDate?: Date) {
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

  async validatePhoneNumber(phoneNumber: string): Promise<boolean> {
    try {
      // Basic phone number validation
      const phoneRegex = /^\+?[1-9]\d{1,14}$/;
      return phoneRegex.test(phoneNumber.replace(/[\s-]/g, ''));
    } catch (error) {
      return false;
    }
  }

  async formatPhoneNumber(phoneNumber: string, countryCode: string = 'US'): Promise<string> {
    try {
      // Remove all non-digit characters
      let cleaned = phoneNumber.replace(/\D/g, '');

      // Add country code if missing
      if (!cleaned.startsWith('+')) {
        const countryCodes: Record<string, string> = {
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
    } catch (error) {
      throw new Error('Failed to format phone number');
    }
  }

  async testSmsConfiguration(): Promise<boolean> {
    try {
      // Send a test SMS to validate configuration
      const testNumber = this.configService.get('SMS_TEST_NUMBER');
      
      if (!testNumber) {
        this.logger.warn('No test number configured for SMS');
        return false;
      }

      await this.sendSms({
        to: testNumber,
        message: 'Test SMS from CareerHub',
      });

      return true;
    } catch (error) {
      this.logger.error('SMS configuration test failed', error);
      return false;
    }
  }

  private async sendViaTwilio(smsData: {
    to: string;
    message: string;
    priority?: string;
    scheduleTime?: Date;
  }) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.apiKey}/Messages.json`;
    
    const data = {
      From: this.sender,
      To: smsData.to,
      Body: smsData.message,
      Priority: smsData.priority || 'normal',
      ScheduleTime: smsData.scheduleTime?.toISOString(),
    };

    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

    const response = await axios.post(url, data, {
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

  private async sendViaMessageBird(smsData: {
    to: string;
    message: string;
    priority?: string;
    scheduleTime?: Date;
  }) {
    const url = 'https://rest.messagebird.com/messages';
    
    const data = {
      originator: this.sender,
      recipients: [smsData.to],
      body: smsData.message,
      priority: smsData.priority || 'normal',
      scheduledDatetime: smsData.scheduleTime?.toISOString(),
    };

    const response = await axios.post(url, data, {
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

  private async sendViaNexmo(smsData: {
    to: string;
    message: string;
    priority?: string;
    scheduleTime?: Date;
  }) {
    const url = 'https://rest.nexmo.com/sms/json';
    
    const data = {
      from: this.sender,
      to: smsData.to,
      text: smsData.message,
      'message-class': smsData.priority === 'high' ? '0' : '1',
      'schedule-time': smsData.scheduleTime?.toISOString(),
    };

    const response = await axios.post(url, data, {
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

  private async getTwilioDeliveryStatus(messageId: string) {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.apiKey}/Messages/${messageId}.json`;
    
    const auth = Buffer.from(`${this.apiKey}:${this.apiSecret}`).toString('base64');

    const response = await axios.get(url, {
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

  private async getMessageBirdDeliveryStatus(messageId: string) {
    const url = `https://rest.messagebird.com/messages/${messageId}`;
    
    const response = await axios.get(url, {
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

  private async getNexmoDeliveryStatus(messageId: string) {
    const url = 'https://rest.nexmo.com/search/message';
    
    const response = await axios.get(url, {
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

  async handleWebhook(webhookData: any, provider: string) {
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

  private handleTwilioWebhook(webhookData: any) {
    // Handle Twilio webhook for delivery status and replies
    return {
      messageId: webhookData.MessageSid,
      status: webhookData.MessageStatus,
      from: webhookData.From,
      to: webhookData.To,
      body: webhookData.Body,
    };
  }

  private handleMessageBirdWebhook(webhookData: any) {
    // Handle MessageBird webhook
    return {
      messageId: webhookData.message?.id,
      status: webhookData.message?.status,
      recipient: webhookData.message?.recipients?.[0],
    };
  }

  private handleNexmoWebhook(webhookData: any) {
    // Handle Nexmo webhook
    return {
      messageId: webhookData['message-id'],
      status: webhookData.status,
      from: webhookData.from,
      to: webhookData.to,
    };
  }
}
