import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { CloudflareService } from './cloudflare.service';
export declare class VideoService {
    private prisma;
    private cloudflareService;
    private configService;
    private readonly logger;
    constructor(prisma: PrismaService, cloudflareService: CloudflareService, configService: ConfigService);
    getUploadUrl(lessonId: string): Promise<{
        uploadUrl: any;
        streamId: any;
        videoId: string;
        maxFileSize: any;
    }>;
    getSignedPlaybackUrl(streamId: string, userId: string, lessonId: string): Promise<{
        playbackUrl: string;
        thumbnailUrl: string;
        duration: number;
        subtitles: any[];
        drm: {
            enabled: boolean;
            licenseUrl: string;
        };
    }>;
    getThumbnailUrl(streamId: string): Promise<string>;
    processVideo(streamId: string, options: {
        generateThumbnail?: boolean;
        generateSubtitles?: boolean;
        quality?: string;
    }): Promise<{
        status: string;
        thumbnailUrl: any;
        duration: any;
        availableQualities: string[];
    }>;
    getVideoStatus(streamId: string): Promise<{
        status: string;
        cloudflareStatus: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteVideo(streamId: string): Promise<void>;
    handleWebhook(webhookData: any): Promise<void>;
    getLessonVideo(userId: string, lessonId: string): Promise<{
        id: string;
        streamId: string;
        playbackUrl: string;
        thumbnailUrl: string;
        duration: number;
        status: string;
        title: string;
        description: string;
    }>;
    transcodeLessonVideo(lessonId: string, options: {
        qualities?: string[];
        format?: string;
        generateThumbnail?: boolean;
    }): Promise<{
        jobId: string;
        status: string;
        estimatedTime: number;
    }>;
    getVideoAnalytics(streamId: string): Promise<{
        videoId: string;
        streamId: string;
        totalViews: number;
        completedViews: number;
        completionRate: number;
        averageWatchTime: number;
        dropOffRate: number;
        cloudflareAnalytics: any;
    }>;
    getVideoThumbnail(streamId: string): Promise<string>;
    getVideoByLesson(lessonId: string, userId?: string): Promise<{
        id: string;
        streamId: string;
        playbackUrl: string;
        thumbnailUrl: string;
        duration: number;
        status: string;
        title: string;
        description: string;
    }>;
    getVideoStats(): Promise<{
        totalVideos: number;
        readyVideos: number;
        processingVideos: number;
        errorVideos: number;
        totalDuration: number;
        readyRate: number;
    }>;
    getVideoStatsOverview(): Promise<{
        totalVideos: number;
        readyVideos: number;
        processingVideos: number;
        errorVideos: number;
        totalDuration: number;
        readyRate: number;
    }>;
    bulkUploadVideos(videos: Array<{
        lessonId: string;
        title: string;
        description?: string;
    }>): Promise<{
        total: number;
        successful: number;
        failed: number;
        results: any[];
    }>;
    searchVideos(query: string, options: {
        page: number;
        limit: number;
    }): Promise<{
        videos: {
            id: string;
            streamId: string;
            status: string;
            thumbnail: string;
            duration: number;
            lesson: {
                id: string;
                title: any;
                course: {
                    id: string;
                    title: any;
                };
            };
            createdAt: Date;
        }[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
            hasNext: boolean;
            hasPrev: boolean;
        };
    }>;
    private trackVideoAccess;
}
