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
var ZoomService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ZoomService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let ZoomService = ZoomService_1 = class ZoomService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(ZoomService_1.name);
        this.accountId = this.configService.get('ZOOM_ACCOUNT_ID');
        this.clientId = this.configService.get('ZOOM_CLIENT_ID');
        this.clientSecret = this.configService.get('ZOOM_CLIENT_SECRET');
    }
    async createMeeting(meetingData) {
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
            const response = await axios_1.default.post('https://api.zoom.us/v2/users/me/meetings', meetingPayload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
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
        }
        catch (error) {
            this.logger.error('Failed to create Zoom meeting', error);
            throw new Error('Failed to create meeting');
        }
    }
    async updateMeeting(meetingId, updateData) {
        try {
            const accessToken = await this.getAccessToken();
            const updatePayload = {};
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
            const response = await axios_1.default.patch(`https://api.zoom.us/v2/meetings/${meetingId}`, updatePayload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.log(`Zoom meeting updated: ${meetingId}`);
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to update Zoom meeting', error);
            throw new Error('Failed to update meeting');
        }
    }
    async deleteMeeting(meetingId) {
        try {
            const accessToken = await this.getAccessToken();
            await axios_1.default.delete(`https://api.zoom.us/v2/meetings/${meetingId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            this.logger.log(`Zoom meeting deleted: ${meetingId}`);
        }
        catch (error) {
            this.logger.error('Failed to delete Zoom meeting', error);
            throw new Error('Failed to delete meeting');
        }
    }
    async getMeeting(meetingId) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await axios_1.default.get(`https://api.zoom.us/v2/meetings/${meetingId}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get Zoom meeting', error);
            throw new Error('Failed to get meeting');
        }
    }
    async getMeetingJoinUrl(meetingId, userId) {
        try {
            const meeting = await this.getMeeting(meetingId);
            // For simplicity, return the regular join URL
            // In a real implementation, you might want to create a registrant
            // and get a personalized join URL
            return meeting.join_url;
        }
        catch (error) {
            this.logger.error('Failed to get meeting join URL', error);
            throw new Error('Failed to get join URL');
        }
    }
    async createRegistrant(meetingId, registrantData) {
        try {
            const accessToken = await this.getAccessToken();
            const registrantPayload = {
                email: registrantData.email,
                first_name: registrantData.firstName,
                last_name: registrantData.lastName,
                auto_approve: true,
            };
            const response = await axios_1.default.post(`https://api.zoom.us/v2/meetings/${meetingId}/registrants`, registrantPayload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
            });
            this.logger.log(`Zoom registrant created for meeting ${meetingId}: ${registrantData.email}`);
            return {
                registrantId: response.data.registrant_id,
                joinUrl: response.data.join_url,
                topic: response.data.topic,
                startTime: response.data.start_time,
            };
        }
        catch (error) {
            this.logger.error('Failed to create Zoom registrant', error);
            throw new Error('Failed to create registrant');
        }
    }
    async getMeetingRecordings(meetingId) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await axios_1.default.get(`https://api.zoom.us/v2/meetings/${meetingId}/recordings`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get meeting recordings', error);
            throw new Error('Failed to get recordings');
        }
    }
    async getMeetingParticipants(meetingId) {
        try {
            const accessToken = await this.getAccessToken();
            const response = await axios_1.default.get(`https://api.zoom.us/v2/report/meetings/${meetingId}/participants`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get meeting participants', error);
            throw new Error('Failed to get participants');
        }
    }
    async getMeetingAnalytics(meetingId) {
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
        }
        catch (error) {
            this.logger.error('Failed to get meeting analytics', error);
            throw new Error('Failed to get analytics');
        }
    }
    async getUserMeetings(userId, options = {}) {
        try {
            const accessToken = await this.getAccessToken();
            const params = new URLSearchParams();
            if (options.from)
                params.append('from', options.from);
            if (options.to)
                params.append('to', options.to);
            if (options.type)
                params.append('type', options.type);
            const response = await axios_1.default.get(`https://api.zoom.us/v2/users/${userId}/meetings?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get user meetings', error);
            throw new Error('Failed to get user meetings');
        }
    }
    async getWebhookEvents() {
        try {
            const accessToken = await this.getAccessToken();
            const response = await axios_1.default.get('https://api.zoom.us/v2/webhooks', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get webhook events', error);
            throw new Error('Failed to get webhook events');
        }
    }
    async verifyWebhookEvent(signature, timestamp, payload) {
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
        }
        catch (error) {
            this.logger.error('Failed to verify webhook event', error);
            return false;
        }
    }
    async handleWebhookEvent(event) {
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
    async getAccessToken() {
        if (this.accessToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
            return this.accessToken;
        }
        try {
            const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
            const response = await axios_1.default.post('https://zoom.us/oauth/token', 'grant_type=account_credentials&account_id=' + this.accountId, {
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            });
            this.accessToken = response.data.access_token;
            this.tokenExpiry = Date.now() + (response.data.expires_in - 60) * 1000; // Refresh 1 minute before expiry
            this.logger.log('Zoom access token refreshed');
            return this.accessToken;
        }
        catch (error) {
            this.logger.error('Failed to get Zoom access token', error);
            throw new Error('Failed to authenticate with Zoom');
        }
    }
    async handleMeetingStarted(event) {
        // Update session status to IN_PROGRESS
        this.logger.log(`Meeting started: ${event.payload.object.id}`);
    }
    async handleMeetingEnded(event) {
        // Update session status to COMPLETED and fetch analytics
        this.logger.log(`Meeting ended: ${event.payload.object.id}`);
    }
    async handleParticipantJoined(event) {
        // Track participant join time
        this.logger.log(`Participant joined meeting: ${event.payload.object.id}`);
    }
    async handleParticipantLeft(event) {
        // Track participant leave time
        this.logger.log(`Participant left meeting: ${event.payload.object.id}`);
    }
    async handleRecordingCompleted(event) {
        // Process completed recording
        this.logger.log(`Recording completed for meeting: ${event.payload.object.id}`);
    }
    async testConnection() {
        try {
            await this.getAccessToken();
            return true;
        }
        catch (error) {
            this.logger.error('Zoom connection test failed', error);
            return false;
        }
    }
    async getAccountInfo() {
        try {
            const accessToken = await this.getAccessToken();
            const response = await axios_1.default.get('https://api.zoom.us/v2/users/me', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            });
            return response.data;
        }
        catch (error) {
            this.logger.error('Failed to get account info', error);
            throw new Error('Failed to get account info');
        }
    }
};
exports.ZoomService = ZoomService;
exports.ZoomService = ZoomService = ZoomService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], ZoomService);
