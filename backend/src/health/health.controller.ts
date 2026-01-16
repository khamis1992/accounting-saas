import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HealthCheckResult,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseHealthIndicator } from './indicators/database.health';
import { SupabaseHealthIndicator } from './indicators/supabase.health';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private databaseHealth: DatabaseHealthIndicator,
    private supabaseHealth: SupabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'General health check' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        info: {
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
          storage: { status: 'up' },
          database: { status: 'up' },
          supabase: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Service is unhealthy' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
      () => this.databaseHealth.isHealthy('database'),
      () => this.supabaseHealth.isHealthy('supabase'),
    ]);
  }

  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe - checks if app is alive' })
  @ApiResponse({
    status: 200,
    description: 'Application is alive',
    schema: {
      example: {
        status: 'ok',
        info: {
          memory_heap: { status: 'up' },
          memory_rss: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Application is not alive' })
  live(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 150 * 1024 * 1024),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe - checks if app can handle requests' })
  @ApiResponse({
    status: 200,
    description: 'Application is ready to handle requests',
    schema: {
      example: {
        status: 'ok',
        info: {
          database: { status: 'up' },
          supabase: { status: 'up' },
          storage: { status: 'up' },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  ready(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.databaseHealth.isHealthy('database'),
      () => this.supabaseHealth.checkAuth('supabase_auth'),
      () => this.disk.checkStorage('storage', { path: '/', thresholdPercent: 0.9 }),
    ]);
  }
}
