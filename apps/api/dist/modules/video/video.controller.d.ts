import { VideoService } from './video.service';
export declare class VideoController {
    private readonly videoService;
    constructor(videoService: VideoService);
    getUploadUrl(body: any): Promise<{
        uploadUrl: any;
        streamId: any;
        videoId: string;
        maxFileSize: any;
    }>;
    getPlaybackUrl(streamId: string, lessonId: string, userId: string): Promise<{
        playbackUrl: string;
        thumbnailUrl: string;
        duration: number;
        subtitles: any[];
        drm: {
            enabled: boolean;
            licenseUrl: string;
        };
    }>;
    getThumbnail(streamId: string): Promise<string>;
    processVideo(streamId: string, options: any): Promise<{
        status: string;
        thumbnailUrl: any;
        duration: any;
        availableQualities: string[];
    }>;
    getStatus(streamId: string): Promise<{
        status: string;
        cloudflareStatus: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    deleteVideo(streamId: string): Promise<void>;
    handleWebhook(data: any): Promise<void>;
    getByLesson(lessonId: string): Promise<{
        id: string;
        streamId: string;
        playbackUrl: string;
        thumbnailUrl: string;
        duration: number;
        status: string;
        title: string;
        description: string;
    }>;
    getStats(): Promise<{
        totalVideos: number;
        readyVideos: number;
        processingVideos: number;
        errorVideos: number;
        totalDuration: number;
        readyRate: number;
    }>;
}
