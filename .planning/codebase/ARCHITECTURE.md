# Architecture

**Analysis Date:** 2025-01-18

## Pattern Overview

**Overall:** Monorepo with separated Frontend (Next.js) and Backend (NestJS) layers, connected via REST API

**Key Characteristics:**
- Multi-tenant SaaS architecture with tenant isolation via Supabase RLS
- Frontend: Next.js 16 with App Router and route groups for organization
- Backend: NestJS modular architecture with domain-driven design
- Authentication: Supabase Auth with JWT tokens via httpOnly cookies
- Database: PostgreSQL via Supabase with Row Level Security
- API Communication: REST API with automatic token refresh
- Internationalization: Built-in i18n with next-intl (English/Arabic)

## Layers

**Frontend Layer (Next.js):**
- Purpose: User interface, client-side state management, routing
- Location: `frontend/`
- Contains: React components, hooks, API client, contexts
- Depends on: Backend REST API, Supabase Auth
- Used by: End users via web browser

**Backend Layer (NestJS):**
- Purpose: Business logic, data persistence, external integrations
- Location: `backend/src/`
- Contains: Controllers, services, DTOs, guards, middleware
- Depends on: Supabase (database), Redis (queues), external APIs
- Used by: Frontend via REST API

**Database Layer (Supabase PostgreSQL):**
- Purpose: Persistent data storage with multi-tenant isolation
- Location: `database/*.sql` files
- Contains: Tables, views, triggers, RLS policies, functions
- Depends on: Supabase platform
- Used by: Backend services

**Data Flow:**

1. User interacts with UI in browser
2. Frontend makes API request via `apiClient` (`frontend/lib/api/client.ts`)
3. Request includes JWT from Supabase httpOnly cookie
4. Backend NestJS controller receives request at `/api/*` endpoint
5. Guard validates JWT and tenant context
6. Service layer executes business logic
7. Service queries Supabase via RLS-protected queries
8. Response returns through controller → apiClient → UI
9. Frontend updates React state and re-renders

**State Management:**
- **Client State:** React Context (AuthProvider, SessionContext)
- **Server State:** Fetch from API on each request (no global cache)
- **Form State:** React Hook Form with Zod validation
- **Auth State:** Supabase session in httpOnly cookies

## Key Abstractions

**API Client Pattern:**
- Purpose: Centralized HTTP client with auth, error handling, token refresh
- Examples: `frontend/lib/api/client.ts`
- Pattern: Singleton class with methods (get, post, put, patch, delete, upload, download)
- Auto-refreshes tokens on 401 responses
- Throws typed ApiError for consistent error handling

**NestJS Module Pattern:**
- Purpose: Encapsulate domain logic with dependencies
- Examples: `backend/src/auth/auth.module.ts`, `backend/src/coa/coa.module.ts`
- Pattern: Each module contains controller, service, DTOs, tests
- Dependencies declared in module imports
- Controllers define endpoints, services contain logic

**Tenant Context:**
- Purpose: Isolate data per tenant (company)
- Implementation: Supabase RLS policies filter by `tenant_id`
- User has `tenant_id`, all tables have `tenant_id` column
- Backend extracts tenant from JWT and sets RLS context

**Supabase Auth Integration:**
- Purpose: Authentication without managing passwords
- Implementation: Supabase handles auth, backend validates tokens
- Tokens stored in httpOnly cookies (XSS-safe)
- Frontend uses `@supabase/ssr` for server/client hydration
- Backend verifies JWT signature via Supabase client

**Route Groups (Next.js):**
- Purpose: Organize routes without affecting URL structure
- Examples: `(app)`, `(auth)`, `(marketing)`
- Pattern: Parentheses in directory name create logical group
- Each group can have its own layout.tsx

## Entry Points

**Backend Bootstrap:**
- Location: `backend/src/main.ts`
- Triggers: `npm run start:dev` or `node dist/src/main`
- Responsibilities:
  - Creates NestJS app
  - Configures security middleware (Helmet, CORS, XSS, compression)
  - Sets up global pipes (Validation, XSS sanitization)
  - Configures Swagger documentation at `/api/docs`
  - Listens on port from ConfigService

**Frontend Entry:**
- Location: `frontend/app/layout.tsx` (root)
- Triggers: User accesses any URL
- Responsibilities:
  - Applies global styles
  - Sets up internationalization
  - No auth logic here (delegated to locale layout)

**Locale Layout:**
- Location: `frontend/app/[locale]/layout.tsx`
- Triggers: Any localized route (e.g., `/en/dashboard`, `/ar/accounting`)
- Responsibilities:
  - Validates locale (en/ar)
  - Sets HTML dir attribute (ltr/rtl)
  - Wraps with AuthProvider for session management
  - Injects translation messages

**Middleware:**
- Location: `frontend/middleware.ts`
- Triggers: Every request before Next.js routing
- Responsibilities:
  - Checks Supabase auth cookies
  - Redirects unauthenticated users from protected routes
  - Redirects authenticated users from signin/signup
  - Applies i18n middleware

**Backend API Root:**
- Location: All controllers under `backend/src/**/`
- Triggers: HTTP requests to `/api/*`
- Responsibilities:
  - Controllers receive requests, validate, delegate to services
  - Services execute business logic, query database
  - Responses returned as JSON with consistent ApiResponse<T> shape

## Error Handling

**Strategy:** Layered error handling with user-friendly messages

**Patterns:**
- **API Layer:** ApiClient throws ApiError with message and status
- **React Components:** Try-catch around async operations, display toast errors
- **Backend:** NestJS exception filters transform errors to consistent JSON responses
- **Validation:** class-validator and Zod schema validation before processing

**Cross-Cutting Concerns:**

**Logging:**
- Backend: NestJS Logger service
- Frontend: Custom logger at `frontend/lib/logger.ts`
- Audit trail: Audit module logs all data changes to `audit_logs` table

**Validation:**
- Backend: class-validator decorators in DTOs
- Frontend: Zod schemas in forms
- API client uses ValidationPipe with whitelist mode

**Authentication:**
- Backend: JwtAuthGuard validates tokens on protected routes
- Frontend: AuthProvider wraps app, exposes useAuth hook
- Middleware: Checks Supabase cookies before route access
- Tokens: Stored in httpOnly cookies (never localStorage for security)

---

*Architecture analysis: 2025-01-18*
