"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var HealthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let HealthService = HealthService_1 = class HealthService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(HealthService_1.name);
        this.startTime = new Date();
    }
    async getBasicHealth() {
        return {
            status: 'healthy',
            timestamp: new Date(),
            uptime: this.getUptimeSeconds(),
            version: this.getVersion(),
        };
    }
    async getDetailedHealth() {
        const [databaseHealth, redisHealth, externalServicesHealth, memoryUsage, cpuUsage,] = await Promise.all([
            this.getDatabaseHealth(),
            this.getRedisHealth(),
            this.getExternalServicesHealth(),
            this.getMemoryUsage(),
            this.getCpuUsage(),
        ]);
        const overallStatus = this.calculateOverallStatus([
            databaseHealth,
            redisHealth,
            externalServicesHealth,
        ]);
        return {
            status: overallStatus,
            timestamp: new Date(),
            uptime: this.getUptimeSeconds(),
            version: this.getVersion(),
            services: {
                database: databaseHealth,
                redis: redisHealth,
                externalServices: externalServicesHealth,
            },
            system: {
                memory: memoryUsage,
                cpu: cpuUsage,
            },
        };
    }
    async getDatabaseHealth() {
        try {
            const start = Date.now();
            // Mock database health check - would implement actual Prisma query
            // await this.prisma.$queryRaw`SELECT 1`;
            const responseTime = Date.now() - start;
            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                lastChecked: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Database health check failed', error);
            return {
                status: 'unhealthy',
                error: error.message,
                lastChecked: new Date(),
            };
        }
    }
    async getRedisHealth() {
        try {
            // Mock Redis health check - would implement actual Redis client
            const start = Date.now();
            // await this.redis.ping();
            const responseTime = Date.now() - start;
            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                lastChecked: new Date(),
            };
        }
        catch (error) {
            this.logger.error('Redis health check failed', error);
            return {
                status: 'unhealthy',
                error: error.message,
                lastChecked: new Date(),
            };
        }
    }
    async getExternalServicesHealth() {
        const services = [];
        // Check Stripe
        try {
            const stripeHealth = await this.checkStripeHealth();
            services.push({
                name: 'Stripe',
                ...stripeHealth,
            });
        }
        catch (error) {
            services.push({
                name: 'Stripe',
                status: 'unhealthy',
                error: error.message,
                lastChecked: new Date(),
            });
        }
        // Check Cloudflare
        try {
            const cloudflareHealth = await this.checkCloudflareHealth();
            services.push({
                name: 'Cloudflare',
                ...cloudflareHealth,
            });
        }
        catch (error) {
            services.push({
                name: 'Cloudflare',
                status: 'unhealthy',
                error: error.message,
                lastChecked: new Date(),
            });
        }
        // Check SendGrid (Email service)
        try {
            const emailHealth = await this.checkEmailServiceHealth();
            services.push({
                name: 'Email Service',
                ...emailHealth,
            });
        }
        catch (error) {
            services.push({
                name: 'Email Service',
                status: 'unhealthy',
                error: error.message,
                lastChecked: new Date(),
            });
        }
        return services;
    }
    async getUptime() {
        return {
            uptime: this.getUptimeSeconds(),
            humanReadable: this.formatUptime(this.getUptimeSeconds()),
            startTime: this.startTime,
        };
    }
    async getVersion() {
        return {
            version: process.env.npm_package_version || '1.0.0',
            name: process.env.npm_package_name || 'careerhub-api',
            environment: this.configService.get('NODE_ENV') || 'development',
            buildNumber: process.env.BUILD_NUMBER || 'unknown',
        };
    }
    async getMetrics() {
        const memoryUsage = this.getMemoryUsage();
        const cpuUsage = this.getCpuUsage();
        return {
            timestamp: new Date(),
            uptime: this.getUptimeSeconds(),
            memory: memoryUsage,
            cpu: cpuUsage,
            process: {
                pid: process.pid,
                version: process.version,
                platform: process.platform,
                arch: process.arch,
            },
        };
    }
    getUptimeSeconds() {
        return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
    }
    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        const parts = [];
        if (days > 0)
            parts.push(`${days}d`);
        if (hours > 0)
            parts.push(`${hours}h`);
        if (minutes > 0)
            parts.push(`${minutes}m`);
        if (secs > 0 || parts.length === 0)
            parts.push(`${secs}s`);
        return parts.join(' ');
    }
    calculateOverallStatus(services) {
        const unhealthyServices = services.filter(service => service.status === 'unhealthy').length;
        if (unhealthyServices === 0) {
            return 'healthy';
        }
        else if (unhealthyServices < services.length / 2) {
            return 'degraded';
        }
        else {
            return 'unhealthy';
        }
    }
    getMemoryUsage() {
        const usage = process.memoryUsage();
        return {
            rss: this.formatBytes(usage.rss),
            heapTotal: this.formatBytes(usage.heapTotal),
            heapUsed: this.formatBytes(usage.heapUsed),
            external: this.formatBytes(usage.external),
            arrayBuffers: this.formatBytes(usage.arrayBuffers),
            percentage: Math.round((usage.heapUsed / usage.heapTotal) * 100),
        };
    }
    getCpuUsage() {
        const usage = process.cpuUsage();
        return {
            user: usage.user,
            system: usage.system,
            percentage: this.getCpuPercentage(),
        };
    }
    formatBytes(bytes) {
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0)
            return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }
    getCpuPercentage() {
        // Mock CPU percentage - would implement actual CPU monitoring
        return Math.round(Math.random() * 100);
    }
    async checkStripeHealth() {
        try {
            // Mock Stripe health check - would implement actual Stripe API call
            const start = Date.now();
            // await this.stripeService.testConnection();
            const responseTime = Date.now() - start;
            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                lastChecked: new Date(),
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkCloudflareHealth() {
        try {
            // Mock Cloudflare health check - would implement actual API call
            const start = Date.now();
            // await this.cloudflareService.testConnection();
            const responseTime = Date.now() - start;
            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                lastChecked: new Date(),
            };
        }
        catch (error) {
            throw error;
        }
    }
    async checkEmailServiceHealth() {
        try {
            // Mock email service health check
            const start = Date.now();
            // await this.emailService.testConnection();
            const responseTime = Date.now() - start;
            return {
                status: 'healthy',
                responseTime: `${responseTime}ms`,
                lastChecked: new Date(),
            };
        }
        catch (error) {
            throw error;
        }
    }
    async getSystemInfo() {
        return {
            platform: process.platform,
            arch: process.arch,
            nodeVersion: process.version,
            npmVersion: process.version,
            environment: this.configService.get('NODE_ENV') || 'development',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            locale: Intl.DateTimeFormat().resolvedOptions().locale,
        };
    }
    async getPerformanceMetrics() {
        const metrics = {
            eventLoopDelay: this.getEventLoopDelay(),
            gcMetrics: this.getGCMetrics(),
            activeHandles: [],
            activeRequests: [],
        };
        return metrics;
    }
    getEventLoopDelay() {
        // Mock event loop delay - would implement actual measurement
        return Math.random() * 10; // milliseconds
    }
    getGCMetrics() {
        // Mock GC metrics - would implement actual GC monitoring
        return {
            collections: Math.floor(Math.random() * 100),
            duration: Math.random() * 1000, // milliseconds
            reclaimedMemory: Math.random() * 1000000, // bytes
        };
    }
    async checkDependencies() {
        const dependencies = [
            { name: 'Database', check: () => this.getDatabaseHealth() },
            { name: 'Redis', check: () => this.getRedisHealth() },
            { name: 'Stripe', check: () => this.checkStripeHealth() },
            { name: 'Cloudflare', check: () => this.checkCloudflareHealth() },
            { name: 'Email Service', check: () => this.checkEmailServiceHealth() },
        ];
        const results = [];
        for (const dependency of dependencies) {
            try {
                const health = await dependency.check();
                results.push({
                    name: dependency.name,
                    status: health.status,
                    lastChecked: health.lastChecked,
                    responseTime: health.responseTime,
                });
            }
            catch (error) {
                results.push({
                    name: dependency.name,
                    status: 'unhealthy',
                    lastChecked: new Date(),
                    error: error.message,
                });
            }
        }
        return {
            dependencies: results,
            healthyCount: results.filter(r => r.status === 'healthy').length,
            totalCount: results.length,
            overallStatus: results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
        };
    }
    async getCacheHealth() {
        // Mock cache health check
        return {
            status: 'healthy',
            hitRate: 94.5,
            missRate: 5.5,
            evictionRate: 2.1,
            memoryUsage: '256MB',
            lastChecked: new Date(),
        };
    }
    async getQueueHealth() {
        // Mock queue health check
        return {
            status: 'healthy',
            queueSize: 23,
            processingRate: 45.2, // jobs per minute
            errorRate: 0.5, // percentage
            lastProcessed: new Date(),
            lastChecked: new Date(),
        };
    }
};
exports.HealthService = HealthService;
exports.HealthService = HealthService = HealthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], HealthService);
