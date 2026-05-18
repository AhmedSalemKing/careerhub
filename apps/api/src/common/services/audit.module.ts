import { Module } from '@nestjs/common'
import { AuditService } from './audit.service'
import { ActivityService } from './activity.service'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  providers: [AuditService, ActivityService],
  exports: [AuditService, ActivityService],
})
export class AuditModule {}
