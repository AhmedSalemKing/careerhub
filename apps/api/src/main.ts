import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { join } from 'path';
const compression = require('compression');
const morgan = require('morgan');
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Serve uploaded files as static assets
  app.useStaticAssets(join(__dirname, '..', 'uploads'), { prefix: '/uploads/' });
  const configService = app.get(ConfigService);

  // Security middleware
  app.use(helmet({
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
    origin: true, // allow all origins for demo
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'ngrok-skip-browser-warning'],
  });

  // Compression
  app.use(compression());

  // HTTP request logger
  if (configService.get('NODE_ENV') !== 'production') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Custom logger middleware
  app.use(new LoggerMiddleware().use);

  // Global pipes
  app.useGlobalPipes(new ValidationPipe({
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
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new TransformInterceptor());

  // API prefix
  const apiPrefix = configService.get('API_PREFIX') || 'api';
  app.setGlobalPrefix(apiPrefix);

  // Swagger documentation
  if (configService.get('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('DeveWay API')
      .setDescription('AI Career Development Platform API Documentation')
      .setVersion('1.0.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description: 'Enter JWT token',
          in: 'header',
        },
        'JWT-auth',
      )
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
      .addServer(`https://api.deveway.com/${apiPrefix}`, 'Production')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
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
      customSiteTitle: 'DeveWay API Documentation',
      customfavIcon: '/favicon.ico',
      customCss: `
        .topbar-wrapper img { content: url('https://deveway.com/logo.png'); width: 40px; height: auto; }
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

  logger.log(`🚀 DeveWay API is running on port ${port}`);
  logger.log(`🌍 Environment: ${configService.get('NODE_ENV') || 'development'}`);
  logger.log(`📡 API endpoint: http://localhost:${port}/${apiPrefix}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
