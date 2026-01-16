import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerConfigModule } from '../throttler/throttler.module';
import { SecurityMiddleware, RequestLoggingMiddleware } from '../common/middleware';
import { XssSanitizerPipe, SanitizerPipe } from '../common/pipes';
import { ThrottlerGuard } from '../throttler/throttler.guard';

/**
 * Security Module
 *
 * Centralizes all security-related functionality:
 * - Rate limiting (Throttler)
 * - Security middleware
 * - XSS protection
 * - Input sanitization
 *
 * This module is imported by AppModule to apply security globally.
 */
@Module({
  imports: [
    ThrottlerConfigModule,
  ],
  providers: [
    SecurityMiddleware,
    RequestLoggingMiddleware,
    XssSanitizerPipe,
    SanitizerPipe,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [
    ThrottlerConfigModule,
    SecurityMiddleware,
    RequestLoggingMiddleware,
    XssSanitizerPipe,
    SanitizerPipe,
  ],
})
export class SecurityModule {}
