# Security Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENT REQUEST                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER 1                          │
│                    (Express Middleware)                      │
├─────────────────────────────────────────────────────────────┤
│  1. Helmet (Security Headers)                               │
│     - Content-Security-Policy                                │
│     - X-Frame-Options                                        │
│     - X-Content-Type-Options                                 │
│     - etc.                                                   │
│                                                              │
│  2. CORS Configuration                                       │
│     - Origin validation                                      │
│     - Credentials handling                                   │
│                                                              │
│  3. XSS Protection Middleware                                │
│     - Script tag removal                                     │
│     - HTML entity encoding                                   │
│                                                              │
│  4. Compression Middleware                                   │
│     - Gzip compression                                       │
│     - Threshold: 1KB                                         │
│                                                              │
│  5. Custom Security Middleware                               │
│     - Additional headers                                     │
│     - Path traversal detection                               │
│                                                              │
│  6. Request Logging Middleware                               │
│     - Request tracking                                       │
│     - Response time monitoring                               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER 2                          │
│                    (NestJS Guards)                           │
├─────────────────────────────────────────────────────────────┤
│  1. Throttler Guard (Rate Limiting)                          │
│     - Short-term: 3 req/sec                                  │
│     - Medium-term: 100 req/min                               │
│     - Long-term: 1000 req/15min                              │
│     - Auth: 10 req/min                                       │
│     - Skips: /health, /api/docs                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYER 3                          │
│                    (NestJS Pipes)                            │
├─────────────────────────────────────────────────────────────┤
│  1. Validation Pipe                                          │
│     - Whitelist validation                                   │
│     - Type transformation                                    │
│     - Unknown property rejection                             │
│                                                              │
│  2. XSS Sanitizer Pipe                                       │
│     - HTML entity encoding                                   │
│     - Dangerous pattern removal                              │
│                                                              │
│  3. Sanitizer Pipe                                           │
│     - String trimming                                        │
│     - Basic sanitization                                     │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LOGIC                         │
│                    (Controllers & Services)                   │
├─────────────────────────────────────────────────────────────┤
│  - Business Logic                                            │
│  - Database Operations                                       │
│  - External API Calls                                        │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
Request → [Helmet] → [CORS] → [XSS Protection] → [Compression]
           ↓          ↓         ↓                  ↓
        Headers    Origin   Sanitize          Compress
        Checked    Checked  Request            Response
           ↓          ↓         ↓                  ↓
        [Security Middleware] → [Request Logging]
           ↓                     ↓
     Add Headers           Log Request
     Detect Attacks        Track Time
           ↓                     ↓
        [Throttler Guard]
           ↓
     Check Rate Limits
           ↓
        [Validation Pipes]
           ↓
     Validate & Sanitize
           ↓
        [Controller]
           ↓
        [Service]
           ↓
        [Response]
           ↓
     [Compression] → [Security Headers] → Client
```

## Module Dependency Graph

```
┌─────────────────────────────────────────────────────────┐
│                     AppModule                            │
├─────────────────────────────────────────────────────────┤
│  Imports:                                                │
│  ┌───────────────────────────────────────────────────┐  │
│  │              SecurityModule                        │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  - ThrottlerConfigModule                          │  │
│  │  - SecurityMiddleware                             │  │
│  │  - RequestLoggingMiddleware                       │  │
│  │  - XssSanitizerPipe                               │  │
│  │  - SanitizerPipe                                  │  │
│  │  - ThrottlerGuard (APP_GUARD)                     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  Other Modules:                                          │
│  - AuthModule                                            │
│  - UsersModule                                           │
│  - TenantsModule                                         │
│  - etc.                                                  │
└─────────────────────────────────────────────────────────┘
```

## File Structure

```
backend/src/
│
├── security/                          # Security Module
│   ├── security.module.ts            # Main security module
│   └── index.ts
│
├── throttler/                         # Rate Limiting
│   ├── throttler.module.ts           # Configuration
│   ├── throttler.guard.ts            # Custom guard
│   └── index.ts
│
├── common/                            # Shared Security Components
│   ├── middleware/
│   │   ├── security.middleware.ts    # Custom headers
│   │   ├── request-logging.middleware.ts  # Logging
│   │   └── index.ts
│   │
│   └── pipes/
│       ├── sanitizer.pipe.ts         # Basic sanitization
│       ├── xss-sanitizer.pipe.ts     # XSS protection
│       └── index.ts
│
├── config/
│   ├── config.service.ts             # Environment config
│   ├── config.module.ts
│   └── security.config.ts            # Security reference
│
├── app.module.ts                     # Root module
└── main.ts                           # Bootstrap & middleware setup
```

## Security Feature Matrix

| Feature | Layer | Package | Priority | Status |
|---------|-------|---------|----------|--------|
| **Rate Limiting** | Guard | @nestjs/throttler | HIGH | ✅ |
| **Helmet Headers** | Middleware | helmet | HIGH | ✅ |
| **CORS** | Middleware | Built-in | HIGH | ✅ |
| **XSS Protection** | Middleware + Pipe | express-xss-sanitizer | HIGH | ✅ |
| **Input Validation** | Pipe | class-validator | HIGH | ✅ |
| **Compression** | Middleware | compression | MEDIUM | ✅ |
| **Request Logging** | Middleware | Custom | MEDIUM | ✅ |
| **Path Traversal Detection** | Middleware | Custom | HIGH | ✅ |
| **HSTS** | Middleware | helmet | HIGH | ✅ (prod only) |
| **Sanitization** | Pipe | Custom | MEDIUM | ✅ |

## Configuration Flow

```
Environment Variables (.env)
         │
         ▼
┌─────────────────────────┐
│   ConfigService         │
│   - Reads .env          │
│   - Validates config    │
│   - Type-safe access    │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   SecurityModule        │
│   - ThrottlerConfig     │
│   - Middleware          │
│   - Guards              │
│   - Pipes               │
└──────────┬──────────────┘
           │
           ▼
┌─────────────────────────┐
│   main.ts               │
│   - Apply middleware    │
│   - Setup guards        │
│   - Configure pipes     │
└─────────────────────────┘
```

## Threat Model

### Protected Against

| Attack Type | Protection Mechanism | Status |
|-------------|---------------------|--------|
| **DDoS / Brute Force** | Rate Limiting | ✅ |
| **XSS (Cross-Site Scripting)** | XSS Sanitizer + CSP | ✅ |
| **Clickjacking** | X-Frame-Options | ✅ |
| **MIME Sniffing** | X-Content-Type-Options | ✅ |
| **Path Traversal** | Custom Middleware | ✅ |
| **CSRF** | SameSite cookies + CORS | ✅ |
| **Man-in-the-Middle** | HSTS (HTTPS) | ✅ (prod) |
| **Injection Attacks** | Input Validation | ✅ |
| **Data Leaks** | Security Headers | ✅ |

### Security Layers

```
Layer 1: Network/Infrastructure
├── HTTPS/TLS (Production)
└── Firewall rules

Layer 2: Application (Express)
├── Helmet (Security Headers)
├── CORS (Cross-Origin Control)
├── XSS Protection
├── Compression
├── Custom Security Middleware
└── Request Logging

Layer 3: Application (NestJS)
├── Rate Limiting (Throttler)
├── Input Validation
├── Sanitization Pipes
└── Authentication/Authorization

Layer 4: Data
├── Supabase RLS (Row Level Security)
├── Encrypted connections
└── Parameterized queries
```

## Performance Considerations

### Overhead Analysis

| Component | Overhead | Impact | Mitigation |
|-----------|----------|--------|------------|
| Helmet | ~1ms | Negligible | None needed |
| XSS Sanitizer | ~1ms | Negligible | None needed |
| Compression | ~2ms | Low | Threshold: 1KB |
| Rate Limiting | ~1ms | Negligible | Redis cache |
| Validation | ~1ms | Negligible | None needed |
| Logging | ~1ms | Negligible | Async logging |
| **Total** | **~5-7ms** | **Acceptable** | - |

### Optimization Tips

1. **Compression:** Only compress responses > 1KB
2. **Rate Limiting:** Use Redis for distributed systems
3. **Logging:** Use async logging in production
4. **Validation:** Keep DTOs simple and focused

## Monitoring & Observability

### Key Metrics

```
Security Metrics:
├── Rate limit violations per IP
├── Failed authentication attempts
├── Path traversal attempts
├── XSS injection attempts
├── Response time anomalies
└── Error rates by endpoint

Performance Metrics:
├── Request throughput
├── Response times (p50, p95, p99)
├── Compression ratio
├── Rate limit cache hit rate
└── Middleware overhead
```

### Alerting Rules

```yaml
alerts:
  - name: High rate limit violations
    condition: rate_limit_violations > 100/min
    severity: warning

  - name: Brute force attack
    condition: failed_auth_attempts > 50/min
    severity: critical

  - name: Path traversal attempt
    condition: path_traversal_attempts > 0
    severity: high

  - name: Response time anomaly
    condition: avg_response_time > 500ms
    severity: warning
```

## Upgrade Path

### Current Implementation: Phase 1 ✅

- [x] Basic rate limiting
- [x] Security headers
- [x] XSS protection
- [x] Input validation
- [x] Request logging

### Future Enhancements: Phase 2 (Optional)

- [ ] Redis-based rate limiting (distributed)
- [ ] Advanced threat detection (ML-based)
- [ ] Web Application Firewall (WAF)
- [ ] DDoS protection service (Cloudflare, AWS Shield)
- [ ] Security audit logging (SIEM integration)
- [ ] Automated security scanning
- [ ] Penetration testing

### Future Enhancements: Phase 3 (Advanced)

- [ ] API security analytics dashboard
- [ ] Real-time threat intelligence
- [ ] Automated incident response
- [ ] Security orchestration (SOAR)
- [ ] Compliance reporting (SOC 2, ISO 27001)

---

**Last Updated:** January 15, 2026
**Architecture Version:** 1.0.0
**Status:** ✅ Production Ready
