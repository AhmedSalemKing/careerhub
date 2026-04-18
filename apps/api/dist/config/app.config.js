"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAppConfig = void 0;
const getAppConfig = (configService) => {
    var _a, _b;
    return ({
        port: configService.get('PORT') || 3001,
        nodeEnv: configService.get('NODE_ENV') || 'development',
        apiPrefix: configService.get('API_PREFIX') || 'api',
        corsOrigins: [
            configService.get('FRONTEND_URL') || 'http://localhost:3000',
            configService.get('LEARN_URL') || 'http://localhost:3002',
        ],
        uploadConfig: {
            maxSize: configService.get('MAX_FILE_SIZE') || 10485760,
            allowedTypes: ((_a = configService.get('ALLOWED_FILE_TYPES')) === null || _a === void 0 ? void 0 : _a.split(',')) || [
                'image/jpeg',
                'image/png',
                'image/webp',
                'application/pdf',
            ],
            destination: './uploads',
        },
        emailConfig: {
            from: configService.get('FROM_EMAIL') || 'noreply@careerhub.com',
            templatesDir: configService.get('EMAIL_TEMPLATES_DIR') || './templates',
        },
        rateLimitConfig: {
            windowMs: configService.get('RATE_LIMIT_WINDOW_MS') || 900000,
            max: configService.get('RATE_LIMIT_MAX_REQUESTS') || 100,
        },
        monitoringConfig: {
            logLevel: configService.get('LOG_LEVEL') || 'info',
            enableMetrics: configService.get('ENABLE_METRICS') || true,
        },
        websocketConfig: {
            corsOrigin: ((_b = configService.get('SOCKET_CORS_ORIGIN')) === null || _b === void 0 ? void 0 : _b.split(',')) || [
                'http://localhost:3000',
                'http://localhost:3002',
            ],
        },
    });
};
exports.getAppConfig = getAppConfig;
//# sourceMappingURL=app.config.js.map