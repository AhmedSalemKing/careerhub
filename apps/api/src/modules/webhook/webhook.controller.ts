import {
  Controller, Post, Req, Res, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PrismaService } from '../../prisma/prisma.service';
import { LiveService } from '../live/live.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly liveService: LiveService,
  ) {}

  @Post('daily')
  async handleDaily(
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // Respond immediately — Daily expects 200 within a few seconds
    res.status(200).json({ ok: true });

    const body = req.body as any;
    const { event_type, payload } = body;

    if (event_type === 'recording.ready') {
      setImmediate(async () => {
        try {
          const roomName: string = payload?.room_name || '';
          const downloadLink: string = payload?.download_link || '';

          if (!roomName || !downloadLink) {
            this.logger.warn('[DailyWebhook] recording.ready missing room_name or download_link');
            return;
          }

          // Room name format: course-{courseId}-{timestamp}
          const parts = roomName.split('-');
          // courseId may itself contain hyphens (cuid uses letters only, but be safe)
          const courseId = parts.slice(1, -1).join('-');

          const session = await this.prisma.liveSession.findFirst({
            where: { dailyRoomName: roomName },
            orderBy: { createdAt: 'desc' },
          });

          if (session) {
            await this.liveService.saveRecording(courseId, session.id, downloadLink);
            this.logger.log(`[DailyWebhook] Recording saved for room ${roomName}`);
          } else {
            this.logger.warn(`[DailyWebhook] No session found for room ${roomName}`);
          }
        } catch (e) {
          this.logger.error(`[DailyWebhook] Error processing recording.ready: ${e.message}`);
        }
      });
    }
  }
}
