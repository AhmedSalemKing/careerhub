import { ConfigService } from '@nestjs/config';
export declare class ZoomService {
    private configService;
    private readonly logger;
    private readonly accountId;
    private readonly clientId;
    private readonly clientSecret;
    private accessToken;
    private tokenExpiry;
    constructor(configService: ConfigService);
    createMeeting(meetingData: {
        topic: string;
        startTime: string;
        duration: number;
        hostEmail?: string;
        agenda?: string;
    }): Promise<{
        id: any;
        uuid: any;
        joinUrl: any;
        startUrl: any;
        password: any;
        topic: any;
        startTime: any;
        duration: any;
        timezone: any;
        settings: any;
    }>;
    updateMeeting(meetingId: string, updateData: {
        startTime?: string;
        duration?: number;
        topic?: string;
        agenda?: string;
    }): Promise<any>;
    deleteMeeting(meetingId: string): Promise<void>;
    getMeeting(meetingId: string): Promise<any>;
    getMeetingJoinUrl(meetingId: string, userId: string): Promise<any>;
    createRegistrant(meetingId: string, registrantData: {
        email: string;
        firstName: string;
        lastName: string;
    }): Promise<{
        registrantId: any;
        joinUrl: any;
        topic: any;
        startTime: any;
    }>;
    getMeetingRecordings(meetingId: string): Promise<any>;
    getMeetingParticipants(meetingId: string): Promise<any>;
    getMeetingAnalytics(meetingId: string): Promise<{
        recordings: any;
        participants: any;
        totalParticipants: any;
        hasRecording: boolean;
        duration: any;
    }>;
    getUserMeetings(userId: string, options?: {
        from?: string;
        to?: string;
        type?: 'scheduled' | 'live' | 'upcoming';
    }): Promise<any>;
    getWebhookEvents(): Promise<any>;
    verifyWebhookEvent(signature: string, timestamp: string, payload: string): Promise<boolean>;
    handleWebhookEvent(event: any): Promise<void>;
    private getAccessToken;
    private handleMeetingStarted;
    private handleMeetingEnded;
    private handleParticipantJoined;
    private handleParticipantLeft;
    private handleRecordingCompleted;
    testConnection(): Promise<boolean>;
    getAccountInfo(): Promise<any>;
}
