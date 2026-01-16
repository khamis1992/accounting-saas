/**
 * Security Configuration Documentation
 *
 * This document outlines all security measures implemented in the backend.
 *
 * ## 1. RATE LIMITING (Throttling)
 *
 * ### Configuration:
 * - Short-term: 3-10 requests per second (prevents burst attacks)
 * - Medium-term: 100-200 requests per minute (general rate limiting)
 * - Long-term: 1000-2000 requests per 15 minutes (sustained limiting)
 * - Auth endpoints: 10-20 requests per minute (stricter for security)
 *
 * ### Implementation:
 * - Package: @nestjs/throttler
 * - Guard: ThrottlerGuard (customized)
 * - Skips: Health checks, Swagger docs
 *
 * ### Usage:
 * ```typescript
 * // Apply to all routes by default
 * // Skip for specific routes:
 * @SkipThrottle()
 * @Get('health')
 * healthCheck() { ... }
 *
 * // Custom limit for specific route:
 * @Throttle({ default: { limit: 5, ttl: 60000 } })
 * @Post('sensitive-operation')
 * sensitiveOp() { ... }
 * ```
 *
 * ## 2. SECURITY HEADERS (Helmet)
 *
 * ### Implemented Headers:
 * - Content-Security-Policy (CSP): Restricts resource sources
 * - X-Content-Type-Options: Prevents MIME sniffing
 * - X-Frame-Options: Prevents clickjacking
 * - X-XSS-Protection: XSS filter for legacy browsers
 * - Strict-Transport-Security (HSTS): HTTPS enforcement (production only)
 * - Referrer-Policy: Controls referrer information
 * - Permissions-Policy: Restricts browser features
 *
 * ### CSP Directives:
 * - defaultSrc: 'self' only
 * - styleSrc: 'self' and 'unsafe-inline'
 * - scriptSrc: 'self' only
 * - imgSrc: 'self', data:, https:
 * - connectSrc: 'self' only
 * - frameSrc: 'none'
 * - objectSrc: 'none'
 *
 * ## 3. CORS CONFIGURATION
 *
 * ### Settings:
 * - Origins: From ConfigService (CORS_ORIGINS env var)
 * - Credentials: Enabled
 * - Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
 * - Allowed Headers: Content-Type, Authorization, etc.
 * - Max Age: 24 hours (preflight cache)
 *
 * ### Environment Variables:
 * ```env
 * CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
 * # Or use wildcard for development (not recommended for production):
 * CORS_ORIGINS=*
 * ```
 *
 * ## 4. XSS PROTECTION
 *
 * ### Implementation:
 * - Package: express-xss-sanitizer
 * - Middleware: Applied globally
 * - Pipe: XssSanitizerPipe for request bodies
 *
 * ### Sanitization:
 * - HTML entity encoding
 * - Removes <script> tags
 * - Removes javascript: protocol
 * - Removes event handlers (onclick, onload, etc.)
 * - Removes vbscript: protocol
 *
 * ## 5. INPUT VALIDATION
 *
 * ### Global Validation Pipe:
 * - whitelist: True (removes non-whitelisted properties)
 * - forbidNonWhitelisted: True (rejects unknown properties)
 * - transform: True (auto-transforms types)
 * - enableImplicitConversion: True
 *
 * ### Additional Pipes:
 * - XssSanitizerPipe: Sanitizes all request bodies
 * - SanitizerPipe: Basic sanitization and trimming
 *
 * ## 6. COMPRESSION
 *
 * ### Settings:
 * - Package: compression
 * - Threshold: 1KB (only compress larger responses)
 * - Level: 6 (balanced compression)
 * - Filter: Skips if x-no-compression header present
 *
 * ## 7. CUSTOM MIDDLEWARE
 *
 * ### SecurityMiddleware:
 * - Adds additional security headers
 * - Removes X-Powered-By header
 * - Logs potential path traversal attempts
 *
 * ### RequestLoggingMiddleware:
 * - Logs all incoming requests
 * - Includes IP, method, path, user agent
 * - Tracks response time
 * - Logs errors with warnings
 *
 * ## 8. HSTS (HTTP Strict Transport Security)
 *
 * ### Configuration (Production Only):
 * - Max Age: 31536000 (1 year)
 * - Include SubDomains: True
 * - Preload: True (for HSTS preload list)
 *
 * ## 9. REQUEST SIZE LIMITS
 *
 * ### Body Parser Settings:
 * - JSON limit: 10mb
 * - URL-encoded limit: 10mb
 *
 * ## SECURITY BEST PRACTICES
 *
 * 1. Never commit .env files or secrets
 * 2. Use strong JWT secrets (32+ characters)
 * 3. Validate all input on both client and server
 * 4. Use parameterized queries (Supabase handles this)
 * 5. Implement proper error handling (don't leak information)
 * 6. Use HTTPS in production
 * 7. Keep dependencies updated
 * 8. Run security audits regularly
 * 9. Monitor logs for suspicious activity
 * 10. Implement proper authentication and authorization
 *
 * ## TESTING SECURITY
 *
 * 1. Test rate limiting:
 *    ```bash
 *    for i in {1..100}; do curl http://localhost:3000/api/health; done
 *    ```
 *
 * 2. Test XSS protection:
 *    ```bash
 *    curl -X POST http://localhost:3000/api/auth/login \
 *      -H "Content-Type: application/json" \
 *      -d '{"email":"<script>alert(1)</script>","password":"test"}'
 *    ```
 *
 * 3. Test security headers:
 *    ```bash
 *    curl -I http://localhost:3000/api/health
 *    ```
 *
 * 4. Test CORS:
 *    ```bash
 *    curl -H "Origin: http://evil.com" \
 *      -H "Access-Control-Request-Method: POST" \
 *      -X OPTIONS http://localhost:3000/api/auth/login
 *    ```
 *
 * ## MONITORING
 *
 * - Check logs for rate limit violations
 * - Monitor for path traversal attempts
 * - Track response times for anomalies
 * - Review failed authentication attempts
 * - Alert on unusual traffic patterns
 */

export const SECURITY_CONFIG = {
  rateLimiting: {
    short: { ttl: 1000, limit: 3 },
    medium: { ttl: 60000, limit: 100 },
    long: { ttl: 900000, limit: 1000 },
    auth: { ttl: 60000, limit: 10 },
  },
  cors: {
    credentials: true,
    maxAge: 86400,
  },
  compression: {
    threshold: 1024,
    level: 6,
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};
