import { Module } from '@nestjs/common'
import { ConsultingController } from './consulting.controller'
import { ConsultingService } from './consulting.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { AuditModule } from '../../common/services/audit.module'

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [ConsultingController],
  providers: [ConsultingService],
  exports: [ConsultingService],
})
export class ConsultingModule {}
