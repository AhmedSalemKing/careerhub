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
var CloudflareService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CloudflareService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let CloudflareService = CloudflareService_1 = class CloudflareService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(CloudflareService_1.name);
        this.apiToken = this.configService.get('CLOUDFLARE_API_TOKEN');
        this.accountId = this.configService.get('CLOUDFLARE_ACCOUNT_ID');
        this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}`;
    }
    async createUploadUrl(options) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/stream/direct_upload`, {
                maxDurationSeconds: options.maxDurationSeconds || 3600,
                requiresSignedURLs: options.requiresSignedURLs || true,
                allowedOrigins: options.allowedOrigins || [],
                watermark: {
                    uid: this.configService.get('CLOUDFLARE_WATERMARK_ID'),
                    opacity: 0.1,
                    position: 'bottom-right',
                },
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                return response.data.result;
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to create upload URL', error);
            throw error;
        }
    }
    async getSignedPlaybackUrl(streamId, options = {}) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/stream/${streamId}/token`, {
                exp: this.getExpirationTime(options.expiresIn || '1h'),
                allowedOrigins: options.allowedOrigins || [],
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                const token = response.data.result.token;
                return `https://cloudflarestream.com/${streamId}/manifest/video.m3u8?token=${token}`;
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to get signed playback URL', error);
            throw error;
        }
    }
    async getVideoStatus(streamId) {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/stream/${streamId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                },
            });
            if (response.data.success) {
                return response.data.result;
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to get video status', error);
            throw error;
        }
    }
    async processVideo(streamId, options) {
        try {
            // Update video with processing options
            const response = await axios_1.default.post(`${this.baseUrl}/stream/${streamId}`, {
                thumbnailTimestampPct: options.generateThumbnail ? 10 : null,
                requireSignedURLs: true,
                uploaded: new Date().toISOString(),
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                const video = response.data.result;
                // Generate thumbnail if requested
                let thumbnailUrl = null;
                if (options.generateThumbnail && video.thumbnail) {
                    thumbnailUrl = `https://videodelivery.net/${video.uid}/thumbnails/thumbnail.jpg`;
                }
                return {
                    status: video.status,
                    thumbnailUrl,
                    duration: video.duration?.duration,
                    availableQualities: video.maxResolution?.height ? [`${video.maxResolution.height}p`] : ['720p'],
                };
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to process video', error);
            throw error;
        }
    }
    async deleteVideo(streamId) {
        try {
            const response = await axios_1.default.delete(`${this.baseUrl}/stream/${streamId}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                },
            });
            if (!response.data.success) {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
            this.logger.log(`Video deleted from Cloudflare: ${streamId}`);
        }
        catch (error) {
            this.logger.error('Failed to delete video', error);
            throw error;
        }
    }
    async transcodeVideo(streamId, options) {
        try {
            // Cloudflare Stream automatically handles transcoding
            // We can trigger a re-process if needed
            const response = await axios_1.default.post(`${this.baseUrl}/stream/${streamId}`, {
            // Cloudflare will automatically create multiple renditions
            // We can specify custom settings if needed
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                return {
                    jobId: `transcode_${streamId}_${Date.now()}`,
                    status: 'processing',
                    estimatedTime: 300, // 5 minutes estimate
                };
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to transcode video', error);
            throw error;
        }
    }
    async getVideoAnalytics(streamId) {
        try {
            // Cloudflare Stream provides basic analytics
            const response = await axios_1.default.get(`${this.baseUrl}/stream/${streamId}/views`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                },
            });
            if (response.data.success) {
                return response.data.result;
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to get video analytics', error);
            throw error;
        }
    }
    async listVideos(options = {}) {
        try {
            const params = new URLSearchParams();
            if (options.page)
                params.append('page', options.page.toString());
            if (options.limit)
                params.append('per_page', options.limit.toString());
            if (options.status)
                params.append('status', options.status);
            const response = await axios_1.default.get(`${this.baseUrl}/stream?${params.toString()}`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                },
            });
            if (response.data.success) {
                return response.data.result;
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to list videos', error);
            throw error;
        }
    }
    getLicenseUrl(streamId) {
        // Cloudflare Stream uses token-based authentication
        // The license URL is embedded in the signed playback URL
        return `${this.baseUrl}/stream/${streamId}/drm/license`;
    }
    async getWebhookSigningKey() {
        // Cloudflare Stream webhooks can be signed
        // This would return the public key for verification
        return this.configService.get('CLOUDFLARE_WEBHOOK_SIGNING_KEY') || '';
    }
    async verifyWebhookSignature(payload, signature) {
        try {
            // Verify webhook signature using Cloudflare's public key
            const signingKey = await this.getWebhookSigningKey();
            if (!signingKey) {
                this.logger.warn('No webhook signing key configured');
                return true; // Allow if no key configured
            }
            // Implement signature verification logic
            // This would use crypto to verify the signature
            return true; // Placeholder
        }
        catch (error) {
            this.logger.error('Failed to verify webhook signature', error);
            return false;
        }
    }
    async createWatermark(options) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/stream/watermarks`, {
                name: options.name,
                png: options.pngBase64,
                opacity: options.opacity || 0.1,
                position: options.position || 'bottom-right',
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                return response.data.result;
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to create watermark', error);
            throw error;
        }
    }
    async getUsageStats() {
        try {
            const response = await axios_1.default.get(`${this.baseUrl}/stream/analytics`, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                },
            });
            if (response.data.success) {
                return response.data.result;
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to get usage stats', error);
            throw error;
        }
    }
    getExpirationTime(expiresIn) {
        const now = Math.floor(Date.now() / 1000);
        const duration = this.parseDuration(expiresIn);
        return now + duration;
    }
    parseDuration(duration) {
        const match = duration.match(/^(\d+)([smhd])$/);
        if (!match) {
            throw new Error(`Invalid duration format: ${duration}`);
        }
        const value = parseInt(match[1], 10);
        const unit = match[2];
        switch (unit) {
            case 's': return value;
            case 'm': return value * 60;
            case 'h': return value * 3600;
            case 'd': return value * 86400;
            default: throw new Error(`Unknown duration unit: ${unit}`);
        }
    }
    async generateThumbnail(streamId, timestampPercent = 10) {
        try {
            const response = await axios_1.default.post(`${this.baseUrl}/stream/${streamId}`, {
                thumbnailTimestampPct: timestampPercent,
            }, {
                headers: {
                    'Authorization': `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                const video = response.data.result;
                return {
                    thumbnailUrl: `https://videodelivery.net/${video.uid}/thumbnails/thumbnail.jpg`,
                    status: 'generated',
                };
            }
            else {
                throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
            }
        }
        catch (error) {
            this.logger.error('Failed to generate thumbnail', error);
            throw error;
        }
    }
    async getEmbedCode(streamId, options = {}) {
        const signedUrl = await this.getSignedPlaybackUrl(streamId);
        const embedOptions = {
            width: options.width || 640,
            height: options.height || 360,
            autoplay: options.autoplay || false,
            muted: options.muted || false,
            controls: options.controls !== false,
        };
        return {
            iframe: `<iframe src="${signedUrl}" width="${embedOptions.width}" height="${embedOptions.height}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`,
            playerOptions: embedOptions,
        };
    }
};
exports.CloudflareService = CloudflareService;
exports.CloudflareService = CloudflareService = CloudflareService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CloudflareService);
