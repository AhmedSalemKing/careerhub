import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * Uploads videos to Bunny.net Stream and returns an HLS playback URL.
 *
 * This service is used ONLY for video uploads. Images and documents keep using
 * their existing providers (Cloudinary / S3) and are not affected by it.
 *
 * Required env vars (see .env.example):
 *   BUNNY_API_KEY       - Bunny Stream library API key (AccessKey)
 *   BUNNY_LIBRARY_ID    - Bunny Stream video library id
 *   BUNNY_CDN_HOSTNAME  - Pull zone / CDN hostname (e.g. vz-xxxx.b-cdn.net)
 */
@Injectable()
export class BunnyStreamService {
  private readonly logger = new Logger(BunnyStreamService.name);

  private readonly apiKey = process.env.BUNNY_API_KEY || '';
  private readonly libraryId = process.env.BUNNY_LIBRARY_ID || '';
  private readonly cdnHostname = (process.env.BUNNY_CDN_HOSTNAME || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');

  private get isConfigured(): boolean {
    return !!(this.apiKey && this.libraryId && this.cdnHostname);
  }

  /** True when all required Bunny env vars are present. */
  get isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Uploads a video buffer to Bunny Stream.
   * @returns the HLS (.m3u8) playback URL and the created video id.
   */
  async uploadVideo(file: Express.Multer.File): Promise<{ url: string; videoId: string }> {
    if (!file) {
      throw new InternalServerErrorException('No video file provided');
    }
    if (!file.buffer || file.buffer.length === 0) {
      throw new InternalServerErrorException('Video buffer is empty or missing');
    }
    if (!this.isConfigured) {
      throw new InternalServerErrorException(
        'Bunny Stream is not configured (BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_HOSTNAME)',
      );
    }

    const videoId = uuidv4();
    const createUrl = `https://video.bunnycdn.com/library/${this.libraryId}/videos`;

    try {
      // 1. Create the video object in the library to obtain an id.
      const createRes = await axios.post(
        createUrl,
        { title: file.originalname || videoId },
        {
          headers: {
            AccessKey: this.apiKey,
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          timeout: 30000,
        },
      );

      const createdId = createRes?.data?.guid || videoId;

      // 2. Upload the binary content into the created video object.
      const uploadUrl = `https://video.bunnycdn.com/library/${this.libraryId}/videos/${createdId}`;
      await axios.put(uploadUrl, file.buffer, {
        headers: {
          AccessKey: this.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 0, // large uploads: no client-side timeout
      });

      const url = this.getHlsUrl(createdId);
      this.logger.log(`Bunny Stream upload successful: ${url}`);
      return { url, videoId: createdId };
    } catch (error: any) {
      const detail = error?.response?.data ? JSON.stringify(error.response.data) : error?.message;
      this.logger.error(`Bunny Stream upload error: ${detail}`);
      throw new InternalServerErrorException('Failed to upload video to Bunny Stream');
    }
  }

  /** Builds the HLS playlist URL for a Bunny Stream video id. */
  getHlsUrl(videoId: string): string {
    return `https://${this.cdnHostname}/${videoId}/playlist.m3u8`;
  }
}
