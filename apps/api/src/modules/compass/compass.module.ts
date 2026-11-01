import { Module } from '@nestjs/common'
import { CompassController } from './compass.controller'
import { CompassService } from './compass.service'
import { PrismaModule } from '../../prisma/prisma.module'
import { AuthModule } from '../auth/auth.module'

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CompassController],
  providers: [CompassService],
})
export class CompassModule {}
