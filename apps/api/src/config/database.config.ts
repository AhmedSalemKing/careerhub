import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService) => ({
  url: configService.get<string>('DATABASE_URL'),
  ssl: configService.get<string>('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
  logQueries: configService.get<string>('NODE_ENV') === 'development',
  errorFormat: 'pretty',
});

export const getRedisConfig = (configService: ConfigService) => ({
  host: configService.get<string>('REDIS_HOST') || 'localhost',
  port: configService.get<number>('REDIS_PORT') || 6379,
  password: configService.get<string>('REDIS_PASSWORD'),
  db: configService.get<number>('REDIS_DB') || 0,
  connectTimeout: 10000,
  lazyConnect: true,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
});
