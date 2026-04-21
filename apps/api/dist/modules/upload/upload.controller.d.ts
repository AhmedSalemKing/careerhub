import { Response } from 'express';
import { UploadService } from './upload.service';
import { User } from '@prisma/client';
export declare class UploadController {
    private readonly uploadService;
    constructor(uploadService: UploadService);
    uploadCV(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {
            url: string;
            fileName: string;
            size: number;
        };
    }>;
    uploadSingleFile(user: User, file: Express.Multer.File, folder?: string, isPublic?: string): Promise<{
        success: boolean;
        message: string;
        data: any;
    }>;
    uploadMultipleFiles(user: User, files: Express.Multer.File[], folder?: string, isPublic?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            total: number;
            successful: number;
            failed: number;
            results: any[];
        };
    }>;
    uploadImage(image: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            url: string;
            fileName: string;
            size: number;
            mimeType: string;
        };
    }>;
    uploadFile(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {
            url: string;
            fileName: string;
            size: number;
            type: string;
        };
    }>;
    uploadVideo(video: Express.Multer.File): Promise<{
        success: boolean;
        message: string;
        data: {
            url: string;
            fileName: string;
            size: number;
            mimeType: string;
        };
    }>;
    uploadDocument(user: User, document: Express.Multer.File, title?: string, description?: string): Promise<{
        success: boolean;
        message: string;
        data: {
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
        };
    }>;
    getMyFiles(user: User, page?: number, limit?: number, type?: string): Promise<{
        success: boolean;
        data: {
            files: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                isPublic: boolean;
                fileName: string;
                originalName: string;
                mimeType: string;
                size: number;
                fileType: string;
                key: string;
                url: string;
                folder: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
            }[];
            meta: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        };
    }>;
    serveCV(filename: string, res: Response, download?: string): Promise<void>;
    getFile(fileId: string): Promise<{
        success: boolean;
        data: {
            file: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                isPublic: boolean;
                fileName: string;
                originalName: string;
                mimeType: string;
                size: number;
                fileType: string;
                key: string;
                url: string;
                folder: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
            };
        };
    }>;
    downloadFile(fileId: string): Promise<{
        success: boolean;
        data: {
            downloadUrl: {
                url: string;
            };
        };
    }>;
    deleteFile(user: User, fileId: string): Promise<void>;
    shareFile(user: User, fileId: string, shareData: {
        expiresAt?: Date;
        password?: string;
        downloadLimit?: number;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            shareLink: {
                shareId: string;
                shareUrl: string;
                expiresAt: Date;
                hasPassword: boolean;
                downloadLimit: number;
            };
        };
    }>;
    getSharedFile(shareId: string): Promise<{
        success: boolean;
        data: {
            file: {
                file: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    userId: string;
                    isPublic: boolean;
                    fileName: string;
                    originalName: string;
                    mimeType: string;
                    size: number;
                    fileType: string;
                    key: string;
                    url: string;
                    folder: string;
                    metadata: import("@prisma/client/runtime/library").JsonValue | null;
                };
                url: string;
                hasPassword: boolean;
                downloadCount: number;
                downloadLimit: number;
            };
        };
    }>;
    generatePresignedUrl(user: User, urlData: {
        fileName: string;
        fileType: string;
        fileSize: number;
        folder?: string;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            presignedUrl: string;
            key: string;
            fileName: string;
            fileType: string;
        };
    }>;
    processFile(user: User, fileId: string, processData: {
        operation: 'resize' | 'compress' | 'convert' | 'extract_thumbnails';
        options?: Record<string, any>;
    }): Promise<{
        success: boolean;
        message: string;
        data: {
            fileId: string;
            operation: any;
            status: string;
            startedAt: Date;
        };
    }>;
    getAllFiles(page?: number, limit?: number, userId?: string, type?: string): Promise<{
        success: boolean;
        data: {
            files: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                userId: string;
                isPublic: boolean;
                fileName: string;
                originalName: string;
                mimeType: string;
                size: number;
                fileType: string;
                key: string;
                url: string;
                folder: string;
                metadata: import("@prisma/client/runtime/library").JsonValue | null;
            }[];
            meta: {
                total: number;
                page: number;
                limit: number;
                totalPages: number;
                hasNext: boolean;
                hasPrev: boolean;
            };
        };
    }>;
    getUploadStats(): Promise<{
        success: boolean;
        data: {
            stats: {
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
            };
        };
    }>;
    cleanupFiles(days?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            deletedCount: number;
            errorCount: number;
            totalProcessed: number;
        };
    }>;
}
