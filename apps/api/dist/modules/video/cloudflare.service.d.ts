import { ConfigService } from '@nestjs/config';
export declare class CloudflareService {
    private configService;
    private readonly logger;
    private readonly apiToken;
    private readonly accountId;
    private readonly baseUrl;
    constructor(configService: ConfigService);
    createUploadUrl(options: {
        maxDurationSeconds?: number;
        requiresSignedURLs?: boolean;
        allowedOrigins?: string[];
    }): Promise<any>;
    getSignedPlaybackUrl(streamId: string, options?: {
        expiresIn?: string;
        allowedOrigins?: string[];
    }): Promise<string>;
    getVideoStatus(streamId: string): Promise<any>;
    processVideo(streamId: string, options: {
        generateThumbnail?: boolean;
        generateSubtitles?: boolean;
        quality?: string;
    }): Promise<{
        status: any;
        thumbnailUrl: any;
        duration: any;
        availableQualities: string[];
    }>;
    deleteVideo(streamId: string): Promise<void>;
    transcodeVideo(streamId: string, options: {
        qualities?: string[];
        format?: string;
        generateThumbnail?: boolean;
    }): Promise<{
        jobId: string;
        status: string;
        estimatedTime: number;
    }>;
    getVideoAnalytics(streamId: string): Promise<any>;
    listVideos(options?: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<any>;
    getLicenseUrl(streamId: string): string;
    getWebhookSigningKey(): Promise<string>;
    verifyWebhookSignature(payload: string, signature: string): Promise<boolean>;
    createWatermark(options: {
        name: string;
        pngBase64: string;
        opacity?: number;
        position?: string;
    }): Promise<any>;
    getUsageStats(): Promise<any>;
    private getExpirationTime;
    private parseDuration;
    generateThumbnail(streamId: string, timestampPercent?: number): Promise<{
        thumbnailUrl: string;
        status: string;
    }>;
    getEmbedCode(streamId: string, options?: {
        width?: number;
        height?: number;
        autoplay?: boolean;
        muted?: boolean;
        controls?: boolean;
    }): Promise<{
        iframe: string;
        playerOptions: {
            width: number;
            height: number;
            autoplay: boolean;
            muted: boolean;
            controls: boolean;
        };
    }>;
}
