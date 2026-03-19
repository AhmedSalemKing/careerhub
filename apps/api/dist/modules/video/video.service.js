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
var VideoService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const cloudflare_service_1 = require("./cloudflare.service");
let VideoService = VideoService_1 = class VideoService {
    constructor(prisma, cloudflareService, configService) {
        this.prisma = prisma;
        this.cloudflareService = cloudflareService;
        this.configService = configService;
        this.logger = new common_1.Logger(VideoService_1.name);
    }
    async getUploadUrl(lessonId) {
        // Verify lesson exists
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                videoContent: true,
            },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        // Check if video already exists
        if (lesson.videoContent) {
            throw new common_1.BadRequestException('Video already exists for this lesson');
        }
        // Create video content record
        const videoContent = await this.prisma.videoContent.create({
            data: {
                lessonId,
                streamId: `pending_${lessonId}_${Date.now()}`,
                status: 'UPLOADING',
            },
        });
        // Get upload URL from Cloudflare
        const uploadData = await this.cloudflareService.createUploadUrl({
            maxDurationSeconds: 7200, // 2 hours max
            requiresSignedURLs: true,
            allowedOrigins: [this.configService.get('FRONTEND_URL')],
        });
        // Update video content with stream ID
        await this.prisma.videoContent.update({
            where: { id: videoContent.id },
            data: {
                streamId: uploadData.uid,
                uploadUrl: uploadData.uploadURL,
            },
        });
        this.logger.log(`Upload URL generated for lesson ${lessonId}`);
        return {
            uploadUrl: uploadData.uploadURL,
            streamId: uploadData.uid,
            videoId: videoContent.id,
            maxFileSize: uploadData.maxSizeBytes,
        };
    }
    async getSignedPlaybackUrl(streamId, userId, lessonId) {
        // Verify user is enrolled in the course
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    include: {
                        course: true,
                    },
                },
                videoContent: true,
            },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        if (!lesson.videoContent || lesson.videoContent.streamId !== streamId) {
            throw new common_1.NotFoundException('Video not found for this lesson');
        }
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: lesson.module.courseId,
                },
            },
        });
        if (!enrollment) {
            throw new common_1.ForbiddenException('You must be enrolled in this course to access video content');
        }
        if (lesson.videoContent.status !== 'READY') {
            throw new common_1.BadRequestException('Video is not ready for playback');
        }
        // Generate signed playback URL
        const signedUrl = await this.cloudflareService.getSignedPlaybackUrl(streamId, {
            expiresIn: '1h',
            allowedOrigins: [this.configService.get('FRONTEND_URL')],
        });
        // Track video access
        await this.trackVideoAccess(userId, lessonId, streamId);
        return {
            playbackUrl: signedUrl,
            thumbnailUrl: lesson.videoContent.thumbnail,
            duration: lesson.videoContent.duration,
            subtitles: [], // Would be implemented with subtitle service
            drm: {
                enabled: true,
                licenseUrl: this.cloudflareService.getLicenseUrl(streamId),
            },
        };
    }
    async getThumbnailUrl(streamId) {
        const videoContent = await this.prisma.videoContent.findUnique({
            where: { streamId },
        });
        if (!videoContent) {
            throw new common_1.NotFoundException('Video not found');
        }
        if (!videoContent.thumbnail) {
            throw new common_1.NotFoundException('Thumbnail not available');
        }
        return videoContent.thumbnail;
    }
    async processVideo(streamId, options) {
        const videoContent = await this.prisma.videoContent.findUnique({
            where: { streamId },
            include: {
                lesson: true,
            },
        });
        if (!videoContent) {
            throw new common_1.NotFoundException('Video not found');
        }
        // Update status to processing
        await this.prisma.videoContent.update({
            where: { id: videoContent.id },
            data: { status: 'PROCESSING' },
        });
        // Process video with Cloudflare
        const processResult = await this.cloudflareService.processVideo(streamId, {
            generateThumbnail: options.generateThumbnail ?? true,
            generateSubtitles: options.generateSubtitles ?? false,
            quality: options.quality || '720p',
        });
        // Update video content with processing results
        await this.prisma.videoContent.update({
            where: { id: videoContent.id },
            data: {
                status: 'READY',
                thumbnail: processResult.thumbnailUrl,
                duration: processResult.duration,
            },
        });
        this.logger.log(`Video processed for lesson ${videoContent.lesson.title}`);
        return {
            status: 'READY',
            thumbnailUrl: processResult.thumbnailUrl,
            duration: processResult.duration,
            availableQualities: processResult.availableQualities,
        };
    }
    async getVideoStatus(streamId) {
        const videoContent = await this.prisma.videoContent.findUnique({
            where: { streamId },
        });
        if (!videoContent) {
            throw new common_1.NotFoundException('Video not found');
        }
        // Get status from Cloudflare
        const cloudflareStatus = await this.cloudflareService.getVideoStatus(streamId);
        return {
            status: videoContent.status,
            cloudflareStatus,
            createdAt: videoContent.createdAt,
            updatedAt: videoContent.updatedAt,
        };
    }
    async deleteVideo(streamId) {
        const videoContent = await this.prisma.videoContent.findUnique({
            where: { streamId },
        });
        if (!videoContent) {
            throw new common_1.NotFoundException('Video not found');
        }
        // Delete from Cloudflare
        await this.cloudflareService.deleteVideo(streamId);
        // Delete from database
        await this.prisma.videoContent.delete({
            where: { id: videoContent.id },
        });
        this.logger.log(`Video deleted: ${streamId}`);
    }
    async handleWebhook(webhookData) {
        this.logger.log(`Received Cloudflare webhook: ${JSON.stringify(webhookData)}`);
        const { uid: streamId, status } = webhookData;
        if (!streamId || !status) {
            throw new common_1.BadRequestException('Invalid webhook data');
        }
        const videoContent = await this.prisma.videoContent.findUnique({
            where: { streamId },
        });
        if (!videoContent) {
            this.logger.warn(`Webhook for unknown video: ${streamId}`);
            return;
        }
        // Update video status based on webhook
        let newStatus = videoContent.status;
        switch (status) {
            case 'ready':
                newStatus = 'READY';
                break;
            case 'uploaded':
                newStatus = 'PROCESSING';
                break;
            case 'error':
                newStatus = 'ERROR';
                break;
        }
        await this.prisma.videoContent.update({
            where: { id: videoContent.id },
            data: { status: newStatus },
        });
        this.logger.log(`Video status updated via webhook: ${streamId} -> ${newStatus}`);
    }
    async getLessonVideo(userId, lessonId) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: {
                module: {
                    include: {
                        course: true,
                    },
                },
                videoContent: true,
            },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        // Check enrollment
        const enrollment = await this.prisma.enrollment.findUnique({
            where: {
                userId_courseId: {
                    userId,
                    courseId: lesson.module.courseId,
                },
            },
        });
        if (!enrollment) {
            throw new common_1.ForbiddenException('You must be enrolled in this course to access video content');
        }
        if (!lesson.videoContent) {
            throw new common_1.NotFoundException('No video available for this lesson');
        }
        const playbackUrl = await this.cloudflareService.getSignedPlaybackUrl(lesson.videoContent.streamId, { expiresIn: '1h' });
        return {
            id: lesson.videoContent.id,
            streamId: lesson.videoContent.streamId,
            playbackUrl,
            thumbnailUrl: lesson.videoContent.thumbnail,
            duration: lesson.videoContent.duration,
            status: lesson.videoContent.status,
            title: lesson.title,
            description: lesson.description,
        };
    }
    async transcodeLessonVideo(lessonId, options) {
        const lesson = await this.prisma.lesson.findUnique({
            where: { id: lessonId },
            include: { videoContent: true },
        });
        if (!lesson) {
            throw new common_1.NotFoundException('Lesson not found');
        }
        if (!lesson.videoContent) {
            throw new common_1.NotFoundException('No video found for this lesson');
        }
        // Start transcoding process
        const result = await this.cloudflareService.transcodeVideo(lesson.videoContent.streamId, {
            qualities: options.qualities || ['720p', '1080p'],
            format: options.format || 'hls',
            generateThumbnail: options.generateThumbnail ?? true,
        });
        // Update status
        await this.prisma.videoContent.update({
            where: { id: lesson.videoContent.id },
            data: { status: 'PROCESSING' },
        });
        this.logger.log(`Transcoding started for lesson ${lesson.title}`);
        return {
            jobId: result.jobId,
            status: 'PROCESSING',
            estimatedTime: result.estimatedTime,
        };
    }
    async getVideoAnalytics(streamId) {
        const videoContent = await this.prisma.videoContent.findUnique({
            where: { streamId },
            include: {
                lesson: {
                    include: {
                        progress: true,
                    },
                },
            },
        });
        if (!videoContent) {
            throw new common_1.NotFoundException('Video not found');
        }
        const totalViews = videoContent.lesson.progress.length;
        const completedViews = videoContent.lesson.progress.filter(p => p.status === 'COMPLETED').length;
        const avgWatchTime = totalViews > 0
            ? videoContent.lesson.progress.reduce((sum, p) => sum + p.timeSpent, 0) / totalViews
            : 0;
        // Get analytics from Cloudflare
        const cloudflareAnalytics = await this.cloudflareService.getVideoAnalytics(streamId);
        return {
            videoId: videoContent.id,
            streamId,
            totalViews,
            completedViews,
            completionRate: totalViews > 0 ? (completedViews / totalViews) * 100 : 0,
            averageWatchTime: avgWatchTime,
            dropOffRate: totalViews > 0 ? ((totalViews - completedViews) / totalViews) * 100 : 0,
            cloudflareAnalytics,
        };
    }
    async getVideoThumbnail(streamId) {
        return this.getThumbnailUrl(streamId);
    }
    async getVideoByLesson(lessonId, userId) {
        return this.getLessonVideo(userId, lessonId);
    }
    async getVideoStats() {
        return this.getVideoStatsOverview();
    }
    async getVideoStatsOverview() {
        const [totalVideos, readyVideos, processingVideos, errorVideos,] = await Promise.all([
            this.prisma.videoContent.count(),
            this.prisma.videoContent.count({ where: { status: 'READY' } }),
            this.prisma.videoContent.count({ where: { status: 'PROCESSING' } }),
            this.prisma.videoContent.count({ where: { status: 'ERROR' } }),
        ]);
        const totalDuration = await this.prisma.videoContent.aggregate({
            where: { status: 'READY' },
            _sum: { duration: true },
        });
        return {
            totalVideos,
            readyVideos,
            processingVideos,
            errorVideos,
            totalDuration: totalDuration._sum.duration || 0,
            readyRate: totalVideos > 0 ? (readyVideos / totalVideos) * 100 : 0,
        };
    }
    async bulkUploadVideos(videos) {
        const results = [];
        for (const video of videos) {
            try {
                const uploadData = await this.getUploadUrl(video.lessonId);
                results.push({
                    lessonId: video.lessonId,
                    title: video.title,
                    success: true,
                    uploadData,
                });
            }
            catch (error) {
                results.push({
                    lessonId: video.lessonId,
                    title: video.title,
                    success: false,
                    error: error.message,
                });
            }
        }
        this.logger.log(`Bulk upload initiated for ${videos.length} videos`);
        return {
            total: videos.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            results,
        };
    }
    async searchVideos(query, options) {
        const { page, limit } = options;
        const skip = (page - 1) * limit;
        const videos = await this.prisma.videoContent.findMany({
            where: {
                lesson: {
                    OR: [
                        {
                            title: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            titleAr: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            description: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            descriptionAr: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            },
            include: {
                lesson: {
                    include: {
                        module: {
                            include: {
                                course: true,
                            },
                        },
                    },
                },
            },
            skip,
            take: limit,
        });
        const total = await this.prisma.videoContent.count({
            where: {
                lesson: {
                    OR: [
                        {
                            title: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                        {
                            titleAr: {
                                contains: query,
                                mode: 'insensitive',
                            },
                        },
                    ],
                },
            },
        });
        return {
            videos: videos.map(video => ({
                id: video.id,
                streamId: video.streamId,
                status: video.status,
                thumbnail: video.thumbnail,
                duration: video.duration,
                lesson: {
                    id: video.lesson.id,
                    title: video.lesson.title,
                    course: {
                        id: video.lesson.module.course.id,
                        title: video.lesson.module.course.title,
                    },
                },
                createdAt: video.createdAt,
            })),
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNext: page < Math.ceil(total / limit),
                hasPrev: page > 1,
            },
        };
    }
    async trackVideoAccess(userId, lessonId, streamId) {
        // This would track video access for analytics
        // Could be stored in a separate analytics table or sent to an analytics service
        this.logger.log(`Video access tracked: user ${userId}, lesson ${lessonId}, stream ${streamId}`);
    }
};
exports.VideoService = VideoService;
exports.VideoService = VideoService = VideoService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cloudflare_service_1.CloudflareService,
        config_1.ConfigService])
], VideoService);
