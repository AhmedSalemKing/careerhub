import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ConsultingModule } from '../consulting/consulting.module';

@Module({
  imports: [PrismaModule, ConsultingModule],
  controllers: [WebhookController],
})
export class WebhookModule {}
