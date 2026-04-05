"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConfig = exports.getDatabaseConfig = void 0;
const getDatabaseConfig = (configService) => ({
    url: configService.get('DATABASE_URL'),
    ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
    logQueries: configService.get('NODE_ENV') === 'development',
    errorFormat: 'pretty',
});
exports.getDatabaseConfig = getDatabaseConfig;
const getRedisConfig = (configService) => ({
    host: configService.get('REDIS_HOST') || 'localhost',
    port: configService.get('REDIS_PORT') || 6379,
    password: configService.get('REDIS_PASSWORD'),
    db: configService.get('REDIS_DB') || 0,
    connectTimeout: 10000,
    lazyConnect: true,
    retryDelayOnFailover: 100,
    maxRetriesPerRequest: 3,
});
exports.getRedisConfig = getRedisConfig;
//# sourceMappingURL=database.config.js.map