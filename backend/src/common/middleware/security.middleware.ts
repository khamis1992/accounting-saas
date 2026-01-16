import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Security Middleware
 *
 * Adds additional security headers beyond Helmet.
 * Provides defense against various attack vectors.
 */
@Injectable()
export class SecurityMiddleware implements NestMiddleware {
  private readonly logger = new Logger(SecurityMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    // X-Content-Type-Options: Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // X-Frame-Options: Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // X-XSS-Protection: Enable XSS filter (legacy browsers)
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer-Policy: Control referrer information
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions-Policy: Restrict browser features
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(), usb=()'
    );

    // Remove X-Powered-By header (if present)
    const originalJson = res.json;
    res.json = function (body?) {
      res.removeHeader('X-Powered-By');
      return originalJson.call(this, body);
    };

    // Content-Type-Options: No sniff
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Cross-Origin-Opener-Policy: Same-origin
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');

    // Cross-Origin-Resource-Policy: Same-site
    res.setHeader('Cross-Origin-Resource-Policy', 'same-site');

    // Log suspicious requests
    const queryString = JSON.stringify(req.query);
    if (queryString.includes('..') || req.path.includes('../')) {
      this.logger.warn(`Potential path traversal attempt: ${req.path} from ${req.ip}`);
    }

    next();
  }
}
