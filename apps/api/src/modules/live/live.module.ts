import { Module } from '@nestjs/common'
import { LiveController } from './live.controller'
import { LiveService } from './live.service'
import { AgoraService } from './agora.service'
import { LiveGateway } from './live.gateway'
import { PrismaModule } from '../../prisma/prisma.module'
import { UploadModule } from '../upload/upload.module'

@Module({
  // UploadModule exports BunnyStreamService — the live recording is stored on
  // Bunny.net Stream through the exact same service as every other video.
  imports: [PrismaModule, UploadModule],
  controllers: [LiveController],
  providers: [LiveService, AgoraService, LiveGateway],
  exports: [LiveService, AgoraService],
})
export class LiveModule {}
