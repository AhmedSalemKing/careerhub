import {
  Controller, Post, Req, Res, Headers, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { createHmac } from 'crypto';
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
    const rawBody: string = (req as any).rawBody || JSON.stringify(req.body);
    const secret = process.env.AGORA_WEBHOOK_SECRET || '';

    if (secret && (sigV2 || sig)) {
      const usedSig = sigV2 || sig;
      const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
      if (expected !== usedSig) {
        this.logger.warn('Invalid Agora signature');
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const body = req.body as any;
    const eventType = body?.eventType ?? body?.noticeId;
    const sid = body?.payload?.sid || body?.sid;

    // Agora expects a 200 within 10 seconds and retries only 3 times before
    // giving up. Acknowledge as soon as the signature is valid, then do every
    // DB write and the (slow) recording processing in the background.
    res.status(200).json({ received: true });

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
            eventType: String(eventType ?? 'unknown'),
            externalId: sid ?? null,
            payload: body,
            processed: false,
          },
        });

        const isUploadEvent = [31, 32, 40, 'cloud_recording_file_infos', 'cloud_recording_upload_finished'].includes(eventType);
        if (!isUploadEvent || !sid) return;

        let fileList: any[] = [];
        const details = body?.payload?.details || body?.payload;
        if (Array.isArray(details?.fileList)) {
          fileList = details.fileList;
        } else if (typeof details?.fileList === 'string') {
          fileList = details.fileList.split(',').map((f: string) => f.trim());
        } else if (Array.isArray(body?.fileList)) {
          fileList = body.fileList;
        }

        if (fileList.length > 0) {
          await this.processor.processRecordingComplete(event.id, sid, fileList);
        }
      } catch (err) {
        this.logger.error(`Webhook processing error: ${err.message}`);
      }
    });
  }
}
