import { Module } from '@nestjs/common'
import { SessionsController } from './sessions.controller'
import { PrismaModule } from '../../prisma/prisma.module'
import { AuditModule } from '../../common/services/audit.module'
import { LiveModule } from '../live/live.module'

@Module({
  imports: [PrismaModule, AuditModule, LiveModule],
  controllers: [SessionsController],
})
export class SessionsModule {}
