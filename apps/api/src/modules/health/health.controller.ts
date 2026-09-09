import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get basic health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealth() {
    const health = await this.healthService.getBasicHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get('detailed')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get detailed health status' })
  @ApiResponse({ status: 200, description: 'Detailed health status retrieved successfully' })
  async getDetailedHealth() {
    const health = await this.healthService.getDetailedHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get('database')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Check database health' })
  @ApiResponse({ status: 200, description: 'Database health status retrieved successfully' })
  async getDatabaseHealth() {
    const health = await this.healthService.getDatabaseHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get('redis')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Check Redis health' })
  @ApiResponse({ status: 200, description: 'Redis health status retrieved successfully' })
  async getRedisHealth() {
    const health = await this.healthService.getRedisHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get('external-services')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Check external services health' })
  @ApiResponse({ status: 200, description: 'External services health status retrieved successfully' })
  async getExternalServicesHealth() {
    const health = await this.healthService.getExternalServicesHealth();
    return {
      success: true,
      data: health,
    };
  }

  @Get('uptime')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get system uptime' })
  @ApiResponse({ status: 200, description: 'System uptime retrieved successfully' })
  async getUptime() {
    const uptime = await this.healthService.getUptime();
    return {
      success: true,
      data: { uptime },
    };
  }

  @Get('version')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get application version' })
  @ApiResponse({ status: 200, description: 'Application version retrieved successfully' })
  async getVersion() {
    const version = await this.healthService.getVersion();
    return {
      success: true,
      data: { version },
    };
  }

  @Get('metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get application metrics' })
  @ApiResponse({ status: 200, description: 'Application metrics retrieved successfully' })
  async getMetrics() {
    const metrics = await this.healthService.getMetrics();
    return {
      success: true,
      data: metrics,
    };
  }

  @Get('live')
  @ApiOperation({ summary: 'Kubernetes liveness probe' })
  getLive() {
    return { status: 'alive', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @ApiOperation({ summary: 'Kubernetes readiness probe' })
  async getReady() {
    return this.healthService.getBasicHealth();
  }
}
