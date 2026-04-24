export declare class FileValidationUtil {
    private static readonly ALLOWED_IMAGE_TYPES;
    private static readonly ALLOWED_VIDEO_TYPES;
    private static readonly ALLOWED_DOCUMENT_TYPES;
    private static readonly MAX_FILE_SIZES;
    static validateImageFile(file: Express.Multer.File): void;
    static validateVideoFile(file: Express.Multer.File): void;
    static validateDocumentFile(file: Express.Multer.File): void;
    static validateGeneralFile(file: Express.Multer.File): void;
    static getFileType(mimetype: string): 'image' | 'video' | 'document' | null;
    static sanitizeFileName(fileName: string): string;
    static generateUniqueFileName(originalName: string): string;
    static isImageFile(mimetype: string): boolean;
    static isVideoFile(mimetype: string): boolean;
    static isDocumentFile(mimetype: string): boolean;
}
