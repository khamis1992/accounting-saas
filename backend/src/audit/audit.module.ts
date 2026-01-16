import { Module, Global } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditService } from './audit.service';
import { AuditController } from './audit.controller';
import { AuditInterceptor } from './audit.interceptor';
import { AuditMiddleware, AuditContext } from './middleware/audit.middleware';
import { SupabaseModule } from '../supabase/supabase.module';

/**
 * Audit Module
 *
 * Provides comprehensive audit logging for the application.
 * This module is exported so that other modules can inject the AuditService.
 *
 * Features:
 * - Automatic HTTP request/response logging via interceptor
 * - Manual logging via AuditService
 * - Decorators for method-level audit logging
 * - IP address and user agent tracking via middleware
 * - Batch processing for performance
 * - Export capabilities
 * - Statistical analysis
 */
@Global()
@Module({
  imports: [SupabaseModule],
  controllers: [AuditController],
  providers: [
    AuditService,
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    AuditMiddleware,
  ],
  exports: [AuditService, AuditMiddleware],
})
export class AuditModule {}

// Export types for use in other modules
export * from './interfaces';
export * from './decorators';
export * from './middleware/audit.middleware';
