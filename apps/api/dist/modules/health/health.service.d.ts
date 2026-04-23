import { ConfigService } from '@nestjs/config';
export declare class HealthService {
    private configService;
    private readonly logger;
    private readonly startTime;
    constructor(configService: ConfigService);
    getBasicHealth(): Promise<{
        status: string;
        timestamp: Date;
        uptime: number;
        version: Promise<{
            version: string;
            name: string;
            environment: any;
            buildNumber: string;
        }>;
    }>;
    getDetailedHealth(): Promise<{
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
    }>;
    getDatabaseHealth(): Promise<{
        status: string;
        responseTime: string;
        lastChecked: Date;
        error?: undefined;
    } | {
        status: string;
        error: any;
        lastChecked: Date;
        responseTime?: undefined;
    }>;
    getRedisHealth(): Promise<{
        status: string;
        responseTime: string;
        lastChecked: Date;
        error?: undefined;
    } | {
        status: string;
        error: any;
        lastChecked: Date;
        responseTime?: undefined;
    }>;
    getExternalServicesHealth(): Promise<any[]>;
    getUptime(): Promise<{
        uptime: number;
        humanReadable: string;
        startTime: Date;
    }>;
    getVersion(): Promise<{
        version: string;
        name: string;
        environment: any;
        buildNumber: string;
    }>;
    getMetrics(): Promise<{
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
    }>;
    private getUptimeSeconds;
    private formatUptime;
    private calculateOverallStatus;
    private getMemoryUsage;
    private getCpuUsage;
    private formatBytes;
    private getCpuPercentage;
    private checkStripeHealth;
    private checkCloudflareHealth;
    private checkEmailServiceHealth;
    getSystemInfo(): Promise<{
        platform: NodeJS.Platform;
        arch: NodeJS.Architecture;
        nodeVersion: string;
        npmVersion: string;
        environment: any;
        timezone: string;
        locale: string;
    }>;
    getPerformanceMetrics(): Promise<{
        eventLoopDelay: number;
        gcMetrics: {
            collections: number;
            duration: number;
            reclaimedMemory: number;
        };
        activeHandles: any[];
        activeRequests: any[];
    }>;
    private getEventLoopDelay;
    private getGCMetrics;
    checkDependencies(): Promise<{
        dependencies: any[];
        healthyCount: number;
        totalCount: number;
        overallStatus: string;
    }>;
    getCacheHealth(): Promise<{
        status: string;
        hitRate: number;
        missRate: number;
        evictionRate: number;
        memoryUsage: string;
        lastChecked: Date;
    }>;
    getQueueHealth(): Promise<{
        status: string;
        queueSize: number;
        processingRate: number;
        errorRate: number;
        lastProcessed: Date;
        lastChecked: Date;
    }>;
}
