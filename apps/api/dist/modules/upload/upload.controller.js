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
const multer_1 = require("multer");
const path_1 = require("path");
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const swagger_1 = require("@nestjs/swagger");
const upload_service_1 = require("./upload.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const current_user_decorator_1 = require("../auth/decorators/current-user.decorator");
const public_decorator_1 = require("../auth/decorators/public.decorator");
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
    // Public CV upload — used during registration before the user has a token
    async uploadCV(file) {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const result = await this.uploadService.uploadCV(file);
        return { success: true, data: result };
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
    async uploadImage(image) {
        if (!image)
            throw new common_1.BadRequestException('No image file provided');
        const safeName = image.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `img_${Date.now()}_${safeName}`;
        const dir = (0, path_1.join)(process.cwd(), 'uploads', 'images');
        await (0, promises_1.mkdir)(dir, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(dir, fileName), image.buffer);
        return {
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: `/uploads/images/${fileName}`,
                fileName: image.originalname,
                size: image.size,
                mimeType: image.mimetype,
            },
        };
    }
    async uploadFile(file) {
        if (!file)
            throw new common_1.BadRequestException('No file provided');
        const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `file_${Date.now()}_${safeName}`;
        const dir = (0, path_1.join)(process.cwd(), 'uploads', 'files');
        await (0, promises_1.mkdir)(dir, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(dir, fileName), file.buffer);
        return {
            success: true,
            data: {
                url: `/uploads/files/${fileName}`,
                fileName: file.originalname,
                size: file.size,
                type: file.mimetype,
            },
        };
    }
    async uploadVideo(video) {
        if (!video)
            throw new common_1.BadRequestException('No video file provided');
        const safeName = video.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const fileName = `video_${Date.now()}_${safeName}`;
        const dir = (0, path_1.join)(process.cwd(), 'uploads', 'videos');
        await (0, promises_1.mkdir)(dir, { recursive: true });
        await (0, promises_1.writeFile)((0, path_1.join)(dir, fileName), video.buffer);
        return {
            success: true,
            message: 'Video uploaded successfully',
            data: {
                url: `/uploads/videos/${fileName}`,
                fileName: video.originalname,
                size: video.size,
                mimeType: video.mimetype,
            },
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
    async serveCV(filename, res, download) {
        const filePath = (0, path_1.join)(process.cwd(), 'uploads', 'cvs', filename);
        try {
            await (0, promises_1.access)(filePath);
        }
        catch {
            throw new common_1.NotFoundException('File not found');
        }
        const ext = filename.split('.').pop()?.toLowerCase();
        const contentTypes = {
            pdf: 'application/pdf',
            doc: 'application/msword',
            docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        };
        const contentType = contentTypes[ext || ''] || 'application/octet-stream';
        res.setHeader('Content-Type', contentType);
        if (download === 'true') {
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        }
        else {
            res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
        }
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'no-cache');
        const fileStream = (0, fs_1.createReadStream)(filePath);
        fileStream.pipe(res);
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
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('cv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
        fileFilter: (_req, file, cb) => {
            const allowed = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            ];
            if (allowed.includes(file.mimetype)) {
                cb(null, true);
            }
            else {
                cb(new common_1.BadRequestException('Only PDF and Word files are allowed'), false);
            }
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload CV (public — no auth)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'CV uploaded successfully' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadCV", null);
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
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('image', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
        fileFilter: (_req, file, cb) => {
            if (file.mimetype.startsWith('image/'))
                cb(null, true);
            else
                cb(new common_1.BadRequestException('Only image files are allowed'), false);
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload image — saved to local disk' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Image uploaded successfully' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadImage", null);
__decorate([
    (0, common_1.Post)('file'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
        fileFilter: (_req, file, cb) => {
            const allowed = [
                'application/pdf',
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'text/plain',
                'application/zip',
                'image/jpeg', 'image/png', 'image/gif',
            ];
            if (allowed.includes(file.mimetype))
                cb(null, true);
            else
                cb(new common_1.BadRequestException('File type not supported'), false);
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload lesson file (PDF, Word, Excel, PPT...)' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Post)('video'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('video', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB
        fileFilter: (_req, file, cb) => {
            if (file.mimetype.startsWith('video/'))
                cb(null, true);
            else
                cb(new common_1.BadRequestException('Only video files are allowed'), false);
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload video — saved to local disk' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Video uploaded successfully' }),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
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
    (0, common_1.Get)('cv/:filename'),
    (0, swagger_1.ApiOperation)({ summary: 'Serve CV file inline or as download' }),
    __param(0, (0, common_1.Param)('filename')),
    __param(1, (0, common_1.Res)()),
    __param(2, (0, common_1.Query)('download')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "serveCV", null);
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
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
