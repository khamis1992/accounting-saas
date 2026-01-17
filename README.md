# المحاسب - Enterprise Accounting SaaS Platform

A complete enterprise-level Accounting SaaS platform for the Qatar market with full bilingual support (Arabic/English) and strict accounting controls.

## Tech Stack

### Backend
- **Framework**: NestJS (TypeScript)
- **Database**: PostgreSQL via Supabase
- **Authentication**: Supabase Auth
- **Queue**: BullMQ (for background jobs like depreciation)
- **API Documentation**: Swagger

### Frontend
- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: Tailwind CSS v4, shadcn/ui, Radix UI
- **Internationalization**: next-intl (Arabic/English support)
- **Charts**: Recharts
- **Authentication**: Supabase Auth (SSR + Client)

## Project Structure

```
المحاسب/
├── backend/              # NestJS backend
│   ├── src/
│   │   ├── modules/     # Feature modules (auth, tenants, coa, journals, etc.)
│   │   ├── common/       # Shared utilities (guards, decorators, filters)
│   │   ├── supabase/     # Supabase client configuration
│   │   └── queues/       # BullMQ queues and processors
├── frontend/            # Next.js frontend
│   ├── app/
│   │   └── [locale]/    # i18n-enabled routes
│   ├── components/
│   │   ├── layout/       # Sidebar, Topbar, AuthLayout
│   │   └── ui/          # shadcn/ui components
│   ├── lib/
│   │   ├── supabase/     # Supabase client & auth provider
│   │   └── utils.ts
│   └── messages/         # i18n translation files (en.json, ar.json)
└── database/            # SQL schema files
    ├── 01_core_tables.sql
    ├── 02_accounting_tables.sql
    ├── 03_business_tables.sql
    ├── 04_additional_modules.sql
    ├── 05_rls_policies.sql
    ├── 06_views.sql
    ├── 07_triggers.sql
    ├── 08_seed_data.sql
    ├── 09_role_permissions_seed.sql
    └── 10_coa_vat_seed.sql
```

## Setup Instructions

### Prerequisites
- Node.js 20+
- PostgreSQL (Supabase account)
- Redis (for BullMQ - optional, for local development)
- npm or yarn

### 1. Environment Configuration

#### Backend (`.env`)
Create a `.env` file in `backend/` directory:

```env
# Supabase
SUPABASE_URL=your-supabase-project-url
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
SUPABASE_ANON_KEY=your-supabase-anon-key

# Server
PORT=3000
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:3001

# Redis (for BullMQ)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

#### Frontend (`.env.local`)
Create a `.env.local` file in `frontend/` directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 2. Database Setup

1. **Create Supabase Project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note down your project URL and anon key

2. **Run SQL Scripts**

   Execute the SQL files in order in the Supabase SQL Editor:

   ```bash
   # Using psql (if you have local PostgreSQL)
   psql -h your-db-host -U postgres -d postgres -f database/01_core_tables.sql
   psql -h your-db-host -U postgres -d postgres -f database/02_accounting_tables.sql
   psql -h your-db-host -U postgres -d postgres -f database/03_business_tables.sql
   psql -h your-db-host -U postgres -d postgres -f database/04_additional_modules.sql
   psql -h your-db-host -U postgres -d postgres -f database/05_rls_policies.sql
   psql -h your-db-host -U postgres -d postgres -f database/06_views.sql
   psql -h your-db-host -U postgres -d postgres -f database/07_triggers.sql
   psql -h your-db-host -U postgres -d postgres -f database/08_seed_data.sql
   psql -h your-db-host -U postgres -d postgres -f database/09_role_permissions_seed.sql
   psql -h your-db-host -U postgres -d postgres -f database/10_coa_vat_seed.sql
   ```

   Or copy and paste each file's content into the Supabase SQL Editor and run.

3. **Configure Supabase Auth**
   - Enable Email Auth in Supabase dashboard
   - Configure email templates if needed

### 3. Backend Setup

```bash
cd backend
npm install
npm run build
npm run start:dev
```

The backend API will be available at `http://localhost:3000`
Swagger documentation at `http://localhost:3000/api/docs`

### 4. Frontend Setup

**IMPORTANT**: The frontend project is located in a directory with Arabic characters ("المحاسب"). 
Due to a Turbopack (Next.js 16) limitation with non-ASCII characters in paths, 
you may encounter build errors. Workarounds:

**Option 1**: Move the frontend directory to a path without Arabic characters:
```bash
mv frontend accounting-frontend
cd accounting-frontend
```

**Option 2**: Use a development server instead of build:
```bash
cd frontend
npm install
npm run dev  # Use dev server instead of build
```

**Option 3**: Configure Turbopack root (add to `next.config.ts`):
```typescript
const nextConfig: NextConfig = {
  turbopack: {
    root: 'C:/path/to/frontend-without-arabic',
  },
};
```

After resolving the path issue:

```bash
cd frontend  # or the renamed directory
npm install
npm run dev
```

The frontend will be available at `http://localhost:3001`

## Row Level Security (RLS) Policies

The application uses PostgreSQL Row Level Security for strict multi-tenant isolation. Each tenant's data is completely isolated from others.

### Key RLS Concepts

1. **Tenant Isolation**: Every table has a `tenant_id` column
2. **Context Functions**: Helper functions extract tenant_id from JWT
3. **Policies**: Each table has INSERT, SELECT, UPDATE, DELETE policies
4. **Service Role**: Backend uses service role key for admin operations

### RLS Policy Structure

```sql
-- Enable RLS on table
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own tenant's data
CREATE POLICY "Tenant isolation SELECT"
ON table_name
FOR SELECT
USING (tenant_id = auth.uid()::uuid);

-- Policy: Users can only insert for their own tenant
CREATE POLICY "Tenant isolation INSERT"
ON table_name
FOR INSERT
WITH CHECK (tenant_id = auth.uid()::uuid);
```

### Audit Logging

The `audit_log` table tracks all changes:
- INSERT, UPDATE, DELETE operations are logged via triggers
- Includes user_id, action, table_name, record_id, old_value, new_value
- RLS ensures tenants only see their own audit logs

## Key Features

### Accounting
- **Chart of Accounts**: Hierarchical, bilingual (English/Arabic)
- **Journal Entries**: Double-entry enforcement (debit = credit)
- **Posting Workflow**: Draft → Submitted → Approved → Posted
- **General Ledger**: Derived from posted journals only
- **Trial Balance**: Automatic calculation
- **Financial Statements**: Balance Sheet, Income Statement
- **Fiscal Periods**: Period locking to prevent changes

### Sales & Purchases
- **Customers**: Full CRUD with credit limits
- **Vendors**: Full CRUD with balance tracking
- **Invoices**: With VAT calculation (Qatar VAT codes)
- **Quotations**: Convert to invoices
- **Payments**: Receipt allocation to invoices
- **Purchase Orders**: Vendor purchasing
- **Expenses**: With attachments

### Banking
- **Bank Accounts**: Multiple accounts per tenant
- **Transactions**: Manual entry and import
- **Reconciliation**: Match transactions to journal entries

### Assets
- **Fixed Assets**: Registration and tracking
- **Depreciation**: Scheduled via BullMQ jobs
  - Straight-line method
  - Declining balance method
- **Net Book Value**: Automatic calculation

### Tax (VAT)
- **VAT Codes**: Qatar-specific (0%, 5%, exempt, out of scope)
- **VAT Transactions**: Automatic tracking
- **VAT Returns**: Report generation for submission

### Users & Roles
- **RBAC**: Role-based access control
- **Permissions**: Granular permissions (create, read, update, delete)
- **User Management**: Invite users, assign roles
- **Multi-tenant**: Each user belongs to exactly one tenant

### Reports
- **General Ledger**: Full transaction history
- **Trial Balance**: Debit vs Credit verification
- **Balance Sheet**: Assets, Liabilities, Equity
- **Income Statement**: Revenue, Expenses, Profit/Loss
- **Aged Receivables**: Customer aging report
- **Aged Payables**: Vendor aging report
- **VAT Report**: Tax summary for Qatar Tax Authority

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Sign in with email/password
- `POST /api/auth/signup` - Create new account
- `POST /api/auth/refresh` - Refresh JWT token

### Accounting
- `GET /api/coa` - Get chart of accounts
- `POST /api/coa` - Create account
- `GET /api/journals` - Get journal entries
- `POST /api/journals` - Create journal entry
- `POST /api/journals/:id/submit` - Submit journal
- `POST /api/journals/:id/approve` - Approve journal
- `POST /api/journals/:id/post` - Post journal to GL

### Sales
- `GET /api/customers` - Get customers
- `GET /api/invoices` - Get invoices
- `POST /api/invoices` - Create invoice
- `GET /api/payments` - Get payments
- `POST /api/payments` - Record payment

### Other modules follow similar REST patterns.

View full API documentation at `http://localhost:3000/api/docs`

## Internationalization (i18n)

### Supported Languages
- **English** (`en`) - LTR (Left-to-Right)
- **Arabic** (`ar`) - RTL (Right-to-Left)

### Translation Files
- `frontend/messages/en.json` - English translations
- `frontend/messages/ar.json` - Arabic translations

### Database Bilingual Fields
Most database tables have bilingual fields:
- `name_en` - English name
- `name_ar` - Arabic name
- `description_en` - English description
- `description_ar` - Arabic description

### Frontend Usage
```tsx
import { useTranslations } from 'next-intl';

const t = useTranslations('nav');
return <h1>{t('dashboard')}</h1>;
```

## Background Jobs (BullMQ)

### Depreciation Calculation
Automated asset depreciation processing:

```bash
# Trigger depreciation for all assets
POST /api/queues/depreciation/calculate-all
{
  "asOfDate": "2026-01-31"
}

# Check job status
GET /api/queues/depreciation/jobs/:jobId
```

### Jobs Queue
- `depreciation` queue for asset depreciation calculations
- Future: Email notifications, report generation, data sync

## Development Guidelines

### Backend (NestJS)
- Use DTOs for request/response validation
- Follow module pattern: `module.module.ts`, `module.controller.ts`, `module.service.ts`
- Always use `TenantContextGuard` for protected routes
- Use `@RequirePermissions` decorator for RBAC
- Service role client for admin operations, anon client for user operations

### Frontend (Next.js)
- Use Server Components by default
- Use Client Components only when needed (forms, interactivity)
- Follow the file naming: `page.tsx`, `layout.tsx`, `loading.tsx`
- Use shadcn/ui components for consistent UI
- All text must be translatable via `useTranslations`

### Database
- Always add `tenant_id` to new tables
- Add RLS policies immediately after table creation
- Include bilingual fields (`name_en`, `name_ar`)
- Add audit logging via triggers
- Use views for complex queries (avoid in app logic)

## Security Considerations

1. **JWT Verification**: Backend validates Supabase JWT on every request
2. **RLS Policies**: Enforced at database level (cannot be bypassed)
3. **RBAC**: Permissions checked via guards and decorators
4. **Tenant Isolation**: Every query filters by tenant_id
5. **Fiscal Period Locking**: Prevents modifications to closed periods
6. **Double-Entry Validation**: Debits must equal credits before posting

## Qatar-Specific Features

### VAT (Value Added Tax)
- Standard rate: 5%
- Zero-rated: 0%
- Exempt: No VAT
- Out of Scope: Not applicable

### Reporting
- VAT Return format aligned with Qatar Tax Authority requirements
- Bilingual invoice generation (Arabic/English)
- QR codes for invoices (future)

## Troubleshooting

### Frontend Build Error (Turbopack + Arabic Path)
```
Error: byte index X is not a char boundary; it is inside 'X'
```

**Solution**: Move `frontend/` to a directory without Arabic characters.

### CORS Errors
**Solution**: Add `http://localhost:3001` to `CORS_ORIGIN` in backend `.env`.

### Authentication Errors
**Solution**: Verify `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_URL` are correct.

### RLS Policy Errors
**Solution**: Ensure SQL scripts were run in order, especially `05_rls_policies.sql`.

## License

This project is for demonstration purposes. Ensure compliance with Qatar Tax Authority requirements before production use.

## Support

For issues or questions:
1. Check Swagger docs: `http://localhost:3000/api/docs`
2. Review database schema in `database/` folder
3. Check RLS policies in `05_rls_policies.sql`

