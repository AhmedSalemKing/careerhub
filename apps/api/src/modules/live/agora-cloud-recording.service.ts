import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AgoraCloudRecordingService {
  private readonly logger = new Logger(AgoraCloudRecordingService.name);

  private get appId() { return process.env.AGORA_APP_ID; }
  private get baseUrl() { return `https://api.agora.io/v1/apps/${this.appId}/cloud_recording`; }

  // Accept both names: the deployment currently uses B2_*, while new Render
  // setups use the explicit BACKBLAZE_B2_* names.
  private get b2Endpoint() { return process.env.B2_ENDPOINT || process.env.BACKBLAZE_B2_ENDPOINT; }
  private get b2Bucket() { return process.env.B2_BUCKET || process.env.BACKBLAZE_B2_BUCKET; }
  private get b2KeyId() { return process.env.B2_KEY_ID || process.env.BACKBLAZE_B2_KEY_ID; }
  private get b2ApplicationKey() { return process.env.B2_APPLICATION_KEY || process.env.BACKBLAZE_B2_APPLICATION_KEY; }

  private requireStorage(): void {
    const missing: string[] = [];
    if (!this.appId) missing.push('AGORA_APP_ID');
    if (!this.b2Endpoint) missing.push('B2_ENDPOINT or BACKBLAZE_B2_ENDPOINT');
    if (!this.b2Bucket) missing.push('B2_BUCKET or BACKBLAZE_B2_BUCKET');
    if (!this.b2KeyId) missing.push('B2_KEY_ID or BACKBLAZE_B2_KEY_ID');
    if (!this.b2ApplicationKey) missing.push('B2_APPLICATION_KEY or BACKBLAZE_B2_APPLICATION_KEY');
    if (missing.length > 0) {
      throw new Error(`Missing required storage environment variables: ${missing.join(', ')}`);
    }
  }

  private get authHeader() {
    const creds = Buffer.from(`${process.env.AGORA_CUSTOMER_KEY}:${process.env.AGORA_CUSTOMER_SECRET}`).toString('base64');
    return `Basic ${creds}`;
  }

  private requireEnv(keys: string[]): void {
    const missing = keys.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
  }

  private async request(method: string, path: string, body?: any, retries = 3): Promise<any> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const res = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: { Authorization: this.authHeader, 'Content-Type': 'application/json' },
          body: body ? JSON.stringify(body) : undefined,
        });
        const text = await res.text();
        if (!res.ok) {
          // Attach the HTTP status so a 4xx (bad configuration, unknown
          // resource) is not retried: retrying it only delays the real error.
          const error: any = new Error(`Agora API ${res.status}: ${text}`);
          error.status = res.status;
          throw error;
        }
        return text ? JSON.parse(text) : {};
      } catch (err) {
        const status = (err as any)?.status;
        const retryable = !status || status >= 500;
        this.logger.warn(`Attempt ${attempt}/${retries}: ${err.message}`);
        if (!retryable || attempt === retries) throw err;
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }

  async acquireResource(channelName: string, uid: string): Promise<string> {
    this.requireEnv(['AGORA_APP_ID', 'AGORA_CUSTOMER_KEY', 'AGORA_CUSTOMER_SECRET']);
    const data = await this.request('POST', '/acquire', {
      cname: channelName,
      uid,
      clientRequest: { resourceExpiredHour: 24 },
    });
    this.logger.log(`Acquired Agora resource ${data.resourceId} for channel ${channelName}`);
    return data.resourceId;
  }

  async startRecording(resourceId: string, channelName: string, uid: string, token: string): Promise<string> {
    this.requireEnv([
      'AGORA_APP_ID',
      'AGORA_CUSTOMER_KEY',
      'AGORA_CUSTOMER_SECRET',
    ]);
    this.requireStorage();
    const data = await this.request('POST', `/resourceid/${resourceId}/mode/mix/start`, {
      cname: channelName,
      uid,
      clientRequest: {
        token,
        recordingConfig: {
          // The server starts the recorder before the instructor's client has
          // finished joining (cold start, camera permission). Keep the
          // recorder waiting up to five minutes instead of exiting after 30s.
          maxIdleTime: 300,
          streamTypes: 2,
          channelType: 1,
          videoStreamType: 0,
          transcodingConfig: {
            width: 1280,
            height: 720,
            fps: 24,
            bitrate: 2000,
            mixedVideoLayout: 1,
          },
          recordingFileConfig: {
            avFileType: ['hls', 'mp4'],
          },
        },
        storageConfig: {
          // vendor 11 = S3-compatible storage. vendor 1 is AWS S3 only and is
          // rejected by Agora when pointed at a non-AWS endpoint such as B2.
          vendor: 11,
          region: 0,
          bucket: this.b2Bucket,
          accessKey: this.b2KeyId,
          secretKey: this.b2ApplicationKey,
          fileNamePrefix: ['recordings', channelName],
          extensionParams: {
            endpoint: this.b2Endpoint,
          },
        },
      },
    });
    this.logger.log(
      `Started Agora cloud recording sid=${data.sid} resource=${resourceId} channel=${channelName} vendor=11 region=0`,
    );
    return data.sid;
  }

  async stopRecording(resourceId: string, sid: string, channelName: string, uid: string): Promise<void> {
    try {
      await this.request('POST', `/resourceid/${resourceId}/sid/${sid}/mode/mix/stop`, {
        cname: channelName,
        uid,
        clientRequest: {},
      });
    } catch (err) {
      if (err.message?.includes('404') || err.message?.includes('not started')) {
        this.logger.warn(`Recording ${sid} already stopped`);
        return;
      }
      throw err;
    }
  }

  async queryRecording(resourceId: string, sid: string): Promise<any> {
    return this.request('GET', `/resourceid/${resourceId}/sid/${sid}/mode/mix/query`);
  }

  generateRtcToken(channelName: string, uid: number, role: 'publisher' | 'subscriber'): string {
    this.requireEnv(['AGORA_APP_ID', 'AGORA_APP_CERTIFICATE']);
    const { RtcTokenBuilder, RtcRole } = require('agora-token');
    const currentTime = Math.floor(Date.now() / 1000);
    const expireTime = currentTime + 3600;
    const agoraRole = role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;
    return RtcTokenBuilder.buildTokenWithUid(
      process.env.AGORA_APP_ID,
      process.env.AGORA_APP_CERTIFICATE,
      channelName,
      uid,
      agoraRole,
      expireTime,
      expireTime,
    );
  }
}
