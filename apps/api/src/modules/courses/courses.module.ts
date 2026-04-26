import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { CoursesController } from './courses.controller';
import { CoursesService } from './courses.service';
import { EnrollmentService } from './enrollment.service';
import { ProgressService } from './progress.service';
import { RecommendationService } from './recommendation.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    NotificationsModule,
    BullModule.registerQueue({ name: 'certificates' }),
  ],
  controllers: [CoursesController],
  providers: [CoursesService, EnrollmentService, ProgressService, RecommendationService],
  exports: [CoursesService, EnrollmentService, ProgressService, RecommendationService],
})
export class CoursesModule {}
