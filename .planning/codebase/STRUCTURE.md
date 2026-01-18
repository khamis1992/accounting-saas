# Codebase Structure

**Analysis Date:** 2025-01-18

## Directory Layout

```
accounting-saas-new/
├── backend/              # NestJS API server
│   ├── src/             # Source code
│   │   ├── auth/        # Authentication module
│   │   ├── coa/         # Chart of Accounts module
│   │   ├── journals/    # Journal entries module
│   │   ├── invoices/    # Invoicing module
│   │   ├── banking/     # Bank accounts module
│   │   ├── common/      # Shared utilities (guards, pipes, middleware)
│   │   └── config/      # Configuration service
│   ├── dist/            # Compiled JavaScript
│   ├── scripts/         # Utility scripts
│   └── package.json
├── frontend/            # Next.js web application
│   ├── app/            # App Router pages
│   │   ├── [locale]/   # Localized routes
│   │   │   ├── (app)/  # Protected app routes
│   │   │   ├── (auth)/ # Auth pages (signin, signup)
│   │   │   └── (marketing)/ # Public landing pages
│   ├── components/     # React components
│   │   ├── layout/     # Layout components (sidebar, header)
│   │   ├── ui/         # Reusable UI components
│   │   └── loading/    # Loading states
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities and API clients
│   │   ├── api/        # API endpoint functions
│   │   └── supabase/   # Supabase clients
│   ├── contexts/       # React contexts
│   └── types/          # TypeScript type definitions
├── database/           # Database schema and migrations
│   ├── 01_core_tables.sql
│   ├── 02_accounting_tables.sql
│   └── ...
├── .planning/          # Planning and documentation
│   └── codebase/       # Codebase analysis docs (this file)
└── tasks/              # Task definitions and plans
```

## Directory Purposes

**backend/src:**
- Purpose: NestJS application source code
- Contains: Modules, controllers, services, DTOs
- Key files: `main.ts` (bootstrap), `app.module.ts` (root module)

**backend/src/common:**
- Purpose: Shared backend utilities used across modules
- Contains: Guards (auth, permissions), Pipes (validation, XSS), Middleware (security, logging)
- Key files: `guards/jwt-auth.guard.ts`, `pipes/xss-sanitizer.pipe.ts`

**frontend/app:**
- Purpose: Next.js App Router pages and layouts
- Contains: Route handlers, server components, layouts
- Organized by locale (en/ar) with route groups for logical separation

**frontend/app/[locale]/(app):**
- Purpose: Protected authenticated routes
- Contains: Dashboard, accounting, banking, sales, purchases, settings
- All routes require authentication via middleware

**frontend/app/[locale]/(auth):**
- Purpose: Authentication pages (public but special handling)
- Contains: Signin, signup pages
- Authenticated users redirected away from these routes

**frontend/components:**
- Purpose: React components organized by type
- Contains: Layout components (sidebar, topbar), UI components (buttons, dialogs), feature components
- UI components based on Radix UI primitives with Tailwind styling

**frontend/hooks:**
- Purpose: Custom React hooks for reusable logic
- Contains: Data fetching (use-api-request), forms (use-form-reset), UI (use-virtualized-list), business logic (use-permissions)

**frontend/lib:**
- Purpose: Utilities and API integration layer
- Contains: API client (`api/client.ts`), domain-specific API functions (`api/invoices.ts`), Supabase clients (`supabase/browser-client.ts`), utilities (`utils/export.ts`)

**frontend/contexts:**
- Purpose: React Context providers for global state
- Contains: AuthProvider (`contexts/auth-context.tsx`)

**database:**
- Purpose: Database schema, migrations, and seed data
- Contains: SQL files numbered for execution order
- Key files: `01_core_tables.sql` (users, tenants), `02_accounting_tables.sql` (accounts, journals, invoices)

## Key File Locations

**Entry Points:**
- `backend/src/main.ts`: Backend bootstrap (NestJS app creation)
- `frontend/app/layout.tsx`: Root layout (globals, metadata)
- `frontend/app/[locale]/layout.tsx`: Locale layout (i18n, auth provider)
- `frontend/middleware.ts`: Request auth check and redirect logic

**Configuration:**
- `backend/src/config/config.service.ts`: Backend environment config
- `frontend/env.config.js`: Frontend environment validation
- `frontend/tsconfig.json`: Frontend TypeScript config
- `backend/tsconfig.json`: Backend TypeScript config

**Core Logic:**
- `backend/src/auth/auth.service.ts`: Authentication business logic
- `backend/src/supabase/supabase.service.ts`: Supabase client wrapper
- `frontend/lib/api/client.ts`: HTTP client with token refresh
- `frontend/contexts/auth-context.tsx`: Auth state management

**Testing:**
- Backend tests: Co-located as `*.spec.ts` files (e.g., `auth.service.spec.ts`)
- Frontend tests: Test files in same directory as component (e.g., `command-palette.test.tsx`)

## Naming Conventions

**Files:**
- Backend: `kebab-case.service.ts`, `kebab-case.controller.ts`, `kebab-case.dto.ts`, `kebab-case.module.ts`
- Frontend pages: `kebab-case/page.tsx`, `layout.tsx`, `template.tsx`
- Frontend components: `PascalCase.tsx` (e.g., `DataTable.tsx`, `SecurePasswordModal.tsx`)
- Frontend hooks: `use-kebab-case.ts` (e.g., `use-api-request.ts`, `use-permissions.tsx`)

**Directories:**
- Backend modules: `lowercase/` (e.g., `auth/`, `banking/`, `fiscal-periods/`)
- Frontend route groups: `(name)/` (parentheses for non-URL groups)
- Frontend locale routes: `[locale]/` (brackets for dynamic segments)

**Database:**
- Tables: `snake_case` (e.g., `chart_of_accounts`, `journal_entries`)
- Columns: `snake_case` (e.g., `tenant_id`, `created_at`)
- RLS policies: `snake_case` (e.g., `tenants_isolated`, `users_isolated`)

## Where to Add New Code

**New Feature (Backend):**
- Primary code: `backend/src/feature-name/`
  - `feature-name.module.ts`
  - `feature-name.controller.ts`
  - `feature-name.service.ts`
  - `dto/` subdirectory for DTOs
- Tests: `backend/src/feature-name/*.spec.ts`
- Import in `backend/src/app.module.ts`

**New Feature (Frontend):**
- Pages: `frontend/app/[locale]/(app)/feature-name/page.tsx`
- API layer: `frontend/lib/api/feature-name.ts`
- Components: `frontend/components/feature-name/` or co-located in page directory

**New UI Component:**
- Reusable component: `frontend/components/ui/component-name.tsx`
- Feature-specific component: Co-locate with feature or in `frontend/components/feature-name/`
- Use Radix UI primitives + Tailwind classes
- Export from index if needed

**New Utility/Hook:**
- Utility: `frontend/lib/utility-name.ts`
- Hook: `frontend/hooks/use-hook-name.ts`
- Follow existing patterns for consistency

**New Database Table:**
- Migration: `database/XX_description.sql` (use next number)
- Include: CREATE TABLE, RLS policies, indexes, triggers
- Run migration script to apply

## Special Directories

**backend/dist:**
- Purpose: Compiled JavaScript output
- Generated: Yes (from `npm run build`)
- Committed: No (in .gitignore)

**frontend/.next:**
- Purpose: Next.js build output
- Generated: Yes (from `npm run build`)
- Committed: No (in .gitignore)

**node_modules:**
- Purpose: npm dependencies
- Generated: Yes (from `npm install`)
- Committed: No (in .gitignore)

**frontend/components/ui:**
- Purpose: Radix UI + Tailwind component library
- Pattern: Headless UI primitives with styled components
- Examples: Button, Dialog, Select, DataTable, Command
- These are reusable building blocks for the application

**frontend/app/[locale]/(app):**
- Purpose: Protected routes (require authentication)
- Route group: Parentheses mean "(app)" is not in URL
- All pages here inherit from `(app)/layout.tsx` (authenticated layout)

**frontend/app/[locale]/(auth):**
- Purpose: Authentication pages
- Route group: "(auth)" is not in URL
- Public but special redirect logic for authenticated users

**frontend/app/[locale]/(marketing):**
- Purpose: Public marketing pages
- Route group: "(marketing)" is not in URL
- No authentication required

---

*Structure analysis: 2025-01-18*
