# Coding Conventions

**Analysis Date:** 2026-01-18

## Naming Patterns

**Files:**
- **Frontend:** `kebab-case.ts` for utilities, `kebab-case.tsx` for components, `page.tsx` for routes
  - Examples: `use-api-request.ts`, `command-palette.tsx`, `dashboard-chart.tsx`
  - Route groups use parentheses: `(app)/`, `(auth)/`, `(marketing)/`
  - Test files: `*.test.tsx` (e.g., `command-palette.test.tsx`)
- **Backend:** `kebab-case.ts` for all TypeScript files
  - Examples: `coa.service.ts`, `auth.controller.ts`, `create-account.dto.ts`
  - Test files: `*.spec.ts` (e.g., `coa.service.spec.ts`)
  - Integration tests: `test/integration/*.spec.ts`

**Functions:**
- **camelCase** for all functions and methods
- Examples: `findAll()`, `getDashboardData()`, `formatCurrency()`, `fetchWithTimeout()`
- Async functions use `async/await` pattern

**Variables:**
- **camelCase** for local variables and parameters
- Examples: `mockTenantId`, `mockSupabaseClient`, `totalRevenue`
- Constants use **UPPER_SNAKE_CASE**: `DEFAULT_TIMEOUT`, `DEFAULT_MAX_RETRIES`

**Types:**
- **PascalCase** for interfaces, types, classes, and enums
- Examples: `DashboardStats`, `RecentInvoice`, `AppError`, `LogLevel`
- Generic type parameters: `T`, `TResponse`, `TData`

**Database Fields:**
- **snake_case** for all database columns (PostgreSQL/Supabase convention)
- Examples: `tenant_id`, `is_active`, `created_at`, `name_en`, `name_ar`
- Frontend transforms to camelCase when receiving from API: `tenantId`, `isActive`, `createdAt`

## Code Style

**Formatting:**
- **Prettier** with specific configuration from `frontend/.prettierrc`:
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": false,
    "printWidth": 100,
    "tabWidth": 2,
    "useTabs": false,
    "arrowParens": "always",
    "endOfLine": "lf"
  }
  ```
- **Backend** uses similar Prettier config (see `backend/package.json` format script)

**Linting:**
- **Frontend:** ESLint with Next.js TypeScript rules
  - Config: `frontend/.eslintrc.json`
  - Extends: `next/core-web-vitals`, `next/typescript`
  - Key rules:
    - `@typescript-eslint/consistent-type-imports`: enforced (prefer type imports)
    - `no-console`: warn (only warn/error allowed)
    - `prefer-const`: error
    - `react-hooks/exhaustive-deps`: warn
- **Backend:** ESLint with TypeScript support
  - Config: `backend/package.json` (uses `typescript-eslint`)
  - Strict TypeScript settings in `backend/tsconfig.json`

## Import Organization

**Order:**
1. External library imports (React, Next.js, third-party packages)
2. Internal imports (aliases using `@/`)
3. Relative imports
4. Type-only imports (using `type` keyword)

**Examples from codebase:**

```typescript
// Frontend typical import order
import { useEffect, useState, memo } from "react";  // External
import { Card } from "@/components/ui/card";        // Alias
import { apiClient } from "./client";               // Relative
import type { DashboardStats } from "./types";      // Type-only
```

**Path Aliases:**
- `@/` → Project root (used extensively in frontend)
- Examples: `@/components/ui/button`, `@/lib/utils`, `@/hooks/use-api-request`
- Backend uses module path resolution: `src/` prefix in `jest.config.js`

**Import Style:**
- Use `import { type X }` for type-only imports (enforced by ESLint)
- Prefer named exports over default exports
- Example: `export { Button, buttonVariants }` from button component

## Error Handling

**Patterns:**

**Frontend (TypeScript classes):**
- Custom error classes in `frontend/lib/errors.ts`:
  - `AppError` (base class with code, statusCode, details)
  - `AuthError` (401), `NetworkError` (503), `ValidationError` (400), `NotFoundError` (404), `PermissionError` (403)
- Error handling utilities:
  - `handleError(error: unknown): AppError` - converts unknown errors
  - `withErrorHandling<T>(operation, context)` - wraps operations
  - `handleApiError(response)` - handles HTTP responses
- Type guards: `isAppError()`, `isAuthError()`, `isNetworkError()`

**Backend (NestJS):**
- Use NestJS built-in exceptions: `BadRequestException`, `NotFoundException`, `ForbiddenException`
- Throw errors with descriptive messages
- Example from `backend/src/coa/coa.service.ts`:
  ```typescript
  if (existingAccount) {
    throw new BadRequestException('Account code already exists');
  }
  ```

**API Response Handling:**
- Frontend fetch utilities in `frontend/lib/fetch.ts`:
  - `fetchWithTimeout()` - timeout with AbortController
  - `retryWithBackoff()` - exponential backoff retry
  - `fetchEnhanced()` - combines timeout + retry
  - Helper methods: `fetchGet()`, `fetchPost()`, `fetchPut()`, `fetchDelete()`
- Timeout default: 10000ms (10 seconds)
- Max retries default: 3 attempts
- Base delay: 1000ms (1 second)

**Error Logging:**
- Use centralized logger: `frontend/lib/logger.ts`
- Import: `import logger from "@/lib/logger"`
- Methods: `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`
- Specialized methods: `logger.apiRequest()`, `logger.apiResponse()`, `logger.userAction()`, `logger.performance()`
- Backend uses standard error throwing; NestJS handles logging

## Logging

**Framework:** Custom logger utility (`frontend/lib/logger.ts`)

**Patterns:**
- Use `logger` instead of `console.log` (ESLint rule warns on console usage)
- Structured logging with context objects:
  ```typescript
  logger.info('User logged in', { userId, tenantId });
  logger.error('API request failed', error, { url, status });
  logger.performance('pageLoad', duration, 'ms', { route });
  ```
- Log levels: `DEBUG`, `INFO`, `WARN`, `ERROR`, `SILENT`
- Production: logs at WARN level and above
- Development: logs at DEBUG level
- Test environment: console output disabled

**When to Log:**
- API requests/responses (use `logger.apiRequest()`, `logger.apiResponse()`)
- User actions (use `logger.userAction()`)
- Performance metrics (use `logger.performance()`)
- Errors with context (use `logger.error()`)

**Do NOT Log:**
- Sensitive data (passwords, tokens, PII)
- Large objects (truncate before logging)

## Comments

**When to Comment:**
- File headers with `@fileoverview`, `@author`, `@created`, `@updated` JSDoc tags
- Complex business logic (especially accounting rules)
- Non-obvious algorithms
- Public API surfaces (functions exported from lib files)

**JSDoc/TSDoc:**
- Used extensively in utility files and API clients
- Example format:
  ```typescript
  /**
   * Format currency value for display
   *
   * @param amount - The amount to format
   * @param currency - Currency code (default: "QAR")
   * @returns Formatted currency string
   *
   * @example
   * ```typescript
   * formatCurrency(1234.56) // "QAR 1,234.56"
   * ```
   */
  export function formatCurrency(amount: number, currency: string = "QAR"): string
  ```
- Required for:
  - All exported functions in `lib/` directory
  - React component props (especially complex ones)
  - API client methods
  - Custom hooks
  - Error classes

**Component Documentation:**
- File headers include component purpose and author
- Example from `frontend/app/[locale]/(app)/dashboard/page.tsx`:
  ```typescript
  /**
   * page Page
   *
   * Route page component for /
   *
   * @fileoverview page page component
   * @author Frontend Team
   * @created 2026-01-17
   * @updated 2026-01-17
   */
  ```

**Inline Comments:**
- Use `//` for single-line comments
- Use `/* */` for multi-line comments
- Explain "why" not "what" (code shows "what")
- Example: `// Lazy load chart components to reduce initial bundle size`

## Function Design

**Size:**
- Aim for 50-100 lines maximum
- Break down complex functions into smaller helpers
- Example: `buildHierarchy()` is a private method in `CoaService`

**Parameters:**
- Use object parameters for 3+ parameters:
  ```typescript
  // Good
  function fetchEnhanced(url: string, options: RequestInit, config: { timeout?: number; maxRetries?: number })

  // Avoid
  function fetchEnhanced(url: string, options: RequestInit, timeout: number, maxRetries: number, retryDelay: number)
  ```
- Destructure object parameters in function signature
- Provide default values for optional parameters:
  ```typescript
  timeout: number = DEFAULT_TIMEOUT
  ```

**Return Values:**
- Always type return values explicitly
- Use union types for error handling: `Promise<T | AppError>`
- API clients return typed responses:
  ```typescript
  export async function getDashboardData(): Promise<DashboardData>
  ```
- Use `unknown` instead of `any` for untyped data
- Example from `frontend/lib/errors.ts`:
  ```typescript
  export function handleError(error: unknown): AppError
  ```

**Async Functions:**
- Always use `async/await` (no Promise chains)
- Handle errors with try-catch or error wrappers
- Timeout long-running operations (use `fetchWithTimeout` pattern)
- Retry network operations (use `retryWithBackoff` pattern)

## Module Design

**Exports:**
- Use named exports primarily:
  ```typescript
  export { Button, buttonVariants }
  export type { ButtonProps }
  ```
- Default exports only for React components and main modules
- Export types alongside implementations:
  ```typescript
  export { Button, buttonVariants }
  export type { ButtonProps }
  ```

**Barrel Files:**
- Frontend: Use `index.ts` to re-export from directories
- Backend: Limited use of barrel files (NestJS module system handles imports)
- Example pattern:
  ```typescript
  // hooks/index.ts
  export { useApiRequest } from './use-api-request';
  export { useLocalStorage } from './use-local-storage';
  ```

**Directory Structure:**
- **Frontend:**
  - `components/` - Reusable UI components
  - `hooks/` - Custom React hooks
  - `lib/` - Utilities, API clients, constants
  - `app/[locale]/` - Next.js App Router pages
- **Backend:**
  - `src/{module}/` - Feature modules (coa, invoices, customers)
  - `src/{module}/dto/` - Data Transfer Objects
  - `src/common/` - Shared utilities (guards, decorators, interceptors)

---

*Convention analysis: 2026-01-18*
