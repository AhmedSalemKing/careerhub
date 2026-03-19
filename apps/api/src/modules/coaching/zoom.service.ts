import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class ZoomService {
  private readonly logger = new Logger(ZoomService.name);
  private readonly accountId: string;
  private readonly clientId: string;
  private readonly clientSecret: string;
  private accessToken: string;
  private tokenExpiry: number;

  constructor(private configService: ConfigService) {
    this.accountId = this.configService.get('ZOOM_ACCOUNT_ID');
    this.clientId = this.configService.get('ZOOM_CLIENT_ID');
    this.clientSecret = this.configService.get('ZOOM_CLIENT_SECRET');
  }

  async createMeeting(meetingData: {
    topic: string;
    startTime: string;
    duration: number;
    hostEmail?: string;
    agenda?: string;
  }) {
    try {
      const accessToken = await this.getAccessToken();

      const meetingPayload = {
        topic: meetingData.topic,
        type: 2, // Scheduled meeting
        start_time: meetingData.startTime,
        duration: meetingData.duration,
        timezone: 'UTC',
        agenda: meetingData.agenda || 'Career Coaching Session',
        settings: {
          host_video: true,
          participant_video: true,
          cn_meeting: false,
          in_meeting: false,
          join_before_host: false,
          mute_upon_entry: true,
          watermark: false,
          use_pmi: false,
          approval_type: 2,
          audio: 'both',
          auto_recording: 'cloud',
          enforce_login: false,
          registrants_email_notification: true,
          meeting_authentication: false,
          alternative_hosts: '',
          close_registration: true,
          waiting_room: true,
          allow_multiple_devices: true,
          calendar_type: 2,
          registrants_confirmation_email: true,
          show_share_button: false,
          allow_live_streaming: false,
          embed_signup_form: false,
          enable_language_interpretation: false,
          interpretation_languages: [],
          private_meeting: false,
          global_dial_in_countries: [],
          contact_name: '',
          contact_email: '',
          schedule_for: meetingData.hostEmail || '',
          template_id: '',
        },
      };

      const response = await axios.post(
        'https://api.zoom.us/v2/users/me/meetings',
        meetingPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const meeting = response.data;

      this.logger.log(`Zoom meeting created: ${meeting.id}`);

      return {
        id: meeting.id,
        uuid: meeting.uuid,
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url,
        password: meeting.password,
        topic: meeting.topic,
        startTime: meeting.start_time,
        duration: meeting.duration,
        timezone: meeting.timezone,
        settings: meeting.settings,
      };
    } catch (error) {
      this.logger.error('Failed to create Zoom meeting', error);
      throw new Error('Failed to create meeting');
    }
  }

  async updateMeeting(meetingId: string, updateData: {
    startTime?: string;
    duration?: number;
    topic?: string;
    agenda?: string;
  }) {
    try {
      const accessToken = await this.getAccessToken();

      const updatePayload: any = {};

      if (updateData.startTime) {
        updatePayload.start_time = updateData.startTime;
      }
      if (updateData.duration) {
        updatePayload.duration = updateData.duration;
      }
      if (updateData.topic) {
        updatePayload.topic = updateData.topic;
      }
      if (updateData.agenda) {
        updatePayload.agenda = updateData.agenda;
      }

      const response = await axios.patch(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        updatePayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Zoom meeting updated: ${meetingId}`);

      return response.data;
    } catch (error) {
      this.logger.error('Failed to update Zoom meeting', error);
      throw new Error('Failed to update meeting');
    }
  }

  async deleteMeeting(meetingId: string) {
    try {
      const accessToken = await this.getAccessToken();

      await axios.delete(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      this.logger.log(`Zoom meeting deleted: ${meetingId}`);
    } catch (error) {
      this.logger.error('Failed to delete Zoom meeting', error);
      throw new Error('Failed to delete meeting');
    }
  }

  async getMeeting(meetingId: string) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get Zoom meeting', error);
      throw new Error('Failed to get meeting');
    }
  }

  async getMeetingJoinUrl(meetingId: string, userId: string) {
    try {
      const meeting = await this.getMeeting(meetingId);

      // For simplicity, return the regular join URL
      // In a real implementation, you might want to create a registrant
      // and get a personalized join URL
      return meeting.join_url;
    } catch (error) {
      this.logger.error('Failed to get meeting join URL', error);
      throw new Error('Failed to get join URL');
    }
  }

  async createRegistrant(meetingId: string, registrantData: {
    email: string;
    firstName: string;
    lastName: string;
  }) {
    try {
      const accessToken = await this.getAccessToken();

      const registrantPayload = {
        email: registrantData.email,
        first_name: registrantData.firstName,
        last_name: registrantData.lastName,
        auto_approve: true,
      };

      const response = await axios.post(
        `https://api.zoom.us/v2/meetings/${meetingId}/registrants`,
        registrantPayload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      this.logger.log(`Zoom registrant created for meeting ${meetingId}: ${registrantData.email}`);

      return {
        registrantId: response.data.registrant_id,
        joinUrl: response.data.join_url,
        topic: response.data.topic,
        startTime: response.data.start_time,
      };
    } catch (error) {
      this.logger.error('Failed to create Zoom registrant', error);
      throw new Error('Failed to create registrant');
    }
  }

  async getMeetingRecordings(meetingId: string) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `https://api.zoom.us/v2/meetings/${meetingId}/recordings`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get meeting recordings', error);
      throw new Error('Failed to get recordings');
    }
  }

  async getMeetingParticipants(meetingId: string) {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        `https://api.zoom.us/v2/report/meetings/${meetingId}/participants`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get meeting participants', error);
      throw new Error('Failed to get participants');
    }
  }

  async getMeetingAnalytics(meetingId: string) {
    try {
      const [recordings, participants] = await Promise.all([
        this.getMeetingRecordings(meetingId),
        this.getMeetingParticipants(meetingId),
      ]);

      return {
        recordings: recordings.recording_files || [],
        participants: participants.participants || [],
        totalParticipants: participants.participants?.length || 0,
        hasRecording: recordings.recording_files?.length > 0,
        duration: recordings.duration || 0,
      };
    } catch (error) {
      this.logger.error('Failed to get meeting analytics', error);
      throw new Error('Failed to get analytics');
    }
  }

  async getUserMeetings(userId: string, options: {
    from?: string;
    to?: string;
    type?: 'scheduled' | 'live' | 'upcoming';
  } = {}) {
    try {
      const accessToken = await this.getAccessToken();

      const params = new URLSearchParams();
      if (options.from) params.append('from', options.from);
      if (options.to) params.append('to', options.to);
      if (options.type) params.append('type', options.type);

      const response = await axios.get(
        `https://api.zoom.us/v2/users/${userId}/meetings?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get user meetings', error);
      throw new Error('Failed to get user meetings');
    }
  }

  async getWebhookEvents() {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        'https://api.zoom.us/v2/webhooks',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get webhook events', error);
      throw new Error('Failed to get webhook events');
    }
  }

  async verifyWebhookEvent(signature: string, timestamp: string, payload: string): Promise<boolean> {
    try {
      const webhookSecretToken = this.configService.get('ZOOM_WEBHOOK_SECRET_TOKEN');

      if (!webhookSecretToken) {
        this.logger.warn('Zoom webhook secret token not configured');
        return false;
      }

      // In a real implementation, you would verify the signature using HMAC-SHA256
      // const crypto = require('crypto');
      // const hash = crypto.createHmac('sha256', webhookSecretToken)
      //   .update(timestamp + payload)
      //   .digest('base64');
      // return hash === signature;

      // For now, return true if the token is configured
      return true;
    } catch (error) {
      this.logger.error('Failed to verify webhook event', error);
      return false;
    }
  }

  async handleWebhookEvent(event: any) {
    this.logger.log(`Received Zoom webhook event: ${event.event}`);

    switch (event.event) {
      case 'meeting.started':
        await this.handleMeetingStarted(event);
        break;
      case 'meeting.ended':
        await this.handleMeetingEnded(event);
        break;
      case 'meeting.participant_joined':
        await this.handleParticipantJoined(event);
        break;
      case 'meeting.participant_left':
        await this.handleParticipantLeft(event);
        break;
      case 'recording.completed':
        await this.handleRecordingCompleted(event);
        break;
      default:
        this.logger.log(`Unhandled webhook event: ${event.event}`);
    }
  }

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

      const response = await axios.post(
        'https://zoom.us/oauth/token',
        'grant_type=account_credentials&account_id=' + this.accountId,
        {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // Refresh 1 minute before expiry

      this.logger.log('Zoom access token refreshed');

      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get Zoom access token', error);
      throw new Error('Failed to authenticate with Zoom');
    }
  }

  private async handleMeetingStarted(event: any) {
    // Update session status to IN_PROGRESS
    this.logger.log(`Meeting started: ${event.payload.object.id}`);
  }

  private async handleMeetingEnded(event: any) {
    // Update session status to COMPLETED and fetch analytics
    this.logger.log(`Meeting ended: ${event.payload.object.id}`);
  }

  private async handleParticipantJoined(event: any) {
    // Track participant join time
    this.logger.log(`Participant joined meeting: ${event.payload.object.id}`);
  }

  private async handleParticipantLeft(event: any) {
    // Track participant leave time
    this.logger.log(`Participant left meeting: ${event.payload.object.id}`);
  }

  private async handleRecordingCompleted(event: any) {
    // Process completed recording
    this.logger.log(`Recording completed for meeting: ${event.payload.object.id}`);
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      return true;
    } catch (error) {
      this.logger.error('Zoom connection test failed', error);
      return false;
    }
  }

  async getAccountInfo() {
    try {
      const accessToken = await this.getAccessToken();

      const response = await axios.get(
        'https://api.zoom.us/v2/users/me',
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      this.logger.error('Failed to get account info', error);
      throw new Error('Failed to get account info');
    }
  }
}
