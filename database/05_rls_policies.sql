-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Row Level Security (RLS) Policies
-- ============================================

-- Helper function to check if user is platform super admin
CREATE OR REPLACE FUNCTION public.is_platform_super_admin(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = user_id
        AND r.name = 'SUPER_ADMIN'
    ) OR EXISTS(
        SELECT 1 FROM auth.users au
        WHERE au.id = user_id
        AND (au.raw_user_meta_data->>'is_platform_admin')::BOOLEAN = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user's tenant_id
CREATE OR REPLACE FUNCTION public.get_current_user_tenant()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT tenant_id FROM public.users
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TENANTS RLS
-- ============================================

-- Allow platform super admins to read all tenants
DROP POLICY IF EXISTS "Super admins can read all tenants" ON public.tenants;
CREATE POLICY "Super admins can read all tenants"
ON public.tenants FOR SELECT
USING (
    public.is_platform_super_admin(auth.uid())
);

-- ============================================
-- BRANCHES RLS
-- ============================================

-- Users can read branches from their tenant
DROP POLICY IF EXISTS "Users can read tenant branches" ON public.branches;
CREATE POLICY "Users can read tenant branches"
ON public.branches FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- SETTINGS RLS
-- ============================================

-- Users can read settings from their tenant
DROP POLICY IF EXISTS "Users can read tenant settings" ON public.settings;
CREATE POLICY "Users can read tenant settings"
ON public.settings FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- USERS RLS
-- ============================================

-- Users can read themselves
DROP POLICY IF EXISTS "Users can read themselves" ON public.users;
CREATE POLICY "Users can read themselves"
ON public.users FOR SELECT
USING (
    id = auth.uid()
);

-- Platform admins can read all users
DROP POLICY IF EXISTS "Platform admins can read all users" ON public.users;
CREATE POLICY "Platform admins can read all users"
ON public.users FOR SELECT
USING (
    public.is_platform_super_admin(auth.uid())
);

-- Users from same tenant can read each other
DROP POLICY IF EXISTS "Users can read same tenant users" ON public.users;
CREATE POLICY "Users can read same tenant users"
ON public.users FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- Users can update themselves
DROP POLICY IF EXISTS "Users can update themselves" ON public.users;
CREATE POLICY "Users can update themselves"
ON public.users FOR UPDATE
USING (
    id = auth.uid()
);

-- ============================================
-- USER_ROLES RLS
-- ============================================

-- Users can read roles from their tenant
DROP POLICY IF EXISTS "Users can read tenant user roles" ON public.user_roles;
CREATE POLICY "Users can read tenant user roles"
ON public.user_roles FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- CHART OF ACCOUNTS RLS
-- ============================================

-- Users can read COA from their tenant
DROP POLICY IF EXISTS "Users can read tenant COA" ON public.chart_of_accounts;
CREATE POLICY "Users can read tenant COA"
ON public.chart_of_accounts FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- Users with appropriate permissions can insert COA
DROP POLICY IF EXISTS "Users with permissions can insert COA" ON public.chart_of_accounts;
CREATE POLICY "Users with permissions can insert COA"
ON public.chart_of_accounts FOR INSERT
WITH CHECK (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'coa', 'create', '*')
);

-- Users with appropriate permissions can update COA
DROP POLICY IF EXISTS "Users with permissions can update COA" ON public.chart_of_accounts;
CREATE POLICY "Users with permissions can update COA"
ON public.chart_of_accounts FOR UPDATE
USING (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'coa', 'edit', '*')
);

-- Users with appropriate permissions can delete COA
DROP POLICY IF EXISTS "Users with permissions can delete COA" ON public.chart_of_accounts;
CREATE POLICY "Users with permissions can delete COA"
ON public.chart_of_accounts FOR DELETE
USING (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'coa', 'delete', '*')
);

-- ============================================
-- COST CENTERS RLS
-- ============================================

-- Users can read cost centers from their tenant
DROP POLICY IF EXISTS "Users can read tenant cost centers" ON public.cost_centers;
CREATE POLICY "Users can read tenant cost centers"
ON public.cost_centers FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- ============================================
-- FISCAL YEARS RLS
-- ============================================

-- Users can read fiscal years from their tenant
DROP POLICY IF EXISTS "Users can read tenant fiscal years" ON public.fiscal_years;
CREATE POLICY "Users can read tenant fiscal years"
ON public.fiscal_years FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- FISCAL PERIODS RLS
-- ============================================

-- Users can read fiscal periods from their tenant
DROP POLICY IF EXISTS "Users can read tenant fiscal periods" ON public.fiscal_periods;
CREATE POLICY "Users can read tenant fiscal periods"
ON public.fiscal_periods FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- Users with edit_fiscal permissions can update fiscal periods
DROP POLICY IF EXISTS "Users with permissions can update fiscal periods" ON public.fiscal_periods;
CREATE POLICY "Users with permissions can update fiscal periods"
ON public.fiscal_periods FOR UPDATE
USING (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'settings', 'edit', 'fiscal')
);

-- ============================================
-- JOURNALS RLS
-- ============================================

-- Users can read journals from their tenant
DROP POLICY IF EXISTS "Users can read tenant journals" ON public.journals;
CREATE POLICY "Users can read tenant journals"
ON public.journals FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- Users with appropriate permissions can insert journals
DROP POLICY IF EXISTS "Users with permissions can insert journals" ON public.journals;
CREATE POLICY "Users with permissions can insert journals"
ON public.journals FOR INSERT
WITH CHECK (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'journals', 'create', '*')
);

-- Users with appropriate permissions can update journals
DROP POLICY IF EXISTS "Users with permissions can update journals" ON public.journals;
CREATE POLICY "Users with permissions can update journals"
ON public.journals FOR UPDATE
USING (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'journals', 'edit', '*')
    AND status IN ('draft', 'submitted')
);

-- ============================================
-- JOURNAL LINES RLS
-- ============================================

-- Users can read journal lines from their tenant
DROP POLICY IF EXISTS "Users can read tenant journal lines" ON public.journal_lines;
CREATE POLICY "Users can read tenant journal lines"
ON public.journal_lines FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- JOURNAL WORKFLOW RLS
-- ============================================

-- Users can read journal workflow from their tenant
DROP POLICY IF EXISTS "Users can read tenant journal workflow" ON public.journal_workflow;
CREATE POLICY "Users can read tenant journal workflow"
ON public.journal_workflow FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- CUSTOMERS RLS
-- ============================================

-- Users can read customers from their tenant
DROP POLICY IF EXISTS "Users can read tenant customers" ON public.customers;
CREATE POLICY "Users can read tenant customers"
ON public.customers FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- Users with appropriate permissions can insert customers
DROP POLICY IF EXISTS "Users with permissions can insert customers" ON public.customers;
CREATE POLICY "Users with permissions can insert customers"
ON public.customers FOR INSERT
WITH CHECK (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'customers', 'create', '*')
);

-- Users with appropriate permissions can update customers
DROP POLICY IF EXISTS "Users with permissions can update customers" ON public.customers;
CREATE POLICY "Users with permissions can update customers"
ON public.customers FOR UPDATE
USING (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'customers', 'edit', '*')
);

-- ============================================
-- VENDORS RLS
-- ============================================

-- Users can read vendors from their tenant
DROP POLICY IF EXISTS "Users can read tenant vendors" ON public.vendors;
CREATE POLICY "Users can read tenant vendors"
ON public.vendors FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- Users with appropriate permissions can insert vendors
DROP POLICY IF EXISTS "Users with permissions can insert vendors" ON public.vendors;
CREATE POLICY "Users with permissions can insert vendors"
ON public.vendors FOR INSERT
WITH CHECK (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'vendors', 'create', '*')
);

-- Users with appropriate permissions can update vendors
DROP POLICY IF EXISTS "Users with permissions can update vendors" ON public.vendors;
CREATE POLICY "Users with permissions can update vendors"
ON public.vendors FOR UPDATE
USING (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'vendors', 'edit', '*')
);

-- ============================================
-- INVOICES RLS
-- ============================================

-- Users can read invoices from their tenant
DROP POLICY IF EXISTS "Users can read tenant invoices" ON public.invoices;
CREATE POLICY "Users can read tenant invoices"
ON public.invoices FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- Users with appropriate permissions can insert invoices
DROP POLICY IF EXISTS "Users with permissions can insert invoices" ON public.invoices;
CREATE POLICY "Users with permissions can insert invoices"
ON public.invoices FOR INSERT
WITH CHECK (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'invoices', 'create', invoice_type)
);

-- Users with appropriate permissions can update invoices
DROP POLICY IF EXISTS "Users with permissions can update invoices" ON public.invoices;
CREATE POLICY "Users with permissions can update invoices"
ON public.invoices FOR UPDATE
USING (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'invoices', 'edit', '*')
    AND status IN ('draft', 'submitted')
);

-- ============================================
-- INVOICE LINES RLS
-- ============================================

-- Users can read invoice lines from their tenant
DROP POLICY IF EXISTS "Users can read tenant invoice lines" ON public.invoice_lines;
CREATE POLICY "Users can read tenant invoice lines"
ON public.invoice_lines FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- INVOICE TAXES RLS
-- ============================================

-- Users can read invoice taxes from their tenant
DROP POLICY IF EXISTS "Users can read tenant invoice taxes" ON public.invoice_taxes;
CREATE POLICY "Users can read tenant invoice taxes"
ON public.invoice_taxes FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- PAYMENTS RLS
-- ============================================

-- Users can read payments from their tenant
DROP POLICY IF EXISTS "Users can read tenant payments" ON public.payments;
CREATE POLICY "Users can read tenant payments"
ON public.payments FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- Users with appropriate permissions can insert payments
DROP POLICY IF EXISTS "Users with permissions can insert payments" ON public.payments;
CREATE POLICY "Users with permissions can insert payments"
ON public.payments FOR INSERT
WITH CHECK (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'payments', 'create', payment_type)
);

-- ============================================
-- PAYMENT ALLOCATIONS RLS
-- ============================================

-- Users can read payment allocations from their tenant
DROP POLICY IF EXISTS "Users can read tenant payment allocations" ON public.payment_allocations;
CREATE POLICY "Users can read tenant payment allocations"
ON public.payment_allocations FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- VAT CODES RLS
-- ============================================

-- Users can read VAT codes from their tenant
DROP POLICY IF EXISTS "Users can read tenant vat codes" ON public.vat_codes;
CREATE POLICY "Users can read tenant vat codes"
ON public.vat_codes FOR SELECT
USING (
    tenant_id IS NULL OR tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- BANK ACCOUNTS RLS
-- ============================================

-- Users can read bank accounts from their tenant
DROP POLICY IF EXISTS "Users can read tenant bank accounts" ON public.bank_accounts;
CREATE POLICY "Users can read tenant bank accounts"
ON public.bank_accounts FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- ============================================
-- BANK TRANSACTIONS RLS
-- ============================================

-- Users can read bank transactions from their tenant
DROP POLICY IF EXISTS "Users can read tenant bank transactions" ON public.bank_transactions;
CREATE POLICY "Users can read tenant bank transactions"
ON public.bank_transactions FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- BANK RECONCILIATIONS RLS
-- ============================================

-- Users can read bank reconciliations from their tenant
DROP POLICY IF EXISTS "Users can read tenant bank reconciliations" ON public.bank_reconciliations;
CREATE POLICY "Users can read tenant bank reconciliations"
ON public.bank_reconciliations FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- Users with banking reconcile permission can insert reconciliations
DROP POLICY IF EXISTS "Users with permissions can insert bank reconciliations" ON public.bank_reconciliations;
CREATE POLICY "Users with permissions can insert bank reconciliations"
ON public.bank_reconciliations FOR INSERT
WITH CHECK (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'banking', 'reconcile', '*')
);

-- ============================================
-- EXPENSES RLS
-- ============================================

-- Users can read expenses from their tenant
DROP POLICY IF EXISTS "Users can read tenant expenses" ON public.expenses;
CREATE POLICY "Users can read tenant expenses"
ON public.expenses FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- Users with appropriate permissions can insert expenses
DROP POLICY IF EXISTS "Users with permissions can insert expenses" ON public.expenses;
CREATE POLICY "Users with permissions can insert expenses"
ON public.expenses FOR INSERT
WITH CHECK (
    tenant_id = public.get_current_user_tenant()
    AND public.user_has_permission(auth.uid(), 'expenses', 'create', '*')
);

-- Users can update their own expenses
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
CREATE POLICY "Users can update their own expenses"
ON public.expenses FOR UPDATE
USING (
    tenant_id = public.get_current_user_tenant()
    AND employee_id = auth.uid()
    AND status = 'draft'
);

-- ============================================
-- EXPENSE LINES RLS
-- ============================================

-- Users can read expense lines from their tenant
DROP POLICY IF EXISTS "Users can read tenant expense lines" ON public.expense_lines;
CREATE POLICY "Users can read tenant expense lines"
ON public.expense_lines FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- EXPENSE ATTACHMENTS RLS
-- ============================================

-- Users can read expense attachments from their tenant
DROP POLICY IF EXISTS "Users can read tenant expense attachments" ON public.expense_attachments;
CREATE POLICY "Users can read tenant expense attachments"
ON public.expense_attachments FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- ASSETS RLS
-- ============================================

-- Users can read assets from their tenant
DROP POLICY IF EXISTS "Users can read tenant assets" ON public.assets;
CREATE POLICY "Users can read tenant assets"
ON public.assets FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
    AND deleted_at IS NULL
);

-- ============================================
-- ASSET DEPRECIATION RUNS RLS
-- ============================================

-- Users can read asset depreciation runs from their tenant
DROP POLICY IF EXISTS "Users can read tenant asset depreciation runs" ON public.asset_depreciation_runs;
CREATE POLICY "Users can read tenant asset depreciation runs"
ON public.asset_depreciation_runs FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- ASSET DEPRECIATION LINES RLS
-- ============================================

-- Users can read asset depreciation lines from their tenant
DROP POLICY IF EXISTS "Users can read tenant asset depreciation lines" ON public.asset_depreciation_lines;
CREATE POLICY "Users can read tenant asset depreciation lines"
ON public.asset_depreciation_lines FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- VAT TRANSACTIONS RLS
-- ============================================

-- Users can read VAT transactions from their tenant
DROP POLICY IF EXISTS "Users can read tenant vat transactions" ON public.vat_transactions;
CREATE POLICY "Users can read tenant vat transactions"
ON public.vat_transactions FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- ============================================
-- AUDIT LOGS RLS
-- ============================================

-- Users can read audit logs from their tenant
DROP POLICY IF EXISTS "Users can read tenant audit logs" ON public.audit_logs;
CREATE POLICY "Users can read tenant audit logs"
ON public.audit_logs FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);

-- Platform admins can read all audit logs
DROP POLICY IF EXISTS "Platform admins can read all audit logs" ON public.audit_logs;
CREATE POLICY "Platform admins can read all audit logs"
ON public.audit_logs FOR SELECT
USING (
    public.is_platform_super_admin(auth.uid())
);

-- ============================================
-- ATTACHMENTS RLS
-- ============================================

-- Users can read attachments from their tenant
DROP POLICY IF EXISTS "Users can read tenant attachments" ON public.attachments;
CREATE POLICY "Users can read tenant attachments"
ON public.attachments FOR SELECT
USING (
    tenant_id = public.get_current_user_tenant()
);
