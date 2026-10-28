import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
