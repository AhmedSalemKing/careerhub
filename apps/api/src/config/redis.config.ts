import { ConfigService } from '@nestjs/config';

export const getRedisConfig = (configService: ConfigService) => ({
  host: configService.get<string>('REDIS_HOST') || 'localhost',
  port: configService.get<number>('REDIS_PORT') || 6379,
  password: configService.get<string>('REDIS_PASSWORD'),
  db: configService.get<number>('REDIS_DB') || 0,
  keyPrefix: 'careerhub:',
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  connectTimeout: 10000,
  commandTimeout: 5000,
});

export const getCacheConfig = (configService: ConfigService) => ({
  ttl: configService.get<number>('CACHE_TTL') || 3600, // 1 hour
  max: configService.get<number>('CACHE_MAX_ITEMS') || 100,
  checkperiod: configService.get<number>('CACHE_CHECK_PERIOD') || 600, // 10 minutes
});
