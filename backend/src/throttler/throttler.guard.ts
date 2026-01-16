import { Injectable } from '@nestjs/common';
import { ThrottlerGuard as BaseThrottlerGuard } from '@nestjs/throttler';
import type { ThrottlerRequest, ThrottlerStorage } from '@nestjs/throttler';
import { Reflector } from '@nestjs/core';
import type { ThrottlerModuleOptions } from '@nestjs/throttler';

/**
 * Custom Throttler Guard
 *
 * Extends the base ThrottlerGuard to:
 * - Skip throttling for health check endpoints
 * - Customize error messages
 * - Support metadata-based configuration
 */
@Injectable()
export class ThrottlerGuard extends BaseThrottlerGuard {
  constructor(
    options: ThrottlerModuleOptions,
    storageService: ThrottlerStorage,
    protected readonly reflector: Reflector,
  ) {
    super(options, storageService, reflector);
  }

  /**
   * Determine if request should be throttled
   * Skips health check endpoints to allow monitoring
   */
  async handleRequest(requestProps: ThrottlerRequest): Promise<boolean> {
    const { context } = requestProps;
    const request = context.switchToHttp().getRequest();
    const path = request.url;

    // Skip throttling for health check endpoints
    if (path.includes('/health') || path.includes('/api/health')) {
      return true;
    }

    // Skip throttling for Swagger documentation in development
    if (path.includes('/api/docs')) {
      return true;
    }

    return super.handleRequest(requestProps);
  }

  /**
   * Get tracker key for rate limiting
   * Uses IP address by default, but can be customized
   */
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Use IP address as tracker
    return req.ip || req.connection.remoteAddress || 'unknown';
  }
}
