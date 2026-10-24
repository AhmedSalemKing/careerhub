import { Module } from '@nestjs/common';
import { WebhookController } from './webhook.controller';
import { RecordingProcessorService } from '../live/recording-processor.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WebhookController],
  providers: [RecordingProcessorService],
})
export class WebhookModule {}
