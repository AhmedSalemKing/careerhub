import { Module } from '@nestjs/common';
import { CoachingController } from './coaching.controller';
import { CoachingService } from './coaching.service';
import { SchedulingService } from './scheduling.service';
import { ZoomService } from './zoom.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, AuthModule, NotificationsModule],
  controllers: [CoachingController],
  providers: [CoachingService, ZoomService, SchedulingService],
  exports: [CoachingService, ZoomService, SchedulingService],
})
export class CoachingModule {}
