"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_1 = require("@nestjs/config");
const helmet_1 = __importDefault(require("helmet"));
const compression = require('compression');
const morgan = require('morgan');
const app_module_1 = require("./app.module");
const http_exception_filter_1 = require("./common/filters/http-exception.filter");
const transform_interceptor_1 = require("./common/interceptors/transform.interceptor");
const logger_middleware_1 = require("./common/middleware/logger.middleware");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const configService = app.get(config_1.ConfigService);
    // Security middleware
    app.use((0, helmet_1.default)({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
                scriptSrc: ["'self'"],
                imgSrc: ["'self'", "data:", "https:"],
            },
        },
    }));
    // CORS configuration
    app.enableCors({
        origin: [
            configService.get('FRONTEND_URL') || 'http://localhost:3000',
            configService.get('LEARN_URL') || 'http://localhost:3002',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'User-Agent', 'DNT', 'Cache-Control', 'X-Mx-ReqToken', 'Keep-Alive', 'X-Requested-With', 'If-Modified-Since'],
    });
    // Compression
    app.use(compression());
    // HTTP request logger
    if (configService.get('NODE_ENV') !== 'production') {
        app.use(morgan('dev'));
    }
    else {
        app.use(morgan('combined'));
    }
    // Custom logger middleware
    app.use(new logger_middleware_1.LoggerMiddleware().use);
    // Global pipes
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
        validationError: {
            target: false,
            value: false,
        },
    }));
    // Global filters
    app.useGlobalFilters(new http_exception_filter_1.HttpExceptionFilter());
    // Global interceptors
    app.useGlobalInterceptors(new transform_interceptor_1.TransformInterceptor());
    // API prefix
    const apiPrefix = configService.get('API_PREFIX') || 'api';
    app.setGlobalPrefix(apiPrefix);
    // Swagger documentation
    if (configService.get('NODE_ENV') !== 'production') {
        const config = new swagger_1.DocumentBuilder()
            .setTitle('CareerHub API')
            .setDescription('AI Career Development Platform API Documentation')
            .setVersion('1.0.0')
            .addBearerAuth({
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            name: 'JWT',
            description: 'Enter JWT token',
            in: 'header',
        }, 'JWT-auth')
            .addTag('Auth', 'Authentication endpoints')
            .addTag('Users', 'User management')
            .addTag('Career', 'Career paths and assessments')
            .addTag('Courses', 'Course management')
            .addTag('Lessons', 'Lesson content')
            .addTag('Video', 'Video streaming')
            .addTag('Certificates', 'Certificate management')
            .addTag('Coaching', 'Coaching sessions')
            .addTag('Payments', 'Payment processing')
            .addTag('AI', 'AI-powered features')
            .addTag('Notifications', 'Notification system')
            .addTag('Chat', 'Real-time chat')
            .addTag('Analytics', 'Analytics and reporting')
            .addTag('Health', 'Health check endpoints')
            .addTag('Upload', 'File upload management')
            .addTag('Admin', 'Admin management')
            .addServer(`http://localhost:${configService.get('PORT') || 3001}/${apiPrefix}`, 'Development')
            .addServer(`https://api.careerhub.com/${apiPrefix}`, 'Production')
            .build();
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
            swaggerOptions: {
                persistAuthorization: true,
                displayRequestDuration: true,
                filter: true,
                showExtensions: true,
                showCommonExtensions: true,
                docExpansion: 'none',
                defaultModelsExpandDepth: 2,
                defaultModelExpandDepth: 2,
            },
            customSiteTitle: 'CareerHub API Documentation',
            customfavIcon: '/favicon.ico',
            customCss: `
        .topbar-wrapper img { content: url('https://careerhub.com/logo.png'); width: 40px; height: auto; }
        .swagger-ui .topbar { background-color: #2563EB; }
        .swagger-ui .topbar-wrapper .link { color: white; }
      `,
        });
        logger.log(`📚 Swagger documentation available at: http://localhost:${configService.get('PORT') || 3001}/${apiPrefix}/docs`);
    }
    // Rate limiting
    // Note: @nestjs/throttler is configured in AppModule
    // Health check endpoint
    app.getHttpServer().on('request', (req, res) => {
        if (req.url === '/health' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: configService.get('NODE_ENV'),
                version: process.env.npm_package_version || '1.0.0',
            }));
        }
    });
    // Graceful shutdown
    process.on('SIGTERM', async () => {
        logger.log('SIGTERM signal received: closing HTTP server');
        await app.close();
        process.exit(0);
    });
    process.on('SIGINT', async () => {
        logger.log('SIGINT signal received: closing HTTP server');
        await app.close();
        process.exit(0);
    });
    // Start server
    const port = configService.get('PORT') || 3001;
    await app.listen(port);
    logger.log(`🚀 CareerHub API is running on port ${port}`);
    logger.log(`🌍 Environment: ${configService.get('NODE_ENV') || 'development'}`);
    logger.log(`📡 API endpoint: http://localhost:${port}/${apiPrefix}`);
}
bootstrap().catch((error) => {
    console.error('❌ Failed to start application:', error);
    process.exit(1);
});
