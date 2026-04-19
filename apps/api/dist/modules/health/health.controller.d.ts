import { HealthService } from './health.service';
export declare class HealthController {
    private readonly healthService;
    constructor(healthService: HealthService);
    getHealth(): Promise<{
        success: boolean;
        data: {
            status: string;
            timestamp: Date;
            uptime: number;
            version: Promise<{
                version: string;
                name: string;
                environment: any;
                buildNumber: string;
            }>;
        };
    }>;
    getDetailedHealth(): Promise<{
        success: boolean;
        data: {
            status: string;
            timestamp: Date;
            uptime: number;
            version: Promise<{
                version: string;
                name: string;
                environment: any;
                buildNumber: string;
            }>;
            services: {
                database: {
                    status: string;
                    responseTime: string;
                    lastChecked: Date;
                    error?: undefined;
                } | {
                    status: string;
                    error: any;
                    lastChecked: Date;
                    responseTime?: undefined;
                };
                redis: {
                    status: string;
                    responseTime: string;
                    lastChecked: Date;
                    error?: undefined;
                } | {
                    status: string;
                    error: any;
                    lastChecked: Date;
                    responseTime?: undefined;
                };
                externalServices: any[];
            };
            system: {
                memory: {
                    rss: string;
                    heapTotal: string;
                    heapUsed: string;
                    external: string;
                    arrayBuffers: string;
                    percentage: number;
                };
                cpu: {
                    user: number;
                    system: number;
                    percentage: number;
                };
            };
        };
    }>;
    getDatabaseHealth(): Promise<{
        success: boolean;
        data: {
            status: string;
            responseTime: string;
            lastChecked: Date;
            error?: undefined;
        } | {
            status: string;
            error: any;
            lastChecked: Date;
            responseTime?: undefined;
        };
    }>;
    getRedisHealth(): Promise<{
        success: boolean;
        data: {
            status: string;
            responseTime: string;
            lastChecked: Date;
            error?: undefined;
        } | {
            status: string;
            error: any;
            lastChecked: Date;
            responseTime?: undefined;
        };
    }>;
    getExternalServicesHealth(): Promise<{
        success: boolean;
        data: any[];
    }>;
    getUptime(): Promise<{
        success: boolean;
        data: {
            uptime: {
                uptime: number;
                humanReadable: string;
                startTime: Date;
            };
        };
    }>;
    getVersion(): Promise<{
        success: boolean;
        data: {
            version: {
                version: string;
                name: string;
                environment: any;
                buildNumber: string;
            };
        };
    }>;
    getMetrics(): Promise<{
        success: boolean;
        data: {
            timestamp: Date;
            uptime: number;
            memory: {
                rss: string;
                heapTotal: string;
                heapUsed: string;
                external: string;
                arrayBuffers: string;
                percentage: number;
            };
            cpu: {
                user: number;
                system: number;
                percentage: number;
            };
            process: {
                pid: number;
                version: string;
                platform: NodeJS.Platform;
                arch: NodeJS.Architecture;
            };
        };
    }>;
}
