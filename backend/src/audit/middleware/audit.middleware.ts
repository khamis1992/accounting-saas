import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Audit Context Interface
 *
 * Stores audit-related information extracted from the request
 */
export interface AuditContext {
  /** IP address of the client */
  ipAddress?: string;

  /** User agent of the client */
  userAgent?: string;

  /** User ID (if authenticated) */
  userId?: string;

  /** Tenant ID (if authenticated) */
  tenantId?: string;

  /** Request timestamp */
  timestamp?: Date;
}

/**
 * Extended Request interface with audit context
 */
export interface AuditRequest extends Request {
  auditContext?: AuditContext;
}

/**
 * Audit Middleware
 *
 * Extracts and stores audit-related information from incoming requests:
 * - IP address (with proxy support)
 * - User agent
 * - User context (if authenticated)
 * - Timestamp
 *
 * This middleware should run early in the middleware chain to capture
 * request information before it's modified by other middleware.
 */
@Injectable()
export class AuditMiddleware implements NestMiddleware {
  use(req: AuditRequest, res: Response, next: NextFunction): void {
    // Extract IP address with support for proxies
    const ipAddress = this.extractIpAddress(req);

    // Extract user agent
    const userAgent = req.get('user-agent') || 'unknown';

    // Extract user context if available (set by auth middleware)
    const userId = (req as any).user?.id;
    const tenantId = (req as any).user?.tenantId;

    // Store audit context in request for later use
    req.auditContext = {
      ipAddress,
      userAgent,
      userId,
      tenantId,
      timestamp: new Date(),
    };

    next();
  }

  /**
   * Extract IP address from request
   *
   * Handles various proxy configurations:
   * - X-Forwarded-For header (standard proxy)
   * - X-Real-IP header (Nginx)
   * - X-Client-IP header (some CDNs)
   * - CF-Connecting-IP (Cloudflare)
   * - Falls back to req.ip
   *
   * @param req - Express request object
   * @returns IP address string
   */
  private extractIpAddress(req: Request): string {
    // Check X-Forwarded-For header (can contain multiple IPs)
    const forwardedFor = req.get('x-forwarded-for');
    if (forwardedFor) {
      // Take the first IP (original client IP)
      const ips = forwardedFor.split(',').map(ip => ip.trim());
      return ips[0];
    }

    // Check X-Real-IP header (Nginx)
    const realIp = req.get('x-real-ip');
    if (realIp) {
      return realIp;
    }

    // Check X-Client-IP header
    const clientIp = req.get('x-client-ip');
    if (clientIp) {
      return clientIp;
    }

    // Check CF-Connecting-IP header (Cloudflare)
    const cfIp = req.get('cf-connecting-ip');
    if (cfIp) {
      return cfIp;
    }

    // Fall back to Express's ip property
    return req.ip || 'unknown';
  }
}
