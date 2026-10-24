import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { LiveModule } from '../live/live.module';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, LiveModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
