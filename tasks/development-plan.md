# Enterprise Accounting SaaS - Comprehensive Development Plan
## Qatar Market - 6-Week Roadmap

**Project:** المحاسب (Al-Muhasib)
**Timeline:** 6 Weeks (42 Days)
**Team Size:** 2-3 Full-stack Developers
**Status:** Infrastructure 90% Complete, Integration 0%, Business Logic 20%

---

## Executive Summary

### Current State Assessment
- ✅ Database Schema: 95% complete (10 migration files ready)
- ✅ Backend Modules: 90% scaffolded (15 modules created)
- ✅ Frontend Foundation: 60% (auth pages, basic layouts)
- ⚠️ API Validation: 10% (only auth controller fixed)
- ❌ Business Logic: 20% (accounting calculations missing)
- ❌ Frontend Integration: 0% (no API connections)
- ❌ Production Security: 0% (placeholder secrets, no rate limiting)

### Critical Path Analysis
**Week 1-2:** Must complete Auth, Tenants, and COA → everything depends on this
**Week 3:** Journal Posting to GL is CRITICAL → all reports depend on it
**Week 4-5:** Business operations build on posted journals
**Week 6:** Polish, security, deployment

---

## Phase 1: Core Authentication & Tenant Management (Week 1)

### P0 - CRITICAL: Tenant Creation During Signup

**Task 1.1: Self-Service Tenant & User Creation**
- **Priority:** P0 - Blocks all user onboarding
- **Module:** Auth + Tenants
- **MVP:** Yes

**Backend Work:**
1. Create `TenantsService.createTenantWithAdmin()` method
   - Input: company name (en/ar), admin email, admin password
   - Validate company name uniqueness across all tenants
   - Create tenant record with status 'active'
   - Create admin user with role 'admin'
   - Assign admin role permissions
   - Create default COA template for tenant (copy from seed)
   - Create default fiscal year (current calendar year)
   - Set up initial user preferences
   - Return: tenantId, userId, accessToken

2. Add validation decorators to `CreateTenantDto`
   ```typescript
   @IsString()
   @IsNotEmpty()
   @MinLength(2)
   @MaxLength(100)
   name: string;

   @IsString()
   @IsNotEmpty()
   @MinLength(2)
   @MaxLength(100)
   nameAr: string;

   @IsEmail()
   @IsNotEmpty()
   adminEmail: string;

   @IsString()
   @IsNotEmpty()
   @MinLength(8)
   @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
   adminPassword: string;
   ```

3. Create `POST /api/tenants/create-with-admin` endpoint
   - No auth required (public endpoint)
   - Rate limit: 3 requests per IP per hour
   - Validate request
   - Call service method
   - Return 201 with tokens

4. Add COA template copying logic
   - Read from `chart_of_accounts` table where tenant_id is null
   - Copy all accounts to new tenant_id
   - Preserve account hierarchy (parent-child relationships)
   - Copy account types and classifications

**Frontend Work:**
1. Create sign-up flow page (`/app/[locale]/signup/page.tsx`)
   - Client component with form
   - Fields: Company Name (EN), Company Name (AR), Email, Password, Confirm Password
   - Real-time validation
   - Loading state during creation
   - Success → redirect to dashboard
   - Error → show inline errors

2. Add API client method
   ```typescript
   // lib/api/tenants.ts
   export async function createTenantWithAdmin(data: CreateTenantDto) {
     const response = await fetch(`${API_URL}/tenants/create-with-admin`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' },
       body: JSON.stringify(data),
     });
     if (!response.ok) throw new Error('Tenant creation failed');
     return response.json();
   }
   ```

3. Add translations
   - `en.json`: "Create your account", "Company name", etc.
   - `ar.json`: "إنشاء حسابك", "اسم الشركة", etc.

4. Add form validation with react-hook-form + zod
   - Password strength indicator
   - Email format validation
   - Company name required
   - Password match validation

**Database Work:**
- Verify RLS policies allow public insert to tenants table
- Add unique index on `(name_en)` and `(name_ar)` for tenants
- Create trigger to auto-set tenant status to 'active'

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** None
**Acceptance Criteria:**
- [ ] User can sign up with company details
- [ ] Tenant is created in database
- [ ] Admin user is created with admin role
- [ ] Default COA is copied (50+ accounts)
- [ ] Default fiscal year is created
- [ ] User is logged in and redirected to dashboard
- [ ] Email/password cannot be reused for same company
- [ ] Rate limiting prevents abuse

---

### P0 - CRITICAL: Complete Auth Flow

**Task 1.2: Sign-In with JWT Token Management**
- **Priority:** P0 - Core authentication
- **Module:** Auth
- **MVP:** Yes

**Backend Work:**
1. Verify `AuthService.signIn()` implementation
   - Validate email/password using Supabase Auth
   - Fetch user with tenant and roles
   - Generate JWT with tenant_id, user_id, roles
   - Store refresh token in database
   - Return: accessToken, refreshToken, user, tenant

2. Add proper error handling
   - Invalid credentials → 401
   - Inactive tenant → 403 with message
   - Inactive user → 403 with message
   - Rate limit failed attempts

3. Implement token refresh endpoint
   - Validate refresh token
   - Check if still valid (not expired, not revoked)
   - Generate new access token
   - Optionally rotate refresh token
   - Return new tokens

**Frontend Work:**
1. Create sign-in page (`/app/[locale]/signin/page.tsx`)
   - Form with email, password
   - "Remember me" checkbox
   - "Forgot password" link
   - Loading states
   - Error display

2. Implement auth context
   ```typescript
   // contexts/auth-context.tsx
   - Store user, tenant, tokens
   - Provide signIn(), signOut(), refreshTokens()
   - Auto-refresh token before expiry
   - Redirect to signin if not authenticated
   ```

3. Add protected route middleware
   ```typescript
   // middleware.ts
   - Check for valid session
   - Redirect to signin if not authenticated
   - Store tenant context for API calls
   ```

4. Create auth utility functions
   - `getAccessToken()`: Get from storage
   - `refreshAccessToken()`: Call refresh endpoint
   - `isAuthenticated()`: Check token validity
   - `signOut()`: Clear storage, redirect

**Estimated Effort:** 12 hours (1.5 days)
**Dependencies:** Task 1.1
**Acceptance Criteria:**
- [ ] User can sign in with valid credentials
- [ ] Invalid credentials show clear error message
- [ ] Successful signin stores tokens
- [ ] User profile and tenant info available globally
- [ ] Protected routes redirect to signin
- [ ] Token refresh happens automatically
- [ ] Sign out clears all session data

---

### P1 - HIGH: Fix All Controller Validation

**Task 1.3: Add Validation Decorators to All Controllers**
- **Priority:** P1 - Security & data integrity
- **Module:** All Modules
- **MVP:** Yes

**Backend Work:**
Review and fix ALL controllers (15 modules):

1. **Tenants Controller** ✅ (already has DTOs)
   - Add decorators to CreateTenantDto
   - Add decorators to UpdateTenantDto

2. **Users Controller** ❌ (missing DTOs)
   ```typescript
   class CreateUserDto {
     @IsEmail()
     @IsNotEmpty()
     email: string;

     @IsString()
     @IsNotEmpty()
     @MinLength(8)
     password: string;

     @IsString()
     @IsNotEmpty()
     firstName: string;

     @IsString()
     @IsNotEmpty()
     lastName: string;

     @IsUUID()
     @IsNotEmpty()
     roleId: string;

     @IsOptional()
     @IsString()
     phone?: string;

     @IsOptional()
     @IsEnum(['active', 'inactive'])
     status?: string;
   }
   ```

3. **Roles Controller** ❌ (missing DTOs)
4. **COA Controller** ❌ (missing DTOs)
5. **Journals Controller** ❌ (DTO exists, needs decorators)
6. **Fiscal Periods Controller** ❌ (missing DTOs)
7. **Customers Controller** ❌ (missing DTOs)
8. **Vendors Controller** ❌ (missing DTOs)
9. **Invoices Controller** ❌ (missing DTOs)
10. **Payments Controller** ❌ (missing DTOs)
11. **Banking Controller** ❌ (missing DTOs)
12. **Expenses Controller** ❌ (missing DTOs)
13. **Assets Controller** ❌ (missing DTOs)
14. **VAT Controller** ❌ (missing DTOs)
15. **Reports Controller** (query DTOs only)

**For each DTO:**
- Add `@IsString()`, `@IsEmail()`, `@IsUUID()`, etc.
- Add `@IsNotEmpty()` where required
- Add `@IsOptional()` for optional fields
- Add `@MinLength()`, `@MaxLength()` for strings
- Add `@Min()`, `@Max()` for numbers
- Add `@IsEnum()` for status fields
- Add `@IsDate()` or custom date validator
- Add nested DTOs for arrays/objects

**Estimated Effort:** 24 hours (3 days) - Can parallelize across team
**Dependencies:** None
**Acceptance Criteria:**
- [ ] All 15 controllers have proper DTOs
- [ ] All DTOs have validation decorators
- [ ] Swagger docs reflect validation rules
- [ ] Invalid requests return 400 with error details
- [ ] Valid requests succeed

---

### P2 - MEDIUM: User Self-Service Management

**Task 1.4: Profile & Password Management**
- **Priority:** P2 - Nice to have for MVP
- **Module:** Users + Auth
- **MVP:** No (can defer)

**Backend Work:**
1. `GET /api/users/me` - Get current user profile
2. `PATCH /api/users/me` - Update profile (name, phone)
3. `POST /api/users/change-password` - Change password
   - Validate old password
   - Validate new password strength
   - Update in Supabase Auth
4. `POST /api/auth/forgot-password` - Request reset email
5. `POST /api/auth/reset-password` - Reset with token

**Frontend Work:**
1. Profile page (`/app/[locale]/settings/profile/page.tsx`)
2. Change password form
3. Forgot password flow
4. Translations for all strings

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 1.2
**Acceptance Criteria:**
- [ ] User can view their profile
- [ ] User can update their name/phone
- [ ] User can change password
- [ ] Password reset flow works end-to-end

---

## Phase 2: Foundation - Chart of Accounts & Journals (Week 2)

### P0 - CRITICAL: Chart of Accounts CRUD

**Task 2.1: Complete COA Module with API Integration**
- **Priority:** P0 - Foundation for all accounting
- **Module:** COA
- **MVP:** Yes

**Backend Work:**
1. Create proper DTOs for COA
   ```typescript
   class CreateAccountDto {
     @IsUUID()
     @IsOptional()
     parentId?: string;

     @IsString()
     @IsNotEmpty()
     @MinLength(2)
     @MaxLength(50)
     accountNumber: string;

     @IsString()
     @IsNotEmpty()
     @MinLength(3)
     @MaxLength(200)
     nameEn: string;

     @IsString()
     @IsNotEmpty()
     @MinLength(3)
     @MaxLength(200)
     nameAr: string;

     @IsEnum(['asset', 'liability', 'equity', 'revenue', 'expense'])
     @IsNotEmpty()
     accountType: string;

     @IsEnum(['heading', 'account'])
     @IsNotEmpty()
     accountClass: string;

     @IsOptional()
     @IsString()
     @MaxLength(500)
     descriptionEn?: string;

     @IsOptional()
     @IsString()
     @MaxLength(500)
     descriptionAr?: string;

     @IsOptional()
     @IsNumber()
     @Min(0)
     openingBalance?: number;

     @IsOptional()
     @IsString()
     currency?: string;

     @IsOptional()
     @IsEnum(['active', 'inactive'])
     status?: string;

     @IsOptional()
     @IsUUID()
     costCenterId?: string;
   }

   class UpdateAccountDto {
     @IsOptional()
     @IsString()
     @MinLength(2)
     @MaxLength(50)
     accountNumber?: string;

     @IsOptional()
     @IsString()
     @MinLength(3)
     @MaxLength(200)
     nameEn?: string;

     @IsOptional()
     @IsString()
     @MinLength(3)
     @MaxLength(200)
     nameAr?: string;

     // ... other optional fields
   }
   ```

2. Implement `CoaService` methods
   - `findAll(tenantId)`: Get all accounts, hierarchical
   - `findOne(id, tenantId)`: Get account with children
   - `create(dto, tenantId)`: Create account
     - Validate account number uniqueness within tenant
     - Validate parent exists (if provided)
     - Validate account type matches parent
     - Set default status 'active'
   - `update(id, dto, tenantId)`: Update account
     - Prevent if has posted transactions
     - Validate new account number unique
   - `remove(id, tenantId)`: Delete account
     - Only allow if no children
     - Only allow if no transactions
   - `getTree(tenantId)`: Get full hierarchical tree
   - `getByType(tenantId, type)`: Filter by account type

3. Add validation for account numbers
   - Must be unique within tenant
   - Parent account must exist
   - Cannot create circular references
   - Account class must be valid for type

**Frontend Work:**
1. Create COA list page (`/app/[locale]/accounting/coa/page.tsx`)
   - Server component, fetch data on server
   - Display accounts in tree view (expandable/collapsible)
   - Show account number, name (bilingual), type, balance
   - Filter by account type (tabs)
   - Search by name or number
   - Empty state with "Create Account" button

2. Create account detail page (`/app/[locale]/accounting/coa/[id]/page.tsx`)
   - Show account details
   - Show child accounts
   - Show transaction history (link to GL)
   - Edit/Delete buttons (with permissions)

3. Create account form dialog (`components/coa/account-form-dialog.tsx`)
   - Client component
   - Form fields: Parent Account (dropdown), Account Number, Name (EN/AR), Type, Class, Description, Opening Balance
   - Real-time validation
   - Auto-generate account number option
   - Loading states

4. Add API client
   ```typescript
   // lib/api/coa.ts
   export async function getAccounts(tenantId: string) { ... }
   export async function getAccountTree(tenantId: string) { ... }
   export async function createAccount(data: CreateAccountDto) { ... }
   export async function updateAccount(id: string, data: UpdateAccountDto) { ... }
   export async function deleteAccount(id: string) { ... }
   ```

5. Add translations
   - Account types, classes, statuses
   - Form labels, buttons, messages

**Database Work:**
- Ensure indexes on `(tenant_id, account_number)`
- Ensure index on `parent_id` for tree queries
- Add trigger to prevent deletion of accounts with balances

**Estimated Effort:** 24 hours (3 days)
**Dependencies:** Task 1.1 (tenant exists)
**Acceptance Criteria:**
- [ ] User can view full COA in hierarchical tree
- [ ] User can filter by account type
- [ ] User can search accounts
- [ ] User can create new account
- [ ] User can edit account (if no transactions)
- [ ] User can delete account (if no children/transactions)
- [ ] Account number is validated unique
- [ ] Parent account validation works
- [ ] Bilingual display works (EN/AR)
- [ ] Permissions check (create/update/delete)

---

### P0 - CRITICAL: Journal Entry Workflow

**Task 2.2: Complete Journal Entry Module**
- **Priority:** P0 - Core accounting functionality
- **Module:** Journals
- **MVP:** Yes

**Backend Work:**
1. Add validation decorators to `CreateJournalDto`
   ```typescript
   class CreateJournalDto {
     @IsDate()
     @IsNotEmpty()
     journalDate: Date;

     @IsString()
     @IsNotEmpty()
     @MinLength(3)
     @MaxLength(500)
     description: string;

     @IsOptional()
     @IsString()
     @MinLength(3)
     @MaxLength(500)
     descriptionAr?: string;

     @IsUUID()
     @IsNotEmpty()
     fiscalPeriodId: string;

     @IsArray()
     @IsNotEmpty()
     lines: JournalLineDto[];

     @IsOptional()
     @IsString()
     @MaxLength(100)
     reference?: string;

     @IsOptional()
     @IsString()
     @MaxLength(20)
     voucherNumber?: string;
   }

   class JournalLineDto {
     @IsUUID()
     @IsNotEmpty()
     accountId: string;

     @IsOptional()
     @IsString()
     @MaxLength(200)
     description?: string;

     @IsNumber()
     @Min(0)
     debit: number;

     @IsNumber()
     @Min(0)
     credit: number;

     @IsOptional()
     @IsUUID()
     costCenterId?: string;
   }
   ```

2. Implement `JournalsService` methods
   - `create(dto, tenantId, userId)`
     - Validate fiscal period is open
     - Validate at least 2 lines
     - Validate debit = credit (exactly, with tolerance)
     - Validate each account exists
     - Validate no duplicate accounts (unless allowed)
     - Generate journal number (auto-increment)
     - Set status 'draft'
     - Create journal header
     - Create journal lines
     - Audit log

   - `submit(id, tenantId, userId)`
     - Validate status is 'draft'
     - Change status to 'submitted'
     - Add submitted timestamp
     - Send notification to approver (future)

   - `approve(id, tenantId, userId)`
     - Validate status is 'submitted'
     - Re-validate debit = credit
     - Validate fiscal period still open
     - Change status to 'approved'
     - Add approved timestamp

   - `post(id, tenantId, userId)` ← **CRITICAL**
     - Validate status is 'approved'
     - Start database transaction
     - For each line:
       - Create GL entry
       - Update account running balance
     - Update journal status to 'posted'
     - Commit transaction
     - Audit log

   - `update(id, dto, tenantId)`
     - Only allow if status is 'draft'
     - Re-validate debit = credit
     - Update header
     - Delete old lines, create new lines
     - Audit log

   - `remove(id, tenantId)`
     - Only allow if status is 'draft'
     - Delete lines
     - Delete header
     - Audit log

3. Add journal number generation
   - Format: `JV-{YYYY}-{MM}-{#####}`
   - Auto-increment per tenant per month
   - Store in table or sequence

4. Implement fiscal period validation
   - Check `fiscal_periods.is_open = true`
   - Check date is within period range
   - Prevent posting to closed periods

**Frontend Work:**
1. Create journals list page (`/app/[locale]/accounting/journals/page.tsx`)
   - Server component
   - Table with columns: Journal #, Date, Reference, Description, Debit, Credit, Status, Actions
   - Filter by status (Draft, Submitted, Approved, Posted)
   - Filter by fiscal period
   - Filter by date range
   - Search by description or reference
   - Export to CSV

2. Create journal detail page (`/app/[locale]/accounting/journals/[id]/page.tsx`)
   - Show journal header
   - Show journal lines (table)
   - Show total debit/credit (must match)
   - Show audit trail (created, submitted, approved, posted)
   - Action buttons based on status:
     - Draft: Edit, Delete, Submit
     - Submitted: Approve, Reject
     - Approved: Post
     - Posted: View only

3. Create journal form (`components/journals/journal-form-dialog.tsx`)
   - Client component
   - Form fields: Date, Reference, Description (EN/AR), Fiscal Period (dropdown), Lines
   - Dynamic lines table:
     - Add line button
     - Remove line button
     - Account dropdown (searchable)
     - Debit/Credit inputs (mutually exclusive)
     - Running totals (show debit sum, credit sum, difference)
     - Validation: Must balance before submit
   - Loading states

4. Add API client
   ```typescript
   // lib/api/journals.ts
   export async function getJournals(filters: JournalFilters) { ... }
   export async function getJournal(id: string) { ... }
   export async function createJournal(data: CreateJournalDto) { ... }
   export async function updateJournal(id: string, data: UpdateJournalDto) { ... }
   export async function deleteJournal(id: string) { ... }
   export async function submitJournal(id: string) { ... }
   export async function approveJournal(id: string) { ... }
   export async function postJournal(id: string) { ... }
   ```

5. Add translations

**Database Work:**
- Ensure indexes on `(tenant_id, fiscal_period_id, status)`
- Ensure index on `journal_date` for filtering
- Add check constraint: `debit >= 0 AND credit >= 0`
- Add trigger to validate debit = credit on insert

**Estimated Effort:** 32 hours (4 days)
**Dependencies:** Task 2.1 (COA exists)
**Acceptance Criteria:**
- [ ] User can create journal entry
- [ ] System validates debit = credit
- [ ] System validates fiscal period is open
- [ ] User can submit journal for approval
- [ ] User can approve journal
- [ ] User can post journal to GL ← **CRITICAL**
- [ ] User can edit draft journals
- [ ] User can delete draft journals
- [ ] Posted journals cannot be modified
- [ ] Journal number is auto-generated
- [ ] Audit trail shows all status changes

---

### P0 - CRITICAL: General Ledger Posting & View

**Task 2.3: Implement General Ledger Logic**
- **Priority:** P0 - All reports depend on this
- **Module:** Journals (posting) + Reports (GL view)
- **MVP:** Yes

**Backend Work:**
1. Create GL posting logic in `JournalsService.post()`
   ```typescript
   async post(id: string, tenantId: string, userId: string) {
     // Start transaction
     await this.supabase.rpc('begin_transaction');

     try {
       // Get journal with lines
       const journal = await this.findOne(id, tenantId);

       // For each line, create GL entry
       for (const line of journal.lines) {
         await this.supabase.from('general_ledger').insert({
           tenant_id: tenantId,
           journal_id: journal.id,
           journal_line_id: line.id,
           account_id: line.accountId,
           transaction_date: journal.journalDate,
           description: line.description || journal.description,
           debit: line.debit,
           credit: line.credit,
           balance: // calculate running balance for account
           created_by: userId,
           created_at: new Date(),
         });

         // Update account running balance
         await this.updateAccountBalance(line.accountId, line.debit, line.credit);
       }

       // Mark journal as posted
       await this.supabase.from('journals')
         .update({ status: 'posted', posted_at: new Date(), posted_by: userId })
         .eq('id', id);

       // Commit transaction
       await this.supabase.rpc('commit_transaction');

       return { success: true };
     } catch (error) {
       // Rollback on error
       await this.supabase.rpc('rollback_transaction');
       throw error;
     }
   }
   ```

2. Create `general_ledger` table (if not exists)
   ```sql
   CREATE TABLE IF NOT EXISTS general_ledger (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     tenant_id UUID NOT NULL REFERENCES tenants(id),
     journal_id UUID NOT NULL REFERENCES journals(id),
     journal_line_id UUID NOT NULL REFERENCES journal_lines(id),
     account_id UUID NOT NULL REFERENCES chart_of_accounts(id),
     transaction_date DATE NOT NULL,
     description TEXT,
     debit DECIMAL(15,2) NOT NULL DEFAULT 0,
     credit DECIMAL(15,2) NOT NULL DEFAULT 0,
     balance DECIMAL(15,2) NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     created_by UUID REFERENCES users(id),
     UNIQUE(journal_line_id) -- One GL entry per journal line
   );

   -- Indexes
   CREATE INDEX idx_gl_tenant_account ON general_ledger(tenant_id, account_id);
   CREATE INDEX idx_gl_date ON general_ledger(transaction_date);
   ```

3. Implement `ReportsService.getGeneralLedger()`
   - Input: tenantId, accountId, dateFrom, dateTo
   - Query GL entries filtered by account and date
   - Calculate running balance
   - Order by date
   - Return: list of entries with running balance

4. Create GL summary view
   ```sql
   CREATE OR REPLACE VIEW gl_summary AS
   SELECT
     tenant_id,
     account_id,
     COUNT(*) as transaction_count,
     SUM(debit) as total_debit,
     SUM(credit) as total_credit,
     SUM(balance) as closing_balance
   FROM general_ledger
   GROUP BY tenant_id, account_id;
   ```

**Frontend Work:**
1. Create GL page (`/app/[locale]/reports/general-ledger/page.tsx`)
   - Server component
   - Filters: Account (dropdown), Date From, Date To
   - Table with columns: Date, Description, Journal #, Debit, Credit, Balance
   - Running balance column
   - Show opening balance
   - Show closing balance
   - Export to PDF/CSV

2. Create GL summary card
   - Show on dashboard
   - Top 5 accounts by activity
   - Link to full GL

**Estimated Effort:** 24 hours (3 days)
**Dependencies:** Task 2.2 (journal posting)
**Acceptance Criteria:**
- [ ] Posted journals create GL entries
- [ ] GL entries are immutable
- [ ] Each journal line has exactly one GL entry
- [ ] Running balance is calculated correctly
- [ ] Account balances update in real-time
- [ ] User can view GL for any account
- [ ] GL shows running balance
- [ ] GL can be filtered by date range
- [ ] Transaction rollback works if posting fails

---

### P1 - HIGH: Fiscal Period Management

**Task 2.4: Fiscal Year & Period Management**
- **Priority:** P1 - Important for accounting control
- **Module:** Fiscal Periods
- **MVP:** Yes

**Backend Work:**
1. Add validation DTOs
2. Implement service methods
   - Create fiscal year with periods
   - Open/close periods
   - Prevent posting to closed periods
3. Add validation logic

**Frontend Work:**
1. Fiscal periods list page
2. Create fiscal year form
3. Open/close period buttons

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 1.1
**Acceptance Criteria:**
- [ ] User can create fiscal year
- [ ] User can define periods (monthly/quarterly)
- [ ] User can close period
- [ ] Closed periods reject journal posting
- [ ] User cannot reopen closed period (with warning)

---

## Phase 3: Business Operations (Week 3-4)

### P0 - CRITICAL: Customer & Vendor Management

**Task 3.1: Complete Customers Module**
- **Priority:** P0 - Required for invoicing
- **Module:** Customers
- **MVP:** Yes

**Backend Work:**
1. Add validation DTOs
   ```typescript
   class CreateCustomerDto {
     @IsString()
     @IsNotEmpty()
     @MinLength(3)
     @MaxLength(200)
     nameEn: string;

     @IsString()
     @IsNotEmpty()
     @MinLength(3)
     @MaxLength(200)
     nameAr: string;

     @IsEmail()
     @IsOptional()
     email?: string;

     @IsString()
     @IsOptional()
     @MaxLength(20)
     phone?: string;

     @IsOptional()
     @IsString()
     @MaxLength(500)
     address?: string;

     @IsOptional()
     @IsUUID()
     taxCodeId?: string;

     @IsOptional()
     @IsString()
     @MaxLength(50)
     taxRegistrationNumber?: string;

     @IsOptional()
     @IsNumber()
     @Min(0)
     creditLimit?: number;

     @IsOptional()
     @IsString()
     @MaxLength(20)
     paymentTerms?: string; // e.g., "NET30"

     @IsOptional()
     @IsEnum(['active', 'inactive'])
     status?: string;
   }
   ```

2. Implement service methods
   - CRUD operations
   - Calculate current balance (from invoices - payments)
   - Update balance on invoice/payment
   - Validate credit limit before invoice

3. Add customer balance trigger
   - Update `customers.balance` when invoice/payment created

**Frontend Work:**
1. Customers list page
2. Customer detail page (with invoices, payments)
3. Customer form dialog
4. Customer balance card

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 1.1
**Acceptance Criteria:**
- [ ] User can create customer
- [ ] User can edit customer
- [ ] User can view customer balance
- [ ] Customer balance updates automatically
- [ ] Credit limit validation works

---

**Task 3.2: Complete Vendors Module**
- **Priority:** P0 - Required for purchasing
- **Module:** Vendors
- **MVP:** Yes

**Identical structure to Customers module**
- Same DTO structure
- Same CRUD operations
- Track vendor balance (payables)
- Purchase orders instead of invoices

**Estimated Effort:** 12 hours (1.5 days) - reuse customer code
**Dependencies:** Task 1.1
**Acceptance Criteria:**
- [ ] User can create vendor
- [ ] User can edit vendor
- [ ] User can view vendor balance
- [ ] Vendor balance updates automatically

---

### P0 - CRITICAL: Sales Invoicing

**Task 3.3: Complete Sales Invoice Module**
- **Priority:** P0 - Core revenue functionality
- **Module:** Invoices (Sales)
- **MVP:** Yes

**Backend Work:**
1. Add validation DTOs
   ```typescript
   class CreateInvoiceDto {
     @IsUUID()
     @IsNotEmpty()
     customerId: string;

     @IsDate()
     @IsNotEmpty()
     invoiceDate: Date;

     @IsOptional()
     @IsDate()
     dueDate?: Date;

     @IsString()
     @IsNotEmpty()
     @MaxLength(20)
     invoiceNumber: string; // Auto-generated if not provided

     @IsOptional()
     @IsString()
     @MaxLength(200)
    description?: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    descriptionAr?: string;

    @IsArray()
    @IsNotEmpty()
    lines: InvoiceLineDto[];

    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;

    @IsOptional()
    @IsUUID()
    paymentTermId?: string;
  }

  class InvoiceLineDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    description: string;

    @IsOptional()
    @IsString()
    @MaxLength(200)
    descriptionAr?: string;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    quantity: number;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    unitPrice: number;

    @IsUUID()
    @IsNotEmpty()
    accountId: string; // Revenue account

    @IsUUID()
    @IsNotEmpty()
    vatCodeId: string; // VAT code (5%, 0%, exempt)

    @IsOptional()
    @IsNumber()
    @Min(0)
    discount?: number; // Percentage

    @IsOptional()
    @IsUUID()
    costCenterId?: string;
  }
   ```

2. Implement `InvoicesService.createSalesInvoice()`
   - Validate customer exists
   - Generate invoice number if not provided
     - Format: `INV-{YYYY}-{MM}-{#####}`
   - Calculate line totals:
     - Line total = quantity × unitPrice × (1 - discount/100)
   - Calculate line VAT:
     - VAT amount = line total × vatRate
   - Calculate invoice totals:
     - Subtotal = sum(line totals)
     - Total VAT = sum(line VAT amounts)
     - Grand total = subtotal + total VAT
   - Create invoice header
   - Create invoice lines
   - Create journal entry automatically:
     - Debit: Accounts Receivable (grand total)
     - Credit: Revenue accounts (subtotal, distributed by line)
     - Credit: VAT Payable (total VAT)
   - Set journal status to 'approved' (auto-approved)
   - Post journal to GL
   - Update customer balance
   - Return invoice with journal reference

3. Implement invoice workflow
   - Draft → Posted (auto-journal created)
   - Cannot edit posted invoices
   - Can create credit note (negative invoice)
   - Can apply payment

4. Add invoice number generation
   - Auto-increment per tenant per month
   - Gaps allowed (deleted invoices)

5. Implement VAT calculation
   - Use `vat_codes` table
   - Support Qatar VAT rates: 5%, 0%, exempt, out-of-scope

**Frontend Work:**
1. Invoices list page (`/app/[locale]/sales/invoices/page.tsx`)
   - Table with columns: Invoice #, Date, Customer, Subtotal, VAT, Total, Status, Balance Due
   - Filter by status (Draft, Posted, Paid, Overdue)
   - Filter by customer
   - Filter by date range
   - Search by invoice number or customer name
   - Export to CSV/PDF

2. Invoice detail page (`/app/[locale]/sales/invoices/[id]/page.tsx`)
   - Show invoice header
   - Show invoice lines (table)
   - Show totals (subtotal, VAT, total)
   - Show payment status
   - Show linked journal entry
   - Show payments applied
   - Action buttons: Edit (if draft), Record Payment, Print, Send Email

3. Create invoice form (`components/invoices/invoice-form-dialog.tsx`)
   - Client component
   - Customer dropdown (searchable)
   - Invoice date, due date
   - Dynamic lines table:
     - Description, Quantity, Unit Price, VAT Code, Discount
     - Auto-calculate line totals
     - Add/remove lines
   - Show running totals
   - Save as draft / Post buttons

4. Invoice PDF generation
   - Use PDF library (e.g., `@tanstack/react-pdf` or server-side)
   - Bilingual (English/Arabic)
   - Qatar VAT compliant
   - Company logo, address, tax registration
   - Customer details
   - Line items
   - VAT summary
   - Total in words (bilingual)
   - QR code (future)

5. Add API client
   ```typescript
   // lib/api/invoices.ts
   export async function getInvoices(filters: InvoiceFilters) { ... }
   export async function getInvoice(id: string) { ... }
   export async function createInvoice(data: CreateInvoiceDto) { ... }
   export async function updateInvoice(id: string, data: UpdateInvoiceDto) { ... }
   export async function deleteInvoice(id: string) { ... }
   export async function printInvoice(id: string) { ... } // Returns PDF
   ```

6. Add translations

**Database Work:**
- Add trigger to update customer balance on invoice create
- Add trigger to prevent invoice edit if posted
- Add index on `(tenant_id, customer_id, invoice_date)`

**Estimated Effort:** 32 hours (4 days)
**Dependencies:** Task 2.3 (GL posting), Task 3.1 (customers)
**Acceptance Criteria:**
- [ ] User can create sales invoice
- [ ] System generates invoice number
- [ ] System calculates line totals correctly
- [ ] System calculates VAT correctly (5%, 0%, exempt)
- [ ] System creates journal entry automatically
- [ ] System posts journal to GL
- [ ] Customer balance updates
- [ ] User cannot edit posted invoices
- [ ] User can print invoice as PDF
- [ ] PDF is bilingual (EN/AR)
- [ ] Invoice shows VAT breakdown

---

### P0 - CRITICAL: Payment Processing

**Task 3.4: Complete Payments & Receipts Module**
- **Priority:** P0 - Critical for cash flow
- **Module:** Payments
- **MVP:** Yes

**Backend Work:**
1. Add validation DTOs
   ```typescript
   class CreatePaymentDto {
     @IsEnum(['receipt', 'payment'])
     @IsNotEmpty()
     paymentType: string;

     @IsUUID()
     @IsNotEmpty()
     entityId: string; // customer_id (receipt) or vendor_id (payment)

     @IsDate()
     @IsNotEmpty()
     paymentDate: Date;

     @IsString()
     @IsNotEmpty()
     @MaxLength(20)
     paymentNumber: string; // Auto-generated

     @IsNumber()
    @Min(0)
    @IsNotEmpty()
    amount: number;

    @IsUUID()
    @IsNotEmpty()
    bankAccountId: string;

    @IsString()
    @IsOptional()
    @MaxLength(200)
    reference?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    notes?: string;

    @IsArray()
    @IsNotEmpty()
    allocations: PaymentAllocationDto[];
  }

  class PaymentAllocationDto {
    @IsUUID()
    @IsNotEmpty()
    invoiceId: string;

    @IsNumber()
    @Min(0)
    @IsNotEmpty()
    amount: number;
  }
   ```

2. Implement `PaymentsService.createReceipt()`
   - Validate customer exists
   - Generate receipt number
     - Format: `RCT-{YYYY}-{MM}-{#####}`
   - Validate allocations
     - Sum must equal payment amount
     - Invoice must exist
     - Allocated amount ≤ invoice balance due
   - Create payment record
   - Create allocations
   - Update invoice balances
   - Create journal entry:
     - Debit: Bank Account
     - Credit: Accounts Receivable
   - Post journal to GL
   - Update customer balance

3. Implement `PaymentsService.createPayment()`
   - Similar to receipt, but for vendors
   - Journal entry:
     - Debit: Accounts Payable
     - Credit: Bank Account

4. Handle partial payments
   - Allow allocation to multiple invoices
   - Update each invoice's balance
   - Track remaining balance

5. Handle overpayments
   - Create credit note for customer/vendor
   - Apply to future invoices

6. Handle payment reversal
   - Create reversal entry
   - Reverse allocations
   - Reverse journal entry

**Frontend Work:**
1. Receipts list page (`/app/[locale]/sales/receipts/page.tsx`)
2. Payments list page (`/app/[locale]/purchases/payments/page.tsx`)
3. Record payment form (with allocation interface)
4. Payment detail page (show allocations)

**Estimated Effort:** 24 hours (3 days)
**Dependencies:** Task 3.3 (invoices)
**Acceptance Criteria:**
- [ ] User can record customer receipt
- [ ] User can record vendor payment
- [ ] User can allocate payment to multiple invoices
- [ ] System updates invoice balances
- [ ] System creates journal entry
- [ ] System posts to GL
- [ ] User can view payment history
- [ ] User can reverse payment

---

### P1 - HIGH: Quotations & Purchase Orders

**Task 3.5: Quotations Module**
- **Priority:** P1 - Nice to have for MVP
- **Module:** Quotations (new)
- **MVP:** No

**Backend Work:**
1. Create quotations table
2. Implement quotation CRUD
3. Convert quotation to invoice

**Frontend Work:**
1. Quotations list page
2. Quotation form (similar to invoice)
3. Convert to invoice button

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 3.3 (invoices)
**Acceptance Criteria:**
- [ ] User can create quotation
- [ ] User can convert quotation to invoice
- [ ] Quotation number is generated

---

**Task 3.6: Purchase Orders Module**
- **Priority:** P1 - Nice to have for MVP
- **Module:** Purchase Orders (new)
- **MVP:** No

**Similar structure to quotations**
- Link to vendor
- Convert to vendor invoice

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 3.2 (vendors)
**Acceptance Criteria:**
- [ ] User can create purchase order
- [ ] User can convert PO to invoice

---

### P2 - MEDIUM: Expenses Management

**Task 3.7: Expenses Module**
- **Priority:** P2 - Can defer
- **Module:** Expenses
- **MVP:** No

**Backend Work:**
1. Add validation DTOs
2. Implement expense CRUD
3. Handle attachments (receipts)
4. Create journal entry for expense
5. Implement approval workflow

**Frontend Work:**
1. Expenses list page
2. Expense form with file upload
3. Approval interface

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 2.3 (GL posting)
**Acceptance Criteria:**
- [ ] User can create expense
- [ ] User can upload receipt
- [ ] Manager can approve expense
- [ ] Approved expense posts to GL

---

## Phase 4: Financial Reporting (Week 5)

### P0 - CRITICAL: Trial Balance

**Task 4.1: Trial Balance Report**
- **Priority:** P0 - Core accounting report
- **Module:** Reports
- **MVP:** Yes

**Backend Work:**
1. Implement `ReportsService.getTrialBalance()`
   - Input: tenantId, dateFrom, dateTo
   - Query all GL entries within date range
   - Group by account
   - Calculate opening balance (before dateFrom)
   - Calculate period debits/credits
   - Calculate closing balance
   - Filter accounts with non-zero balances
   - Return: list of accounts with debit/credit totals

2. Validate trial balance
   - Total debits = Total credits
   - Throw error if not balanced

3. Add account hierarchy
   - Group by account type
   - Show subtotals by type

**Frontend Work:**
1. Trial balance page (`/app/[locale]/reports/trial-balance/page.tsx`)
   - Filters: As of Date
   - Table with columns: Account #, Account Name, Debit, Credit
   - Show totals at bottom
   - Export to PDF/CSV
   - Print view

**Estimated Effort:** 12 hours (1.5 days)
**Dependencies:** Task 2.3 (GL posting)
**Acceptance Criteria:**
- [ ] User can generate trial balance
- [ ] Report shows all accounts with balances
- [ ] Total debits = Total credits
- [ ] Report can be exported to PDF
- [ ] Report can be filtered by date

---

### P0 - CRITICAL: Financial Statements

**Task 4.2: Balance Sheet & Income Statement**
- **Priority:** P0 - Essential for accounting
- **Module:** Reports
- **MVP:** Yes

**Backend Work:**
1. Implement `ReportsService.getBalanceSheet()`
   - Input: tenantId, asOfDate
   - Get all asset, liability, equity accounts
   - Calculate balances as of date
   - Group by account type
   - Calculate totals
   - Return: hierarchical structure

2. Implement `ReportsService.getIncomeStatement()`
   - Input: tenantId, dateFrom, dateTo
   - Get all revenue, expense accounts
   - Calculate totals for period
   - Calculate gross profit
   - Calculate operating profit
   - Calculate net profit
   - Return: hierarchical structure

3. Add profit/loss calculation
   - Gross profit = Revenue - COGS
   - Operating profit = Gross profit - Operating expenses
   - Net profit = Operating profit - Non-operating items

**Frontend Work:**
1. Balance sheet page (`/app/[locale]/reports/balance-sheet/page.tsx`)
   - Filters: As of Date
   - Show assets, liabilities, equity
   - Show totals
   - Export to PDF

2. Income statement page (`/app/[locale]/reports/income-statement/page.tsx`)
   - Filters: Period From, Period To
   - Show revenue, expenses
   - Show profit calculations
   - Export to PDF

3. Add charts
   - Revenue vs Expense trend
   - Profit margin

**Estimated Effort:** 24 hours (3 days)
**Dependencies:** Task 4.1 (trial balance)
**Acceptance Criteria:**
- [ ] User can generate balance sheet
- [ ] User can generate income statement
- [ ] Assets = Liabilities + Equity
- [ ] Profit calculations are correct
- [ ] Reports can be exported to PDF
- [ ] Reports show bilingual account names

---

### P1 - HIGH: Aged Receivables & Payables

**Task 4.3: Aged Reports**
- **Priority:** P1 - Important for cash management
- **Module:** Reports
- **MVP:** Yes

**Backend Work:**
1. Implement `ReportsService.getAgedReceivables()`
   - Input: tenantId, asOfDate
   - Get all unpaid invoices
   - Calculate days overdue
   - Group by aging buckets: Current, 1-30, 31-60, 61-90, 90+
   - Group by customer
   - Return: aged list

2. Implement `ReportsService.getAgedPayables()`
   - Similar for vendors

**Frontend Work:**
1. Aged receivables page
2. Aged payables page
3. Show aging matrix

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 3.3 (invoices)
**Acceptance Criteria:**
- [ ] User can view aged receivables
- [ ] User can view aged payables
- [ ] Reports show aging buckets
- [ ] Reports can be exported

---

### P2 - MEDIUM: Reports Center

**Task 4.4: Reports Dashboard**
- **Priority:** P2 - Nice to have
- **Module:** Reports
- **MVP:** No

**Frontend Work:**
1. Reports center page
2. Quick access to all reports
3. Saved reports feature
4. Scheduled reports (email)

**Estimated Effort:** 12 hours (1.5 days)
**Dependencies:** All previous reporting tasks
**Acceptance Criteria:**
- [ ] User can access all reports from one page
- [ ] User can save report configurations
- [ ] User can schedule reports (future)

---

## Phase 5: Advanced Features (Week 6)

### P1 - HIGH: Banking & Reconciliation

**Task 5.1: Bank Accounts Management**
- **Priority:** P1 - Important for cash management
- **Module:** Banking
- **MVP:** Yes

**Backend Work:**
1. Add validation DTOs for bank accounts
2. Implement bank account CRUD
3. Implement bank transaction CRUD
4. Calculate running balance

**Frontend Work:**
1. Bank accounts list page
2. Bank transactions page
3. Show running balance

**Estimated Effort:** 12 hours (1.5 days)
**Dependencies:** Task 1.1
**Acceptance Criteria:**
- [ ] User can create bank account
- [ ] User can record bank transactions
- [ ] System calculates running balance
- [ ] User can import bank statement (CSV)

---

**Task 5.2: Bank Reconciliation**
- **Priority:** P2 - Nice to have for MVP
- **Module:** Banking
- **MVP:** No

**Backend Work:**
1. Implement reconciliation logic
2. Match bank transactions to GL entries
3. Mark as reconciled

**Frontend Work:**
1. Reconciliation interface
2. Side-by-side view (bank vs GL)
3. Match/unmatch functionality

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 5.1
**Acceptance Criteria:**
- [ ] User can reconcile bank account
- [ ] System matches transactions
- [ ] User can manually match
- [ ] Reconciliation report is generated

---

### P2 - MEDIUM: Fixed Assets & Depreciation

**Task 5.3: Fixed Assets Module**
- **Priority:** P2 - Can defer
- **Module:** Assets
- **MVP:** No

**Backend Work:**
1. Add validation DTOs
2. Implement asset CRUD
3. Calculate net book value
4. Schedule depreciation jobs (BullMQ)

**Frontend Work:**
1. Assets list page
2. Asset register
3. Depreciation schedule view

**Estimated Effort:** 20 hours (2.5 days)
**Dependencies:** Task 2.3 (GL posting)
**Acceptance Criteria:**
- [ ] User can register fixed asset
- [ ] System calculates depreciation
- [ ] System posts depreciation journal
- [ ] User can view asset register

---

### P1 - HIGH: VAT Management

**Task 5.4: VAT Reports**
- **Priority:** P1 - Required for Qatar Tax Authority
- **Module:** VAT
- **MVP:** Yes

**Backend Work:**
1. Implement `VatService.getVatReturn()`
   - Input: tenantId, periodFrom, periodTo
   - Summarize all VAT transactions
   - Calculate output VAT (sales)
   - Calculate input VAT (purchases)
   - Calculate net VAT payable/refundable
   - Return: VAT return data

2. Implement VAT transaction tracking
   - Track VAT on every invoice/payment
   - Store in `vat_transactions` table

**Frontend Work:**
1. VAT return page (`/app/[locale]/tax/vat-return/page.tsx`)
   - Filters: Period
   - Show output VAT, input VAT, net VAT
   - Export to official format (Excel)

2. VAT transactions page
   - Show all VAT transactions
   - Filter by type, date

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 3.3 (invoices)
**Acceptance Criteria:**
- [ ] User can generate VAT return
- [ ] Report matches Qatar Tax Authority format
- [ ] Report can be exported to Excel
- [ ] System tracks all VAT transactions

---

### P2 - MEDIUM: Settings Pages

**Task 5.5: Company Settings**
- **Priority:** P2 - Important for professional appearance
- **Module:** Tenants
- **MVP:** Yes

**Frontend Work:**
1. Company settings page
   - Company name, logo
   - Address, phone, email
   - Tax registration number
   - Default settings (currency, VAT rate)

**Estimated Effort:** 8 hours (1 day)
**Dependencies:** Task 1.1
**Acceptance Criteria:**
- [ ] User can update company details
- [ ] User can upload company logo
- [ ] Logo appears on invoices

---

**Task 5.6: User & Role Management**
- **Priority:** P2 - Important for multi-user
- **Module:** Users, Roles
- **MVP:** Yes

**Frontend Work:**
1. Users list page
2. Invite user form
3. Roles list page
4. Role permissions editor

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** Task 1.2 (auth)
**Acceptance Criteria:**
- [ ] Admin can invite users
- [ ] Admin can assign roles
- [ ] Admin can manage role permissions

---

**Task 5.7: Cost Centers**
- **Priority:** P3 - Defer
- **Module:** Cost Centers (new)
- **MVP:** No

**Backend Work:**
1. Create cost_centers table
2. Implement CRUD

**Frontend Work:**
1. Cost centers list page
2. Cost center form

**Estimated Effort:** 8 hours (1 day)
**Dependencies:** Task 2.1 (COA)
**Acceptance Criteria:**
- [ ] User can create cost center
- [ ] User can assign cost center to journal lines

---

## Phase 6: Production Readiness (Week 6-7)

### P0 - CRITICAL: Security Hardening

**Task 6.1: Implement Security Best Practices**
- **Priority:** P0 - Cannot deploy without this
- **Module:** All
- **MVP:** Yes

**Backend Work:**
1. **Environment Variables**
   - Replace all placeholder values
   - Generate strong JWT_SECRET (use `openssl rand -base64 32`)
   - Use Supabase service role key properly
   - Never commit .env file

2. **Rate Limiting**
   - Add rate limiter middleware (express-rate-limit)
   - Configure limits per endpoint:
     - Auth endpoints: 5 requests per minute
     - API endpoints: 100 requests per minute
     - Public endpoints: 10 requests per minute

3. **CORS Configuration**
   - Whitelist frontend domains
   - Remove wildcard in production

4. **Helmet Headers**
   - Add Helmet middleware for security headers
   - Configure CSP, HSTS, etc.

5. **Input Validation**
   - Ensure all DTOs have validation
   - Sanitize user input
   - Prevent SQL injection (use parameterized queries)

6. **Authentication**
   - Verify JWT on every protected route
   - Check token expiry
   - Implement token rotation

7. **Password Security**
   - Require strong passwords (min 8 chars, mixed case, numbers)
   - Hash passwords (Supabase handles this)
   - Implement password reset flow

8. **Row Level Security**
   - Verify all RLS policies are active
   - Test tenant isolation
   - Ensure no data leaks

9. **Audit Logging**
   - Log all sensitive actions
   - Include user_id, timestamp, action
   - Store in audit_log table

10. **API Security**
    - Add API versioning
    - Add request ID tracking
    - Implement error handling (no stack traces in production)

**Frontend Work:**
1. **XSS Prevention**
   - Use React's built-in XSS protection
   - Sanitize HTML from user input
   - Use DOMPurify for rich text

2. **CSRF Protection**
   - Supabase handles this
   - Verify SameSite cookie attribute

3. **Secure Storage**
   - Store tokens in httpOnly cookies (Supabase)
   - Never store tokens in localStorage (use Supabase client)

4. **Content Security Policy**
   - Add CSP headers via Next.js config
   - Whitelist script sources

**Estimated Effort:** 24 hours (3 days)
**Dependencies:** All features implemented
**Acceptance Criteria:**
- [ ] No placeholder secrets in code
- [ ] Rate limiting is active
- [ ] CORS is properly configured
- [ ] All endpoints require auth (except public ones)
- [ ] JWT tokens are validated
- [ ] Passwords meet strength requirements
- [ ] RLS policies are active
- [ ] Audit logging is working
- [ ] No sensitive data in error messages
- [ ] Security headers are set (Helmet)

---

### P1 - HIGH: Performance Optimization

**Task 6.2: Optimize Application Performance**
- **Priority:** P1 - Important for user experience
- **Module:** All
- **MVP:** Yes

**Backend Work:**
1. **Database Optimization**
   - Add indexes to frequently queried columns
   - Create composite indexes for common filters
   - Analyze slow queries (use Supabase query stats)
   - Optimize N+1 queries (use joins)

2. **Caching Strategy**
   - Add Redis caching for frequently accessed data
   - Cache COA (changes rarely)
   - Cache user permissions
   - Cache report results for 5 minutes
   - Invalidate cache on updates

3. **API Optimization**
   - Add pagination to all list endpoints
   - Limit default page size to 50
   - Add field selection (GraphQL-like)
   - Use compression (gzip)

4. **Background Jobs**
   - Configure BullMQ properly
   - Process depreciation jobs in background
   - Process report generation in background
   - Configure Redis for BullMQ

**Frontend Work:**
1. **Code Splitting**
   - Use Next.js dynamic imports
   - Split routes
   - Lazy load heavy components

2. **Image Optimization**
   - Use Next.js Image component
   - Optimize company logo
   - Use WebP format

3. **Data Fetching**
   - Use Server Components by default
   - Implement parallel fetching
   - Add loading skeletons
   - Implement optimistic UI updates

4. **Bundle Size**
   - Analyze bundle size
   - Remove unused dependencies
   - Tree shaking

**Estimated Effort:** 20 hours (2.5 days)
**Dependencies:** All features implemented
**Acceptance Criteria:**
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms (p95)
- [ ] Database queries use indexes
- [ ] N+1 queries eliminated
- [ ] Pagination works on all lists
- [ ] Cache is working (Redis)
- [ ] BullMQ jobs process successfully
- [ ] Bundle size is optimized

---

### P1 - HIGH: Testing

**Task 6.3: Implement Testing**
- **Priority:** P1 - Important for quality assurance
- **Module:** All
- **MVP:** Yes

**Backend Work:**
1. **Unit Tests**
   - Test service methods
   - Test validation logic
   - Test business logic (debit = credit)
   - Use Jest
   - Target 70% coverage

2. **Integration Tests**
   - Test API endpoints
   - Test database operations
   - Test auth flow
   - Test tenant isolation
   - Use Supabase test database

3. **E2E Tests**
   - Test critical user flows:
     - Sign up → Create invoice
     - Create journal → Post to GL
     - Generate reports
   - Use Supertest or Playwright

**Frontend Work:**
1. **Component Tests**
   - Test critical components
   - Test form validation
   - Test error states
   - Use React Testing Library

2. **E2E Tests**
   - Test user flows
   - Test navigation
   - Test auth flow
   - Use Playwright

**Estimated Effort:** 32 hours (4 days) - Can parallelize
**Dependencies:** All features implemented
**Acceptance Criteria:**
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Coverage > 70%
- [ ] Critical flows are tested

---

### P1 - HIGH: Error Handling & Logging

**Task 6.4: Implement Comprehensive Error Handling**
- **Priority:** P1 - Critical for production
- **Module:** All
- **MVP:** Yes

**Backend Work:**
1. **Global Error Filter**
   - Catch all errors
   - Log errors with context
   - Return user-friendly messages
   - Include request ID for tracing

2. **Error Types**
   - Create custom exception classes:
     - `BusinessException` (validation errors)
     - `NotFoundException`
     - `UnauthorizedException`
     - `ForbiddenException`
     - `ConflictException`

3. **Logging**
   - Use Winston or Pino
   - Log levels: error, warn, info, debug
   - Log to console (dev) and file/cloud (prod)
   - Include request context

4. **Monitoring**
   - Add health check endpoint: `GET /api/health`
   - Add metrics endpoint: `GET /api/metrics`
   - Integrate with monitoring service (optional)

**Frontend Work:**
1. **Error Boundaries**
   - Add React error boundaries
   - Show friendly error page
   - Log errors to backend

2. **Toast Notifications**
   - Use Sonner (already installed)
   - Show success/error messages
   - Handle API errors gracefully

3. **Loading States**
   - Add loading skeletons
   - Show progress indicators
   - Handle network errors

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** All features implemented
**Acceptance Criteria:**
- [ ] All errors are caught and logged
- [ ] User sees friendly error messages
- [ ] Stack traces not exposed to users
- [ ] Request ID is tracked
- [ ] Health check endpoint works
- [ ] Monitoring is configured

---

### P2 - MEDIUM: Documentation

**Task 6.5: Write Documentation**
- **Priority:** P2 - Important for maintenance
- **Module:** All
- **MVP:** No

**Backend Work:**
1. **API Documentation**
   - Ensure Swagger is complete
   - Add request/response examples
   - Add error codes
   - Document authentication

2. **Code Comments**
   - Document complex logic
   - Add JSDoc comments
   - Explain accounting calculations

**Frontend Work:**
1. **User Documentation**
   - Write user guide
   - Create screenshots
   - Record demo videos
   - Add FAQs

2. **Developer Documentation**
   - Update README
   - Document setup process
   - Add deployment guide
   - Document architecture

**Estimated Effort:** 24 hours (3 days)
**Dependencies:** All features implemented
**Acceptance Criteria:**
- [ ] Swagger docs are complete
- [ ] API has request/response examples
- [ ] User guide is written
- [ ] Deployment guide is written
- [ ] Code is commented

---

### P0 - CRITICAL: Deployment

**Task 6.6: Deploy to Production**
- **Priority:** P0 - Cannot launch without this
- **Module:** All
- **MVP:** Yes

**Backend Deployment:**
1. **Choose Hosting**
   - Option A: Railway, Render, Fly.io (easy)
   - Option B: AWS EC2, DigitalOcean (more control)
   - Option C: Supabase Edge Functions (serverless)

2. **Database Setup**
   - Create production Supabase project
   - Run all migrations in order
   - Verify RLS policies
   - Set up database backups

3. **Environment Variables**
   - Set production variables
   - Generate strong JWT_SECRET
   - Configure Redis (for BullMQ)

4. **Build & Deploy**
   ```bash
   cd backend
   npm run build
   npm run start:prod
   ```

5. **Configure Domain**
   - Add custom domain (e.g., api.al-muhasib.com)
   - Configure SSL certificate

6. **Post-Deployment Checks**
   - Test health endpoint
   - Test auth flow
   - Test database connection
   - Verify RLS policies
   - Load test (simulate 100 concurrent users)

**Frontend Deployment:**
1. **Choose Hosting**
   - Option A: Vercel (recommended for Next.js)
   - Option B: Netlify
   - Option C: Railway, Render

2. **Environment Variables**
   - Set `NEXT_PUBLIC_SUPABASE_URL`
   - Set `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Set `NEXT_PUBLIC_API_URL` (backend URL)

3. **Build & Deploy**
   ```bash
   cd frontend
   npm run build
   ```

4. **Configure Domain**
   - Add custom domain (e.g., app.al-muhasib.com)
   - Configure SSL certificate

5. **Post-Deployment Checks**
   - Test page load
   - Test auth flow
   - Test API calls
   - Test responsive design
   - Test RTL (Arabic)

**Estimated Effort:** 16 hours (2 days)
**Dependencies:** All features implemented, security hardening complete
**Acceptance Criteria:**
- [ ] Backend is deployed and accessible
- [ ] Frontend is deployed and accessible
- [ ] Custom domain is configured
- [ ] SSL certificate is active
- [ ] Health check passes
- [ ] Auth flow works
- [ ] Database is backed up
- [ ] Monitoring is configured
- [ ] Error logging is working
- [ ] Application can handle expected load

---

## Summary & Timeline

### Week 1: Core Auth & Tenancy
- ✅ P0: Tenant creation during signup (2 days)
- ✅ P0: Complete auth flow (1.5 days)
- ✅ P1: Fix all controller validation (3 days) - Parallel
- ⏳ P2: User self-service (2 days) - Can defer

**Week 1 Deliverables:**
- Users can sign up and create tenant
- Users can sign in and access dashboard
- All APIs have proper validation

---

### Week 2: Foundation
- ✅ P0: Chart of Accounts (3 days)
- ✅ P0: Journal Entry workflow (4 days)
- ✅ P0: General Ledger posting (3 days) - Overlaps with journals
- ⏳ P1: Fiscal Periods (2 days) - Parallel

**Week 2 Deliverables:**
- Complete COA management
- Journal entry workflow working
- Journals post to GL correctly
- Fiscal periods can be managed

---

### Week 3: Business Operations (Part 1)
- ✅ P0: Customers module (2 days)
- ✅ P0: Vendors module (1.5 days) - Parallel
- ✅ P0: Sales invoicing (4 days)

**Week 3 Deliverables:**
- Customers and vendors can be managed
- Sales invoices can be created
- Invoices post to GL automatically
- VAT is calculated correctly

---

### Week 4: Business Operations (Part 2)
- ✅ P0: Payments & receipts (3 days)
- ⏳ P1: Quotations (2 days) - Parallel, defer if needed
- ⏳ P1: Purchase Orders (2 days) - Parallel, defer if needed
- ⏳ P2: Expenses (2 days) - Defer

**Week 4 Deliverables:**
- Payments and receipts can be recorded
- Payments allocate to invoices
- Cash flow is tracked

---

### Week 5: Financial Reporting
- ✅ P0: Trial Balance (1.5 days)
- ✅ P0: Financial Statements (3 days)
- ✅ P1: Aged Reports (2 days)
- ⏳ P2: Reports Center (1.5 days) - Parallel

**Week 5 Deliverables:**
- Trial balance can be generated
- Balance sheet and income statement work
- Aged receivables/payables reports
- Reports can be exported to PDF

---

### Week 6: Advanced Features
- ✅ P1: Bank Accounts (1.5 days)
- ⏳ P2: Bank Reconciliation (2 days) - Defer if needed
- ⏳ P2: Fixed Assets (2.5 days) - Defer
- ✅ P1: VAT Reports (2 days)
- ✅ P2: Settings pages (3 days) - Parallel

**Week 6 Deliverables:**
- Bank accounts can be managed
- VAT returns can be generated
- Company settings can be configured
- Users and roles can be managed

---

### Week 6-7: Production Readiness
- ✅ P0: Security hardening (3 days)
- ✅ P1: Performance optimization (2.5 days)
- ✅ P1: Testing (4 days) - Can start earlier
- ✅ P1: Error handling (2 days)
- ⏳ P2: Documentation (3 days) - Can defer
- ✅ P0: Deployment (2 days)

**Week 6-7 Deliverables:**
- Application is secure
- Application is performant
- Tests pass
- Errors are handled gracefully
- Documentation is written
- Application is deployed to production

---

## MVP Definition

### Must Have (P0):
1. ✅ Tenant creation during signup
2. ✅ Complete auth flow
3. ✅ Controller validation
4. ✅ Chart of Accounts
5. ✅ Journal Entry workflow
6. ✅ General Ledger posting
7. ✅ Customers & Vendors
8. ✅ Sales Invoicing
9. ✅ Payments & Receipts
10. ✅ Trial Balance
11. ✅ Financial Statements (Balance Sheet, Income Statement)
12. ✅ VAT Reports
13. ✅ Security hardening
14. ✅ Deployment

### Should Have (P1):
1. Fiscal Periods
2. Aged Reports
3. Bank Accounts
4. Company Settings
5. User & Role Management
6. Performance Optimization
7. Testing
8. Error Handling

### Nice to Have (P2 - Defer):
1. User self-service (password reset)
2. Quotations
3. Purchase Orders
4. Expenses
5. Bank Reconciliation
6. Fixed Assets & Depreciation
7. Cost Centers
8. Reports Center
9. Documentation

---

## Risk Assessment

### High Risk Items:
1. **Journal Posting Logic** - Critical for all reports
   - Mitigation: Test thoroughly, use database transactions
   - Contingency: Manual GL entry if needed

2. **VAT Calculations** - Legal requirement
   - Mitigation: Follow Qatar Tax Authority rules
   - Contingency: Review with accountant

3. **Multi-Tenant Isolation** - Security risk
   - Mitigation: Test RLS policies extensively
   - Contingency: Add application-level checks

4. **Timeline** - 6 weeks is aggressive
   - Mitigation: Prioritize P0 tasks, defer P2/P3
   - Contingency: Extend by 2 weeks if needed

5. **Arabic Path Issue** - Frontend build errors
   - Mitigation: Move frontend to ASCII path
   - Contingency: Use development server

### Medium Risk Items:
1. **Bilingual Support** - Translation work
   - Mitigation: Use next-intl, translate as we go
   - Contingency: Launch with partial translations

2. **Redis/BullMQ Configuration** - Background jobs
   - Mitigation: Use managed Redis (e.g., Redis Cloud)
   - Contingency: Disable background jobs initially

3. **PDF Generation** - Invoice printing
   - Mitigation: Use server-side PDF library
   - Contingency: Use HTML print view

---

## Success Criteria

### Technical:
- [ ] All P0 tasks completed
- [ ] 70% test coverage
- [ ] Page load time < 2 seconds
- [ ] API response time < 500ms
- [ ] Security audit passed
- [ ] Zero critical bugs

### Functional:
- [ ] User can complete full accounting cycle:
  - Create tenant
  - Set up COA
  - Create journal entries
  - Post to GL
  - Generate invoices
  - Record payments
  - Run reports
- [ ] Reports are accurate (debits = credits)
- [ ] VAT calculations are correct
- [ ] Multi-tenant isolation works

### User Experience:
- [ ] Interface is intuitive
- [ ] Bilingual support works (EN/AR)
- [ ] Error messages are clear
- [ ] Loading states are smooth
- [ ] Mobile-responsive

---

## Recommended Team Structure

### Developer 1: Backend Focus
- Week 1: Auth, Tenants, Validation
- Week 2: Journals, GL Posting, Fiscal Periods
- Week 3: Invoices, Payments
- Week 4: Reports (Trial Balance, Financial Statements)
- Week 5: VAT, Banking
- Week 6: Security, Performance, Deployment

### Developer 2: Frontend Focus
- Week 1: Auth pages, Dashboard
- Week 2: COA, Journals pages
- Week 3: Customers, Vendors, Invoices pages
- Week 4: Payments, Receipts pages
- Week 5: Reports pages
- Week 6: Settings, Polish, Testing

### Developer 3: Full-Stack (if available)
- Week 1: Controller validation, API integration
- Week 2: Forms, API clients
- Week 3: Business operations
- Week 4: Testing, Error handling
- Week 5: Advanced features
- Week 6: Documentation, Deployment support

---

## Conclusion

This development plan provides a comprehensive roadmap to complete the Enterprise Accounting SaaS application in 6 weeks. The plan is organized by priority and dependencies, ensuring that critical foundation (auth, tenants, COA, journals, GL posting) is completed first, followed by business operations, then reporting, and finally advanced features and production readiness.

**Key Success Factors:**
1. Focus on P0 tasks first for MVP
2. Complete journal posting to GL early (Week 2)
3. Test accounting calculations thoroughly
4. Implement security from day one
5. Use database transactions for data integrity
6. Test multi-tenant isolation extensively

**Estimated Total Effort:**
- P0 Tasks: ~280 hours (7 weeks for 1 developer, 4.5 weeks for 2 developers)
- P1 Tasks: ~120 hours (3 weeks for 1 developer, 2 weeks for 2 developers)
- P2 Tasks: ~100 hours (2.5 weeks for 1 developer, 1.5 weeks for 2 developers)

**Realistic Timeline:**
- **MVP (P0 only):** 4-5 weeks with 2-3 developers
- **Full Product (P0 + P1):** 6-7 weeks with 2-3 developers
- **Complete Product (all):** 8-9 weeks with 2-3 developers

The plan is achievable in 6 weeks if the team focuses on P0 and P1 tasks, and defers P2 tasks to post-launch iterations.
