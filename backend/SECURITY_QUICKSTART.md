# Security Quick Start Guide

## For Developers

### 5-Minute Setup

#### 1. Verify Installation
```bash
cd backend
npm run build
# Should show: "Successfully compiled"
```

#### 2. Update Environment Variables
Add to your `.env` file:
```env
# CORS - Add your frontend URLs
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com

# Environment
NODE_ENV=development  # Change to 'production' for HSTS
```

#### 3. Start the Server
```bash
npm run start:dev
```

#### 4. Verify Security Headers
```bash
curl -I http://localhost:3000/api/health
```

You should see these headers:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

### Common Tasks

#### Add Rate Limiting to an Endpoint

```typescript
import { Throttle, SkipThrottle } from '@nestjs/throttler';

// Default rate limiting (automatic)
@Get('public')
getPublic() { ... }

// Skip rate limiting (health checks, etc.)
@SkipThrottle()
@Get('health')
healthCheck() { ... }

// Custom rate limiting
@Throttle({ default: { limit: 5, ttl: 60000 } })  // 5 req/min
@Post('login')
login() { ... }
```

#### Add Input Sanitization

```typescript
import { XssSanitizerPipe } from '@/common/pipes';

@Post('create')
create(@Body(XssSanitizerPipe) dto: CreateDto) {
  // DTO is automatically sanitized
}
```

#### Test Security Features

```bash
# Test rate limiting (should get 429 after limit)
for i in {1..100}; do
  curl http://localhost:3000/api/health
done

# Test XSS protection (should sanitize)
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"data":"<script>alert(1)</script>"}'
```

### What's Already Configured

✅ **Automatic Security Features (No Code Needed):**
- Rate limiting on all endpoints
- Security headers on all responses
- XSS protection on all requests
- Input validation on all DTOs
- Response compression
- Request logging
- Path traversal detection

✅ **Customizable Features:**
- Rate limiting rules (see `src/throttler/throttler.module.ts`)
- Security headers (see `src/main.ts`)
- CORS origins (see `.env` file)

### File Locations

```
backend/src/
├── main.ts                          # All security middleware
├── security/
│   └── security.module.ts          # Main security module
├── throttler/
│   ├── throttler.module.ts         # Rate limiting config
│   └── throttler.guard.ts          # Custom guard
├── common/
│   ├── middleware/
│   │   ├── security.middleware.ts  # Custom headers
│   │   └── request-logging.middleware.ts  # Logging
│   └── pipes/
│       ├── xss-sanitizer.pipe.ts   # XSS protection
│       └── sanitizer.pipe.ts       # Basic sanitization
└── config/
    └── security.config.ts          # Reference documentation
```

### Troubleshooting

#### Issue: CORS errors from frontend

**Solution:** Add your frontend URL to `.env`:
```env
CORS_ORIGINS=http://localhost:3000,https://yourdomain.com
```

#### Issue: Rate limiting blocks legitimate requests

**Solution:** Increase limits in `src/throttler/throttler.module.ts`:
```typescript
{
  ttl: 60000,
  limit: 200,  // Increase from 100
}
```

#### Issue: Want to see what's being logged

**Solution:** Check your console for:
- `[SecurityMiddleware]` - Path traversal attempts
- `[RequestLoggingMiddleware]` - All requests with response times
- `[Throttler]` - Rate limit violations

### Security Checklist for New Features

When adding new features:

- [ ] DTOs have `class-validator` decorators
- [ ] Sensitive endpoints use `@Throttle()` with stricter limits
- [ ] Public endpoints marked with `@SkipThrottle()` if needed
- [ ] Input sanitization applied to all user input
- [ ] Error messages don't leak sensitive information
- [ ] Authentication/authorization checks in place

### Testing Your Security

```bash
# 1. Build the project
npm run build

# 2. Run the server
npm run start:dev

# 3. Test in another terminal:

# Test rate limiting
for i in {1..50}; do curl http://localhost:3000/api/health; done

# Test XSS protection
curl -X POST http://localhost:3000/api/test \
  -H "Content-Type: application/json" \
  -d '{"test":"<script>alert(1)</script>"}'

# Test security headers
curl -I http://localhost:3000/api/health

# Test CORS
curl -H "Origin: http://evil.com" \
  -X OPTIONS http://localhost:3000/api/test
```

### Need More Information?

See `SECURITY.md` for comprehensive documentation.

### Quick Reference

| Task | Command/Import |
|------|----------------|
| Skip rate limiting | `@SkipThrottle()` |
| Custom rate limit | `@Throttle({ default: { limit: 5, ttl: 60000 } })` |
| Sanitize input | `@Body(XssSanitizerPipe)` |
| Security module | `import { SecurityModule } from '@/security'` |
| Rate limiter | `import { Throttle, SkipThrottle } from '@nestjs/throttler'` |

---

**Questions?** Check `SECURITY.md` for detailed documentation.
