export declare class CloudinaryService {
    constructor();
    uploadFile(file: Express.Multer.File, folder: string, resourceType?: 'image' | 'video' | 'raw' | 'auto'): Promise<{
        url: string;
        publicId: string;
    }>;
}
