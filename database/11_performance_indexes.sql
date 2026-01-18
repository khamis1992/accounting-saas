-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Performance Indexes Migration
-- ============================================
-- This migration adds missing indexes to improve query performance
-- ============================================

-- ============================================
-- Foreign Key Indexes (Issue #29)
-- ============================================

-- Users foreign keys
CREATE INDEX IF NOT EXISTS idx_users_default_branch_id
ON public.users(default_branch_id);

-- Chart of Accounts foreign keys
CREATE INDEX IF NOT EXISTS idx_coa_parent_id
ON public.chart_of_accounts(parent_id);

CREATE INDEX IF NOT EXISTS idx_coa_created_by
ON public.chart_of_accounts(created_by);

-- Cost Centers foreign keys
CREATE INDEX IF NOT EXISTS idx_cost_centers_parent_id
ON public.cost_centers(parent_id);

CREATE INDEX IF NOT EXISTS idx_cost_centers_branch_id
ON public.cost_centers(branch_id);

CREATE INDEX IF NOT EXISTS idx_cost_centers_manager_id
ON public.cost_centers(manager_id);

-- Fiscal Periods foreign keys
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_fiscal_year_id
ON public.fiscal_periods(fiscal_year_id);

-- Journals foreign keys
CREATE INDEX IF NOT EXISTS idx_journals_created_by
ON public.journals(created_by);

CREATE INDEX IF NOT EXISTS idx_journals_period_id
ON public.journals(fiscal_period_id);

-- Journal Lines foreign keys
CREATE INDEX IF NOT EXISTS idx_journal_lines_journal_id
ON public.journal_lines(journal_id);

CREATE INDEX IF NOT EXISTS idx_journal_lines_account_id
ON public.journal_lines(account_id);

-- Invoices foreign keys
CREATE INDEX IF NOT EXISTS idx_invoices_party_id
ON public.invoices(party_id);

CREATE INDEX IF NOT EXISTS idx_invoices_period_id
ON public.invoices(fiscal_period_id);

CREATE INDEX IF NOT EXISTS idx_invoices_created_by
ON public.invoices(created_by);

-- Invoice Lines foreign keys
CREATE INDEX IF NOT EXISTS idx_invoice_lines_invoice_id
ON public.invoice_lines(invoice_id);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_account_id
ON public.invoice_lines(account_id);

CREATE INDEX IF NOT EXISTS idx_invoice_lines_vat_code_id
ON public.invoice_lines(vat_code_id);

-- Payments foreign keys
CREATE INDEX IF NOT EXISTS idx_payments_party_id
ON public.payments(party_id);

CREATE INDEX IF NOT EXISTS idx_payments_period_id
ON public.payments(fiscal_period_id);

CREATE INDEX IF NOT EXISTS idx_payments_created_by
ON public.payments(created_by);

-- Payment Allocations foreign keys
CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment_id
ON public.payment_allocations(payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_invoice_id
ON public.payment_allocations(invoice_id);

-- Expenses foreign keys
CREATE INDEX IF NOT EXISTS idx_expenses_employee_id
ON public.expenses(employee_id);

CREATE INDEX IF NOT EXISTS idx_expenses_branch_id
ON public.expenses(branch_id);

CREATE INDEX IF NOT EXISTS idx_expenses_period_id
ON public.expenses(fiscal_period_id);

-- Bank Transactions foreign keys
CREATE INDEX IF NOT EXISTS idx_bank_transactions_bank_account_id
ON public.bank_transactions(bank_account_id);

-- Bank Reconciliations foreign keys
CREATE INDEX IF NOT EXISTS idx_bank_reconciliations_bank_account_id
ON public.bank_reconciliations(bank_account_id);

-- Attachments foreign keys
CREATE INDEX IF NOT EXISTS idx_attachments_created_by
ON public.attachments(created_by);

-- ============================================
-- Composite Indexes for Common Queries (Issue #33)
-- ============================================

-- For RLS queries (tenant + deleted_at)
CREATE INDEX IF NOT EXISTS idx_coa_tenant_deleted
ON public.chart_of_accounts(tenant_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_customers_tenant_deleted
ON public.customers(tenant_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_vendors_tenant_deleted
ON public.vendors(tenant_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_deleted
ON public.invoices(tenant_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_journals_tenant_deleted
ON public.journals(tenant_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_payments_tenant_deleted
ON public.payments(tenant_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_expenses_tenant_deleted
ON public.expenses(tenant_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_bank_accounts_tenant_deleted
ON public.bank_accounts(tenant_id, deleted_at);

CREATE INDEX IF NOT EXISTS idx_assets_tenant_deleted
ON public.assets(tenant_id, deleted_at);

-- For active records (tenant + is_active)
CREATE INDEX IF NOT EXISTS idx_coa_tenant_active
ON public.chart_of_accounts(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_branches_tenant_active
ON public.branches(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_cost_centers_tenant_active
ON public.cost_centers(tenant_id, is_active);

CREATE INDEX IF NOT EXISTS idx_users_tenant_active
ON public.users(tenant_id, is_active);

-- For type-based queries (tenant + type + is_active)
CREATE INDEX IF NOT EXISTS idx_coa_tenant_type_active
ON public.chart_of_accounts(tenant_id, type, is_active);

-- For date range queries (tenant + dates)
CREATE INDEX IF NOT EXISTS idx_fiscal_periods_tenant_dates
ON public.fiscal_periods(tenant_id, start_date, end_date);

CREATE INDEX IF NOT EXISTS idx_vat_transactions_tenant_date
ON public.vat_transactions(tenant_id, transaction_date);

-- For invoice queries (tenant + type + status)
CREATE INDEX IF NOT EXISTS idx_invoices_tenant_type_status
ON public.invoices(tenant_id, invoice_type, status);

-- For payment queries (tenant + type + status)
CREATE INDEX IF NOT EXISTS idx_payments_tenant_type_status
ON public.payments(tenant_id, payment_type, status);

-- For expense queries (tenant + employee + status)
CREATE INDEX IF NOT EXISTS idx_expenses_tenant_employee_status
ON public.expenses(tenant_id, employee_id, status);

-- ============================================
-- Specialized Indexes for Business Logic
-- ============================================

-- For journal workflow queries
CREATE INDEX IF NOT EXISTS idx_journals_status
ON public.journals(status);

CREATE INDEX IF NOT EXISTS idx_journal_workflow_journal_id
ON public.journal_workflow(journal_id);

-- For invoice payment status queries
CREATE INDEX IF NOT EXISTS idx_invoices_status_balance
ON public.invoices(status, balance_amount);

-- For approval workflow
CREATE INDEX IF NOT EXISTS idx_journals_tenant_status
ON public.journals(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant_status
ON public.invoices(tenant_id, status);

-- For audit log queries (tenant + table_name + date)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_table_date
ON public.audit_logs(tenant_id, table_name, created_at);

-- For user roles queries
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
ON public.user_roles(user_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_tenant_role
ON public.user_roles(tenant_id, role_id);

-- For account lookups (tenant + code)
CREATE INDEX IF NOT EXISTS idx_coa_tenant_code
ON public.chart_of_accounts(tenant_id, account_code);

-- For fiscal year lookups
CREATE INDEX IF NOT EXISTS idx_fiscal_years_tenant_is_active
ON public.fiscal_years(tenant_id, is_active);

-- ============================================
-- Comments for documentation
-- ============================================

COMMENT ON INDEX idx_coa_parent_id IS 'Enables fast lookups of parent accounts in hierarchy';
COMMENT ON INDEX idx_coa_tenant_active IS 'Optimizes RLS queries for active accounts';
COMMENT ON INDEX idx_invoices_tenant_type_status IS 'Optimizes invoice filtering by type and status';
COMMENT ON INDEX idx_audit_logs_tenant_table_date IS 'Optimizes audit log searches by table and date range';
