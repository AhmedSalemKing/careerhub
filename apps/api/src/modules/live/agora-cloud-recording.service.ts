import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AgoraCloudRecordingService {
  private readonly logger = new Logger(AgoraCloudRecordingService.name);

  private get appId() { return process.env.AGORA_APP_ID; }
  private get baseUrl() { return `https://api.agora.io/v1/apps/${this.appId}/cloud_recording`; }

  private get authHeader() {
    const creds = Buffer.from(`${process.env.AGORA_CUSTOMER_KEY}:${process.env.AGORA_CUSTOMER_SECRET}`).toString('base64');
    return `Basic ${creds}`;
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
        if (!res.ok) throw new Error(`Agora API ${res.status}: ${text}`);
        return JSON.parse(text);
      } catch (err) {
        this.logger.warn(`Attempt ${attempt}/${retries}: ${err.message}`);
        if (attempt === retries) throw err;
        await new Promise(r => setTimeout(r, attempt * 2000));
      }
    }
  }

  async acquireResource(channelName: string, uid: string): Promise<string> {
    const data = await this.request('POST', '/acquire', {
      cname: channelName,
      uid,
      clientRequest: { resourceExpiredHour: 24 },
    });
    return data.resourceId;
  }

  async startRecording(resourceId: string, channelName: string, uid: string, token: string): Promise<string> {
    const data = await this.request('POST', `/resourceid/${resourceId}/mode/mix/start`, {
      cname: channelName,
      uid,
      clientRequest: {
        token,
        recordingConfig: {
          maxIdleTime: 30,
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
          bucket: process.env.B2_BUCKET,
          accessKey: process.env.B2_KEY_ID,
          secretKey: process.env.B2_APPLICATION_KEY,
          fileNamePrefix: ['recordings', channelName],
          extensionParams: {
            endpoint: process.env.B2_ENDPOINT,
          },
        },
      },
    });
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
