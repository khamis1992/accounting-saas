# Task Breakdown - Sprint Ready
## Enterprise Accounting SaaS - Qatar Market

This file contains individual, actionable tasks organized by sprint. Each task can be assigned to a developer and tracked independently.

---

## Sprint 1: Foundation (Week 1)

### Backend Tasks

#### [BACKEND-1.1] Create Tenant with Admin Endpoint
**File:** `backend/src/tenants/tenants.controller.ts`
**Effort:** 4 hours
**Description:** Add public endpoint for creating tenant with admin user
```typescript
@Post('create-with-admin')
async createTenantWithAdmin(@Body() dto: CreateTenantWithAdminDto) {
  // Implementation
}
```
**Acceptance:**
- [ ] Endpoint is public (no auth required)
- [ ] Validates company name uniqueness
- [ ] Creates tenant record
- [ ] Creates admin user with admin role
- [ ] Copies default COA (50+ accounts)
- [ ] Creates default fiscal year
- [ ] Returns tokens and user data
- [ ] Rate limited (3 req/hour per IP)

#### [BACKEND-1.2] Add COA Template Copying Logic
**File:** `backend/src/tenants/tenants.service.ts`
**Effort:** 3 hours
**Description:** Copy default COA template to new tenant
```typescript
async copyCoaTemplate(tenantId: string) {
  // Get all accounts where tenant_id is null (template)
  // Copy to new tenant_id
  // Preserve parent-child relationships
}
```
**Acceptance:**
- [ ] Reads template accounts (tenant_id = null)
- [ ] Copies all accounts to new tenant
- [ ] Preserves account hierarchy
- [ ] Returns count of copied accounts

#### [BACKEND-1.3] Fix Auth Controller Validation
**File:** `backend/src/auth/auth.controller.ts`
**Effort:** 2 hours
**Description:** Already done - verify all DTOs have validation
**Acceptance:**
- [ ] All DTOs have class-validator decorators
- [ ] Swagger docs reflect validation
- [ ] Invalid requests return 400

#### [BACKEND-1.4] Create Users Module Validation DTOs
**File:** `backend/src/users/dto/*.ts`
**Effort:** 3 hours
**Description:** Create validation DTOs for users module
```typescript
// create-user.dto.ts
export class CreateUserDto {
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
  // ... etc
}
```
**Acceptance:**
- [ ] CreateUserDto with validation
- [ ] UpdateUserDto with validation
- [ ] All fields properly typed and validated

#### [BACKEND-1.5] Create Roles Module Validation DTOs
**File:** `backend/src/roles/dto/*.ts`
**Effort:** 2 hours
**Description:** Create validation DTOs for roles module
**Acceptance:**
- [ ] CreateRoleDto with validation
- [ ] UpdateRoleDto with validation
- [ ] AssignPermissionDto with validation

#### [BACKEND-1.6] Create COA Module Validation DTOs
**File:** `backend/src/coa/dto/*.ts`
**Effort:** 3 hours
**Description:** Create validation DTOs for COA module
```typescript
// create-account.dto.ts
export class CreateAccountDto {
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
  // ... etc
}
```
**Acceptance:**
- [ ] CreateAccountDto with validation
- [ ] UpdateAccountDto with validation
- [ ] All fields validated

#### [BACKEND-1.7] Create Journals Module Validation DTOs
**File:** `backend/src/journals/dto/*.ts`
**Effort:** 3 hours
**Description:** Add validation decorators to existing DTOs
**Acceptance:**
- [ ] CreateJournalDto with validation
- [ ] UpdateJournalDto with validation
- [ ] JournalLineDto with validation
- [ ] Nested DTOs validated

#### [BACKEND-1.8] Create Fiscal Periods Validation DTOs
**File:** `backend/src/fiscal-periods/dto/*.ts`
**Effort:** 2 hours
**Description:** Create validation DTOs for fiscal periods
**Acceptance:**
- [ ] CreateFiscalYearDto with validation
- [ ] CreateFiscalPeriodDto with validation
- [ ] UpdateFiscalPeriodDto with validation

#### [BACKEND-1.9] Create Customers Validation DTOs
**File:** `backend/src/customers/dto/*.ts`
**Effort:** 2 hours
**Description:** Create validation DTOs for customers
**Acceptance:**
- [ ] CreateCustomerDto with validation
- [ ] UpdateCustomerDto with validation

#### [BACKEND-1.10] Create Vendors Validation DTOs
**File:** `backend/src/vendors/dto/*.ts`
**Effort:** 2 hours
**Description:** Create validation DTOs for vendors
**Acceptance:**
- [ ] CreateVendorDto with validation
- [ ] UpdateVendorDto with validation

#### [BACKEND-1.11] Create Invoices Validation DTOs
**File:** `backend/src/invoices/dto/*.ts`
**Effort:** 4 hours
**Description:** Create validation DTOs for invoices
```typescript
// create-invoice.dto.ts
export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  customerId: string;

  @IsDate()
  @IsNotEmpty()
  invoiceDate: Date;

  @IsArray()
  @IsNotEmpty()
  lines: InvoiceLineDto[];
  // ... etc
}

export class InvoiceLineDto {
  @IsString()
  @IsNotEmpty()
  description: string;

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
  accountId: string;

  @IsUUID()
  @IsNotEmpty()
  vatCodeId: string;
  // ... etc
}
```
**Acceptance:**
- [ ] CreateInvoiceDto with validation
- [ ] UpdateInvoiceDto with validation
- [ ] InvoiceLineDto with validation
- [ ] Nested arrays validated

#### [BACKEND-1.12] Create Payments Validation DTOs
**File:** `backend/src/payments/dto/*.ts`
**Effort:** 3 hours
**Description:** Create validation DTOs for payments
**Acceptance:**
- [ ] CreatePaymentDto with validation
- [ ] CreateReceiptDto with validation
- [ ] PaymentAllocationDto with validation

#### [BACKEND-1.13] Create Banking Validation DTOs
**File:** `backend/src/banking/dto/*.ts`
**Effort:** 2 hours
**Description:** Create validation DTOs for banking
**Acceptance:**
- [ ] CreateBankAccountDto with validation
- [ ] CreateBankTransactionDto with validation

#### [BACKEND-1.14] Create Expenses Validation DTOs
**File:** `backend/src/expenses/dto/*.ts`
**Effort:** 2 hours
**Description:** Create validation DTOs for expenses
**Acceptance:**
- [ ] CreateExpenseDto with validation
- [ ] UpdateExpenseDto with validation

#### [BACKEND-1.15] Create Assets Validation DTOs
**File:** `backend/src/assets/dto/*.ts`
**Effort:** 2 hours
**Description:** Create validation DTOs for assets
**Acceptance:**
- [ ] CreateAssetDto with validation
- [ ] UpdateAssetDto with validation

#### [BACKEND-1.16] Create VAT Validation DTOs
**File:** `backend/src/vat/dto/*.ts`
**Effort:** 2 hours
**Description:** Create validation DTOs for VAT
**Acceptance:**
- [ ] CreateVatCodeDto with validation
- [ ] UpdateVatCodeDto with validation

---

### Frontend Tasks

#### [FRONTEND-1.1] Fix Frontend Build Path Issue
**File:** Root directory
**Effort:** 1 hour
**Description:** Move frontend to ASCII-compliant path
**Steps:**
```bash
# Option 1: Move frontend directory
mv "C:\Users\khamis\Desktop\المحاسب\frontend" "C:\Users\khamis\Desktop\accounting-frontend"

# Option 2: Rename entire project
mv "C:\Users\khamis\Desktop\المحاسب" "C:\Users\khamis\Desktop\accounting-saas"
```
**Acceptance:**
- [ ] Frontend builds without errors
- [ ] `npm run build` succeeds
- [ ] Turbopack error resolved

#### [FRONTEND-1.2] Set Up Internationalization
**File:** `frontend/next.config.ts`, `frontend/app/[locale]/`
**Effort:** 4 hours
**Description:** Configure next-intl for bilingual support
**Acceptance:**
- [ ] next-intl installed and configured
- [ ] Locale routing enabled (`/en/*`, `/ar/*`)
- [ ] Language switcher component created
- [ ] English translation file created (`messages/en.json`)
- [ ] Arabic translation file created (`messages/ar.json`)
- [ ] RTL support configured for Arabic
- [ ] Default locale set to English

#### [FRONTEND-1.3] Create Sign-Up Page
**File:** `frontend/app/[locale]/signup/page.tsx`
**Effort:** 6 hours
**Description:** Create tenant signup flow
**Acceptance:**
- [ ] Form with fields: Company Name (EN), Company Name (AR), Email, Password, Confirm Password
- [ ] Real-time validation (password strength, email format)
- [ ] Loading state during submission
- [ ] Error display inline
- [ ] Success → redirect to dashboard
- [ ] API integration with `/api/tenants/create-with-admin`
- [ ] Bilingual labels and messages
- [ ] Responsive design

#### [FRONTEND-1.4] Create Sign-In Page
**File:** `frontend/app/[locale]/signin/page.tsx`
**Effort:** 4 hours
**Description:** Create sign-in page
**Acceptance:**
- [ ] Form with email and password
- [ ] "Remember me" checkbox
- [ ] "Forgot password" link
- [ ] Loading states
- [ ] Error display
- [ ] API integration with `/api/auth/sign-in`
- [ ] Bilingual labels
- [ ] Redirect to dashboard on success

#### [FRONTEND-1.5] Implement Auth Context
**File:** `frontend/contexts/auth-context.tsx`
**Effort:** 6 hours
**Description:** Create global auth state management
**Acceptance:**
- [ ] AuthProvider component created
- [ ] Stores user, tenant, accessToken
- [ ] Provides signIn() method
- [ ] Provides signOut() method
- [ ] Provides refreshTokens() method
- [ ] Auto-refreshes token before expiry
- [ ] Redirects to signin if not authenticated
- [ ] Persists session across page reloads

#### [FRONTEND-1.6] Create Protected Route Middleware
**File:** `frontend/middleware.ts`
**Effort:** 3 hours
**Description:** Protect routes that require authentication
**Acceptance:**
- [ ] Middleware checks for valid session
- [ ] Redirects to signin if not authenticated
- [ ] Stores tenant context for API calls
- [ ] Allows public routes (signin, signup)
- [ ] Works with locale routing

#### [FRONTEND-1.7] Create API Client Base
**File:** `frontend/lib/api/client.ts`
**Effort:** 4 hours
**Description:** Create base API client with auth
**Acceptance:**
- [ ] Base URL configured
- [ ] Automatically adds Authorization header
- [ ] Handles token refresh
- [ ] Handles 401 responses (redirect to signin)
- [ ] Handles network errors
- [ ] Provides typed fetch wrapper

#### [FRONTEND-1.8] Create Dashboard Layout
**File:** `frontend/app/[locale]/dashboard/layout.tsx`
**Effort:** 8 hours
**Description:** Create main application layout with sidebar and navigation
**Acceptance:**
- [ ] Sidebar with navigation menu
- [ ] Top bar with user menu, language switcher
- [ ] Responsive design (mobile menu)
- [ ] Bilingual menu items
- [ ] Active route highlighting
- [ ] Logout functionality
- [ ] Tenant name displayed
- [ ] RTL support for Arabic

#### [FRONTEND-1.9] Create Dashboard Home Page
**File:** `frontend/app/[locale]/dashboard/page.tsx`
**Effort:** 6 hours
**Description:** Create dashboard with summary cards and charts
**Acceptance:**
- [ ] Summary cards: Total Revenue, Total Expenses, Net Profit, Cash Balance
- [ ] Revenue vs Expense chart (Recharts)
- [ ] Recent invoices table
- [ ] Recent payments table
- [ ] Quick action buttons
- [ ] Loading states
- [ ] Empty states
- [ ] Bilingual labels

---

## Sprint 2: Chart of Accounts & Journals (Week 2)

### Backend Tasks

#### [BACKEND-2.1] Implement COA Service Methods
**File:** `backend/src/coa/coa.service.ts`
**Effort:** 8 hours
**Description:** Complete COA service implementation
**Acceptance:**
- [ ] `findAll(tenantId)` - Get all accounts
- [ ] `findOne(id, tenantId)` - Get account with children
- [ ] `create(dto, tenantId)` - Create account
  - Validates account number uniqueness
  - Validates parent exists
  - Validates account type matches parent
  - Prevents circular references
- [ ] `update(id, dto, tenantId)` - Update account
  - Prevents if has posted transactions
- [ ] `remove(id, tenantId)` - Delete account
  - Only if no children
  - Only if no transactions
- [ ] `getTree(tenantId)` - Get hierarchical tree
- [ ] `getByType(tenantId, type)` - Filter by type

#### [BACKEND-2.2] Add Journal Number Generation
**File:** `backend/src/journals/journals.service.ts`
**Effort:** 3 hours
**Description:** Auto-generate journal numbers
```typescript
async generateJournalNumber(tenantId: string): Promise<string> {
  // Format: JV-YYYY-MM-#####
  // Auto-increment per tenant per month
}
```
**Acceptance:**
- [ ] Format: `JV-{YYYY}-{MM}-{#####}`
- [ ] Auto-increments per tenant per month
- [ ] Gaps allowed (deleted journals)
- [ ] Thread-safe

#### [BACKEND-2.3] Implement Journal Create Method
**File:** `backend/src/journals/journals.service.ts`
**Effort:** 6 hours
**Description:** Create journal entry with validation
**Acceptance:**
- [ ] Validates fiscal period is open
- [ ] Validates at least 2 lines
- [ ] Validates debit = credit (exactly)
- [ ] Validates each account exists
- [ ] Validates no duplicate accounts (unless allowed)
- [ ] Generates journal number
- [ ] Sets status to 'draft'
- [ ] Creates journal header
- [ ] Creates journal lines
- [ ] Logs to audit trail

#### [BACKEND-2.4] Implement Journal Submit Method
**File:** `backend/src/journals/journals.service.ts`
**Effort:** 2 hours
**Description:** Submit journal for approval
**Acceptance:**
- [ ] Validates status is 'draft'
- [ ] Changes status to 'submitted'
- [ ] Adds submitted timestamp
- [ ] Adds submitted_by user

#### [BACKEND-2.5] Implement Journal Approve Method
**File:** `backend/src/journals/journals.service.ts`
**Effort:** 3 hours
**Description:** Approve journal entry
**Acceptance:**
- [ ] Validates status is 'submitted'
- [ ] Re-validates debit = credit
- [ ] Validates fiscal period still open
- [ ] Changes status to 'approved'
- [ ] Adds approved timestamp
- [ ] Adds approved_by user

#### [BACKEND-2.6] Implement Journal Post Method - CRITICAL
**File:** `backend/src/journals/journals.service.ts`
**Effort:** 8 hours
**Description:** Post journal to General Ledger
**Acceptance:**
- [ ] Validates status is 'approved'
- [ ] Starts database transaction
- [ ] For each line:
  - [ ] Creates GL entry
  - [ ] Updates account running balance
- [ ] Updates journal status to 'posted'
- [ ] Commits transaction
- [ ] Rolls back on error
- [ ] Logs to audit trail

#### [BACKEND-2.7] Create General Ledger Table
**File:** `database/11_general_ledger.sql` (new)
**Effort:** 2 hours
**Description:** Create GL table for posted journal entries
```sql
CREATE TABLE general_ledger (
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
  UNIQUE(journal_line_id)
);

CREATE INDEX idx_gl_tenant_account ON general_ledger(tenant_id, account_id);
CREATE INDEX idx_gl_date ON general_ledger(transaction_date);
```
**Acceptance:**
- [ ] Table created
- [ ] Indexes created
- [ ] RLS policies applied
- [ ] Triggers for audit logging

#### [BACKEND-2.8] Create Fiscal Period Validation
**File:** `backend/src/journals/journals.service.ts`
**Effort:** 3 hours
**Description:** Validate fiscal period is open before posting
**Acceptance:**
- [ ] Checks `fiscal_periods.is_open = true`
- [ ] Checks date is within period range
- [ ] Throws error if period closed
- [ ] Applied to create, submit, approve, post

---

### Frontend Tasks

#### [FRONTEND-2.1] Create COA List Page
**File:** `frontend/app/[locale]/accounting/coa/page.tsx`
**Effort:** 8 hours
**Description:** Chart of Accounts list with tree view
**Acceptance:**
- [ ] Server component, fetches data on server
- [ ] Tree view (expandable/collapsible)
- [ ] Columns: Account #, Name, Type, Balance
- [ ] Filter by account type (tabs)
- [ ] Search by name or number
- [ ] "Create Account" button
- [ ] Loading state
- [ ] Empty state
- [ ] Bilingual

#### [FRONTEND-2.2] Create Account Form Dialog
**File:** `frontend/components/coa/account-form-dialog.tsx`
**Effort:** 6 hours
**Description:** Form for creating/editing accounts
**Acceptance:**
- [ ] Client component with react-hook-form
- [ ] Fields: Parent Account (dropdown), Account Number, Name (EN/AR), Type, Class, Description
- [ ] Real-time validation
- [ ] Auto-generate account number option
- [ ] Loading states
- [ ] Success/error toasts
- [ ] Bilingual

#### [FRONTEND-2.3] Create Journals List Page
**File:** `frontend/app/[locale]/accounting/journals/page.tsx`
**Effort:** 8 hours
**Description:** Journal entries list with filters
**Acceptance:**
- [ ] Server component
- [ ] Table: Journal #, Date, Reference, Description, Debit, Credit, Status, Actions
- [ ] Filter by status (Draft, Submitted, Approved, Posted)
- [ ] Filter by fiscal period
- [ ] Filter by date range
- [ ] Search by description
- [ ] "Create Journal" button
- [ ] Export to CSV
- [ ] Loading/empty states
- [ ] Bilingual

#### [FRONTEND-2.4] Create Journal Form Dialog
**File:** `frontend/components/journals/journal-form-dialog.tsx`
**Effort:** 10 hours
**Description:** Form for creating/editing journal entries
**Acceptance:**
- [ ] Client component
- [ ] Fields: Date, Reference, Description (EN/AR), Fiscal Period
- [ ] Dynamic lines table:
  - [ ] Add/remove line buttons
  - [ ] Account dropdown (searchable)
  - [ ] Debit/Credit inputs (mutually exclusive)
  - [ ] Running totals (debit sum, credit sum, difference)
- [ ] Validation: Must balance before submit
- [ ] Loading states
- [ ] Success/error toasts
- [ ] Bilingual

#### [FRONTEND-2.5] Create Journal Detail Page
**File:** `frontend/app/[locale]/accounting/journals/[id]/page.tsx`
**Effort:** 6 hours
**Description:** View journal entry details
**Acceptance:**
- [ ] Show journal header
- [ ] Show journal lines (table)
- [ ] Show total debit/credit (must match)
- [ ] Show audit trail
- [ ] Action buttons based on status:
  - Draft: Edit, Delete, Submit
  - Submitted: Approve, Reject
  - Approved: Post
  - Posted: View only
- [ ] Bilingual

#### [FRONTEND-2.6] Create Fiscal Periods Page
**File:** `frontend/app/[locale]/settings/fiscal-periods/page.tsx`
**Effort:** 6 hours
**Description:** Manage fiscal years and periods
**Acceptance:**
- [ ] List of fiscal years
- [ ] Create fiscal year form
- [ ] Open/close period buttons
- [ ] Warning when closing period
- [ ] Bilingual

---

## Sprint 3: Business Operations - Part 1 (Week 3)

### Backend Tasks

#### [BACKEND-3.1] Implement Customers Service
**File:** `backend/src/customers/customers.service.ts`
**Effort:** 6 hours
**Description:** Complete customers CRUD with balance tracking
**Acceptance:**
- [ ] CRUD operations
- [ ] Calculate current balance (invoices - payments)
- [ ] Update balance on invoice/payment
- [ ] Validate credit limit before invoice
- [ ] Search by name, email, phone

#### [BACKEND-3.2] Implement Vendors Service
**File:** `backend/src/vendors/vendors.service.ts`
**Effort:** 4 hours
**Description:** Complete vendors CRUD with balance tracking
**Acceptance:**
- [ ] CRUD operations
- [ ] Calculate current balance (POs - payments)
- [ ] Update balance on transactions
- [ ] Search by name, email, phone

#### [BACKEND-3.3] Add Invoice Number Generation
**File:** `backend/src/invoices/invoices.service.ts`
**Effort:** 2 hours
**Description:** Auto-generate invoice numbers
**Acceptance:**
- [ ] Format: `INV-{YYYY}-{MM}-{#####}`
- [ ] Auto-increments per tenant per month
- [ ] Gaps allowed

#### [BACKEND-3.4] Implement Invoice Calculation Logic
**File:** `backend/src/invoices/invoices.service.ts`
**Effort:** 6 hours
**Description:** Calculate invoice totals with VAT
**Acceptance:**
- [ ] Calculate line totals: quantity × price × (1 - discount/100)
- [ ] Calculate line VAT: line total × vatRate
- [ ] Calculate subtotal: sum(line totals)
- [ ] Calculate total VAT: sum(line VAT)
- [ ] Calculate grand total: subtotal + total VAT
- [ ] Support Qatar VAT rates: 5%, 0%, exempt, out-of-scope

#### [BACKEND-3.5] Implement Sales Invoice Creation
**File:** `backend/src/invoices/invoices.service.ts`
**Effort:** 8 hours
**Description:** Create sales invoice with automatic journal entry
**Acceptance:**
- [ ] Validates customer exists
- [ ] Generates invoice number
- [ ] Calculates totals
- [ ] Creates invoice header
- [ ] Creates invoice lines
- [ ] Creates journal entry:
  - [ ] Debit: Accounts Receivable (grand total)
  - [ ] Credit: Revenue accounts (subtotal)
  - [ ] Credit: VAT Payable (total VAT)
- [ ] Sets journal status to 'approved'
- [ ] Posts journal to GL
- [ ] Updates customer balance
- [ ] Returns invoice with journal reference

#### [BACKEND-3.6] Create VAT Transaction Tracking
**File:** `database/12_vat_transactions.sql` (new)
**Effort:** 2 hours
**Description:** Track VAT for reporting
```sql
CREATE TABLE vat_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  transaction_type VARCHAR(20) NOT NULL, -- 'sales' or 'purchase'
  transaction_id UUID NOT NULL,
  transaction_date DATE NOT NULL,
  vat_code_id UUID NOT NULL REFERENCES vat_codes(id),
  vat_rate DECIMAL(5,2) NOT NULL,
  vat_amount DECIMAL(15,2) NOT NULL,
  net_amount DECIMAL(15,2) NOT NULL,
  gross_amount DECIMAL(15,2) NOT NULL
);
```
**Acceptance:**
- [ ] Table created
- [ ] Trigger updates on invoice create
- [ ] VAT transactions tracked

---

### Frontend Tasks

#### [FRONTEND-3.1] Create Customers List Page
**File:** `frontend/app/[locale]/sales/customers/page.tsx`
**Effort:** 6 hours
**Description:** Customers list with actions
**Acceptance:**
- [ ] Table: Name, Email, Phone, Balance, Status, Actions
- [ ] Search by name or email
- [ ] Filter by status
- [ ] "Create Customer" button
- [ ] Loading/empty states
- [ ] Bilingual

#### [FRONTEND-3.2] Create Customer Form Dialog
**File:** `frontend/components/customers/customer-form-dialog.tsx`
**Effort:** 4 hours
**Description:** Form for creating/editing customers
**Acceptance:**
- [ ] Fields: Name (EN/AR), Email, Phone, Address, Tax Registration, Credit Limit, Payment Terms
- [ ] Real-time validation
- [ ] Loading states
- [ ] Success/error toasts
- [ ] Bilingual

#### [FRONTEND-3.3] Create Vendors List Page
**File:** `frontend/app/[locale]/purchases/vendors/page.tsx`
**Effort:** 4 hours
**Description:** Vendors list (similar to customers)
**Acceptance:**
- [ ] Table: Name, Email, Phone, Balance, Status, Actions
- [ ] Search and filters
- [ ] "Create Vendor" button
- [ ] Bilingual

#### [FRONTEND-3.4] Create Vendor Form Dialog
**File:** `frontend/components/vendors/vendor-form-dialog.tsx`
**Effort:** 3 hours
**Description:** Form for creating/editing vendors
**Acceptance:**
- [ ] Similar to customer form
- [ ] Bilingual

#### [FRONTEND-3.5] Create Invoices List Page
**File:** `frontend/app/[locale]/sales/invoices/page.tsx`
**Effort:** 8 hours
**Description:** Sales invoices list
**Acceptance:**
- [ ] Table: Invoice #, Date, Customer, Subtotal, VAT, Total, Status, Balance Due
- [ ] Filter by status (Draft, Posted, Paid, Overdue)
- [ ] Filter by customer
- [ ] Filter by date range
- [ ] Search by invoice number or customer
- [ ] Export to CSV/PDF
- [ ] "Create Invoice" button
- [ ] Loading/empty states
- [ ] Bilingual

#### [FRONTEND-3.6] Create Invoice Form Dialog
**File:** `frontend/components/invoices/invoice-form-dialog.tsx`
**Effort:** 12 hours
**Description:** Form for creating/editing invoices
**Acceptance:**
- [ ] Customer dropdown (searchable)
- [ ] Invoice date, due date
- [ ] Dynamic lines table:
  - [ ] Description, Quantity, Unit Price, VAT Code, Discount
  - [ ] Auto-calculate line totals
  - [ ] Add/remove lines
- [ ] Show running totals (subtotal, VAT, total)
- [ ] Save as draft / Post buttons
- [ ] Validation before posting
- [ ] Loading states
- [ ] Success/error toasts
- [ ] Bilingual

#### [FRONTEND-3.7] Create Invoice Detail Page
**File:** `frontend/app/[locale]/sales/invoices/[id]/page.tsx`
**Effort:** 6 hours
**Description:** View invoice details
**Acceptance:**
- [ ] Show invoice header
- [ ] Show invoice lines
- [ ] Show totals (subtotal, VAT, total)
- [ ] Show payment status
- [ ] Show linked journal entry
- [ ] Show payments applied
- [ ] Actions: Edit (if draft), Record Payment, Print, Send Email
- [ ] Bilingual

#### [FRONTEND-3.8] Implement Invoice PDF Generation
**File:** `backend/src/invoices/invoices.service.ts` (server-side)
**Effort:** 8 hours
**Description:** Generate PDF for invoices
**Acceptance:**
- [ ] Bilingual (English/Arabic)
- [ ] Company logo, address, tax registration
- [ ] Customer details
- [ ] Line items
- [ ] VAT summary
- [ ] Total in words (bilingual)
- [ ] QR code placeholder
- [ ] Returns PDF buffer
- [ ] Frontend displays/downloads PDF

---

## Sprint 4: Business Operations - Part 2 (Week 4)

### Backend Tasks

#### [BACKEND-4.1] Add Receipt Number Generation
**File:** `backend/src/payments/payments.service.ts`
**Effort:** 2 hours
**Description:** Auto-generate receipt numbers
**Acceptance:**
- [ ] Format: `RCT-{YYYY}-{MM}-{#####}`
- [ ] Auto-increments per tenant per month

#### [BACKEND-4.2] Implement Receipt Creation
**File:** `backend/src/payments/payments.service.ts`
**Effort:** 8 hours
**Description:** Record customer receipt with allocation
**Acceptance:**
- [ ] Validates customer exists
- [ ] Generates receipt number
- [ ] Validates allocations:
  - [ ] Sum equals payment amount
  - [ ] Invoice exists
  - [ ] Allocated amount ≤ balance due
- [ ] Creates payment record
- [ ] Creates allocations
- [ ] Updates invoice balances
- [ ] Creates journal entry:
  - [ ] Debit: Bank Account
  - [ ] Credit: Accounts Receivable
- [ ] Posts journal to GL
- [ ] Updates customer balance

#### [BACKEND-4.3] Implement Payment Creation
**File:** `backend/src/payments/payments.service.ts`
**Effort:** 6 hours
**Description:** Record vendor payment with allocation
**Acceptance:**
- [ ] Similar to receipt, but for vendors
- [ ] Journal entry:
  - [ ] Debit: Accounts Payable
  - [ ] Credit: Bank Account

#### [BACKEND-4.4] Implement Payment Reversal
**File:** `backend/src/payments/payments.service.ts`
**Effort:** 4 hours
**Description:** Reverse payment/receipt
**Acceptance:**
- [ ] Creates reversal entry
- [ ] Reverses allocations
- [ ] Reverses journal entry
- [ ] Restores invoice/customer balances

---

### Frontend Tasks

#### [FRONTEND-4.1] Create Receipts List Page
**File:** `frontend/app/[locale]/sales/receipts/page.tsx`
**Effort:** 4 hours
**Description:** Customer receipts list
**Acceptance:**
- [ ] Table: Receipt #, Date, Customer, Amount, Allocated, Reference
- [ ] Filters and search
- [ ] "Record Receipt" button
- [ ] Bilingual

#### [FRONTEND-4.2] Create Payments List Page
**File:** `frontend/app/[locale]/purchases/payments/page.tsx`
**Effort:** 4 hours
**Description:** Vendor payments list
**Acceptance:**
- [ ] Similar to receipts
- [ ] Bilingual

#### [FRONTEND-4.3] Create Receipt Form Dialog
**File:** `frontend/components/payments/receipt-form-dialog.tsx`
**Effort:** 8 hours
**Description:** Form for recording customer receipts
**Acceptance:**
- [ ] Customer dropdown
- [ ] Payment date, amount
- [ ] Bank account dropdown
- [ ] Allocation interface:
  - [ ] Show unpaid invoices
  - [ ] Allocate amount to each invoice
  - [ ] Auto-allocate (oldest first)
  - [ ] Show remaining balance
- [ ] Validation: Total allocation = payment amount
- [ ] Loading states
- [ ] Success/error toasts
- [ ] Bilingual

#### [FRONTEND-4.4] Create Payment Form Dialog
**File:** `frontend/components/payments/payment-form-dialog.tsx`
**Effort:** 6 hours
**Description:** Form for recording vendor payments
**Acceptance:**
- [ ] Similar to receipt form
- [ ] Vendor dropdown instead of customer
- [ ] Bilingual

---

## Sprint 5: Financial Reporting (Week 5)

### Backend Tasks

#### [BACKEND-5.1] Implement Trial Balance Report
**File:** `backend/src/reports/reports.service.ts`
**Effort:** 6 hours
**Description:** Generate trial balance
**Acceptance:**
- [ ] Query all GL entries within date range
- [ ] Group by account
- [ ] Calculate opening balance
- [ ] Calculate period debits/credits
- [ ] Calculate closing balance
- [ ] Filter accounts with non-zero balances
- [ ] Validate total debits = total credits
- [ ] Group by account type
- [ ] Return hierarchical structure

#### [BACKEND-5.2] Implement Balance Sheet Report
**File:** `backend/src/reports/reports.service.ts`
**Effort:** 8 hours
**Description:** Generate balance sheet
**Acceptance:**
- [ ] Get all asset, liability, equity accounts
- [ ] Calculate balances as of date
- [ ] Group by account type
- [ ] Calculate totals:
  - [ ] Total Assets
  - [ ] Total Liabilities
  - [ ] Total Equity
- [ ] Validate: Assets = Liabilities + Equity
- [ ] Return hierarchical structure

#### [BACKEND-5.3] Implement Income Statement Report
**File:** `backend/src/reports/reports.service.ts`
**Effort:** 8 hours
**Description:** Generate income statement
**Acceptance:**
- [ ] Get all revenue, expense accounts
- [ ] Calculate totals for period
- [ ] Calculate:
  - [ ] Gross Profit = Revenue - COGS
  - [ ] Operating Profit = Gross Profit - Operating Expenses
  - [ ] Net Profit = Operating Profit - Non-operating items
- [ ] Return hierarchical structure

#### [BACKEND-5.4] Implement Aged Receivables Report
**File:** `backend/src/reports/reports.service.ts`
**Effort:** 4 hours
**Description:** Generate aged receivables
**Acceptance:**
- [ ] Get all unpaid invoices
- [ ] Calculate days overdue
- [ ] Group by aging buckets: Current, 1-30, 31-60, 61-90, 90+
- [ ] Group by customer
- [ ] Calculate totals

#### [BACKEND-5.5] Implement Aged Payables Report
**File:** `backend/src/reports/reports.service.ts`
**Effort:** 4 hours
**Description:** Generate aged payables
**Acceptance:**
- [ ] Similar to aged receivables
- [ ] For vendors instead of customers

#### [BACKEND-5.6] Implement VAT Return Report
**File:** `backend/src/vat/vat.service.ts`
**Effort:** 6 hours
**Description:** Generate VAT return for Qatar Tax Authority
**Acceptance:**
- [ ] Summarize VAT transactions for period
- [ ] Calculate output VAT (sales)
- [ ] Calculate input VAT (purchases)
- [ ] Calculate net VAT payable/refundable
- [ ] Match Qatar Tax Authority format
- [ ] Return Excel-compatible data

---

### Frontend Tasks

#### [FRONTEND-5.1] Create Trial Balance Page
**File:** `frontend/app/[locale]/reports/trial-balance/page.tsx`
**Effort:** 6 hours
**Description:** Trial balance report
**Acceptance:**
- [ ] Filters: As of Date
- [ ] Table: Account #, Account Name, Debit, Credit
- [ ] Show totals at bottom
- [ ] Validate debits = credits
- [ ] Export to PDF/CSV
- [ ] Print view
- [ ] Loading states
- [ ] Bilingual

#### [FRONTEND-5.2] Create Balance Sheet Page
**File:** `frontend/app/[locale]/reports/balance-sheet/page.tsx`
**Effort:** 8 hours
**Description:** Balance sheet report
**Acceptance:**
- [ ] Filters: As of Date
- [ ] Show Assets, Liabilities, Equity sections
- [ ] Show totals
- [ ] Validate: Assets = Liabilities + Equity
- [ ] Export to PDF
- [ ] Print view
- [ ] Bilingual

#### [FRONTEND-5.3] Create Income Statement Page
**File:** `frontend/app/[locale]/reports/income-statement/page.tsx`
**Effort:** 8 hours
**Description:** Income statement report
**Acceptance:**
- [ ] Filters: Period From, Period To
- [ ] Show Revenue, Expenses sections
- [ ] Show Gross Profit, Operating Profit, Net Profit
- [ ] Charts: Revenue vs Expense trend
- [ ] Export to PDF
- [ ] Print view
- [ ] Bilingual

#### [FRONTEND-5.4] Create Aged Receivables Page
**File:** `frontend/app/[locale]/reports/aged-receivables/page.tsx`
**Effort:** 4 hours
**Description:** Aged receivables report
**Acceptance:**
- [ ] Filters: As of Date
- [ ] Aging matrix: Current, 1-30, 31-60, 61-90, 90+
- [ ] Group by customer
- [ ] Show totals
- [ ] Export to CSV
- [ ] Bilingual

#### [FRONTEND-5.5] Create Aged Payables Page
**File:** `frontend/app/[locale]/reports/aged-payables/page.tsx`
**Effort:** 4 hours
**Description:** Aged payables report
**Acceptance:**
- [ ] Similar to aged receivables
- [ ] For vendors
- [ ] Bilingual

#### [FRONTEND-5.6] Create VAT Return Page
**File:** `frontend/app/[locale]/tax/vat-return/page.tsx`
**Effort:** 6 hours
**Description:** VAT return for Qatar Tax Authority
**Acceptance:**
- [ ] Filters: Period From, Period To
- [ ] Show output VAT, input VAT, net VAT
- [ ] Match official format
- [ ] Export to Excel
- [ ] Bilingual

---

## Sprint 6: Production Readiness (Week 6-7)

### Backend Tasks

#### [BACKEND-6.1] Implement Rate Limiting
**File:** `backend/src/common/middleware/rate-limit.middleware.ts`
**Effort:** 4 hours
**Description:** Add rate limiting to API
**Acceptance:**
- [ ] Auth endpoints: 5 req/min
- [ ] API endpoints: 100 req/min
- [ ] Public endpoints: 10 req/min
- [ ] Uses Redis for storage
- [ ] Returns 429 when limit exceeded

#### [BACKEND-6.2] Add Security Headers
**File:** `backend/src/main.ts`
**Effort:** 2 hours
**Description:** Configure Helmet for security headers
**Acceptance:**
- [ ] Helmet middleware added
- [ ] CSP configured
- [ ] HSTS enabled
- [ ] X-Frame-Options set
- [ ] X-Content-Type-Options set

#### [BACKEND-6.3] Add Database Indexes
**File:** `database/13_performance_indexes.sql` (new)
**Effort:** 3 hours
**Description:** Add indexes for performance
**Acceptance:**
- [ ] Index on (tenant_id, account_number) for COA
- [ ] Index on (tenant_id, fiscal_period_id, status) for journals
- [ ] Index on (tenant_id, customer_id, invoice_date) for invoices
- [ ] Index on (tenant_id, account_id, transaction_date) for GL
- [ ] Composite indexes for common filters

#### [BACKEND-6.4] Implement Redis Caching
**File:** `backend/src/common/cache/cache.service.ts`
**Effort:** 6 hours
**Description:** Add caching layer
**Acceptance:**
- [ ] Cache COA (5 min TTL)
- [ ] Cache user permissions (10 min TTL)
- [ ] Cache report results (5 min TTL)
- [ ] Invalidate cache on updates
- [ ] Cache statistics endpoint

#### [BACKEND-6.5] Add Pagination to All List Endpoints
**File:** All controllers
**Effort:** 4 hours
**Description:** Add pagination support
**Acceptance:**
- [ ] Query params: page, limit
- [ ] Default: page=1, limit=50
- [ ] Max limit: 100
- [ ] Return total count
- [ ] Return pagination metadata

#### [BACKEND-6.6] Add Global Error Filter
**File:** `backend/src/common/filters/all-exceptions.filter.ts`
**Effort:** 3 hours
**Description:** Centralized error handling
**Acceptance:**
- [ ] Catches all errors
- [ ] Logs errors with context
- [ ] Returns user-friendly messages
- [ ] Includes request ID
- [ ] No stack traces in production

#### [BACKEND-6.7] Add Health Check Endpoint
**File:** `backend/src/health/health.controller.ts`
**Effort:** 2 hours
**Description:** Health monitoring
**Acceptance:**
- [ ] GET /api/health returns status
- [ ] Checks database connection
- [ ] Checks Redis connection
- [ ] Returns uptime
- [ ] Returns version

#### [BACKEND-6.8] Add Request ID Middleware
**File:** `backend/src/common/middleware/request-id.middleware.ts`
**Effort:** 2 hours
**Description:** Track requests
**Acceptance:**
- [ ] Generates unique request ID
- [ ] Adds to response headers
- [ ] Logs request ID
- [ ] Passes to services

#### [BACKEND-6.9] Add Unit Tests for Critical Services
**File:** `backend/src/**/*.spec.ts`
**Effort:** 16 hours (spread across sprint)
**Description:** Test business logic
**Acceptance:**
- [ ] Test COA service (account hierarchy validation)
- [ ] Test Journals service (debit = credit validation)
- [ ] Test Invoices service (VAT calculation)
- [ ] Test Payments service (allocation logic)
- [ ] Test Reports service (trial balance validation)
- [ ] Coverage > 70%

#### [BACKEND-6.10] Add Integration Tests for API
**File:** `backend/test/*.e2e-spec.ts`
**Effort:** 12 hours (spread across sprint)
**Description:** Test API endpoints
**Acceptance:**
- [ ] Test auth flow (sign up, sign in, token refresh)
- [ ] Test CRUD operations for all modules
- [ ] Test tenant isolation (RLS)
- [ ] Test journal posting to GL
- [ ] Test invoice creation with journal
- [ ] Test report generation

---

### Frontend Tasks

#### [FRONTEND-6.1] Add Error Boundaries
**File:** `frontend/app/error.tsx`, `frontend/components/error-boundary.tsx`
**Effort:** 3 hours
**Description:** Handle React errors gracefully
**Acceptance:**
- [ ] Global error boundary
- [ ] Shows friendly error page
- [ ] Logs errors to backend
- [ ] Provides retry option

#### [FRONTEND-6.2] Add Loading Skeletons
**File:** All list pages
**Effort:** 4 hours
**Description:** Improve perceived performance
**Acceptance:**
- [ ] Table skeletons
- [ ] Card skeletons
- [ ] Form field skeletons
- [ ] Shimmer animation

#### [FRONTEND-6.3] Add Toast Notifications
**File:** `frontend/components/toaster.tsx`
**Effort:** 2 hours
**Description:** Show success/error messages
**Acceptance:**
- [ ] Use Sonner (already installed)
- [ ] Success messages (green)
- [ ] Error messages (red)
- [ ] Warning messages (yellow)
- [ ] Info messages (blue)
- [ ] Auto-dismiss after 5 seconds

#### [FRONTEND-6.4] Optimize Bundle Size
**File:** `frontend/next.config.ts`
**Effort:** 4 hours
**Description:** Reduce JavaScript bundle
**Acceptance:**
- [ ] Analyze bundle size
- [ ] Remove unused dependencies
- [ ] Dynamic import heavy components
- [ ] Use Server Components by default
- [ ] Lazy load routes

#### [FRONTEND-6.5] Add Component Tests
**File:** `frontend/components/**/*.spec.tsx`
**Effort:** 8 hours (spread across sprint)
**Description:** Test critical components
**Acceptance:**
- [ ] Test form validation
- [ ] Test error states
- [ ] Test loading states
- [ ] Test user interactions

#### [FRONTEND-6.6] Add E2E Tests
**File:** `frontend/e2e/*.spec.ts`
**Effort:** 12 hours (spread across sprint)
**Description:** Test user flows
**Acceptance:**
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test create invoice flow
- [ ] Test create journal flow
- [ ] Test generate report flow

#### [FRONTEND-6.7] Create Company Settings Page
**File:** `frontend/app/[locale]/settings/company/page.tsx`
**Effort:** 6 hours
**Description:** Manage company details
**Acceptance:**
- [ ] Company name, logo
- [ ] Address, phone, email
- [ ] Tax registration number
- [ ] Default currency, VAT rate
- [ ] Logo upload
- [ ] Bilingual

#### [FRONTEND-6.8] Create Users Management Page
**File:** `frontend/app/[locale]/settings/users/page.tsx`
**Effort:** 8 hours
**Description:** Manage users and roles
**Acceptance:**
- [ ] List of users
- [ ] Invite user form
- [ ] Assign roles
- [ ] Deactivate user
- [ ] List of roles
- [ ] Role permissions editor
- [ ] Bilingual

#### [FRONTEND-6.9] Create Bank Accounts Page
**File:** `frontend/app/[locale]/banking/accounts/page.tsx`
**Effort:** 4 hours
**Description:** Manage bank accounts
**Acceptance:**
- [ ] List of bank accounts
- [ ] Create account form
- [ ] Show running balance
- [ ] Bilingual

#### [FRONTEND-6.10] Create Bank Transactions Page
**File:** `frontend/app/[locale]/banking/transactions/page.tsx`
**Effort:** 4 hours
**Description:** Record bank transactions
**Acceptance:**
- [ ] List of transactions
- [ ] Create transaction form
- [ ] Import CSV statement
- [ ] Bilingual

---

## Deployment Tasks

#### [DEPLOY-1] Configure Production Environment
**File:** `.env.production`
**Effort:** 2 hours
**Description:** Set up production environment variables
**Acceptance:**
- [ ] Generate strong JWT_SECRET
- [ ] Configure Supabase production project
- [ ] Configure Redis instance
- [ ] Set CORS origins
- [ ] Set production NODE_ENV

#### [DEPLOY-2] Set Up Production Database
**File:** Supabase project
**Effort:** 3 hours
**Description:** Create and configure production database
**Acceptance:**
- [ ] Create Supabase project
- [ ] Run all migrations in order
- [ ] Verify RLS policies are active
- [ ] Set up database backups
- [ ] Configure connection pooling

#### [DEPLOY-3] Deploy Backend to Production
**File:** Railway/Render/AWS
**Effort:** 4 hours
**Description:** Deploy NestJS backend
**Acceptance:**
- [ ] Choose hosting platform
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy successfully
- [ ] Configure custom domain
- [ ] Configure SSL certificate
- [ ] Test health endpoint

#### [DEPLOY-4] Deploy Frontend to Production
**File:** Vercel/Netlify
**Effort:** 3 hours
**Description:** Deploy Next.js frontend
**Acceptance:**
- [ ] Choose hosting platform (Vercel recommended)
- [ ] Connect GitHub repository
- [ ] Configure build settings
- [ ] Set environment variables
- [ ] Deploy successfully
- [ ] Configure custom domain
- [ ] Configure SSL certificate
- [ ] Test page load

#### [DEPLOY-5] Configure Domain and DNS
**File:** Domain registrar
**Effort:** 2 hours
**Description:** Set up custom domains
**Acceptance:**
- [ ] Purchase domain (e.g., al-muhasib.com)
- [ ] Configure DNS A records:
  - [ ] app.al-muhasib.com → Frontend
  - [ ] api.al-muhasib.com → Backend
- [ ] Verify DNS propagation
- [ ] Verify SSL certificates

#### [DEPLOY-6] Post-Deployment Testing
**File:** Manual testing
**Effort:** 4 hours
**Description:** Verify production deployment
**Acceptance:**
- [ ] Test health endpoint
- [ ] Test sign up flow
- [ ] Test sign in flow
- [ ] Test create invoice
- [ ] Test generate report
- [ ] Test file upload (logo)
- [ ] Test PDF generation
- [ ] Load test (100 concurrent users)
- [ ] Test RLS policies (tenant isolation)
- [ ] Verify error monitoring

#### [DEPLOY-7] Set Up Monitoring
**File:** External service (optional)
**Effort:** 4 hours
**Description:** Configure application monitoring
**Acceptance:**
- [ ] Set up error tracking (Sentry)
- [ ] Set up uptime monitoring (UptimeRobot)
- [ ] Set up analytics (Plausible/PostHog)
- [ ] Configure alerts
- [ ] Test notifications

#### [DEPLOY-8] Create Deployment Documentation
**File:** `DEPLOYMENT.md`
**Effort:** 3 hours
**Description:** Document deployment process
**Acceptance:**
- [ ] Document environment setup
- [ ] Document database migration steps
- [ ] Document backend deployment
- [ ] Document frontend deployment
- [ ] Document rollback procedure
- [ ] Document troubleshooting steps

---

## Task Summary

### Total Task Count
- **Backend Tasks:** 68
- **Frontend Tasks:** 52
- **Deployment Tasks:** 8
- **Total:** 128 tasks

### Effort Estimation
- **Sprint 1 (Week 1):** ~120 hours (Backend: 48h, Frontend: 42h, Setup: 30h)
- **Sprint 2 (Week 2):** ~88 hours (Backend: 32h, Frontend: 56h)
- **Sprint 3 (Week 3):** ~96 hours (Backend: 32h, Frontend: 64h)
- **Sprint 4 (Week 4):** ~56 hours (Backend: 20h, Frontend: 36h)
- **Sprint 5 (Week 5):** ~72 hours (Backend: 36h, Frontend: 36h)
- **Sprint 6 (Week 6-7):** ~128 hours (Backend: 64h, Frontend: 48h, Deploy: 16h)

**Total Estimated Effort:** ~560 hours

### Team Capacity
- **1 Developer:** 14 weeks (560 ÷ 40)
- **2 Developers:** 7 weeks (560 ÷ 80)
- **3 Developers:** 4.5 weeks (560 ÷ 120)

**With 2-3 Developers:** 6-7 weeks (aligns with timeline)

---

## Progress Tracking

Use this format to track task completion:

```markdown
### Sprint Progress

#### Sprint 1: Foundation (Week 1)
- [BACKEND-1.1] ✅ Completed by @developer on 2026-01-15
- [BACKEND-1.2] ⏳ In Progress by @developer
- [BACKEND-1.3] ❌ Not Started
...
**Progress:** 5/48 backend tasks, 3/42 frontend tasks
```

---

## Notes

1. **Task Interdependencies:** Many tasks have dependencies. Check acceptance criteria before starting.
2. **Parallel Work:** Backend and frontend tasks can often be done in parallel.
3. **Testing:** Testing tasks are spread across all sprints.
4. **Documentation:** Documentation tasks can be deferred if needed.
5. **Flexibility:** This plan is a guide. Adjust based on actual progress.
6. **Daily Standups:** Track progress and blockers daily.
7. **Sprint Retrospectives:** Review and adjust after each sprint.

---

**Last Updated:** 2026-01-15
**Project:** المحاسب (Al-Muhasib) - Enterprise Accounting SaaS
**Target Launch:** 2026-02-26 (6 weeks from start)
