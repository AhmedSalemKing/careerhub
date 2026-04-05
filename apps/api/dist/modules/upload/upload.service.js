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
var UploadService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../../prisma/prisma.service");
const AWS = __importStar(require("aws-sdk"));
const sharp = require('sharp');
const path = __importStar(require("path"));
const crypto = __importStar(require("crypto"));
const uuid_1 = require("uuid");
const bcrypt = __importStar(require("bcrypt"));
let UploadService = UploadService_1 = class UploadService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(UploadService_1.name);
        this.allowedMimeTypes = {
            image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            video: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'],
            document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        };
        this.initializeS3();
        this.bucketName = this.configService.get('AWS_S3_BUCKET');
    }
    initializeS3() {
        this.s3 = new AWS.S3({
            accessKeyId: this.configService.get('AWS_ACCESS_KEY_ID'),
            secretAccessKey: this.configService.get('AWS_SECRET_ACCESS_KEY'),
            region: this.configService.get('AWS_REGION'),
        });
    }
    async uploadSingleFile(userId, file, options = {}) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const fileType = this.getFileType(file.mimetype);
        if (!fileType) {
            throw new common_1.BadRequestException('Invalid file type');
        }
        const fileName = this.generateFileName(file.originalname);
        const key = this.generateFileKey(userId, fileName, options.folder);
        try {
            // Upload to S3
            const uploadResult = await this.s3.upload({
                Bucket: this.bucketName,
                Key: key,
                Body: file.buffer,
                ContentType: file.mimetype,
                ACL: options.isPublic ? 'public-read' : 'private',
                Metadata: {
                    originalName: file.originalname,
                    uploadedBy: userId,
                },
            }).promise();
            // Create file record in database
            const fileRecord = await this.prisma.uploadedFile.create({
                data: {
                    userId,
                    fileName,
                    originalName: file.originalname,
                    mimeType: file.mimetype,
                    size: file.size,
                    fileType,
                    key,
                    url: uploadResult.Location,
                    isPublic: options.isPublic || false,
                    folder: options.folder || 'general',
                },
            });
            this.logger.log(`File uploaded: ${fileName} by user ${userId}`);
            return fileRecord;
        }
        catch (error) {
            this.logger.error('Failed to upload file', error);
            throw new Error('Failed to upload file');
        }
    }
    async uploadMultipleFiles(userId, files, options = {}) {
        if (!files || files.length === 0) {
            throw new common_1.BadRequestException('No files provided');
        }
        const results = [];
        for (const file of files) {
            try {
                const result = await this.uploadSingleFile(userId, file, options);
                results.push({ success: true, ...result });
            }
            catch (error) {
                results.push({ success: false, error: error.message, fileName: file.originalname });
            }
        }
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        this.logger.log(`Multiple files uploaded: ${successful} successful, ${failed} failed`);
        return {
            total: files.length,
            successful,
            failed,
            results,
        };
    }
    async uploadImage(userId, image, options = {}) {
        if (!image) {
            throw new common_1.BadRequestException('No image provided');
        }
        if (!this.allowedMimeTypes.image.includes(image.mimetype)) {
            throw new common_1.BadRequestException('Invalid image format');
        }
        let processedImage = image.buffer;
        // Process image with Sharp
        if (options.resizeWidth || options.resizeHeight || options.quality) {
            const sharpInstance = sharp(processedImage);
            if (options.resizeWidth || options.resizeHeight) {
                sharpInstance.resize(options.resizeWidth, options.resizeHeight, {
                    fit: 'inside',
                    withoutEnlargement: true,
                });
            }
            if (options.quality) {
                sharpInstance.jpeg({ quality: options.quality });
            }
            processedImage = await sharpInstance.toBuffer();
        }
        // Generate thumbnails if requested
        const thumbnails = [];
        if (options.generateThumbnails) {
            const thumbnailSizes = [
                { width: 150, height: 150, suffix: 'thumb' },
                { width: 300, height: 300, suffix: 'medium' },
            ];
            for (const size of thumbnailSizes) {
                const thumbnailBuffer = await sharp(image.buffer)
                    .resize(size.width, size.height, {
                    fit: 'cover',
                    position: 'center',
                })
                    .jpeg({ quality: 80 })
                    .toBuffer();
                const thumbnailName = this.generateFileName(image.originalname, size.suffix);
                const thumbnailKey = this.generateFileKey(userId, thumbnailName, 'thumbnails');
                const thumbnailUpload = await this.s3.upload({
                    Bucket: this.bucketName,
                    Key: thumbnailKey,
                    Body: thumbnailBuffer,
                    ContentType: 'image/jpeg',
                    ACL: 'public-read',
                }).promise();
                thumbnails.push({
                    size: size.suffix,
                    url: thumbnailUpload.Location,
                    width: size.width,
                    height: size.height,
                });
            }
        }
        // Upload main image
        const fileName = this.generateFileName(image.originalname);
        const key = this.generateFileKey(userId, fileName, 'images');
        const uploadResult = await this.s3.upload({
            Bucket: this.bucketName,
            Key: key,
            Body: processedImage,
            ContentType: image.mimetype,
            ACL: 'public-read',
            Metadata: {
                originalName: image.originalname,
                uploadedBy: userId,
                processed: 'true',
            },
        }).promise();
        // Create file record in database
        const fileRecord = await this.prisma.uploadedFile.create({
            data: {
                userId,
                fileName,
                originalName: image.originalname,
                mimeType: image.mimetype,
                size: processedImage.length,
                fileType: 'image',
                key,
                url: uploadResult.Location,
                isPublic: true,
                folder: 'images',
                metadata: {
                    processed: true,
                    thumbnails,
                    originalSize: image.size,
                },
            },
        });
        this.logger.log(`Image uploaded and processed: ${fileName} by user ${userId}`);
        return {
            id: fileRecord.id,
            fileName: fileRecord.fileName,
            originalName: fileRecord.originalName,
            mimeType: fileRecord.mimeType,
            size: fileRecord.size,
            fileType: fileRecord.fileType,
            url: fileRecord.url,
            thumbnails,
            uploadedAt: fileRecord.createdAt,
        };
    }
    async uploadVideo(userId, video, options = {}) {
        if (!video) {
            throw new common_1.BadRequestException('No video provided');
        }
        if (!this.allowedMimeTypes.video.includes(video.mimetype)) {
            throw new common_1.BadRequestException('Invalid video format');
        }
        // Check video size (max 500MB)
        if (video.size > 500 * 1024 * 1024) {
            throw new common_1.BadRequestException('Video size exceeds 500MB limit');
        }
        const fileName = this.generateFileName(video.originalname);
        const key = this.generateFileKey(userId, fileName, 'videos');
        try {
            const uploadResult = await this.s3.upload({
                Bucket: this.bucketName,
                Key: key,
                Body: video.buffer,
                ContentType: video.mimetype,
                ACL: 'private',
                Metadata: {
                    originalName: video.originalname,
                    uploadedBy: userId,
                    title: options.title || '',
                    description: options.description || '',
                },
            }).promise();
            // Create file record in database
            const fileRecord = await this.prisma.uploadedFile.create({
                data: {
                    userId,
                    fileName,
                    originalName: video.originalname,
                    mimeType: video.mimetype,
                    size: video.size,
                    fileType: 'video',
                    key,
                    url: uploadResult.Location,
                    isPublic: false,
                    folder: 'videos',
                    metadata: {
                        title: options.title,
                        description: options.description,
                    },
                },
            });
            this.logger.log(`Video uploaded: ${fileName} by user ${userId}`);
            return {
                id: fileRecord.id,
                fileName: fileRecord.fileName,
                originalName: fileRecord.originalName,
                mimeType: fileRecord.mimeType,
                size: fileRecord.size,
                fileType: fileRecord.fileType,
                url: fileRecord.url,
                title: options.title,
                description: options.description,
                uploadedAt: fileRecord.createdAt,
            };
        }
        catch (error) {
            this.logger.error('Failed to upload video', error);
            throw new Error('Failed to upload video');
        }
    }
    async uploadDocument(userId, document, options = {}) {
        if (!document) {
            throw new common_1.BadRequestException('No document provided');
        }
        if (!this.allowedMimeTypes.document.includes(document.mimetype)) {
            throw new common_1.BadRequestException('Invalid document format');
        }
        const fileName = this.generateFileName(document.originalname);
        const key = this.generateFileKey(userId, fileName, 'documents');
        try {
            const uploadResult = await this.s3.upload({
                Bucket: this.bucketName,
                Key: key,
                Body: document.buffer,
                ContentType: document.mimetype,
                ACL: 'private',
                Metadata: {
                    originalName: document.originalname,
                    uploadedBy: userId,
                    title: options.title || '',
                    description: options.description || '',
                },
            }).promise();
            // Create file record in database
            const fileRecord = await this.prisma.uploadedFile.create({
                data: {
                    userId,
                    fileName,
                    originalName: document.originalname,
                    mimeType: document.mimetype,
                    size: document.size,
                    fileType: 'document',
                    key,
                    url: uploadResult.Location,
                    isPublic: false,
                    folder: 'documents',
                    metadata: {
                        title: options.title,
                        description: options.description,
                    },
                },
            });
            this.logger.log(`Document uploaded: ${fileName} by user ${userId}`);
            return {
                id: fileRecord.id,
                fileName: fileRecord.fileName,
                originalName: fileRecord.originalName,
                mimeType: fileRecord.mimeType,
                size: fileRecord.size,
                fileType: fileRecord.fileType,
                url: fileRecord.url,
                title: options.title,
                description: options.description,
                uploadedAt: fileRecord.createdAt,
            };
        }
        catch (error) {
            this.logger.error('Failed to upload document', error);
            throw new Error('Failed to upload document');
        }
    }
    async getUserFiles(userId, options) {
        const where = {
            userId,
            ...(options.type && { fileType: options.type }),
        };
        const skip = (options.page - 1) * options.limit;
        const [files, total] = await Promise.all([
            this.prisma.uploadedFile.findMany({
                where,
                skip,
                take: options.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.uploadedFile.count({ where }),
        ]);
        const totalPages = Math.ceil(total / options.limit);
        return {
            files,
            meta: {
                total,
                page: options.page,
                limit: options.limit,
                totalPages,
                hasNext: options.page < totalPages,
                hasPrev: options.page > 1,
            },
        };
    }
    async getFile(fileId) {
        const file = await this.prisma.uploadedFile.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        return file;
    }
    async getDownloadUrl(fileId) {
        const file = await this.prisma.uploadedFile.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        // Generate signed URL for private files
        if (file.isPublic) {
            return { url: file.url };
        }
        const signedUrl = this.s3.getSignedUrl('getObject', {
            Bucket: this.bucketName,
            Key: file.key,
            Expires: 3600, // 1 hour
        });
        return { url: signedUrl };
    }
    async deleteFile(userId, fileId) {
        const file = await this.prisma.uploadedFile.findFirst({
            where: { id: fileId, userId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found or access denied');
        }
        // Delete from S3
        try {
            await this.s3.deleteObject({
                Bucket: this.bucketName,
                Key: file.key,
            }).promise();
        }
        catch (error) {
            this.logger.error('Failed to delete file from S3', error);
        }
        // Delete from database
        await this.prisma.uploadedFile.delete({
            where: { id: fileId },
        });
        this.logger.log(`File deleted: ${fileId} by user ${userId}`);
    }
    async shareFile(userId, fileId, shareOptions) {
        const file = await this.prisma.uploadedFile.findFirst({
            where: { id: fileId, userId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found or access denied');
        }
        const shareId = (0, uuid_1.v4)();
        const shareUrl = `${this.configService.get('FRONTEND_URL')}/shared/${shareId}`;
        // Hash password if provided
        let hashedPassword = null;
        if (shareOptions.password) {
            hashedPassword = await bcrypt.hash(shareOptions.password, 12);
        }
        // Create share record
        await this.prisma.fileShare.create({
            data: {
                fileId,
                shareId,
                userId,
                expiresAt: shareOptions.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                password: hashedPassword,
                downloadLimit: shareOptions.downloadLimit,
            },
        });
        this.logger.log(`File shared: ${fileId} with share ID: ${shareId}`);
        return {
            shareId,
            shareUrl,
            expiresAt: shareOptions.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            hasPassword: !!shareOptions.password,
            downloadLimit: shareOptions.downloadLimit,
        };
    }
    async getSharedFile(shareId) {
        const share = await this.prisma.fileShare.findUnique({
            where: { shareId },
            include: { file: true },
        });
        if (!share) {
            throw new common_1.NotFoundException('Shared file not found');
        }
        if (share.expiresAt < new Date()) {
            throw new common_1.NotFoundException('Share has expired');
        }
        if (share.downloadLimit && share.downloadCount >= share.downloadLimit) {
            throw new common_1.NotFoundException('Download limit exceeded');
        }
        // Increment download count
        await this.prisma.fileShare.update({
            where: { id: share.id },
            data: { downloadCount: { increment: 1 } },
        });
        // Generate download URL
        let url;
        if (share.file.isPublic) {
            url = share.file.url;
        }
        else {
            url = this.s3.getSignedUrl('getObject', {
                Bucket: this.bucketName,
                Key: share.file.key,
                Expires: 3600,
            });
        }
        return {
            file: share.file,
            url,
            hasPassword: !!share.password,
            downloadCount: share.downloadCount,
            downloadLimit: share.downloadLimit,
        };
    }
    async generatePresignedUrl(userId, urlData) {
        const fileType = this.getFileType(urlData.fileType);
        if (!fileType) {
            throw new common_1.BadRequestException('Invalid file type');
        }
        const fileName = this.generateFileName(urlData.fileName);
        const key = this.generateFileKey(userId, fileName, urlData.folder);
        const presignedUrl = await this.s3.getSignedUrlPromise('putObject', {
            Bucket: this.bucketName,
            Key: key,
            ContentType: urlData.fileType,
            Expires: 3600, // 1 hour
        });
        return {
            presignedUrl,
            key,
            fileName,
            fileType,
        };
    }
    async processFile(userId, fileId, processData) {
        const file = await this.prisma.uploadedFile.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException('File not found');
        }
        this.logger.log(`File processing started: ${fileId}, operation: ${processData.operation}`);
        // Update file metadata with processing info
        await this.prisma.uploadedFile.update({
            where: { id: fileId },
            data: {
                metadata: {
                    ...file.metadata,
                    processing: {
                        operation: processData.operation,
                        status: 'processing',
                        startedAt: new Date(),
                    },
                },
            },
        });
        return {
            fileId,
            operation: processData.operation,
            status: 'processing',
            startedAt: new Date(),
        };
    }
    async getAllFiles(options) {
        const where = {
            ...(options.userId && { userId: options.userId }),
            ...(options.type && { fileType: options.type }),
        };
        const skip = (options.page - 1) * options.limit;
        const [files, total] = await Promise.all([
            this.prisma.uploadedFile.findMany({
                where,
                skip,
                take: options.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.uploadedFile.count({ where }),
        ]);
        const totalPages = Math.ceil(total / options.limit);
        return {
            files,
            meta: {
                total,
                page: options.page,
                limit: options.limit,
                totalPages,
                hasNext: options.page < totalPages,
                hasPrev: options.page > 1,
            },
        };
    }
    async getUploadStats() {
        const [totalFiles, totalSizeResult, filesByType] = await Promise.all([
            this.prisma.uploadedFile.count(),
            this.prisma.uploadedFile.aggregate({
                _sum: { size: true },
            }),
            this.prisma.uploadedFile.groupBy({
                by: ['fileType'],
                _count: { id: true },
                _sum: { size: true },
            }),
        ]);
        const totalSize = totalSizeResult._sum.size || 0;
        // Get top users by file count
        const topUsers = await this.prisma.uploadedFile.groupBy({
            by: ['userId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });
        // Get user details for top users
        const userIds = topUsers.map(u => u.userId);
        const users = await this.prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, email: true, profile: { select: { firstName: true, lastName: true } } },
        });
        const topUsersWithDetails = topUsers.map(topUser => {
            const user = users.find(u => u.id === topUser.userId);
            return {
                userId: topUser.userId,
                email: user?.email,
                name: user?.profile ? `${user.profile.firstName} ${user.profile.lastName}` : 'Unknown',
                fileCount: topUser._count.id,
            };
        });
        // Get recent uploads (last 7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentUploads = await this.prisma.uploadedFile.count({
            where: { createdAt: { gte: sevenDaysAgo } },
        });
        return {
            totalFiles,
            totalSize,
            filesByType: filesByType.map(type => ({
                type: type.fileType,
                count: type._count.id,
                size: type._sum.size || 0,
            })),
            topUsers: topUsersWithDetails,
            recentUploads,
        };
    }
    async cleanupFiles(days = 30) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        // Find files to delete
        const filesToDelete = await this.prisma.uploadedFile.findMany({
            where: { createdAt: { lt: cutoffDate } },
            select: { id: true, key: true },
        });
        let deletedCount = 0;
        let errorCount = 0;
        for (const file of filesToDelete) {
            try {
                // Delete from S3
                await this.s3.deleteObject({
                    Bucket: this.bucketName,
                    Key: file.key,
                }).promise();
                // Delete from database
                await this.prisma.uploadedFile.delete({
                    where: { id: file.id },
                });
                deletedCount++;
            }
            catch (error) {
                this.logger.error(`Failed to delete file ${file.id}:`, error);
                errorCount++;
            }
        }
        this.logger.log(`Cleanup completed for files older than ${days} days`);
        return {
            deletedCount,
            errorCount,
            totalProcessed: filesToDelete.length,
        };
    }
    getFileType(mimetype) {
        for (const [type, mimeTypes] of Object.entries(this.allowedMimeTypes)) {
            if (mimeTypes.includes(mimetype)) {
                return type;
            }
        }
        return null;
    }
    generateFileName(originalName, suffix) {
        const ext = path.extname(originalName);
        const name = path.basename(originalName, ext);
        const timestamp = Date.now();
        const random = crypto.randomBytes(4).toString('hex');
        const suffixPart = suffix ? `-${suffix}` : '';
        return `${name}-${timestamp}-${random}${suffixPart}${ext}`;
    }
    generateFileKey(userId, fileName, folder) {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const folderPath = folder || 'general';
        return `uploads/${userId}/${year}/${month}/${day}/${folderPath}/${fileName}`;
    }
    // Public CV upload — saves to disk when S3 is not configured
    async uploadCV(file) {
        const { writeFile, mkdir } = await Promise.resolve().then(() => __importStar(require('fs/promises')));
        const { join } = await Promise.resolve().then(() => __importStar(require('path')));
        const safeName = `cv_${Date.now()}_${file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`;
        const uploadDir = join(process.cwd(), 'uploads', 'cvs');
        await mkdir(uploadDir, { recursive: true });
        await writeFile(join(uploadDir, safeName), file.buffer);
        return {
            url: `/uploads/cvs/${safeName}`,
            fileName: file.originalname,
            size: file.size,
        };
    }
};
exports.UploadService = UploadService;
exports.UploadService = UploadService = UploadService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], UploadService);
