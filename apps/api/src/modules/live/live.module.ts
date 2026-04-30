import { Module } from '@nestjs/common'
import { LiveController } from './live.controller'
import { LiveService } from './live.service'
import { AgoraService } from './agora.service'
import { LiveGateway } from './live.gateway'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [LiveController],
  providers: [LiveService, AgoraService, LiveGateway],
  exports: [LiveService, AgoraService],
})
export class LiveModule {}
