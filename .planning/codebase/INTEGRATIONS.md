# External Integrations

**Analysis Date:** 2025-01-18

## APIs & External Services

**Authentication:**
- Supabase Auth - User authentication and session management
  - SDK/Client: `@supabase/supabase-js` v2.90.1, `@supabase/ssr` v0.8.0
  - Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend)
  - Backend auth: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - Implementation location:
    - Frontend client: `frontend/lib/supabase/browser-client.ts`
    - Frontend server: `frontend/lib/supabase/server-client.ts`
    - Auth context: `frontend/contexts/auth-context.tsx`
    - Middleware: `frontend/middleware.ts` (cookie-based auth checking)

**Internal Backend API:**
- Custom NestJS API - REST endpoints for business logic
  - Base URL: `NEXT_PUBLIC_API_URL` environment variable
  - API prefix: `/api`
  - Swagger documentation: `/api/docs`
  - Implementation: `backend/src/main.ts`
  - Health check: `/api/health` (using @nestjs/terminus)

**Email Providers (Configurable):**
- SMTP - Default email sending
  - Config: `EMAIL_PROVIDER=smtp`, `EMAIL_FROM_ADDRESS`, `EMAIL_REPLY_TO`
  - Implementation: `backend/src/email/email.service.ts` (nodemailer)

- SendGrid - Transactional email service
  - Config: `EMAIL_PROVIDER=sendgrid`, `SENDGRID_API_KEY`
  - Host: `smtp.sendgrid.net`
  - Implementation: `backend/src/email/email.service.ts`

- Mailgun - Transactional email service
  - Config: `EMAIL_PROVIDER=mailgun`, `MAILGUN_USERNAME`, `MAILGUN_PASSWORD`
  - Host: `smtp.mailgun.org`
  - Implementation: `backend/src/email/email.service.ts`

- Supabase Email - Alternative option
  - Config: `EMAIL_PROVIDER=supabase`
  - Implementation: `backend/src/email/email.service.ts`

## Data Storage

**Databases:**
- Supabase PostgreSQL - Primary database
  - Connection: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (backend), `NEXT_PUBLIC_SUPABASE_URL` (frontend)
  - Client: Supabase client (`@supabase/supabase-js`)
  - ORM: Direct SQL queries via Supabase client
  - Schema location: `database/*.sql` files (14 migration files)
  - Key schema files:
    - `database/01_core_tables.sql` - Tenants, users, roles, permissions
    - `database/02_accounting_tables.sql` - COA, journals, ledger
    - `database/03_business_tables.sql` - Customers, vendors, invoices, payments
    - `database/04_additional_modules.sql` - Banking, expenses, assets, VAT
    - `database/05_rls_policies.sql` - Row-level security policies
    - `database/06_views.sql` - Database views
    - `database/07_triggers.sql` - Automated triggers
    - `database/11_performance_indexes.sql` - Performance optimization
  - Features used:
    - UUID extension (`uuid-ossp`)
    - Row-Level Security (RLS) with tenant isolation
    - Database functions (e.g., `public.get_current_user_tenant()`, `public.is_platform_super_admin()`)
    - Triggers for audit trails
    - JSONB columns for flexible settings storage

**File Storage:**
- Supabase Storage - File uploads (avatars, receipts, attachments)
  - Bucket configuration: Supabase project
  - Image optimization: Next.js Image component with Supabase domain whitelisting
  - Allowed domains: `gbbmicjucestjpxtkjyp.supabase.co` (configured in `frontend/next.config.ts`)

**Caching:**
- Not implemented (no Redis caching layer, only Redis for job queues)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth - Complete auth solution
  - Implementation: Cookie-based authentication with SSR support
  - Frontend:
    - Browser client: `frontend/lib/supabase/browser-client.ts` (createBrowserClient)
    - Server client: `frontend/lib/supabase/server-client.ts` (createServerClient)
    - Context: `frontend/contexts/auth-context.tsx` (AuthContext provider)
  - Middleware: `frontend/middleware.ts` (auth cookie pattern matching, route protection)
  - Cookie pattern: `sb-.*-auth-token.*` (Supabase auth cookies)
  - Session management: Supabase SSR with Next.js middleware
  - Protected routes: All routes under `app/[locale]/(app)/` require authentication
  - Public routes: `app/[locale]/(auth)/` and `app/[locale]/(marketing)/`

**Role-Based Access Control (RBAC):**
- Custom implementation using Supabase database
  - Tables: `public.roles`, `public.permissions`, `public.role_permissions`, `public.user_roles`
  - System roles: SUPER_ADMIN, ADMIN, ACCOUNTANT, VIEWER
  - Permission checking: `frontend/hooks/use-permissions.tsx`
  - Backend guards: `backend/src/common/guards/`

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, LogRocket, or similar integrated)

**Logs:**
- Console-based logging
- Backend: NestJS Logger (`Logger` class from `@nestjs/common`)
- Frontend: Console methods (warn, error allowed per ESLint config)
- Log levels: Configurable via `LOG_LEVEL` env var (debug/info/warn/error)
- Request logging: `backend/src/common/middleware/` (RequestLoggingMiddleware)
- Health checks: `/api/health` endpoint with @nestjs/terminus

**Performance Monitoring:**
- Next.js Bundle Analyzer (`@next/bundle-analyzer`)
- Run with: `ANALYZE=true npm run build` in frontend
- Database query monitoring: `database/13_query_monitoring.sql`

## CI/CD & Deployment

**Hosting:**
- Backend: Railway (configured in `railway.json`)
  - Build command: `cd backend && npm install && npm run build`
  - Start command: `cd backend && npm run start:prod`
  - Health check: `/api/health` (300s timeout)
  - Restart policy: ON_FAILURE
  - Actual deployment: `https://accounting-saas-production-bd32.up.railway.app/api`

- Frontend: Vercel (configured in `vercel.json`)
  - Build command: `cd frontend && npm run build`
  - Dev command: `cd frontend && npm run dev`
  - Install command: `cd frontend && npm install`
  - Output directory: `frontend/.next`

**CI Pipeline:**
- None detected (no GitHub Actions, GitLab CI, or similar configured)

## Environment Configuration

**Required env vars:**

**Frontend (.env.local):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_URL` - Frontend application URL
- Optional: `NEXT_PUBLIC_APP_NAME` - Application display name

**Backend (.env):**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin access)
- `JWT_SECRET` - JWT signing secret (minimum 32 characters)
- `JWT_EXPIRES_IN` - JWT token expiration time
- `REDIS_HOST` - Redis host for BullMQ
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)
- `EMAIL_PROVIDER` - Email provider: smtp/sendgrid/mailgun/supabase
- `EMAIL_FROM_NAME` - Email sender name
- `EMAIL_FROM_ADDRESS` - Email sender address
- `EMAIL_REPLY_TO` - Email reply-to address
- `SENDGRID_API_KEY` - SendGrid API key (if using SendGrid)
- `MAILGUN_USERNAME` - MailGun username (if using MailGun)
- `MAILGUN_PASSWORD` - MailGun password (if using MailGun)
- `CORS_ORIGINS` - Comma-separated list of allowed origins
- `FRONTEND_URL` - Frontend URL for email links
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment: development/staging/production/test
- `LOG_LEVEL` - Logging level: debug/info/warn/error

**Secrets location:**
- Environment files (`.env` for backend, `.env.local` for frontend)
- Deployment platform environment variables (Railway, Vercel)
- Validation: Build-time validation in `frontend/env.config.js`

## Webhooks & Callbacks

**Incoming:**
- None detected (no webhook endpoints configured)

**Outgoing:**
- None detected (no external webhooks integrated)

**Internal Event System:**
- BullMQ Job Queues - Background job processing
  - Queue provider: BullMQ 5.66.5 with Redis backend
  - Implementation: `backend/src/queues/`
  - Email queue: `backend/src/email/email-queue.processor.ts`
  - Depreciation queue: `backend/src/queues/processors/depreciation.processor.ts`
  - Queue service: `backend/src/queues/queues.service.ts`
  - Module: `backend/src/queues/queues.module.ts`
  - Jobs handled:
    - Email sending (via Bull)
    - Asset depreciation calculations
    - Background processing tasks

---

*Integration audit: 2025-01-18*
