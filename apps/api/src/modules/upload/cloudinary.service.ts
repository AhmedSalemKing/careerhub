import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string,
    resourceType: 'image' | 'video' | 'raw' | 'auto' = 'raw',
  ): Promise<{ url: string; publicId: string }> {
    this.logger.log(`Uploading to Cloudinary: ${file?.originalname}, size: ${file?.size}, type: ${resourceType}`);

    // Validate file exists
    if (!file) {
      throw new Error('No file provided');
    }

    if (!file.buffer || file.buffer.length === 0) {
      this.logger.error('File buffer is empty or missing');
      throw new Error('File buffer is empty or missing');
    }

    return new Promise((resolve, reject) => {
      try {
        const upload = cloudinary.uploader.upload_stream(
          {
            folder: `deveway/${folder}`,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
          },
          (error, result) => {
            if (error) {
              this.logger.error('Cloudinary upload error:', error);
              return reject(error);
            }
            if (!result) {
              this.logger.error('No result from Cloudinary');
              return reject(new Error('No result from Cloudinary'));
            }
            
            const url = result.secure_url.startsWith('http')
              ? result.secure_url
              : `https:${result.secure_url}`;

            this.logger.log(`Upload successful: ${url}`);
            resolve({ url, publicId: result.public_id });
          },
        );

        // Create readable stream from buffer
        const readable = new Readable();
        readable._read = () => {}; // Required forReadable stream
        readable.push(file.buffer);
        readable.push(null); // Signal end of stream
        readable.pipe(upload);

      } catch (err) {
        this.logger.error('Stream creation error:', err);
        reject(err);
      }
    });
  }
}