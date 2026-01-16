# Environment Configuration Guide

## Overview

This backend uses a comprehensive environment configuration system with Joi validation to ensure all required environment variables are present and valid before the application starts.

## Configuration Files

### Core Files
- `src/config/config.schema.ts` - TypeScript interfaces for environment variables
- `src/config/config.service.ts` - Service for accessing configuration values
- `src/config/config.validation.ts` - Joi validation schema
- `src/config/config.module.ts` - NestJS configuration module

### Environment Files
- `.env.example` - Complete example with all variables and documentation
- `.env.development.example` - Development-specific template
- `.env.staging.example` - Staging-specific template
- `.env.production.example` - Production-specific template

## Setup Instructions

### 1. Create Environment File

Copy the appropriate template based on your environment:

```bash
# Development
cp .env.development.example .env

# Staging
cp .env.staging.example .env

# Production
cp .env.production.example .env
```

### 2. Fill in Required Values

Edit `.env` and fill in all required values:

```bash
# Required variables
NODE_ENV=development
DATABASE_URL=your-database-url
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret-min-32-chars
FRONTEND_URL=your-frontend-url
```

### 3. Validation

The application will **not start** if required environment variables are missing or invalid. You'll see clear error messages like:

```
Error: Configuration validation failed:
  - DATABASE_URL is required
  - JWT_SECRET must be at least 32 characters long
```

## Configuration Reference

### Environment Variables

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `NODE_ENV` | enum | No | development | Environment: development, staging, production, test |
| `PORT` | number | No | 3000 | Server port (1024-65535) |
| `DATABASE_URL` | string | Yes | - | PostgreSQL connection URL |
| `SUPABASE_URL` | string | Yes | - | Supabase project URL |
| `SUPABASE_ANON_KEY` | string | Yes | - | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | string | Yes | - | Supabase service role key |
| `JWT_SECRET` | string | Yes | - | JWT secret (min 32 chars) |
| `JWT_EXPIRATION` | string | No | 7d | Token expiration (e.g., 1h, 7d, 30m) |
| `CORS_ORIGINS` | string | No | * | Comma-separated origins or * |
| `REDIS_HOST` | string | No | localhost | Redis server host |
| `REDIS_PORT` | number | No | 6379 | Redis server port |
| `REDIS_PASSWORD` | string | No | - | Redis password |
| `FRONTEND_URL` | string | Yes | - | Frontend URL for redirects |
| `LOG_LEVEL` | enum | No | info | Logging level: debug, info, warn, error |

## Using ConfigService

### Injection

Import and inject `ConfigService` in your services:

```typescript
import { ConfigService } from '../config/config.service';

@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}
}
```

### Common Methods

```typescript
// Environment detection
configService.isDevelopment  // boolean
configService.isProduction   // boolean
configService.isStaging      // boolean

// Server config
configService.port  // number

// Database
configService.databaseUrl  // string

// Supabase
configService.supabaseUrl  // string
configService.supabaseAnonKey  // string
configService.supabaseServiceRoleKey  // string

// JWT
configService.jwtSecret  // string
configService.jwtExpiration  // string

// CORS
configService.corsOrigins  // string[]

// Redis
configService.redisHost  // string
configService.redisPort  // number
configService.redisPassword  // string | undefined

// Frontend
configService.frontendUrl  // string

// Logging
configService.logLevel  // 'debug' | 'info' | 'warn' | 'error'
```

## Security Best Practices

### Development
- Use `LOG_LEVEL=debug` for verbose logging
- Can use wildcard CORS origins (`*`) for local development
- Use shorter JWT expiration (1h) for testing

### Staging
- Use `LOG_LEVEL=info`
- Specify staging domains in `CORS_ORIGINS`
- Use moderate JWT expiration (7d)
- Use staging-specific secrets

### Production
- Use `LOG_LEVEL=warn` or `error`
- **NEVER** use wildcard CORS (`*`)
- Use strong, unique secrets (minimum 32 characters for JWT_SECRET)
- Use long JWT expiration (7d)
- Rotate secrets regularly
- Enable Redis password authentication
- Use database connection pooling

## Generating Secrets

### JWT Secret

Generate a secure JWT secret:

```bash
# Linux/Mac
openssl rand -base64 48

# Windows (PowerShell)
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 48 | % {[char]$_})
```

## Validation Rules

### JWT_SECRET
- Must be at least 32 characters
- Should be cryptographically random
- Different for each environment

### JWT_EXPIRATION
- Format: `<number><unit>`
- Units: `s` (seconds), `m` (minutes), `h` (hours), `d` (days)
- Examples: `1h`, `7d`, `30m`, `1s`

### URL Validation
- `DATABASE_URL` must be a valid PostgreSQL connection string
- `SUPABASE_URL` must be a valid HTTPS URL
- `FRONTEND_URL` must be a valid URL

### Port Validation
- Range: 1024-65535
- Default: 3000

## Troubleshooting

### Application Won't Start

If you see validation errors:

1. Check that `.env` file exists
2. Verify all required variables are set
3. Check formats (URLs, numbers, etc.)
4. Ensure JWT_SECRET is at least 32 characters

### Configuration Not Loading

1. Verify `.env` file is in the backend root directory
2. Check file permissions
3. Ensure no syntax errors (no extra spaces, quotes, etc.)
4. Verify NODE_ENV matches environment file name (optional)

### Type Errors

If you see TypeScript errors with ConfigService:

1. Ensure you're importing from `../config/config.service`
2. Not from `@nestjs/config` (that's the NestJS one)
3. Run `npm run build` to check for errors

## Examples

### Example 1: Basic Service

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '../config/config.service';

@Injectable()
export class EmailService {
  constructor(private configService: ConfigService) {}

  async sendPasswordReset(email: string, token: string) {
    const resetUrl = `${this.configService.frontendUrl}/auth/reset?token=${token}`;

    // Send email with resetUrl
  }
}
```

### Example 2: Conditional Logic

```typescript
@Injectable()
export class MyService {
  constructor(private configService: ConfigService) {}

  async performAction() {
    if (this.configService.isDevelopment) {
      // Development-only logic
      console.log('Debug info');
    }

    if (this.configService.isProduction) {
      // Production-only logic
      logger.info('Action performed');
    }
  }
}
```

### Example 3: Multiple Origins

```typescript
// .env file
CORS_ORIGINS=https://app.example.com,https://admin.example.com,https://api.example.com

// In code
const allowedOrigins = this.configService.corsOrigins;
// Returns: ['https://app.example.com', 'https://admin.example.com', 'https://api.example.com']
```

## Additional Resources

- [NestJS Config Documentation](https://docs.nestjs.com/techniques/configuration)
- [Joi Validation](https://joi.dev/api/)
- [Environment Variables Best Practices](https://12factor.net/config)

## Support

For issues or questions:
1. Check this documentation
2. Review `.env.example` for variable descriptions
3. Check validation error messages carefully
4. Ensure all dependencies are installed (`npm install`)
