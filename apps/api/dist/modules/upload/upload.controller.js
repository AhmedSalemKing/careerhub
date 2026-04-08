"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
// ─── Cloudinary helper ───────────────────────────────────────────────────────
async function getCloudinary() {
    const { v2: cloudinary } = await Promise.resolve().then(() => __importStar(require('cloudinary')));
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    return cloudinary;
}
function safeUrl(url) {
    if (!url)
        return url;
    if (url.startsWith('http://') || url.startsWith('https://'))
        return url;
    return `https:${url}`;
}
// ─────────────────────────────────────────────────────────────────────────────
let UploadController = class UploadController {
    constructor(uploadService) {
        this.uploadService = uploadService;
    }
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
        return { success: true, message: 'File uploaded successfully', data: result };
    }
    async uploadMultipleFiles(user, files, folder, isPublic) {
        const result = await this.uploadService.uploadMultipleFiles(user.id, files, {
            folder,
            isPublic: isPublic === 'true',
        });
        return { success: true, message: 'Files uploaded successfully', data: result };
    }
    async uploadImage(image) {
        if (!image)
            throw new common_1.BadRequestException('No image file provided');
        const cloudinary = await getCloudinary();
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ folder: 'deveway/images' }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            }).end(image.buffer);
        });
        return {
            success: true,
            message: 'Image uploaded successfully',
            data: {
                url: safeUrl(result.secure_url),
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
        const cloudinary = await getCloudinary();
        const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({
                folder: 'deveway/videos',
                resource_type: 'video',
                chunk_size: 6000000,
            }, (error, result) => {
                if (error)
                    reject(error);
                else
                    resolve(result);
            }).end(video.buffer);
        });
        return {
            success: true,
            message: 'Video uploaded successfully',
            data: {
                url: safeUrl(result.secure_url),
                fileName: video.originalname,
                size: video.size,
                mimeType: video.mimetype,
            },
        };
    }
    async uploadDocument(user, document, title, description) {
        const result = await this.uploadService.uploadDocument(user.id, document, { title, description });
        return { success: true, message: 'Document uploaded successfully', data: result };
    }
    async getMyFiles(user, page, limit, type) {
        const files = await this.uploadService.getUserFiles(user.id, {
            page: page || 1,
            limit: limit || 20,
            type,
        });
        return { success: true, data: files };
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
        return { success: true, data: { file } };
    }
    async downloadFile(fileId) {
        const downloadUrl = await this.uploadService.getDownloadUrl(fileId);
        return { success: true, data: { downloadUrl } };
    }
    async deleteFile(user, fileId) {
        await this.uploadService.deleteFile(user.id, fileId);
    }
    async shareFile(user, fileId, shareData) {
        const shareLink = await this.uploadService.shareFile(user.id, fileId, shareData);
        return { success: true, message: 'File shared successfully', data: { shareLink } };
    }
    async getSharedFile(shareId) {
        const file = await this.uploadService.getSharedFile(shareId);
        return { success: true, data: { file } };
    }
    async generatePresignedUrl(user, urlData) {
        const presignedUrl = await this.uploadService.generatePresignedUrl(user.id, urlData);
        return { success: true, message: 'Presigned URL generated successfully', data: presignedUrl };
    }
    async processFile(user, fileId, processData) {
        const result = await this.uploadService.processFile(user.id, fileId);
        return { success: true, message: 'File processing started', data: result };
    }
    async getAllFiles(page, limit, userId, type) {
        const files = await this.uploadService.getAllFiles({ page: page || 1, limit: limit || 20, userId, type });
        return { success: true, data: files };
    }
    async getUploadStats() {
        const stats = await this.uploadService.getUploadStats();
        return { success: true, data: { stats } };
    }
    async cleanupFiles(days = 30) {
        const result = await this.uploadService.cleanupFiles(days);
        return { success: true, message: 'Cleanup completed successfully', data: result };
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('cv'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
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
    (0, common_1.UseInterceptors)((0, platform_express_1.FilesInterceptor)('files', 10)),
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
        limits: { fileSize: 10 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype.startsWith('image/'))
                cb(null, true);
            else
                cb(new common_1.BadRequestException('Only image files are allowed'), false);
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload image — saved to Cloudinary' }),
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
        limits: { fileSize: 50 * 1024 * 1024 },
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
        limits: { fileSize: 500 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            if (file.mimetype.startsWith('video/'))
                cb(null, true);
            else
                cb(new common_1.BadRequestException('Only video files are allowed'), false);
        },
    })),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Upload video — saved to Cloudinary' }),
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
    (0, swagger_1.ApiQuery)({ name: 'page', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'type', required: false }),
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
    (0, swagger_1.ApiParam)({ name: 'fileId' }),
    __param(0, (0, common_1.Param)('fileId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getFile", null);
__decorate([
    (0, common_1.Get)(':fileId/download'),
    (0, swagger_1.ApiOperation)({ summary: 'Download file' }),
    (0, swagger_1.ApiParam)({ name: 'fileId' }),
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
    (0, swagger_1.ApiParam)({ name: 'fileId' }),
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
    (0, swagger_1.ApiParam)({ name: 'fileId' }),
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
    (0, swagger_1.ApiParam)({ name: 'shareId' }),
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
    (0, swagger_1.ApiParam)({ name: 'fileId' }),
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
