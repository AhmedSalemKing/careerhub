import { ConfigService } from '@nestjs/config';
export declare const getAppConfig: (configService: ConfigService) => {
    port: number;
    nodeEnv: string;
    apiPrefix: string;
    corsOrigins: string[];
    uploadConfig: {
        maxSize: number;
        allowedTypes: string[];
        destination: string;
    };
    emailConfig: {
        from: string;
        templatesDir: string;
    };
    rateLimitConfig: {
        windowMs: number;
        max: number;
    };
    monitoringConfig: {
        logLevel: string;
        enableMetrics: true;
    };
    websocketConfig: {
        corsOrigin: string[];
    };
};
