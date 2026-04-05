import { Module } from '@nestjs/common'
import { SessionsController } from './sessions.controller'
import { PrismaModule } from '../../prisma/prisma.module'

@Module({
  imports: [PrismaModule],
  controllers: [SessionsController],
})
export class SessionsModule {}
