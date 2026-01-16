-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Additional Modules: Banking, Expenses, Assets, VAT, Audit
-- ============================================

-- ============================================
-- BANK ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    code VARCHAR(20) NOT NULL,
    account_name VARCHAR(255) NOT NULL,
    account_number VARCHAR(100) NOT NULL,
    iban VARCHAR(50),
    bank_name VARCHAR(255),
    bank_branch VARCHAR(255),
    swift_code VARCHAR(20),
    currency VARCHAR(3) DEFAULT 'QAR',
    account_type VARCHAR(20) CHECK (account_type IN ('checking', 'savings', 'current', 'credit_card')),
    gl_account_id UUID REFERENCES public.chart_of_accounts(id),
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    balance DECIMAL(18,2) DEFAULT 0,
    last_reconciled_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_bank_accounts_tenant_id ON public.bank_accounts(tenant_id);
CREATE INDEX idx_bank_accounts_is_active ON public.bank_accounts(is_active);

-- ============================================
-- BANK TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.bank_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
    transaction_date DATE NOT NULL,
    value_date DATE,
    reference_number VARCHAR(100),
    description TEXT,
    description_ar TEXT,
    amount DECIMAL(18,2) NOT NULL,
    balance DECIMAL(18,2),
    currency VARCHAR(3) DEFAULT 'QAR',
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('debit', 'credit')),
    category VARCHAR(100),
    is_reconciled BOOLEAN DEFAULT false,
    reconciliation_id UUID REFERENCES public.bank_reconciliations(id),
    attachment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_bank_transactions_tenant_id ON public.bank_transactions(tenant_id);
CREATE INDEX idx_bank_transactions_bank_account_id ON public.bank_transactions(bank_account_id);
CREATE INDEX idx_bank_transactions_transaction_date ON public.bank_transactions(transaction_date);
CREATE INDEX idx_bank_transactions_is_reconciled ON public.bank_transactions(is_reconciled);

-- ============================================
-- BANK RECONCILIATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
    reconciliation_number VARCHAR(50) NOT NULL,
    as_of_date DATE NOT NULL,
    statement_balance DECIMAL(18,2) NOT NULL,
    book_balance DECIMAL(18,2) NOT NULL,
    difference DECIMAL(18,2) NOT NULL DEFAULT 0,
    is_balanced BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
    completed_by UUID REFERENCES public.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, bank_account_id, as_of_date, status)
);

CREATE INDEX idx_bank_reconciliations_tenant_id ON public.bank_reconciliations(tenant_id);
CREATE INDEX idx_bank_reconciliations_bank_account_id ON public.bank_reconciliations(bank_account_id);
CREATE INDEX idx_bank_reconciliations_as_of_date ON public.bank_reconciliations(as_of_date);
CREATE INDEX idx_bank_reconciliations_status ON public.bank_reconciliations(status);

-- ============================================
-- EXPENSES
-- ============================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    expense_number VARCHAR(50) NOT NULL,
    title_ar TEXT NOT NULL,
    title_en TEXT,
    expense_date DATE NOT NULL,
    employee_id UUID REFERENCES public.users(id),
    vendor_id UUID REFERENCES public.vendors(id),
    category VARCHAR(100),
    currency VARCHAR(3) DEFAULT 'QAR',
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    paid_amount DECIMAL(18,2) DEFAULT 0,
    approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN (
        'pending', 'approved', 'rejected', 'cancelled'
    )),
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by UUID REFERENCES public.users(id),
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'posted', 'paid'
    )),
    posted_journal_id UUID REFERENCES public.journals(id),
    submitted_by UUID REFERENCES public.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID REFERENCES public.users(id),
    posted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, expense_number)
);

CREATE INDEX idx_expenses_tenant_id ON public.expenses(tenant_id);
CREATE INDEX idx_expenses_branch_id ON public.expenses(branch_id);
CREATE INDEX idx_expenses_expense_date ON public.expenses(expense_date);
CREATE INDEX idx_expenses_employee_id ON public.expenses(employee_id);
CREATE INDEX idx_expenses_approval_status ON public.expenses(approval_status);
CREATE INDEX idx_expenses_status ON public.expenses(status);

-- ============================================
-- EXPENSE LINES
-- ============================================
CREATE TABLE IF NOT EXISTS public.expense_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    description_ar TEXT NOT NULL,
    description_en TEXT,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_code_id UUID REFERENCES public.vat_codes(id),
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(expense_id, line_number)
);

CREATE INDEX idx_expense_lines_expense_id ON public.expense_lines(expense_id);
CREATE INDEX idx_expense_lines_account_id ON public.expense_lines(account_id);

-- ============================================
-- EXPENSE ATTACHMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.expense_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES public.users(id)
);

CREATE INDEX idx_expense_attachments_expense_id ON public.expense_attachments(expense_id);

-- ============================================
-- FIXED ASSETS
-- ============================================
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    asset_code VARCHAR(50) NOT NULL,
    asset_name_ar TEXT NOT NULL,
    asset_name_en TEXT,
    asset_category VARCHAR(100),
    description TEXT,
    description_ar TEXT,
    purchase_date DATE NOT NULL,
    purchase_value DECIMAL(18,2) NOT NULL DEFAULT 0,
    salvage_value DECIMAL(18,2) DEFAULT 0,
    useful_life_years INTEGER NOT NULL,
    depreciation_method VARCHAR(50) DEFAULT 'straight_line' CHECK (depreciation_method IN (
        'straight_line', 'declining_balance', 'double_declining_balance'
    )),
    depreciation_rate DECIMAL(5,2),
    accumulated_depreciation DECIMAL(18,2) DEFAULT 0,
    net_book_value DECIMAL(18,2) DEFAULT 0,
    asset_account_id UUID REFERENCES public.chart_of_accounts(id),
    depreciation_account_id UUID REFERENCES public.chart_of_accounts(id),
    accumulated_depreciation_account_id UUID REFERENCES public.chart_of_accounts(id),
    location VARCHAR(255),
    location_ar VARCHAR(255),
    responsible_person_id UUID REFERENCES public.users(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'disposed', 'sold', 'scrapped'
    )),
    disposal_date DATE,
    disposal_value DECIMAL(18,2),
    disposal_journal_id UUID REFERENCES public.journals(id),
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, asset_code)
);

CREATE INDEX idx_assets_tenant_id ON public.assets(tenant_id);
CREATE INDEX idx_assets_branch_id ON public.assets(branch_id);
CREATE INDEX idx_assets_status ON public.assets(status);
CREATE INDEX idx_assets_purchase_date ON public.assets(purchase_date);

-- ============================================
-- ASSET DEPRECIATION RUNS
-- ============================================
CREATE TABLE IF NOT EXISTS public.asset_depreciation_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    run_number VARCHAR(50) NOT NULL,
    run_date DATE NOT NULL,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress' CHECK (status IN (
        'in_progress', 'completed', 'failed'
    )),
    total_depreciation DECIMAL(18,2) DEFAULT 0,
    asset_count INTEGER DEFAULT 0,
    journal_id UUID REFERENCES public.journals(id),
    completed_by UUID REFERENCES public.users(id),
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, run_number)
);

CREATE INDEX idx_asset_depreciation_runs_tenant_id ON public.asset_depreciation_runs(tenant_id);
CREATE INDEX idx_asset_depreciation_runs_run_date ON public.asset_depreciation_runs(run_date);
CREATE INDEX idx_asset_depreciation_runs_status ON public.asset_depreciation_runs(status);

-- ============================================
-- ASSET DEPRECIATION LINES
-- ============================================
CREATE TABLE IF NOT EXISTS public.asset_depreciation_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    depreciation_run_id UUID NOT NULL REFERENCES public.asset_depreciation_runs(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    depreciation_date DATE NOT NULL,
    depreciation_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    accumulated_depreciation_before DECIMAL(18,2) DEFAULT 0,
    accumulated_depreciation_after DECIMAL(18,2) DEFAULT 0,
    net_book_value_before DECIMAL(18,2) DEFAULT 0,
    net_book_value_after DECIMAL(18,2) DEFAULT 0,
    journal_line_id UUID REFERENCES public.journal_lines(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_asset_depreciation_lines_run_id ON public.asset_depreciation_lines(depreciation_run_id);
CREATE INDEX idx_asset_depreciation_lines_asset_id ON public.asset_depreciation_lines(asset_id);

-- ============================================
-- VAT TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.vat_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN (
        'sales', 'purchases', 'adjustment'
    )),
    transaction_date DATE NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'invoice', 'journal', 'expense'
    source_id UUID NOT NULL,
    vat_type VARCHAR(20) NOT NULL CHECK (vat_type IN ('output', 'input')),
    vat_code_id UUID NOT NULL REFERENCES public.vat_codes(id),
    vat_percentage DECIMAL(5,2) NOT NULL,
    taxable_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    vat_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'QAR',
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    is_reportable BOOLEAN DEFAULT true,
    reporting_period VARCHAR(20),
    fiscal_period_id UUID REFERENCES public.fiscal_periods(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vat_transactions_tenant_id ON public.vat_transactions(tenant_id);
CREATE INDEX idx_vat_transactions_transaction_date ON public.vat_transactions(transaction_date);
CREATE INDEX idx_vat_transactions_vat_type ON public.vat_transactions(vat_type);
CREATE INDEX idx_vat_transactions_source ON public.vat_transactions(source_type, source_id);
CREATE INDEX idx_vat_transactions_fiscal_period_id ON public.vat_transactions(fiscal_period_id);

-- ============================================
-- AUDIT LOGS
-- ============================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('insert', 'update', 'delete', 'post', 'approve', 'reject')),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    user_id UUID REFERENCES public.users(id),
    user_email VARCHAR(255),
    user_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    request_id VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_tenant_id ON public.audit_logs(tenant_id);
CREATE INDEX idx_audit_logs_table_record ON public.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ============================================
-- ATTACHMENTS (Generic)
-- ============================================
CREATE TABLE IF NOT EXISTS public.attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    file_type VARCHAR(100),
    mime_type VARCHAR(100),
    storage_bucket VARCHAR(100),
    storage_path TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    uploaded_by UUID REFERENCES public.users(id)
);

CREATE INDEX idx_attachments_tenant_id ON public.attachments(tenant_id);
CREATE INDEX idx_attachments_table_record ON public.attachments(table_name, record_id);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate asset depreciation journal
CREATE OR REPLACE FUNCTION public.create_depreciation_journal(
    p_run_id UUID,
    p_user_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_journal_id UUID;
    v_tenant_id UUID;
    v_run_date DATE;
    v_description_ar VARCHAR(500) := 'قيد استهلاك الأصول الثابتة';
    v_description_en VARCHAR(500) := 'Fixed Assets Depreciation Entry';
BEGIN
    -- Get run details
    SELECT tenant_id, run_date INTO v_tenant_id, v_run_date
    FROM public.asset_depreciation_runs
    WHERE id = p_run_id;

    -- Create journal header
    INSERT INTO public.journals (
        tenant_id,
        journal_number,
        journal_type,
        description_ar,
        description_en,
        transaction_date,
        currency,
        status,
        created_by,
        posted_by,
        posted_at
    )
    VALUES (
        v_tenant_id,
        public.generate_journal_number(v_tenant_id, 'depreciation'),
        'depreciation',
        v_description_ar,
        v_description_en,
        v_run_date,
        'QAR',
        'posted',
        p_user_id,
        p_user_id,
        NOW()
    )
    RETURNING id INTO v_journal_id;

    RETURN v_journal_id;
END;
$$ LANGUAGE plpgsql;

-- Generate expense number
CREATE OR REPLACE FUNCTION public.generate_expense_number(p_tenant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_sequence BIGINT;
    v_year VARCHAR(4);
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;

    v_sequence := COALESCE(
        (SELECT (value->>'sequence')::BIGINT FROM public.settings
         WHERE tenant_id = p_tenant_id AND key = 'expense_sequence'),
        0
    ) + 1;

    INSERT INTO public.settings (tenant_id, key, value)
    VALUES (p_tenant_id, 'expense_sequence', jsonb_build_object('sequence', v_sequence))
    ON CONFLICT (tenant_id, key)
    DO UPDATE SET value = jsonb_build_object('sequence', v_sequence), updated_at = NOW();

    RETURN 'EXP-' || v_year || '-' || LPAD(v_sequence::VARCHAR, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate reconciliation number
CREATE OR REPLACE FUNCTION public.generate_reconciliation_number(p_tenant_id UUID)
RETURNS VARCHAR AS $$
DECLARE
    v_sequence BIGINT;
    v_year VARCHAR(4);
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;

    v_sequence := COALESCE(
        (SELECT (value->>'sequence')::BIGINT FROM public.settings
         WHERE tenant_id = p_tenant_id AND key = 'reconciliation_sequence'),
        0
    ) + 1;

    INSERT INTO public.settings (tenant_id, key, value)
    VALUES (p_tenant_id, 'reconciliation_sequence', jsonb_build_object('sequence', v_sequence))
    ON CONFLICT (tenant_id, key)
    DO UPDATE SET value = jsonb_build_object('sequence', v_sequence), updated_at = NOW();

    RETURN 'REC-' || v_year || '-' || LPAD(v_sequence::VARCHAR, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_reconciliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_depreciation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_depreciation_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
