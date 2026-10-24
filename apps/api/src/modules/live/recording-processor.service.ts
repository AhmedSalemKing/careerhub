import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

@Injectable()
export class RecordingProcessorService {
  private readonly logger = new Logger(RecordingProcessorService.name);
  private readonly s3: S3Client;

  constructor(private readonly prisma: PrismaService) {
    this.s3 = new S3Client({
      region: this.resolveRegion(),
      endpoint: process.env.B2_ENDPOINT,
      credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
      },
      forcePathStyle: true,
    });
  }

  /**
   * The S3 client must be signed for the bucket's real region. Backblaze
   * encodes the region in the endpoint (s3.<region>.backblazeb2.com); signing
   * with a hardcoded region produces SignatureDoesNotMatch at download time.
   */
  private resolveRegion(): string {
    const explicit = process.env.B2_REGION?.trim();
    if (explicit) return explicit;
    const match = (process.env.B2_ENDPOINT || '').match(/s3[.-]([a-z0-9-]+)\.backblazeb2\.com/i);
    return match?.[1] || 'us-east-1';
  }

  async processRecordingComplete(webhookEventId: string, sid: string, fileList: any[]): Promise<void> {
    const recording = await this.prisma.liveRecording.findUnique({ where: { sid } });
    if (!recording) { this.logger.warn(`No recording for sid: ${sid}`); return; }
    if (recording.status === 'READY') { this.logger.log(`Already processed: ${sid}`); return; }

    await this.prisma.liveRecording.update({ where: { sid }, data: { status: 'PROCESSING' } });
    this.logger.log(`Processing ${sid}: ${Array.isArray(fileList) ? fileList.length : 0} file(s) in payload`);

    try {
      // Agora sends fileList as an array of path strings; older webhook payloads
      // (and the processor's own callers) may wrap them as { fileName }. Accept
      // both shapes and always prefer the single MP4 over HLS .ts fragments.
      const fileNames: string[] = (Array.isArray(fileList) ? fileList : [])
        .map((f: any) => (typeof f === 'string' ? f : f?.fileName))
        .filter((f: unknown): f is string => typeof f === 'string' && f.length > 0);

      const mp4File = fileNames.find((f: string) => f.endsWith('.mp4'));
      const tsFile = fileNames.find((f: string) => f.endsWith('.ts'));
      const fileKey = mp4File ?? tsFile;

      if (!fileKey) {
        this.logger.error(`No processable file in: ${JSON.stringify(fileList)}`);
        throw new Error('No mp4 or ts file found in recording file list');
      }

      const b2Key = fileKey;
      this.logger.log(`Selected B2 object ${b2Key} (${mp4File ? 'mp4' : 'ts fallback'})`);
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

      this.logger.log(`Recording ${sid} uploaded to Bunny as ${bunnyVideoId}`);
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
    this.logger.log(`Created Bunny video ${guid} for session ${sessionId}`);

    const { Body, ContentLength } = await this.s3.send(new GetObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: b2Key,
    }));
    if (!Body) throw new Error(`Empty B2 object: ${b2Key}`);
    this.logger.log(`Downloading ${b2Key} from B2 (${ContentLength ?? 'unknown'} bytes)`);

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

    this.logger.log(`Bunny upload finished for video ${guid}`);
    return guid;
  }
}
