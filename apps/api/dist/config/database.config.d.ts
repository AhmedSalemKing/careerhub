import { ConfigService } from '@nestjs/config';
export declare const getDatabaseConfig: (configService: ConfigService) => {
    url: string;
    ssl: boolean | {
        rejectUnauthorized: boolean;
    };
    logQueries: boolean;
    errorFormat: string;
};
export declare const getRedisConfig: (configService: ConfigService) => {
    host: string;
    port: number;
    password: string;
    db: number;
    connectTimeout: number;
    lazyConnect: boolean;
    retryDelayOnFailover: number;
    maxRetriesPerRequest: number;
};
