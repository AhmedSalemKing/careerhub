import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { TrackActivityMiddleware } from './middleware/track-activity.middleware';
import { HttpLoggerMiddleware } from './middleware/http-logger.middleware';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { ThrottlerModule } from '@nestjs/throttler';
import { BullModule } from '@nestjs/bull';
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
import { CartModule } from './modules/cart/cart.module';
import { PaymentModule } from './modules/payment/payment.module';
import { AiModule } from './modules/ai/ai.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { EmailModule } from './modules/email/email.module';
import { RatingsModule } from './modules/ratings/ratings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        REDIS_URL: Joi.string().default('redis://localhost:6379'),
        AWS_ACCESS_KEY_ID: Joi.string().optional(),
        AWS_SECRET_ACCESS_KEY: Joi.string().optional(),
        AWS_S3_BUCKET: Joi.string().optional(),
        STRIPE_SECRET_KEY: Joi.string().optional(),
        STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
        SENDGRID_API_KEY: Joi.string().optional(),
        GROQ_API_KEY: Joi.string().optional(),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
        LEARN_URL: Joi.string().default('http://localhost:3002'),
      }),
      validationOptions: { abortEarly: false },
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
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        redis: configService.get('REDIS_URL') || 'redis://localhost:6379',
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
    CartModule,
    PaymentModule,
    AiModule,
    SessionsModule,
    EmailModule,
    RatingsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware, TrackActivityMiddleware).forRoutes('*');
  }
}
