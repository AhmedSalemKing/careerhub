import { Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller('webhooks')
export class WebhookController {
  @Post('daily')
  handleDaily(@Res() res: Response): void {
    // Free plan does not send recording webhooks; keep route alive to avoid 404
    res.status(200).json({ ok: true });
  }
}
