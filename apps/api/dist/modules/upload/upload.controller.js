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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const upload_service_1 = require("./upload.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    async uploadSingleFile(user, file, folder, isPublic) {
        const result = await this.uploadService.uploadSingleFile(user.id, file, {
            folder,
            isPublic: isPublic === 'true',
        });
        return {
            success: true,
            message: 'File uploaded successfully',
            data: result,
        };
    }
    async uploadMultipleFiles(user, files, folder, isPublic) {
        const result = await this.uploadService.uploadMultipleFiles(user.id, files, {
            folder,
            isPublic: isPublic === 'true',
        });
        return {
            success: true,
            message: 'Files uploaded successfully',
            data: result,
        };
    }
    async uploadImage(user, image, resizeWidth, resizeHeight, quality, generateThumbnails) {
        const result = await this.uploadService.uploadImage(user.id, image, {
            resizeWidth: resizeWidth ? parseInt(resizeWidth) : undefined,
            resizeHeight: resizeHeight ? parseInt(resizeHeight) : undefined,
            quality: quality ? parseInt(quality) : undefined,
            generateThumbnails: generateThumbnails === 'true',
        });
        return {
            success: true,
            message: 'Image uploaded and processed successfully',
            data: result,
        };
    }
    async uploadVideo(user, video, title, description) {
        const result = await this.uploadService.uploadVideo(user.id, video, {
            title,
            description,
        });
        return {
            success: true,
            message: 'Video uploaded successfully',
            data: result,
        };
    }
    async uploadDocument(user, document, title, description) {
        const result = await this.uploadService.uploadDocument(user.id, document, {
            title,
            description,
        });
        return {
            success: true,
            message: 'Document uploaded successfully',
            data: result,
        };
    }
    async getMyFiles(user, page, limit, type) {
        const files = await this.uploadService.getUserFiles(user.id, {
            page: page || 1,
            limit: limit || 20,
            type,
        });
        return {
            success: true,
            data: files,
        };
    }
    async getFile(fileId) {
        const file = await this.uploadService.getFile(fileId);
        return {
            success: true,
            data: { file },
        };
    }
    async downloadFile(fileId) {
        const downloadUrl = await this.uploadService.getDownloadUrl(fileId);
        return {
            success: true,
            data: { downloadUrl },
        };
    }
    async deleteFile(user, fileId) {
        await this.uploadService.deleteFile(user.id, fileId);
    }
    async shareFile(user, fileId, shareData) {
        const shareLink = await this.uploadService.shareFile(user.id, fileId, shareData);
        return {
            success: true,
            message: 'File shared successfully',
            data: { shareLink },
        };
    }
    async getSharedFile(shareId) {
        const file = await this.uploadService.getSharedFile(shareId);
        return {
            success: true,
            data: { file },
        };
    }
    async generatePresignedUrl(user, urlData) {
        const presignedUrl = await this.uploadService.generatePresignedUrl(user.id, urlData);
        return {
            success: true,
            message: 'Presigned URL generated successfully',
            data: presignedUrl,
        };
    }
    async processFile(user, fileId, processData) {
        const result = await this.uploadService.processFile(user.id, fileId);
        return {
            success: true,
            message: 'File processing started',
            data: result,
        };
    }
    // Admin endpoints
    async getAllFiles(page, limit, userId, type) {
        const files = await this.uploadService.getAllFiles({
            page: page || 1,
            limit: limit || 20,
            userId,
            type,
        });
        return {
            success: true,
            data: files,
        };
    }
    async getUploadStats() {
        const stats = await this.uploadService.getUploadStats();
        return {
            success: true,
            data: { stats },
        };
    }
    async cleanupFiles(days = 30) {
        const result = await this.uploadService.cleanupFiles(days);
        return {
            success: true,
            message: 'Cleanup completed successfully',
            data: result,
        };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Post)('single'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload single file' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'File uploaded successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('folder')),
    __param(3, (0, common_1.Body)('isPublic')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadSingleFile", null);
__decorate([
    (0, common_1.Post)('multiple'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)) // Max 10 files
    ,
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload multiple files' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Files uploaded successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFiles)()),
    __param(2, (0, common_1.Body)('folder')),
    __param(3, (0, common_1.Body)('isPublic')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array, String, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadMultipleFiles", null);
__decorate([
    (0, common_1.Post)('image'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload image with processing' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Image uploaded and processed successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('resizeWidth')),
    __param(3, (0, common_1.Body)('resizeHeight')),
    __param(4, (0, common_1.Body)('quality')),
    __param(5, (0, common_1.Body)('generateThumbnails')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Post)('video'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('video')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload video file' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Video uploaded successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('title')),
    __param(3, (0, common_1.Body)('description')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadVideo", null);
__decorate([
    (0, common_1.Post)('document'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('document')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload document file' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Document uploaded successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Body)('title')),
    __param(3, (0, common_1.Body)('description')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadDocument", null);
__decorate([
    (0, common_1.Get)('my-files'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user uploaded files' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Files retrieved successfully' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page' }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false, description: 'Filter by file type' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Number, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getMyFiles", null);
__decorate([
    (0, common_1.Get)(':fileId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get file by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File not found' }),
    (0, swagger_1.ApiParam)({ name: 'fileId', description: 'File ID' }),
    __param(0, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getFile", null);
__decorate([
    (0, common_1.Get)(':fileId/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Download file' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File download URL generated' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'File not found' }),
    (0, swagger_1.ApiParam)({ name: 'fileId', description: 'File ID' }),
    __param(0, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "downloadFile", null);
__decorate([
    (0, common_1.Delete)(':fileId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: 'Delete file' }),
    (0, swagger_1.ApiResponse)({ status: 204, description: 'File deleted successfully' }),
    (0, swagger_1.ApiParam)({ name: 'fileId', description: 'File ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "deleteFile", null);
__decorate([
    (0, common_1.Post)(':fileId/share'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Share file' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File shared successfully' }),
    (0, swagger_1.ApiParam)({ name: 'fileId', description: 'File ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('fileId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "shareFile", null);
__decorate([
    (0, common_1.Get)('shared/:shareId'),
    (0, swagger_1.ApiOperation)({ summary: 'Access shared file' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Shared file accessed successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Shared file not found or expired' }),
    (0, swagger_1.ApiParam)({ name: 'shareId', description: 'Share ID' }),
    __param(0, (0, common_1.Param)('shareId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getSharedFile", null);
__decorate([
    (0, common_1.Post)('presigned-url'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Generate presigned upload URL' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Presigned URL generated successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "generatePresignedUrl", null);
__decorate([
    (0, common_1.Post)('process/:fileId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Process uploaded file' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'File processing started' }),
    (0, swagger_1.ApiParam)({ name: 'fileId', description: 'File ID' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)('fileId')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "processFile", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all files (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Files retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('userId')),
    __param(3, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getAllFiles", null);
__decorate([
    (0, common_1.Get)('admin/stats'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get upload statistics (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getUploadStats", null);
__decorate([
    (0, common_1.Post)('admin/cleanup'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)('ADMIN'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cleanup unused files (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cleanup completed successfully' }),
    __param(0, (0, common_1.Body)('days')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "cleanupFiles", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('Upload'),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
