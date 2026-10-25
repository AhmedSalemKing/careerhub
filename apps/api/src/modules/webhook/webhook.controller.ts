import {
  Controller, Post, Req, Res, Headers, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RecordingProcessorService } from '../live/recording-processor.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: RecordingProcessorService,
  ) {}

  @Post('agora')
  async handleAgora(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('agora-signature-v2') sigV2: string,
    @Headers('agora-signature') sig: string,
  ): Promise<void> {
    const rawBody: Buffer = (req as any).rawBody
      || Buffer.from(JSON.stringify(req.body ?? {}));
    const secret = process.env.AGORA_WEBHOOK_SECRET || '';

    if (secret) {
      const usedSig = (sigV2 || sig || '').trim();
      if (!usedSig) {
        this.logger.warn('Agora webhook rejected: missing signature header');
        res.status(401).json({ error: 'Missing signature' });
        return;
      }
      const expected = createHmac(sigV2 ? 'sha256' : 'sha1', secret).update(rawBody).digest('hex');
      const expectedBuf = Buffer.from(expected, 'utf8');
      const actualBuf = Buffer.from(usedSig.toLowerCase(), 'utf8');
      if (
        expectedBuf.length !== actualBuf.length
        || !timingSafeEqual(expectedBuf, actualBuf)
      ) {
        this.logger.warn('Invalid Agora signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const body = req.body as any;
    const eventType = String(body?.eventType ?? body?.noticeId ?? 'unknown');
    const sid = body?.payload?.sid || body?.sid || null;

    // Agora expects a 200 within 10 seconds and retries only 3 times before
    // giving up. Acknowledge as soon as the signature is valid, then do every
    // DB write and the (slow) recording processing in the background.
    res.status(200).json({ received: true });
    this.logger.log(`Agora webhook accepted: eventType=${eventType} sid=${sid ?? 'none'}`);

    setImmediate(async () => {
      try {
        if (sid) {
          const duplicate = await this.prisma.webhookEvent.findFirst({
            where: { externalId: sid, processed: true },
          });
          if (duplicate) {
            this.logger.log(`Duplicate webhook ignored for sid: ${sid}`);
            return;
          }
        }

        const event = await this.prisma.webhookEvent.create({
          data: {
            source: 'agora',
            eventType,
            externalId: sid,
            payload: body,
            processed: false,
          },
        });

        // Agora Cloud Recording event types (per the official docs):
        // 4  cloud_recording_file_infos (M3U8 generated)
        // 11 session_exit, 31 uploaded, 32 backuped, 41 recorder_leave.
        // Only 31 and 32 carry the final fileList that can be uploaded to B2.
        if (eventType === '11' || eventType === '41') {
          this.logger.log(`Recording lifecycle event ${eventType} for sid ${sid ?? 'none'}`);
        }

        const isUploadEvent = ['31', '32'].includes(eventType);
        if (!isUploadEvent || !sid) return;

        const fileList = this.extractFileList(body);
        this.logger.log(`Webhook file list for sid ${sid}: ${JSON.stringify(fileList)}`);

        if (fileList.length > 0) {
          await this.processor.processRecordingComplete(event.id, sid, fileList);
        } else {
          this.logger.warn(`Upload event for sid ${sid} carried no file list`);
        }
      } catch (err) {
        this.logger.error(`Webhook processing error: ${err.message}`, err.stack);
      }
    });
  }

  private extractFileList(body: any): string[] {
    const details = body?.payload?.details || body?.payload;
    let raw: any = details?.fileList ?? body?.fileList;

    if (typeof raw === 'string') {
      raw = raw.split(',');
    }
    if (!Array.isArray(raw)) return [];

    return raw
      .map((f: any) => (typeof f === 'string' ? f.trim() : f?.fileName))
      .filter((f: unknown): f is string => typeof f === 'string' && f.length > 0);
  }
}

