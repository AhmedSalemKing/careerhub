"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileValidationUtil = void 0;
const common_1 = require("@nestjs/common");
class FileValidationUtil {
    static validateImageFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No image file provided');
        }
        if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Invalid image format. Allowed formats: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`);
        }
        if (file.size > this.MAX_FILE_SIZES.image) {
            throw new common_1.BadRequestException(`Image file too large. Maximum size: ${this.MAX_FILE_SIZES.image / 1024 / 1024}MB`);
        }
    }
    static validateVideoFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No video file provided');
        }
        if (!this.ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Invalid video format. Allowed formats: ${this.ALLOWED_VIDEO_TYPES.join(', ')}`);
        }
        if (file.size > this.MAX_FILE_SIZES.video) {
            throw new common_1.BadRequestException(`Video file too large. Maximum size: ${this.MAX_FILE_SIZES.video / 1024 / 1024}MB`);
        }
    }
    static validateDocumentFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No document file provided');
        }
        if (!this.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Invalid document format. Allowed formats: ${this.ALLOWED_DOCUMENT_TYPES.join(', ')}`);
        }
        if (file.size > this.MAX_FILE_SIZES.document) {
            throw new common_1.BadRequestException(`Document file too large. Maximum size: ${this.MAX_FILE_SIZES.document / 1024 / 1024}MB`);
        }
    }
    static validateGeneralFile(file) {
        if (!file) {
            throw new common_1.BadRequestException('No file provided');
        }
        const allAllowedTypes = [
            ...this.ALLOWED_IMAGE_TYPES,
            ...this.ALLOWED_VIDEO_TYPES,
            ...this.ALLOWED_DOCUMENT_TYPES,
        ];
        if (!allAllowedTypes.includes(file.mimetype)) {
            throw new common_1.BadRequestException(`Invalid file format. Allowed formats: ${allAllowedTypes.join(', ')}`);
        }
        if (file.size > this.MAX_FILE_SIZES.general) {
            throw new common_1.BadRequestException(`File too large. Maximum size: ${this.MAX_FILE_SIZES.general / 1024 / 1024}MB`);
        }
    }
    static getFileType(mimetype) {
        if (this.ALLOWED_IMAGE_TYPES.includes(mimetype)) {
            return 'image';
        }
        if (this.ALLOWED_VIDEO_TYPES.includes(mimetype)) {
            return 'video';
        }
        if (this.ALLOWED_DOCUMENT_TYPES.includes(mimetype)) {
            return 'document';
        }
        return null;
    }
    static sanitizeFileName(fileName) {
        return fileName
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/\s+/g, '_')
            .toLowerCase();
    }
    static generateUniqueFileName(originalName) {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2);
        const extension = originalName.split('.').pop();
        const nameWithoutExtension = originalName.split('.').slice(0, -1).join('.');
        const sanitizedName = this.sanitizeFileName(nameWithoutExtension);
        return `${sanitizedName}_${timestamp}_${random}.${extension}`;
    }
    static isImageFile(mimetype) {
        return this.ALLOWED_IMAGE_TYPES.includes(mimetype);
    }
    static isVideoFile(mimetype) {
        return this.ALLOWED_VIDEO_TYPES.includes(mimetype);
    }
    static isDocumentFile(mimetype) {
        return this.ALLOWED_DOCUMENT_TYPES.includes(mimetype);
    }
}
exports.FileValidationUtil = FileValidationUtil;
FileValidationUtil.ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
];
FileValidationUtil.ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/webm',
];
FileValidationUtil.ALLOWED_DOCUMENT_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
];
FileValidationUtil.MAX_FILE_SIZES = {
    image: 10 * 1024 * 1024,
    video: 500 * 1024 * 1024,
    document: 50 * 1024 * 1024,
    general: 20 * 1024 * 1024,
};
//# sourceMappingURL=file-validation.util.js.map