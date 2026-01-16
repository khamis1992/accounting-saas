import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Request context decorator
 *
 * Extracts audit-related information from the request context
 * that has been populated by the audit middleware
 */
export const RequestContext = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const auditContext = request.auditContext || {};

    return data ? auditContext[data] : auditContext;
  }
);

/**
 * Extract IP address from request context
 */
export const RequestIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.auditContext?.ipAddress || request.ip;
  }
);

/**
 * Extract user agent from request context
 */
export const RequestUserAgent = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.auditContext?.userAgent || request.get('user-agent');
  }
);
