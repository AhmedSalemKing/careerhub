import { Module } from '@nestjs/common'
import { LiveController } from './live.controller'
import { LiveService } from './live.service'
import { DailyService } from './daily.service'
import { LiveGateway } from './live.gateway'
import { PrismaModule } from '../../prisma/prisma.module'
import { UploadModule } from '../upload/upload.module'

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [LiveController],
  providers: [LiveService, DailyService, LiveGateway],
  exports: [LiveService, DailyService],
})
export class LiveModule {}
