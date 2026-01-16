import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Request Logging Middleware
 *
 * Logs all incoming requests for security monitoring and debugging.
 * Includes IP, method, path, user agent, and response time.
 */
@Injectable()
export class RequestLoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RequestLoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, url, ip } = req;
    const userAgent = req.get('user-agent') || 'unknown';
    const logger = this.logger;

    // Log request start
    logger.debug(`Incoming request: ${method} ${url} from ${ip}`);

    // Capture response
    const originalSend = res.send;
    res.send = function (body: any) {
      const duration = Date.now() - startTime;
      const { statusCode } = res;

      // Log response
      if (statusCode >= 400) {
        logger.warn(
          `${method} ${url} - ${statusCode} - ${duration}ms - ${ip} - ${userAgent}`
        );
      } else {
        logger.debug(
          `${method} ${url} - ${statusCode} - ${duration}ms`
        );
      }

      return originalSend.call(res, body);
    } as any;

    next();
  }
}
