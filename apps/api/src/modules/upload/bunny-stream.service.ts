import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

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

/** Every one of these has to be present for Bunny.net Stream to work. */
export const BUNNY_REQUIRED_ENV_VARS = [
  'BUNNY_API_KEY',
  'BUNNY_LIBRARY_ID',
  'BUNNY_CDN_HOSTNAME',
] as const;

/** The result of a successful upload — the player needs the full URLs. */
export interface BunnyUploadResult {
  /** Bunny's GUID of the created video (NOT the library id). */
  videoId: string;
  /** Full HLS playlist URL — https://{CDN_HOSTNAME}/{videoId}/playlist.m3u8 */
  videoUrl: string;
  /** Auto-generated thumbnail — https://{CDN_HOSTNAME}/{videoId}/thumbnail.jpg */
  thumbnailUrl: string;
}

/** The minimal shape of a Bunny video object this service cares about. */
export interface BunnyVideo {
  guid: string;
  title?: string;
  status?: number | string;
  duration?: number;
  thumbnailUrl?: string;
  [key: string]: any;
}

/** A file (or a raw buffer) that is about to be uploaded. */
export interface BunnyUploadInput {
  buffer: Buffer;
  originalname?: string;
  mimetype?: string;
}

/** Options accepted by {@link BunnyStreamService.uploadVideo}. */
export interface BunnyUploadOptions {
  /** The title shown in the Bunny library. */
  title?: string;
  /**
   * Called with every raw Bunny response while the upload runs. The test
   * script uses it to print what Bunny actually answered.
   */
  onRaw?: (event: {
    step: 'create' | 'upload';
    status: number;
    data: any;
  }) => void;
}

@Injectable()
export class BunnyStreamService {
  private readonly logger = new Logger(BunnyStreamService.name);

  private readonly apiKey: string;
  private readonly libraryId: string;
  private readonly cdnHostname: string;

  /**
   * Fails fast when the Bunny configuration is broken.
   *
   * A partially configured Bunny (e.g. the API key is there but the library id
   * is not) is a deployment mistake: it would only blow up later as a 500 on
   * the first upload. Failing here stops the boot with a clear message
   * instead. When *no* Bunny variable is set the feature is simply off and the
   * upload endpoint keeps its Cloudinary fallback, so that deployment must
   * still boot.
   */
  constructor() {
    this.apiKey = process.env.BUNNY_API_KEY || '';
    this.libraryId = process.env.BUNNY_LIBRARY_ID || '';
    this.cdnHostname = (process.env.BUNNY_CDN_HOSTNAME || '')
      .replace(/^https?:\/\//, '')
      .replace(/\/+$/, '');

    const missing = BUNNY_REQUIRED_ENV_VARS.filter((v) => !process.env[v]);

    if (missing.length === 0) {
      console.log(
        '[Bunny] Configured — Library:',
        process.env.BUNNY_LIBRARY_ID,
        'CDN:',
        process.env.BUNNY_CDN_HOSTNAME,
      );
      return;
    }

    if (missing.length === BUNNY_REQUIRED_ENV_VARS.length) {
      this.logger.warn(
        '[Bunny] Not configured — video uploads fall back to Cloudinary',
      );
      return;
    }

    throw new Error(`Missing required env var: ${missing[0]}`);
  }

  private get isConfigured(): boolean {
    return !!(this.apiKey && this.libraryId && this.cdnHostname);
  }

  /** True when all required Bunny env vars are present. */
  get isAvailable(): boolean {
    return this.isConfigured;
  }

  /**
   * Uploads a video to Bunny.net Stream.
   *
   * @param file  a Multer file or the raw bytes of the video
   * @param options.title  the title shown in the Bunny library
   * @returns the Bunny GUID plus the full HLS and thumbnail URLs
   */
  async uploadVideo(
    file: Express.Multer.File | Buffer | BunnyUploadInput,
    options: BunnyUploadOptions = {},
  ): Promise<BunnyUploadResult> {
    const buffer = Buffer.isBuffer(file) ? file : file?.buffer;
    const title =
      options.title ||
      (Buffer.isBuffer(file) ? undefined : file?.originalname) ||
      'upload';

    if (!buffer || buffer.length === 0) {
      throw new InternalServerErrorException('Video buffer is empty or missing');
    }
    if (!this.isConfigured) {
      throw new InternalServerErrorException(
        'Bunny Stream is not configured (BUNNY_API_KEY, BUNNY_LIBRARY_ID, BUNNY_CDN_HOSTNAME)',
      );
    }

    const createUrl = `https://video.bunnycdn.com/library/${this.libraryId}/videos`;

    try {
      // 1. Create the video object in the library to obtain its id.
      const createRes = await axios.post(
        createUrl,
        { title },
        {
          headers: {
            AccessKey: this.apiKey,
            'Content-Type': 'application/json',
            accept: 'application/json',
          },
          timeout: 30000,
        },
      );

      // The GUID is the id of the video — the library id is NOT part of the
      // playback URL. A response without a guid cannot be addressed, so it is
      // a hard failure instead of a silently broken URL.
      const videoId: string | undefined = createRes?.data?.guid;
      options.onRaw?.({ step: 'create', status: createRes?.status, data: createRes?.data });
      if (!videoId) {
        this.logger.error(
          `Bunny Stream did not return a guid: ${JSON.stringify(createRes?.data)}`,
        );
        throw new InternalServerErrorException(
          'Bunny Stream did not return a video id',
        );
      }

      // 2. Upload the binary content into the created video object.
      const uploadUrl = `https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`;
      const uploadRes = await axios.put(uploadUrl, buffer, {
        headers: {
          AccessKey: this.apiKey,
          'Content-Type': 'application/octet-stream',
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 0, // large uploads: no client-side timeout
      });
      options.onRaw?.({ step: 'upload', status: uploadRes?.status, data: uploadRes?.data });

      const videoUrl = this.getHlsUrl(videoId);
      this.logger.log(`Bunny Stream upload successful: ${videoUrl}`);
      return {
        videoId,
        videoUrl,
        thumbnailUrl: this.getThumbnailUrl(videoId),
      };
    } catch (error: any) {
      if (error instanceof InternalServerErrorException) throw error;
      const detail = error?.response?.data
        ? JSON.stringify(error.response.data)
        : error?.message;
      this.logger.error(`Bunny Stream upload error: ${detail}`);
      throw new InternalServerErrorException('Failed to upload video to Bunny Stream');
    }
  }

  /** Builds the HLS playlist URL for a Bunny Stream video id. */
  getHlsUrl(videoId: string): string {
    return `https://${this.cdnHostname}/${videoId}/playlist.m3u8`;
  }

  /** Builds the auto-generated thumbnail URL for a Bunny Stream video id. */
  getThumbnailUrl(videoId: string): string {
    return `https://${this.cdnHostname}/${videoId}/thumbnail.jpg`;
  }

  /** Lists the videos of the configured library. */
  async listVideos(page = 1, perPage = 100): Promise<BunnyVideo[]> {
    if (!this.isConfigured) {
      throw new InternalServerErrorException('Bunny Stream is not configured');
    }
    const res = await axios.get(
      `https://video.bunnycdn.com/library/${this.libraryId}/videos`,
      {
        headers: { AccessKey: this.apiKey, accept: 'application/json' },
        params: { page, perPage },
        timeout: 30000,
      },
    );
    const items = res?.data?.items;
    return Array.isArray(items) ? items : [];
  }

  /** Reads a single video object (status, duration, …) from the library. */
  async getVideo(videoId: string): Promise<BunnyVideo | null> {
    if (!this.isConfigured) {
      throw new InternalServerErrorException('Bunny Stream is not configured');
    }
    const res = await axios.get(
      `https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`,
      {
        headers: { AccessKey: this.apiKey, accept: 'application/json' },
        timeout: 30000,
      },
    );
    return res?.data ?? null;
  }

  /** Removes a video from the library. */
  async deleteVideo(videoId: string): Promise<void> {
    if (!this.isConfigured) {
      throw new InternalServerErrorException('Bunny Stream is not configured');
    }
    await axios.delete(
      `https://video.bunnycdn.com/library/${this.libraryId}/videos/${videoId}`,
      { headers: { AccessKey: this.apiKey }, timeout: 30000 },
    );
  }
}
