"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCacheConfig = exports.getRedisConfig = void 0;
const getRedisConfig = (configService) => ({
    host: configService.get('REDIS_HOST') || 'localhost',
    port: configService.get('REDIS_PORT') || 6379,
    password: configService.get('REDIS_PASSWORD'),
    db: configService.get('REDIS_DB') || 0,
    keyPrefix: 'deveway:',
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
    lazyConnect: true,
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
});
exports.getRedisConfig = getRedisConfig;
const getCacheConfig = (configService) => ({
    ttl: configService.get('CACHE_TTL') || 3600,
    max: configService.get('CACHE_MAX_ITEMS') || 100,
    checkperiod: configService.get('CACHE_CHECK_PERIOD') || 600,
});
exports.getCacheConfig = getCacheConfig;
//# sourceMappingURL=redis.config.js.map