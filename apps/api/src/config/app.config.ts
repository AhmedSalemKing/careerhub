import { ConfigService } from '@nestjs/config';

export const getAppConfig = (configService: ConfigService) => ({
  port: configService.get<number>('PORT') || 3001,
  nodeEnv: configService.get<string>('NODE_ENV') || 'development',
  apiPrefix: configService.get<string>('API_PREFIX') || 'api',
  corsOrigins: [
    configService.get<string>('FRONTEND_URL') || 'http://localhost:3000',
    configService.get<string>('LEARN_URL') || 'http://localhost:3002',
  ],
  uploadConfig: {
    maxSize: configService.get<number>('MAX_FILE_SIZE') || 10485760, // 10MB
    allowedTypes: configService.get<string>('ALLOWED_FILE_TYPES')?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/pdf',
    ],
    destination: './uploads',
  },
  emailConfig: {
    from: configService.get<string>('FROM_EMAIL') || 'noreply@careerhub.com',
    templatesDir: configService.get<string>('EMAIL_TEMPLATES_DIR') || './templates',
  },
  rateLimitConfig: {
    windowMs: configService.get<number>('RATE_LIMIT_WINDOW_MS') || 900000, // 15 minutes
    max: configService.get<number>('RATE_LIMIT_MAX_REQUESTS') || 100,
  },
  monitoringConfig: {
    logLevel: configService.get<string>('LOG_LEVEL') || 'info',
    enableMetrics: configService.get<boolean>('ENABLE_METRICS') || true,
  },
  websocketConfig: {
    corsOrigin: configService.get<string>('SOCKET_CORS_ORIGIN')?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3002',
    ],
  },
});
