import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class DailyService implements OnModuleInit {
  private readonly logger = new Logger(DailyService.name);
  private readonly apiKey = process.env.DAILY_API_KEY;
  private readonly domain = process.env.DAILY_DOMAIN || 'deveway';
  private readonly appUrl = process.env.APP_URL || process.env.API_URL || 'https://api.deveways.com';
  private readonly baseUrl = 'https://api.daily.co/v1';

  async onModuleInit() {
    await this.registerWebhook();
  }

  private async request(path: string, method = 'GET', body?: object) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Daily API ${method} ${path} failed: ${text}`);
    }
    if (method === 'DELETE') return null;
    return res.json();
  }

  async createRoom(courseId: string): Promise<{ roomUrl: string; roomName: string }> {
    const roomName = `course-${courseId}-${Date.now()}`;
    const data = await this.request('/rooms', 'POST', {
      name: roomName,
      properties: {
        enable_chat: true,
        enable_screenshare: true,
        enable_recording: 'cloud',
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
      },
    });
    return {
      roomUrl: `https://${this.domain}.daily.co/${roomName}`,
      roomName: data.name,
    };
  }

  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.request(`/rooms/${roomName}`, 'DELETE');
    } catch (e) {
      this.logger.warn(`Could not delete room ${roomName}: ${e.message}`);
    }
  }

  async createToken(roomName: string, isOwner: boolean): Promise<string> {
    const data = await this.request('/meeting-tokens', 'POST', {
      properties: {
        room_name: roomName,
        is_owner: isOwner,
        start_cloud_recording: isOwner,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
      },
    });
    return data.token;
  }

  async getRecordingForRoom(roomName: string): Promise<string | null> {
    try {
      const data = await this.request(`/recordings?room_name=${roomName}`);
      if (data?.data?.length > 0) {
        const recording = data.data[0];
        const accessLink = await this.request(`/recordings/${recording.id}/access-link`, 'GET');
        return accessLink?.download_link || null;
      }
    } catch (e) {
      this.logger.warn(`Could not fetch recordings for room ${roomName}: ${e.message}`);
    }
    return null;
  }

  async registerWebhook(): Promise<void> {
    const webhookUrl = `${this.appUrl}/api/webhooks/daily`;
    try {
      const existing = await this.request('/webhooks');
      const alreadyExists = existing?.data?.some((w: any) => w.url === webhookUrl);
      if (alreadyExists) {
        this.logger.log('Daily webhook already registered');
        return;
      }
      await this.request('/webhooks', 'POST', {
        url: webhookUrl,
        event_types: ['recording.ready', 'recording.started'],
      });
      this.logger.log(`Daily webhook registered: ${webhookUrl}`);
    } catch (e) {
      this.logger.warn(`Could not register Daily webhook: ${e.message}`);
    }
  }
}
