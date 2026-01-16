import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Reflector } from '@nestjs/core';
import { AuditService } from './audit.service';

/**
 * Audit Interceptor
 *
 * Intercepts HTTP requests and responses to log:
 * - Request details (method, URL, headers)
 * - Response details (status, body)
 * - Execution time
 * - Errors
 *
 * Can be applied globally or per-controller/method
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  // Routes to exclude from audit logging
  private readonly EXCLUDED_ROUTES = [
    '/health',
    '/metrics',
    '/api/docs',
    '/audit', // Don't log audit endpoint calls to prevent infinite loops
  ];

  constructor(
    private reflector: Reflector,
    private auditService: AuditService
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Check if audit is disabled for this route
    const disableAudit = this.reflector.get<boolean>('disableAudit', context.getHandler()) ||
                        this.reflector.get<boolean>('disableAudit', context.getClass());

    if (disableAudit || this.isExcludedRoute(request.url)) {
      return next.handle();
    }

    const startTime = Date.now();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || 'unknown';
    const auditContext = request.auditContext || {};

    // Extract user and tenant info from request (if available)
    const userId = request.user?.id || auditContext.userId || 'anonymous';
    const tenantId = request.user?.tenantId || auditContext.tenantId || 'system';

    this.logger.debug(`[AUDIT] ${method} ${url} - User: ${userId}, Tenant: ${tenantId}`);

    return next.handle().pipe(
      tap((data) => {
        const executionTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        // Log successful request
        this.logHttpRequest({
          action: this.mapMethodToAction(method),
          entity: this.extractEntityFromUrl(url),
          userId,
          tenantId,
          method,
          url,
          statusCode,
          executionTime,
          ipAddress: auditContext.ipAddress || ip,
          userAgent: auditContext.userAgent || userAgent,
          success: statusCode < 400,
          metadata: {
            requestHeaders: this.sanitizeHeaders(request.headers),
            responseHeaders: this.sanitizeHeaders(response.getHeaders()),
            requestData: this.sanitizeBody(request.body),
          },
        });
      }),
      catchError((error) => {
        const executionTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        // Log failed request
        this.logHttpRequest({
          action: this.mapMethodToAction(method),
          entity: this.extractEntityFromUrl(url),
          userId,
          tenantId,
          method,
          url,
          statusCode,
          executionTime,
          ipAddress: auditContext.ipAddress || ip,
          userAgent: auditContext.userAgent || userAgent,
          success: false,
          errorMessage: error.message,
          metadata: {
            requestHeaders: this.sanitizeHeaders(request.headers),
            errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          },
        });

        throw error;
      })
    );
  }

  /**
   * Log HTTP request to audit service
   */
  private logHttpRequest(data: {
    action: string;
    entity: string;
    userId: string;
    tenantId: string;
    method: string;
    url: string;
    statusCode: number;
    executionTime: number;
    ipAddress: string;
    userAgent: string;
    success: boolean;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): void {
    // Don't log GET requests as they're less critical
    if (data.method === 'GET') {
      return;
    }

    this.auditService.logAction({
      action: data.action,
      entity: data.entity,
      userId: data.userId,
      tenantId: data.tenantId,
      metadata: {
        ...data.metadata,
        httpMethod: data.method,
        url: data.url,
        statusCode: data.statusCode,
      },
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      timestamp: new Date(),
      executionTime: data.executionTime,
      success: data.success,
      errorMessage: data.errorMessage,
    }).catch((error) => {
      this.logger.error(`Failed to log HTTP request: ${error.message}`);
    });
  }

  /**
   * Map HTTP method to audit action
   */
  private mapMethodToAction(method: string): string {
    const actionMap: Record<string, string> = {
      POST: 'create',
      PUT: 'update',
      PATCH: 'update',
      DELETE: 'delete',
      GET: 'view',
    };
    return actionMap[method] || method.toLowerCase();
  }

  /**
   * Extract entity type from URL
   */
  private extractEntityFromUrl(url: string): string {
    const parts = url.split('/').filter(Boolean);
    // /api/customers -> customers
    // /api/customers/123 -> customers
    // /api/invoices/123/items -> invoices
    if (parts.length >= 2) {
      return parts[1];
    }
    return 'unknown';
  }

  /**
   * Check if route is excluded from audit logging
   */
  private isExcludedRoute(url: string): boolean {
    return this.EXCLUDED_ROUTES.some(route => url.startsWith(route));
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private sanitizeHeaders(headers: Record<string, any>): Record<string, any> {
    const sanitized = { ...headers };
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];

    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sanitized = { ...body };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
