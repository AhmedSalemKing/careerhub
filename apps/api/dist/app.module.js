"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const Joi = __importStar(require("joi"));
const throttler_1 = require("@nestjs/throttler");
const bull_1 = require("@nestjs/bull");
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
const cart_module_1 = require("./modules/cart/cart.module");
const payment_module_1 = require("./modules/payment/payment.module");
const ai_module_1 = require("./modules/ai/ai.module");
const sessions_module_1 = require("./modules/sessions/sessions.module");
const email_module_1 = require("./modules/email/email.module");
const ratings_module_1 = require("./modules/ratings/ratings.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
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
            bull_1.BullModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: (configService) => ({
                    redis: configService.get('REDIS_URL') || 'redis://localhost:6379',
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
            cart_module_1.CartModule,
            payment_module_1.PaymentModule,
            ai_module_1.AiModule,
            sessions_module_1.SessionsModule,
            email_module_1.EmailModule,
            ratings_module_1.RatingsModule,
        ],
        controllers: [],
        providers: [],
    })
], AppModule);
