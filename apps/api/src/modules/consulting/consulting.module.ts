import { Module } from '@nestjs/common'
import { ConsultingController } from './consulting.controller'
import { ConsultingService } from './consulting.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [ConsultingController],
  providers: [ConsultingService],
  exports: [ConsultingService],
})
export class ConsultingModule {}
