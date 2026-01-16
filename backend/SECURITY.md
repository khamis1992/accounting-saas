# Security Implementation Documentation

## Overview

This document outlines the comprehensive security hardening implemented in the NestJS backend for the Qatar Accounting SaaS platform.

## Table of Contents

1. [Security Features](#security-features)
2. [Installation](#installation)
3. [Configuration](#configuration)
4. [Usage](#usage)
5. [Testing](#testing)
6. [Monitoring](#monitoring)

---

## Security Features

### 1. Rate Limiting (Throttling)

**Package:** `@nestjs/throttler`

**Purpose:** Prevent abuse and DDoS attacks by limiting the rate of incoming requests.

**Configuration:**

```typescript
// Throttler tiers configured in src/throttler/throttler.module.ts
- Short-term: 3 requests/second (burst protection)
- Medium-term: 100 requests/minute (general limiting)
- Long-term: 1000 requests/15 minutes (sustained limiting)
- Auth endpoints: 10 requests/minute (stricter security)
```

**Custom Guard:** `ThrottlerGuard`
- Skips health check endpoints
- Skips Swagger documentation
- Uses IP address as tracker

**Usage:**

```typescript
// Apply default throttling (automatic)
@Post('create')
create() { ... }

// Skip throttling for specific endpoints
@SkipThrottle()
@Get('health')
healthCheck() { ... }

// Custom throttling limits
@Throttle({ default: { limit: 5, ttl: 60000 } })
@Post('sensitive')
sensitiveOperation() { ... }
```

### 2. Security Headers (Helmet)

**Package:** `helmet`

**Purpose:** Sets various HTTP headers to secure the application.

**Implemented Headers:**

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | Custom directives | Prevents XSS and data injection |
| X-Content-Type-Options | nosniff | Prevents MIME type sniffing |
| X-Frame-Options | DENY | Prevents clickjacking |
| X-XSS-Protection | 1; mode=block | XSS filter (legacy browsers) |
| Strict-Transport-Security | max-age=31536000 | HTTPS enforcement (production only) |
| Referrer-Policy | strict-origin-when-cross-origin | Controls referrer information |
| Permissions-Policy | Restricts features | Limits browser feature access |
| Cross-Origin-Opener-Policy | same-origin | Same-origin enforcement |
| Cross-Origin-Resource-Policy | same-site | Cross-origin resource control |

**CSP Directives:**

```typescript
defaultSrc: 'self'
styleSrc: 'self', 'unsafe-inline'
scriptSrc: 'self'
imgSrc: 'self', 'data:', 'https:'
connectSrc: 'self'
frameSrc: 'none'
objectSrc: 'none'
```

### 3. CORS Configuration

**Purpose:** Control cross-origin resource sharing.

**Configuration:**

```typescript
// From ConfigService (CORS_ORIGINS env variable)
origin: ['http://localhost:3000', 'https://yourdomain.com']
credentials: true
methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
allowedHeaders: ['Content-Type', 'Authorization', ...]
maxAge: 86400 // 24 hours
```

**Environment Variable:**
```env
CORS_ORIGINS=http://localhost:3000,https://app.yourdomain.com
```

### 4. XSS Protection

**Package:** `express-xss-sanitizer`

**Purpose:** Prevent Cross-Site Scripting (XSS) attacks.

**Implementation:**
- Global middleware: Sanitizes all request bodies
- Custom pipe: `XssSanitizerPipe` for additional sanitization
- HTML entity encoding
- Removes dangerous patterns (script tags, event handlers, etc.)

### 5. Input Validation

**Package:** `class-validator`, `class-transformer`

**Global Validation Pipe:**

```typescript
{
  whitelist: true,                    // Remove non-whitelisted properties
  forbidNonWhitelisted: true,         // Reject unknown properties
  transform: true,                    // Auto-transform types
  enableImplicitConversion: true      // Enable implicit type conversion
}
```

**Custom Pipes:**
- `XssSanitizerPipe`: Advanced XSS protection
- `SanitizerPipe`: Basic sanitization and trimming

### 6. Response Compression

**Package:** `compression`

**Configuration:**
```typescript
threshold: 1024  // Only compress responses > 1KB
level: 6         // Compression level (1-9)
```

### 7. Custom Security Middleware

**SecurityMiddleware:**
- Adds additional security headers
- Removes `X-Powered-By` header
- Logs potential path traversal attempts

**RequestLoggingMiddleware:**
- Logs all incoming requests
- Tracks response time
- Logs errors with warnings
- Includes IP, method, path, user agent

### 8. HSTS (HTTP Strict Transport Security)

**Configuration (Production Only):**
```typescript
maxAge: 31536000        // 1 year
includeSubDomains: true // Apply to all subdomains
preload: true          // Submit to HSTS preload list
```

---

## Installation

All security packages are already installed:

```bash
npm install @nestjs/throttler helmet express-xss-sanitizer compression
npm install --save-dev @types/helmet @types/compression @types/express-xss-sanitizer
```

---

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# CORS Configuration
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Security
NODE_ENV=production  # Enables HSTS in production
```

### Module Structure

```
backend/src/
├── security/
│   ├── security.module.ts     # Main security module
│   └── index.ts
├── throttler/
│   ├── throttler.module.ts    # Rate limiting config
│   ├── throttler.guard.ts     # Custom throttler guard
│   └── index.ts
├── common/
│   ├── middleware/
│   │   ├── security.middleware.ts
│   │   ├── request-logging.middleware.ts
│   │   └── index.ts
│   └── pipes/
│       ├── sanitizer.pipe.ts
│       ├── xss-sanitizer.pipe.ts
│       └── index.ts
└── config/
    └── security.config.ts     # Security documentation
```

---

## Usage

### Applying Security Globally

Security is automatically applied globally via `SecurityModule`:

```typescript
// app.module.ts
@Module({
  imports: [
    SecurityModule,  // Includes all security features
    // ... other modules
  ],
})
export class AppModule {}
```

### Custom Rate Limiting

```typescript
import { Throttle } from '@nestjs/throttler';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('api/auth')
export class AuthController {
  // Stricter rate limiting for login
  @Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 requests/minute
  @Post('login')
  login() { ... }

  // Skip rate limiting for public endpoints
  @SkipThrottle()
  @Get('public')
  publicEndpoint() { ... }
}
```

### Using Sanitization Pipes

```typescript
import { XssSanitizerPipe } from '@/common/pipes';

@Controller('api/users')
export class UsersController {
  @Post('create')
  create(@Body(XssSanitizerPipe) createUserDto: CreateUserDto) {
    // DTO is already sanitized
  }
}
```

---

## Testing

### 1. Test Rate Limiting

```bash
# Send multiple requests quickly
for i in {1..100}; do
  curl http://localhost:3000/api/health
done

# Expected: HTTP 429 (Too Many Requests) after limit
```

### 2. Test XSS Protection

```bash
# Attempt XSS injection
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<script>alert(1)</script>","password":"test"}'

# Expected: Script tags are sanitized/removed
```

### 3. Test Security Headers

```bash
# Check security headers
curl -I http://localhost:3000/api/health

# Expected output:
# X-Content-Type-Options: nosniff
# X-Frame-Options: DENY
# X-XSS-Protection: 1; mode=block
# Strict-Transport-Security: max-age=31536000 (production)
# Content-Security-Policy: ...
```

### 4. Test CORS

```bash
# Test CORS from disallowed origin
curl -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: POST" \
  -X OPTIONS http://localhost:3000/api/auth/login

# Expected: Origin not allowed in CORS headers
```

### 5. Test Input Validation

```bash
# Test with unknown properties
curl -X POST http://localhost:3000/api/users/create \
  -H "Content-Type: application/json" \
  -d '{"name":"John","unknown":"property"}'

# Expected: 400 Bad Request (forbidNonWhitelisted)
```

---

## Monitoring

### Logs to Monitor

1. **Rate Limit Violations:**
   ```
   [Throttler] Too many requests from IP: xxx.xxx.xxx.xxx
   ```

2. **Path Traversal Attempts:**
   ```
   [SecurityMiddleware] Potential path traversal attempt: /../../etc/passwd from IP: xxx.xxx.xxx.xxx
   ```

3. **Failed Requests:**
   ```
   [RequestLoggingMiddleware] POST /api/auth/login - 401 - 123ms - xxx.xxx.xxx.xxx
   ```

### Security Metrics

Track these metrics for security monitoring:

- Rate limit violations per IP
- Failed authentication attempts
- Path traversal attempts
- XSS injection attempts
- Response times (anomalies may indicate attacks)

### Alerting

Set up alerts for:
- More than 100 rate limit violations/minute
- More than 50 failed auth attempts/minute from single IP
- Any path traversal attempts
- Unusual response time patterns

---

## Security Best Practices

### Development
1. Never commit `.env` files or secrets
2. Use strong JWT secrets (32+ characters)
3. Validate all input on both client and server
4. Use parameterized queries (Supabase handles this)
5. Implement proper error handling (don't leak information)

### Production
1. Use HTTPS only (HSTS enabled)
2. Keep dependencies updated
3. Run security audits regularly (`npm audit`)
4. Monitor logs for suspicious activity
5. Implement proper authentication and authorization
6. Use environment-specific CORS origins
7. Enable all security headers
8. Regular security reviews and penetration testing

### Regular Maintenance
- Update dependencies monthly
- Review and update security headers as needed
- Monitor for new vulnerabilities
- Review rate limiting rules periodically
- Update CSP directives as needed

---

## Troubleshooting

### CORS Issues

**Problem:** Frontend can't connect to backend

**Solution:**
```env
# Check CORS_ORIGINS includes your frontend URL
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

### Rate Limiting Too Strict

**Problem:** Legitimate users being throttled

**Solution:** Adjust limits in `throttler.module.ts`:
```typescript
{
  ttl: 60000,
  limit: 200,  // Increase from 100
}
```

### Compression Not Working

**Problem:** Responses not compressed

**Solution:** Check response size (must be > 1KB) and ensure client accepts gzip:
```bash
curl -H "Accept-Encoding: gzip" -I http://localhost:3000/api/health
```

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NestJS Security](https://docs.nestjs.com/security)
- [Helmet Documentation](https://helmetjs.github.io/)
- [@nestjs/throttler](https://docs.nestjs.com/security/rate-limiting)

---

## Security Checklist

- [x] Rate limiting implemented
- [x] Security headers configured (Helmet)
- [x] CORS properly configured
- [x] XSS protection enabled
- [x] Input validation (class-validator)
- [x] Response compression
- [x] Custom security middleware
- [x] Request logging
- [x] HSTS enabled (production)
- [x] Sanitization pipes
- [x] Path traversal detection
- [x] Type safety (TypeScript)

---

**Last Updated:** January 15, 2026
**Version:** 1.0.0
**Status:** Active ✅
