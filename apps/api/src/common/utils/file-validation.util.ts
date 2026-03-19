import { BadRequestException } from '@nestjs/common';

export class FileValidationUtil {
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ];

  private static readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/avi',
    'video/mov',
    'video/wmv',
    'video/webm',
  ];

  private static readonly ALLOWED_DOCUMENT_TYPES = [
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

  private static readonly MAX_FILE_SIZES = {
    image: 10 * 1024 * 1024, // 10MB
    video: 500 * 1024 * 1024, // 500MB
    document: 50 * 1024 * 1024, // 50MB
    general: 20 * 1024 * 1024, // 20MB
  };

  static validateImageFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No image file provided');
    }

    if (!this.ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid image format. Allowed formats: ${this.ALLOWED_IMAGE_TYPES.join(', ')}`
      );
    }

    if (file.size > this.MAX_FILE_SIZES.image) {
      throw new BadRequestException(
        `Image file too large. Maximum size: ${this.MAX_FILE_SIZES.image / 1024 / 1024}MB`
      );
    }
  }

  static validateVideoFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No video file provided');
    }

    if (!this.ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid video format. Allowed formats: ${this.ALLOWED_VIDEO_TYPES.join(', ')}`
      );
    }

    if (file.size > this.MAX_FILE_SIZES.video) {
      throw new BadRequestException(
        `Video file too large. Maximum size: ${this.MAX_FILE_SIZES.video / 1024 / 1024}MB`
      );
    }
  }

  static validateDocumentFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No document file provided');
    }

    if (!this.ALLOWED_DOCUMENT_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid document format. Allowed formats: ${this.ALLOWED_DOCUMENT_TYPES.join(', ')}`
      );
    }

    if (file.size > this.MAX_FILE_SIZES.document) {
      throw new BadRequestException(
        `Document file too large. Maximum size: ${this.MAX_FILE_SIZES.document / 1024 / 1024}MB`
      );
    }
  }

  static validateGeneralFile(file: Express.Multer.File): void {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const allAllowedTypes = [
      ...this.ALLOWED_IMAGE_TYPES,
      ...this.ALLOWED_VIDEO_TYPES,
      ...this.ALLOWED_DOCUMENT_TYPES,
    ];

    if (!allAllowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file format. Allowed formats: ${allAllowedTypes.join(', ')}`
      );
    }

    if (file.size > this.MAX_FILE_SIZES.general) {
      throw new BadRequestException(
        `File too large. Maximum size: ${this.MAX_FILE_SIZES.general / 1024 / 1024}MB`
      );
    }
  }

  static getFileType(mimetype: string): 'image' | 'video' | 'document' | null {
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

  static sanitizeFileName(fileName: string): string {
    // Remove special characters and replace spaces with underscores
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\s+/g, '_')
      .toLowerCase();
  }

  static generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const extension = originalName.split('.').pop();
    const nameWithoutExtension = originalName.split('.').slice(0, -1).join('.');
    const sanitizedName = this.sanitizeFileName(nameWithoutExtension);
    
    return `${sanitizedName}_${timestamp}_${random}.${extension}`;
  }

  static isImageFile(mimetype: string): boolean {
    return this.ALLOWED_IMAGE_TYPES.includes(mimetype);
  }

  static isVideoFile(mimetype: string): boolean {
    return this.ALLOWED_VIDEO_TYPES.includes(mimetype);
  }

  static isDocumentFile(mimetype: string): boolean {
    return this.ALLOWED_DOCUMENT_TYPES.includes(mimetype);
  }
}
