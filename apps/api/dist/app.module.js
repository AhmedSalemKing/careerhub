"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const career_module_1 = require("./modules/career/career.module");
const courses_module_1 = require("./modules/courses/courses.module");
const lessons_module_1 = require("./modules/lessons/lessons.module");
const video_module_1 = require("./modules/video/video.module");
const certificates_module_1 = require("./modules/certificates/certificates.module");
const coaching_module_1 = require("./modules/coaching/coaching.module");
const payments_module_1 = require("./modules/payments/payments.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const admin_module_1 = require("./modules/admin/admin.module");
const health_module_1 = require("./modules/health/health.module");
const upload_module_1 = require("./modules/upload/upload.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: ['.env.local', '.env'],
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    throttlers: [
                        {
                            ttl: configService.get('RATE_LIMIT_WINDOW_MS') || 900000,
                            limit: configService.get('RATE_LIMIT_MAX_REQUESTS') || 100,
                        },
                    ],
                }),
                inject: [config_1.ConfigService],
            }),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            career_module_1.CareerModule,
            courses_module_1.CoursesModule,
            lessons_module_1.LessonsModule,
            video_module_1.VideoModule,
            certificates_module_1.CertificatesModule,
            coaching_module_1.CoachingModule,
            payments_module_1.PaymentsModule,
            notifications_module_1.NotificationsModule,
            analytics_module_1.AnalyticsModule,
            admin_module_1.AdminModule,
            health_module_1.HealthModule,
            upload_module_1.UploadModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
