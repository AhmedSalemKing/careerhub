import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class CloudflareService {
  private readonly logger = new Logger(CloudflareService.name);
  private readonly apiToken: string;
  private readonly accountId: string;
  private readonly baseUrl: string;

  constructor(private configService: ConfigService) {
    this.apiToken = this.configService.get('CLOUDFLARE_API_TOKEN');
    this.accountId = this.configService.get('CLOUDFLARE_ACCOUNT_ID');
    this.baseUrl = `https://api.cloudflare.com/client/v4/accounts/${this.accountId}`;
  }

  async createUploadUrl(options: {
    maxDurationSeconds?: number;
    requiresSignedURLs?: boolean;
    allowedOrigins?: string[];
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/stream/direct_upload`,
        {
          maxDurationSeconds: options.maxDurationSeconds || 3600,
          requiresSignedURLs: options.requiresSignedURLs || true,
          allowedOrigins: options.allowedOrigins || [],
          watermark: {
            uid: this.configService.get('CLOUDFLARE_WATERMARK_ID'),
            opacity: 0.1,
            position: 'bottom-right',
          },
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to create upload URL', error);
      throw error;
    }
  }

  async getSignedPlaybackUrl(streamId: string, options: {
    expiresIn?: string;
    allowedOrigins?: string[];
  } = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/stream/${streamId}/token`,
        {
          exp: this.getExpirationTime(options.expiresIn || '1h'),
          allowedOrigins: options.allowedOrigins || [],
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const token = response.data.result.token;
        return `https://cloudflarestream.com/${streamId}/manifest/video.m3u8?token=${token}`;
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to get signed playback URL', error);
      throw error;
    }
  }

  async getVideoStatus(streamId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/stream/${streamId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to get video status', error);
      throw error;
    }
  }

  async processVideo(streamId: string, options: {
    generateThumbnail?: boolean;
    generateSubtitles?: boolean;
    quality?: string;
  }) {
    try {
      // Update video with processing options
      const response = await axios.post(
        `${this.baseUrl}/stream/${streamId}`,
        {
          thumbnailTimestampPct: options.generateThumbnail ? 10 : null,
          requireSignedURLs: true,
          uploaded: new Date().toISOString(),
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const video = response.data.result;
        
        // Generate thumbnail if requested
        let thumbnailUrl = null;
        if (options.generateThumbnail && video.thumbnail) {
          thumbnailUrl = `https://videodelivery.net/${video.uid}/thumbnails/thumbnail.jpg`;
        }

        return {
          status: video.status,
          thumbnailUrl,
          duration: video.duration?.duration,
          availableQualities: video.maxResolution?.height ? [`${video.maxResolution.height}p`] : ['720p'],
        };
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to process video', error);
      throw error;
    }
  }

  async deleteVideo(streamId: string) {
    try {
      const response = await axios.delete(
        `${this.baseUrl}/stream/${streamId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      if (!response.data.success) {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }

      this.logger.log(`Video deleted from Cloudflare: ${streamId}`);
    } catch (error) {
      this.logger.error('Failed to delete video', error);
      throw error;
    }
  }

  async transcodeVideo(streamId: string, options: {
    qualities?: string[];
    format?: string;
    generateThumbnail?: boolean;
  }) {
    try {
      // Cloudflare Stream automatically handles transcoding
      // We can trigger a re-process if needed
      const response = await axios.post(
        `${this.baseUrl}/stream/${streamId}`,
        {
          // Cloudflare will automatically create multiple renditions
          // We can specify custom settings if needed
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return {
          jobId: `transcode_${streamId}_${Date.now()}`,
          status: 'processing',
          estimatedTime: 300, // 5 minutes estimate
        };
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to transcode video', error);
      throw error;
    }
  }

  async getVideoAnalytics(streamId: string) {
    try {
      // Cloudflare Stream provides basic analytics
      const response = await axios.get(
        `${this.baseUrl}/stream/${streamId}/views`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to get video analytics', error);
      throw error;
    }
  }

  async listVideos(options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('per_page', options.limit.toString());
      if (options.status) params.append('status', options.status);

      const response = await axios.get(
        `${this.baseUrl}/stream?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to list videos', error);
      throw error;
    }
  }

  getLicenseUrl(streamId: string): string {
    // Cloudflare Stream uses token-based authentication
    // The license URL is embedded in the signed playback URL
    return `${this.baseUrl}/stream/${streamId}/drm/license`;
  }

  async getWebhookSigningKey(): Promise<string> {
    // Cloudflare Stream webhooks can be signed
    // This would return the public key for verification
    return this.configService.get('CLOUDFLARE_WEBHOOK_SIGNING_KEY') || '';
  }

  async verifyWebhookSignature(payload: string, signature: string): Promise<boolean> {
    try {
      // Verify webhook signature using Cloudflare's public key
      const signingKey = await this.getWebhookSigningKey();
      
      if (!signingKey) {
        this.logger.warn('No webhook signing key configured');
        return true; // Allow if no key configured
      }

      // Implement signature verification logic
      // This would use crypto to verify the signature
      return true; // Placeholder
    } catch (error) {
      this.logger.error('Failed to verify webhook signature', error);
      return false;
    }
  }

  async createWatermark(options: {
    name: string;
    pngBase64: string;
    opacity?: number;
    position?: string;
  }) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/stream/watermarks`,
        {
          name: options.name,
          png: options.pngBase64,
          opacity: options.opacity || 0.1,
          position: options.position || 'bottom-right',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to create watermark', error);
      throw error;
    }
  }

  async getUsageStats() {
    try {
      const response = await axios.get(
        `${this.baseUrl}/stream/analytics`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
          },
        }
      );

      if (response.data.success) {
        return response.data.result;
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to get usage stats', error);
      throw error;
    }
  }

  private getExpirationTime(expiresIn: string): number {
    const now = Math.floor(Date.now() / 1000);
    const duration = this.parseDuration(expiresIn);
    return now + duration;
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid duration format: ${duration}`);
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value;
      case 'm': return value * 60;
      case 'h': return value * 3600;
      case 'd': return value * 86400;
      default: throw new Error(`Unknown duration unit: ${unit}`);
    }
  }

  async generateThumbnail(streamId: string, timestampPercent: number = 10) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/stream/${streamId}`,
        {
          thumbnailTimestampPct: timestampPercent,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data.success) {
        const video = response.data.result;
        return {
          thumbnailUrl: `https://videodelivery.net/${video.uid}/thumbnails/thumbnail.jpg`,
          status: 'generated',
        };
      } else {
        throw new Error(`Cloudflare API error: ${JSON.stringify(response.data.errors)}`);
      }
    } catch (error) {
      this.logger.error('Failed to generate thumbnail', error);
      throw error;
    }
  }

  async getEmbedCode(streamId: string, options: {
    width?: number;
    height?: number;
    autoplay?: boolean;
    muted?: boolean;
    controls?: boolean;
  } = {}) {
    const signedUrl = await this.getSignedPlaybackUrl(streamId);
    
    const embedOptions = {
      width: options.width || 640,
      height: options.height || 360,
      autoplay: options.autoplay || false,
      muted: options.muted || false,
      controls: options.controls !== false,
    };

    return {
      iframe: `<iframe src="${signedUrl}" width="${embedOptions.width}" height="${embedOptions.height}" frameborder="0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`,
      playerOptions: embedOptions,
    };
  }
}
