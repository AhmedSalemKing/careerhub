import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class RecordingProcessorService {
  private readonly logger = new Logger(RecordingProcessorService.name);
  private readonly s3: S3Client;

  constructor(private readonly prisma: PrismaService) {
    this.s3 = new S3Client({
      region: 'eu-central-003',
      endpoint: process.env.B2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
      },
      forcePathStyle: true,
    });
  }

  async processRecordingComplete(webhookEventId: string, sid: string, fileList: any[]): Promise<void> {
    const recording = await this.prisma.liveRecording.findUnique({ where: { sid } });
    if (!recording) { this.logger.warn(`No recording for sid: ${sid}`); return; }
    if (recording.status === 'READY') { this.logger.log(`Already processed: ${sid}`); return; }

    await this.prisma.liveRecording.update({ where: { sid }, data: { status: 'PROCESSING' } });

    try {
      const mainFile = fileList.find((f: any) => f.fileName?.endsWith('.mp4'))
        || fileList.find((f: any) => f.fileName?.endsWith('.ts'))
        || fileList[0];

      if (!mainFile?.fileName) throw new Error('No usable file in fileList');

      const b2Key = mainFile.fileName;
      await this.prisma.liveRecording.update({ where: { sid }, data: { b2Key } });

      const bunnyVideoId = await this.uploadToBunny(recording.liveSessionId, b2Key);

      await this.prisma.liveRecording.update({
        where: { sid },
        data: { bunnyVideoId, status: 'READY', updatedAt: new Date() },
      });

      await this.prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: { processed: true, processedAt: new Date() },
      });

      this.logger.log(`✓ ${sid} → Bunny ${bunnyVideoId}`);
    } catch (err) {
      const retryCount = (recording.retryCount || 0) + 1;
      await this.prisma.liveRecording.update({
        where: { sid },
        data: {
          lastError: err.message,
          retryCount,
          status: retryCount >= 3 ? 'NEEDS_ATTENTION' : 'FAILED',
        },
      });
      this.logger.error(`Failed ${sid}: ${err.message}`);
      throw err;
    }
  }

  private async uploadToBunny(sessionId: string, b2Key: string): Promise<string> {
    const libraryId = process.env.BUNNY_LIBRARY_ID;
    const apiKey = process.env.BUNNY_API_KEY;

    const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
      method: 'POST',
      headers: { AccessKey: apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: `Live - ${sessionId} - ${Date.now()}` }),
    });
    if (!createRes.ok) throw new Error(`Bunny create: ${await createRes.text()}`);
    const { guid } = await createRes.json();

    const { Body, ContentLength } = await this.s3.send(new GetObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: b2Key,
    }));

    const uploadRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`, {
      method: 'PUT',
      headers: {
        AccessKey: apiKey,
        'Content-Type': 'application/octet-stream',
        ...(ContentLength ? { 'Content-Length': String(ContentLength) } : {}),
      },
      // @ts-ignore — Node.js fetch supports ReadableStream body
      body: Body,
      duplex: 'half',
    } as any);
    if (!uploadRes.ok) throw new Error(`Bunny upload: ${await uploadRes.text()}`);

    return guid;
  }
}
