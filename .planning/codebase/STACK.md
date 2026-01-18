# Technology Stack

**Analysis Date:** 2025-01-18

## Languages

**Primary:**
- TypeScript 5.x - Backend and Frontend (strict mode enabled)

**Secondary:**
- SQL (PostgreSQL) - Database schema, migrations, RLS policies, views, triggers
- JavaScript (Node.js) - Build scripts, configuration

## Runtime

**Environment:**
- Node.js 20+ (specified in `.nvmrc`)

**Package Manager:**
- npm (backend) - Lockfile: present
- npm (frontend) - Lockfile: `package-lock.json` present

## Frameworks

**Core Backend:**
- NestJS 11.x - REST API framework
- Express.js (via NestJS platform) - HTTP server

**Core Frontend:**
- Next.js 16.1.1 - React framework with App Router
- React 19.2.3 - UI library
- React DOM 19.2.3

**UI Component Frameworks:**
- Radix UI (@radix-ui/*) - Unstyled accessible components (alert-dialog, avatar, checkbox, dialog, dropdown-menu, label, select, separator, slot, switch, tabs)
- Tailwind CSS 4.x - Utility-first styling
- shadcn/ui - Component library built on Radix UI
- cmdk - Command palette component

**State Management:**
- React Context API - Auth context
- Supabase SSR - Server-side state management

**Internationalization:**
- next-intl 4.7.0 - i18n for Next.js (Arabic/English)

**Animation:**
- Framer Motion 11.18.2 - Declarative animations

**Testing:**
- Jest 30.x - Backend test runner
- Jest 30.x - Frontend test runner (inferred from dependencies)
- SuperTest - API testing

**Build/Dev:**
- TypeScript Compiler (tsc) - Type checking and compilation
- ESLint 9.x - Linting (backend and frontend)
- Prettier 3.8.x - Code formatting
- @next/bundle-analyzer - Bundle size analysis

## Key Dependencies

**Critical Backend:**
- @supabase/supabase-js 2.90.1 - Database client, auth client
- @nestjs/swagger 11.x - OpenAPI/Swagger documentation
- class-validator 0.14.3 - Request validation
- class-transformer 0.5.1 - Data transformation
- @nestjs/jwt 11.x - JWT authentication
- passport 0.7.0 + passport-jwt 4.x - Auth strategies

**Critical Frontend:**
- @supabase/supabase-js 2.90.1 - Database client, auth client
- @supabase/ssr 0.8.0 - Server-side rendering utilities
- @tanstack/react-table 8.21.3 - Table components
- react-hook-form 7.71.1 - Form handling
- @hookform/resolvers 5.2.2 - Form validation resolvers
- zod 4.3.5 - Schema validation
- recharts 3.6.0 - Charting library
- sonner 2.0.7 - Toast notifications
- date-fns 4.1.0 - Date manipulation
- lucide-react 0.562.0 - Icon library

**Infrastructure:**
- BullMQ 5.66.5 - Job queue system
- Bull 4.16.5 - Legacy queue compatibility
- ioredis 5.9.1 - Redis client for BullMQ
- helmet 8.1.0 - Security headers
- compression 1.8.1 - Response compression
- express-xss-sanitizer 2.x - XSS protection

**Data Export/Reporting:**
- pdfkit 0.17.2 - PDF generation
- exceljs 4.4.0 - Excel export
- @fast-csv/format 5.0.5 - CSV export
- handlebars 4.7.8 - Email template engine

**Email:**
- nodemailer 7.0.12 - Email sending
- Support for SMTP, SendGrid, Mailgun providers

**Security:**
- @nestjs/throttler 6.5.0 - Rate limiting
- @nestjs/terminus 11.x - Health checks

## Configuration

**Environment:**
- Backend: `.env` file (see `backend/.env.example`)
- Frontend: `.env.local` file (validated at build time via `frontend/env.config.js`)

**Key configs required:**

**Backend (.env):**
- `NODE_ENV` - development/staging/production/test
- `PORT` - Server port (default: 3000)
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase admin key
- `JWT_SECRET` - JWT signing secret (min 32 chars)
- `JWT_EXPIRES_IN` - Token expiration (e.g., "7d")
- `CORS_ORIGINS` - Comma-separated allowed origins
- `REDIS_HOST` - Redis host for BullMQ
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)
- `EMAIL_PROVIDER` - smtp/sendgrid/mailgun/supabase
- `EMAIL_FROM_NAME` - Email sender name
- `EMAIL_FROM_ADDRESS` - Email sender address
- `EMAIL_REPLY_TO` - Reply-to address
- `SENDGRID_API_KEY` - SendGrid API key (if using SendGrid)
- `MAILGUN_USERNAME` - MailGun username (if using MailGun)
- `MAILGUN_PASSWORD` - MailGun password (if using MailGun)
- `FRONTEND_URL` - Frontend URL for email links
- `LOG_LEVEL` - debug/info/warn/error

**Frontend (.env.local):**
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL (required)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase public key (required)
- `NEXT_PUBLIC_API_URL` - Backend API URL (required)
- `NEXT_PUBLIC_APP_URL` - Frontend app URL (required)
- `NEXT_PUBLIC_APP_NAME` - Application name (default: "المحاسب")

**Build:**
**Frontend:** `frontend/next.config.ts`
- Environment variable validation (build fails if vars missing)
- Bundle analyzer support (`ANALYZE=true next build`)
- Image optimization for Supabase domains
- next-intl plugin integration

**Backend:** `backend/nest-cli.json`
- Delete outDir before build
- Source root: `src/`

**TypeScript:**
- Frontend: `frontend/tsconfig.json` (ES2017 target, strict mode, path aliases: `@/*`)
- Backend: `backend/tsconfig.json` (ES2023 target, strict mode, decorators enabled)

**Linting:**
- Frontend: `frontend/.eslintrc.json` (Next.js rules, TypeScript rules)
- Backend: ESLint 9.x with TypeScript support

**Formatting:**
- Prettier 3.8.x configuration in `frontend/.prettierrc`
- Semi-colons enforced
- Single quotes: false (use double quotes)
- Print width: 100
- LF line endings

## Platform Requirements

**Development:**
- Node.js 20+
- npm (for package management)
- PostgreSQL (via Supabase)
- Redis (for BullMQ - optional for local development)
- Git

**Production:**
**Backend:**
- Railway (configured in `railway.json`) or any Node.js hosting
- PostgreSQL database (Supabase recommended)
- Redis instance (for BullMQ queues)

**Frontend:**
- Vercel (configured in `vercel.json`) or any Next.js hosting
- Environment variables must be configured
- Edge runtime compatible

**Deployment Targets:**
- Backend: Railway (`railway.json`)
- Frontend: Vercel (`vercel.json`)

---

*Stack analysis: 2025-01-18*
