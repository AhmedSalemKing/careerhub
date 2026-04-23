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
Object.defineProperty(exports, "__esModule", { value: true });
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const health_service_1 = require("./health.service");
let HealthController = class HealthController {
    constructor(healthService) {
        this.healthService = healthService;
    }
    async getHealth() {
        const health = await this.healthService.getBasicHealth();
        return {
            success: true,
            data: health,
        };
    }
    async getDetailedHealth() {
        const health = await this.healthService.getDetailedHealth();
        return {
            success: true,
            data: health,
        };
    }
    async getDatabaseHealth() {
        const health = await this.healthService.getDatabaseHealth();
        return {
            success: true,
            data: health,
        };
    }
    async getRedisHealth() {
        const health = await this.healthService.getRedisHealth();
        return {
            success: true,
            data: health,
        };
    }
    async getExternalServicesHealth() {
        const health = await this.healthService.getExternalServicesHealth();
        return {
            success: true,
            data: health,
        };
    }
    async getUptime() {
        const uptime = await this.healthService.getUptime();
        return {
            success: true,
            data: { uptime },
        };
    }
    async getVersion() {
        const version = await this.healthService.getVersion();
        return {
            success: true,
            data: { version },
        };
    }
    async getMetrics() {
        const metrics = await this.healthService.getMetrics();
        return {
            success: true,
            data: metrics,
        };
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get basic health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Health status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)('detailed'),
    (0, swagger_1.ApiOperation)({ summary: 'Get detailed health status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Detailed health status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getDetailedHealth", null);
__decorate([
    (0, common_1.Get)('database'),
    (0, swagger_1.ApiOperation)({ summary: 'Check database health' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Database health status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getDatabaseHealth", null);
__decorate([
    (0, common_1.Get)('redis'),
    (0, swagger_1.ApiOperation)({ summary: 'Check Redis health' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Redis health status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getRedisHealth", null);
__decorate([
    (0, common_1.Get)('external-services'),
    (0, swagger_1.ApiOperation)({ summary: 'Check external services health' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'External services health status retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getExternalServicesHealth", null);
__decorate([
    (0, common_1.Get)('uptime'),
    (0, swagger_1.ApiOperation)({ summary: 'Get system uptime' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'System uptime retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getUptime", null);
__decorate([
    (0, common_1.Get)('version'),
    (0, swagger_1.ApiOperation)({ summary: 'Get application version' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Application version retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getVersion", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({ summary: 'Get application metrics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Application metrics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getMetrics", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)('Health'),
    (0, common_1.Controller)('health'),
    __metadata("design:paramtypes", [health_service_1.HealthService])
], HealthController);
//# sourceMappingURL=health.controller.js.map