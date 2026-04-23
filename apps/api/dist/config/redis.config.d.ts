import { ConfigService } from '@nestjs/config';
export declare const getRedisConfig: (configService: ConfigService) => {
    host: string;
    port: number;
    password: string;
    db: number;
    keyPrefix: string;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
    lazyConnect: boolean;
    keepAlive: number;
    connectTimeout: number;
    commandTimeout: number;
};
export declare const getCacheConfig: (configService: ConfigService) => {
    ttl: number;
    max: number;
    checkperiod: number;
};
