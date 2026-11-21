import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import type { UploadApiOptions } from 'cloudinary';
import { Readable } from 'stream';
import { randomUUID } from 'crypto';
import { assertFileMatchesDeclaredType, SAFE_EXTENSION_BY_MIME } from '../../common/file-sniff';

const EXTENSION_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.ms-excel': '.xls',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
  'application/vnd.ms-powerpoint': '.ppt',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'text/plain': '.txt',
  'application/zip': '.zip',
};

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

    // Single gate for every Cloudinary upload: the bytes must match the declared type, and script-capable
    // formats (SVG, HTML, PHP ...) are refused. Throws a 400 before anything leaves the server.
    assertFileMatchesDeclaredType(file);

    return new Promise((resolve, reject) => {
      try {
        const options: UploadApiOptions = {
          folder: `deveway/${folder}`,
          type: 'upload',
          resource_type: resourceType,
        };

        if (resourceType === 'raw') {
          // `upload_stream` has no filename metadata, so Cloudinary generates an
          // extension-less public id for `raw` assets (e.g. .../raw/upload/abc123).
          // The CDN then serves the file as `Content-Disposition: attachment;
          // filename="file"` and browsers save it without a .pdf extension.
          // Raw public ids MUST carry the extension, so build one explicitly.
          options.public_id = this.buildRawPublicId(file);
          options.use_filename = false;
          options.unique_filename = false;
        } else {
          // Random public id: the client's file name (often a person's name) never reaches the CDN URL
          options.use_filename = false;
          options.unique_filename = true;
          if (resourceType === 'image') options.allowed_formats = ['jpg', 'png', 'webp', 'gif'];
          if (resourceType === 'video') options.allowed_formats = ['mp4', 'webm', 'mov'];
        }

        const upload = cloudinary.uploader.upload_stream(
          options,
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

  /**
   * Public id for a `raw` upload: a random UUID plus an extension taken from the verified MIME type.
   * Cloudinary requires raw public ids to carry an extension so the CDN serves a sensible file name.
   * Nothing from the client's file name is used (no personal data, no attacker-chosen extension).
   */
  private buildRawPublicId(file: Express.Multer.File): string {
    const extension = SAFE_EXTENSION_BY_MIME[(file.mimetype || '').toLowerCase()] ?? '';
    return `${randomUUID()}${extension}`;
  }
}
