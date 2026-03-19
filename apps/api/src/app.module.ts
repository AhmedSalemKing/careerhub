import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CareerModule } from './modules/career/career.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { VideoModule } from './modules/video/video.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { CoachingModule } from './modules/coaching/coaching.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AdminModule } from './modules/admin/admin.module';
import { HealthModule } from './modules/health/health.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get('RATE_LIMIT_WINDOW_MS') || 900000,
            limit: configService.get('RATE_LIMIT_MAX_REQUESTS') || 100,
          },
        ],
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    CareerModule,
    CoursesModule,
    LessonsModule,
    VideoModule,
    CertificatesModule,
    CoachingModule,
    PaymentsModule,
    NotificationsModule,
    AnalyticsModule,
    AdminModule,
    HealthModule,
    UploadModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
