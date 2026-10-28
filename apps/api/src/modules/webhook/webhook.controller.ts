import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly prisma: PrismaService) {}

  @Post('daily')
  @HttpCode(HttpStatus.OK)
  async handleDaily(@Body() body: any): Promise<{ ok: boolean }> {
    // Daily.co sends { action: "..." } or { type: "..." }
    const action: string = body?.action || body?.type || '';

    if (action === 'meeting.ended') {
      // Payload shape: { action, payload: { room_name, duration (seconds), ... } }
      const roomName: string = body?.payload?.room_name ?? body?.room_name ?? '';
      const durationSec: number | null =
        typeof body?.payload?.duration === 'number'
          ? body.payload.duration
          : typeof body?.duration === 'number'
          ? body.duration
          : null;

      if (!roomName) {
        this.logger.warn('meeting.ended webhook missing room_name');
        return { ok: true };
      }

      try {
        const session = await this.prisma.consultingSession.findFirst({
          where: { dailyRoomName: roomName },
          select: { id: true, status: true },
        });

        if (session) {
          const actualDuration =
            durationSec != null && durationSec > 0
              ? Math.round(durationSec / 60)
              : null;

          const updateData: any = {};
          if (actualDuration != null) updateData.actualDuration = actualDuration;
          if (session.status !== 'COMPLETED') {
            updateData.status = 'COMPLETED';
            updateData.completedAt = new Date();
          }

          if (Object.keys(updateData).length > 0) {
            await this.prisma.consultingSession.update({
              where: { id: session.id },
              data: updateData,
            });
          }

          this.logger.log(
            `meeting.ended: session ${session.id} actualDuration=${actualDuration ?? 'unknown'}min`,
          );
        }
        // else: course live session — handled separately by LiveService
      } catch (e: any) {
        this.logger.error(`meeting.ended handler failed: ${e?.message}`);
      }
    }

    return { ok: true };
  }
}
