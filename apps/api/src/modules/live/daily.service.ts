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
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 6,
      },
    });
    return data.token;
  }

  // Returns both the Daily.co recording ID and a fresh pre-signed download URL.
  // The ID is stored so future calls can skip the list step.
  // The URL MUST NOT be cached — it expires after ~1 hour.
  private async fetchRecording(
    roomName: string,
    maxRetries = 10,
  ): Promise<{ id: string; url: string } | null> {
    const apiKey = this.apiKey;

    for (let i = 0; i < maxRetries; i++) {
      if (i > 0) await new Promise(r => setTimeout(r, 15_000));
      try {
        const listRes = await fetch(
          `${this.baseUrl}/recordings?room_name=${encodeURIComponent(roomName)}&limit=10`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
        const listJson = await listRes.json();
        const recordings: any[] = listJson?.data ?? [];

        const finished = recordings
          .filter((r: any) => r.status === 'finished')
          .sort((a: any, b: any) => b.start_ts - a.start_ts)[0];

        if (!finished) continue;

        const linkRes = await fetch(
          `${this.baseUrl}/recordings/${finished.id}/access-link`,
          { headers: { Authorization: `Bearer ${apiKey}` } },
        );
        const linkJson = await linkRes.json();
        const url: string | undefined = linkJson?.download_link;
        if (url) return { id: finished.id as string, url };
      } catch (e) {
        this.logger.warn(`fetchRecording attempt ${i + 1} failed: ${(e as Error).message}`);
      }
    }
    return null;
  }

  private async fetchRecordingUrl(roomName: string, maxRetries = 10): Promise<string | null> {
    const result = await this.fetchRecording(roomName, maxRetries);
    return result?.url ?? null;
  }

  // Get a fresh pre-signed download URL for a known recording ID.
  // Call this on EVERY request — never cache the result.
  async getAccessLink(recordingId: string): Promise<string | null> {
    try {
      const res = await fetch(
        `${this.baseUrl}/recordings/${recordingId}/access-link`,
        { headers: { Authorization: `Bearer ${this.apiKey}` } },
      );
      const json = await res.json();
      return (json?.download_link as string) ?? null;
    } catch (e) {
      this.logger.warn(`getAccessLink failed for ${recordingId}: ${(e as Error).message}`);
      return null;
    }
  }

  // Find the recording for a room and return both its ID and a fresh URL.
  async getRecordingWithId(roomName: string, maxRetries = 10): Promise<{ id: string; url: string } | null> {
    return this.fetchRecording(roomName, maxRetries);
  }

  async getRecordingForRoom(roomName: string, maxRetries = 10): Promise<string | null> {
    return this.fetchRecordingUrl(roomName, maxRetries);
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
