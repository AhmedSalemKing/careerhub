import { Module } from '@nestjs/common'
import { LiveController } from './live.controller'
import { LiveService } from './live.service'
import { AgoraService } from './agora.service'
import { LiveGateway } from './live.gateway'
import { AgoraCloudRecordingService } from './agora-cloud-recording.service'
import { RecordingProcessorService } from './recording-processor.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { UploadModule } from '../upload/upload.module'

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [LiveController],
  providers: [LiveService, AgoraService, LiveGateway, AgoraCloudRecordingService, RecordingProcessorService],
  exports: [LiveService, AgoraService, AgoraCloudRecordingService, RecordingProcessorService],
})
export class LiveModule {}
