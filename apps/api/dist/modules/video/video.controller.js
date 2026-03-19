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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const video_service_1 = require("./video.service");
let VideoController = class VideoController {
    constructor(videoService) {
        this.videoService = videoService;
    }
    async getUploadUrl(body) {
        return this.videoService.getUploadUrl(body.lessonId);
    }
    async getPlaybackUrl(streamId, lessonId, userId) {
        return this.videoService.getSignedPlaybackUrl(streamId, userId, lessonId);
    }
    async getThumbnail(streamId) {
        return this.videoService.getVideoThumbnail(streamId);
    }
    async processVideo(streamId, options) {
        return this.videoService.processVideo(streamId, options);
    }
    async getStatus(streamId) {
        return this.videoService.getVideoStatus(streamId);
    }
    async deleteVideo(streamId) {
        return this.videoService.deleteVideo(streamId);
    }
    async handleWebhook(data) {
        return this.videoService.handleWebhook(data);
    }
    async getByLesson(lessonId) {
        return this.videoService.getVideoByLesson(lessonId);
    }
    async getStats() {
        return this.videoService.getVideoStats();
    }
};
exports.VideoController = VideoController;
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get upload URL' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getUploadUrl", null);
__decorate([
    (0, common_1.Get)(':streamId/playback'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get signed playback URL' }),
    __param(0, (0, common_1.Param)('streamId')),
    __param(1, (0, common_1.Query)('lessonId')),
    __param(2, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getPlaybackUrl", null);
__decorate([
    (0, common_1.Get)(':streamId/thumbnail'),
    (0, swagger_1.ApiOperation)({ summary: 'Get thumbnail' }),
    __param(0, (0, common_1.Param)('streamId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getThumbnail", null);
__decorate([
    (0, common_1.Post)(':streamId/process'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Process video' }),
    __param(0, (0, common_1.Param)('streamId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "processVideo", null);
__decorate([
    (0, common_1.Get)(':streamId/status'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get video status' }),
    __param(0, (0, common_1.Param)('streamId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getStatus", null);
__decorate([
    (0, common_1.Delete)(':streamId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete video' }),
    __param(0, (0, common_1.Param)('streamId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "deleteVideo", null);
__decorate([
    (0, common_1.Post)('webhook/cloudflare'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Cloudflare webhook' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "handleWebhook", null);
__decorate([
    (0, common_1.Get)('lesson/:lessonId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get video by lesson' }),
    __param(0, (0, common_1.Param)('lessonId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getByLesson", null);
__decorate([
    (0, common_1.Get)('stats/overview'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Video stats' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getStats", null);
exports.VideoController = VideoController = __decorate([
    (0, swagger_1.ApiTags)('video'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('video'),
    __metadata("design:paramtypes", [video_service_1.VideoService])
], VideoController);
