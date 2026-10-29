import { Controller, Post, Body, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ConsultingService } from '../consulting/consulting.service';

@Controller('webhooks')
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  constructor(private readonly consultingService: ConsultingService) {}

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
        if (roomName.startsWith('consulting-')) {
          await this.consultingService.completeSessionFromWebhook(
            roomName,
            durationSec ?? 0,
          );
          this.logger.log(`meeting.ended: consulting session for room ${roomName}`);
        }
        // else: course live session — handled separately by LiveService
      } catch (e: any) {
        this.logger.error(`meeting.ended handler failed: ${e?.message}`);
      }
    }

    return { ok: true };
  }
}
