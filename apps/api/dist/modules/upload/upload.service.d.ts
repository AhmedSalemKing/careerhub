import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
export declare class UploadService {
    private configService;
    private prisma;
    private readonly logger;
    private s3;
    private readonly bucketName;
    private readonly allowedMimeTypes;
    constructor(configService: ConfigService, prisma: PrismaService);
    private initializeS3;
    uploadSingleFile(userId: string, file: Express.Multer.File, options?: {
        folder?: string;
        isPublic?: boolean;
    }): Promise<any>;
    uploadMultipleFiles(userId: string, files: Express.Multer.File[], options?: {
        folder?: string;
        isPublic?: boolean;
    }): Promise<{
        total: number;
        successful: number;
        failed: number;
        results: any[];
    }>;
    uploadImage(userId: string, image: Express.Multer.File, options?: {
        resizeWidth?: number;
        resizeHeight?: number;
        quality?: number;
        generateThumbnails?: boolean;
    }): Promise<{
        id: string;
        fileName: string;
        originalName: string;
        mimeType: string;
        size: number;
        fileType: string;
        url: string;
        thumbnails: any[];
        uploadedAt: Date;
    }>;
    uploadVideo(userId: string, video: Express.Multer.File, options?: {
        title?: string;
        description?: string;
    }): Promise<{
        id: string;
        fileName: string;
        originalName: string;
        mimeType: string;
        size: number;
        fileType: string;
        url: string;
        title: string;
        description: string;
        uploadedAt: Date;
    }>;
    uploadDocument(userId: string, document: Express.Multer.File, options?: {
        title?: string;
        description?: string;
    }): Promise<{
        id: string;
        fileName: string;
        originalName: string;
        mimeType: string;
        size: number;
        fileType: string;
        url: string;
        title: string;
        description: string;
        uploadedAt: Date;
    }>;
    getUserFiles(userId: string, options: {
        page: number;
        limit: number;
        type?: string;
    }): Promise<{
        files: {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            url: string;
            isPublic: boolean;
            fileName: string;
            originalName: string;
            mimeType: string;
            size: number;
            fileType: string;
            key: string;
            folder: string;
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
    getFile(fileId: string): Promise<{
        id: string;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        createdAt: Date;
        userId: string;
        updatedAt: Date;
        url: string;
        isPublic: boolean;
        fileName: string;
        originalName: string;
        mimeType: string;
        size: number;
        fileType: string;
        key: string;
        folder: string;
    }>;
    getDownloadUrl(fileId: string): Promise<{
        url: string;
    }>;
    deleteFile(userId: string, fileId: string): Promise<void>;
    shareFile(userId: string, fileId: string, shareOptions: {
        expiresAt?: Date;
        password?: string;
        downloadLimit?: number;
    }): Promise<{
        shareId: string;
        shareUrl: string;
        expiresAt: Date;
        hasPassword: boolean;
        downloadLimit: number;
    }>;
    getSharedFile(shareId: string): Promise<{
        file: {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            url: string;
            isPublic: boolean;
            fileName: string;
            originalName: string;
            mimeType: string;
            size: number;
            fileType: string;
            key: string;
            folder: string;
        };
        url: string;
        hasPassword: boolean;
        downloadCount: number;
        downloadLimit: number;
    }>;
    generatePresignedUrl(userId: string, urlData: {
        fileName: string;
        fileType: string;
        fileSize: number;
        folder?: string;
    }): Promise<{
        presignedUrl: string;
        key: string;
        fileName: string;
        fileType: string;
    }>;
    processFile(userId: string, fileId: string, processData?: any): Promise<{
        fileId: string;
        operation: any;
        status: string;
        startedAt: Date;
    }>;
    getAllFiles(options: {
        page: number;
        limit: number;
        userId?: string;
        type?: string;
    }): Promise<{
        files: {
            id: string;
            metadata: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
            userId: string;
            updatedAt: Date;
            url: string;
            isPublic: boolean;
            fileName: string;
            originalName: string;
            mimeType: string;
            size: number;
            fileType: string;
            key: string;
            folder: string;
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
    getUploadStats(): Promise<{
        totalFiles: number;
        totalSize: number;
        filesByType: {
            type: string;
            count: number;
            size: number;
        }[];
        topUsers: {
            userId: string;
            email: string;
            name: string;
            fileCount: number;
        }[];
        recentUploads: number;
    }>;
    cleanupFiles(days?: number): Promise<{
        deletedCount: number;
        errorCount: number;
        totalProcessed: number;
    }>;
    private getFileType;
    private generateFileName;
    private generateFileKey;
    uploadCV(file: Express.Multer.File): Promise<{
        url: string;
        fileName: string;
        size: number;
    }>;
}
