import { Module } from '@nestjs/common'
import { SessionsController } from './sessions.controller'
import { PrismaModule } from '../../prisma/prisma.module'
import { AuditModule } from '../../common/services/audit.module'

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [SessionsController],
})
export class SessionsModule {}
