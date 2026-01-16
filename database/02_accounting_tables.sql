-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Accounting Tables: COA, Fiscal Periods, Journals
-- ============================================

-- ============================================
-- CHART OF ACCOUNTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    subtype VARCHAR(50),
    parent_id UUID REFERENCES public.chart_of_accounts(id),
    level INTEGER NOT NULL DEFAULT 1,
    is_control_account BOOLEAN DEFAULT false,
    is_posting_allowed BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    balance_type VARCHAR(10) NOT NULL DEFAULT 'debit' CHECK (balance_type IN ('debit', 'credit')),
    description TEXT,
    currency VARCHAR(3),
    cost_center_required BOOLEAN DEFAULT false,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_coa_tenant_id ON public.chart_of_accounts(tenant_id);
CREATE INDEX idx_coa_parent_id ON public.chart_of_accounts(parent_id);
CREATE INDEX idx_coa_type ON public.chart_of_accounts(type);
CREATE INDEX idx_coa_is_active ON public.chart_of_accounts(is_active);

-- ============================================
-- COST CENTERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.cost_centers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    parent_id UUID REFERENCES public.cost_centers(id),
    branch_id UUID REFERENCES public.branches(id),
    manager_id UUID REFERENCES public.users(id),
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_cost_centers_tenant_id ON public.cost_centers(tenant_id);
CREATE INDEX idx_cost_centers_is_active ON public.cost_centers(is_active);

-- ============================================
-- FISCAL YEARS
-- ============================================
CREATE TABLE IF NOT EXISTS public.fiscal_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    name_ar VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_closed BOOLEAN DEFAULT false,
    closed_by UUID REFERENCES public.users(id),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (end_date > start_date),
    UNIQUE(tenant_id, name)
);

CREATE INDEX idx_fiscal_years_tenant_id ON public.fiscal_years(tenant_id);
CREATE INDEX idx_fiscal_years_dates ON public.fiscal_years(start_date, end_date);
CREATE INDEX idx_fiscal_years_is_closed ON public.fiscal_years(is_closed);

-- ============================================
-- FISCAL PERIODS (Months)
-- ============================================
CREATE TABLE IF NOT EXISTS public.fiscal_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    fiscal_year_id UUID NOT NULL REFERENCES public.fiscal_years(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(20) NOT NULL,
    name_ar VARCHAR(20),
    period_number INTEGER NOT NULL CHECK (period_number BETWEEN 1 AND 12),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_locked BOOLEAN DEFAULT false,
    locked_by UUID REFERENCES public.users(id),
    locked_at TIMESTAMP WITH TIME ZONE,
    override_code VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(fiscal_year_id, period_number),
    CHECK (end_date > start_date)
);

CREATE INDEX idx_fiscal_periods_tenant_id ON public.fiscal_periods(tenant_id);
CREATE INDEX idx_fiscal_periods_fiscal_year_id ON public.fiscal_periods(fiscal_year_id);
CREATE INDEX idx_fiscal_periods_dates ON public.fiscal_periods(start_date, end_date);
CREATE INDEX idx_fiscal_periods_is_locked ON public.fiscal_periods(is_locked);

-- ============================================
-- JOURNALS
-- ============================================
CREATE TABLE IF NOT EXISTS public.journals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    journal_number VARCHAR(50) NOT NULL,
    journal_type VARCHAR(50) NOT NULL CHECK (journal_type IN (
        'general', 'sales', 'purchase', 'receipt', 'payment', 'expense',
        'depreciation', 'adjustment', 'opening', 'closing'
    )),
    reference_number VARCHAR(50),
    description_ar TEXT NOT NULL,
    description_en TEXT,
    transaction_date DATE NOT NULL,
    posting_date DATE,
    currency VARCHAR(3) NOT NULL DEFAULT 'QAR',
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    total_debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    total_credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'approved', 'posted', 'reversed'
    )),
    submitted_by UUID REFERENCES public.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID REFERENCES public.users(id),
    posted_at TIMESTAMP WITH TIME ZONE,
    reversed_by UUID REFERENCES public.users(id),
    reversed_at TIMESTAMP WITH TIME ZONE,
    reversal_journal_id UUID REFERENCES public.journals(id),
    reversal_reason TEXT,
    notes TEXT,
    attachment_url TEXT,
    source_module VARCHAR(50), -- e.g., 'invoices', 'payments'
    source_id UUID,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, journal_number)
);

CREATE INDEX idx_journals_tenant_id ON public.journals(tenant_id);
CREATE INDEX idx_journals_branch_id ON public.journals(branch_id);
CREATE INDEX idx_journals_transaction_date ON public.journals(transaction_date);
CREATE INDEX idx_journals_status ON public.journals(status);
CREATE INDEX idx_journals_journal_type ON public.journals(journal_type);
CREATE INDEX idx_journals_source ON public.journals(source_module, source_id);
CREATE INDEX idx_journals_reversal ON public.journals(reversal_journal_id);

-- ============================================
-- JOURNAL LINES
-- ============================================
CREATE TABLE IF NOT EXISTS public.journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    account_id UUID NOT NULL REFERENCES public.chart_of_accounts(id),
    description_ar TEXT,
    description_en TEXT,
    cost_center_id UUID REFERENCES public.cost_centers(id),
    debit DECIMAL(18,2) NOT NULL DEFAULT 0,
    credit DECIMAL(18,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3),
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    foreign_amount DECIMAL(18,2),
    reference VARCHAR(255),
    reference_type VARCHAR(50),
    reference_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(journal_id, line_number),
    CHECK ((debit > 0 AND credit = 0) OR (credit > 0 AND debit = 0))
);

CREATE INDEX idx_journal_lines_journal_id ON public.journal_lines(journal_id);
CREATE INDEX idx_journal_lines_account_id ON public.journal_lines(account_id);
CREATE INDEX idx_journal_lines_cost_center_id ON public.journal_lines(cost_center_id);
CREATE INDEX idx_journal_lines_tenant_id ON public.journal_lines(tenant_id);

-- ============================================
-- JOURNAL WORKFLOW
-- ============================================
CREATE TABLE IF NOT EXISTS public.journal_workflow (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_id UUID NOT NULL REFERENCES public.journals(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    action VARCHAR(20) NOT NULL CHECK (action IN (
        'created', 'submitted', 'approved', 'rejected', 'posted', 'reversed'
    )),
    from_status VARCHAR(20),
    to_status VARCHAR(20),
    actioned_by UUID REFERENCES public.users(id),
    actioned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT,
    metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_journal_workflow_journal_id ON public.journal_workflow(journal_id);
CREATE INDEX idx_journal_workflow_actioned_by ON public.journal_workflow(actioned_by);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate next journal number
CREATE OR REPLACE FUNCTION public.generate_journal_number(
    p_tenant_id UUID,
    p_journal_type VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_sequence BIGINT;
    v_year VARCHAR(4);
    v_month VARCHAR(2);
BEGIN
    v_prefix := CASE
        WHEN p_journal_type = 'general' THEN 'GJ'
        WHEN p_journal_type = 'sales' THEN 'SJ'
        WHEN p_journal_type = 'purchase' THEN 'PJ'
        WHEN p_journal_type = 'receipt' THEN 'RV'
        WHEN p_journal_type = 'payment' THEN 'PV'
        WHEN p_journal_type = 'expense' THEN 'EX'
        WHEN p_journal_type = 'depreciation' THEN 'DP'
        WHEN p_journal_type = 'adjustment' THEN 'AD'
        WHEN p_journal_type = 'opening' THEN 'OP'
        WHEN p_journal_type = 'closing' THEN 'CL'
        ELSE 'JL'
    END;

    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;
    v_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::VARCHAR, 2, '0');

    -- Get sequence from settings or use default
    v_sequence := COALESCE(
        (SELECT (value->>'sequence')::BIGINT FROM public.settings
         WHERE tenant_id = p_tenant_id AND key = 'journal_sequence_' || p_journal_type),
        0
    ) + 1;

    -- Update sequence in settings
    INSERT INTO public.settings (tenant_id, key, value)
    VALUES (p_tenant_id, 'journal_sequence_' || p_journal_type, jsonb_build_object('sequence', v_sequence))
    ON CONFLICT (tenant_id, key)
    DO UPDATE SET value = jsonb_build_object('sequence', v_sequence), updated_at = NOW();

    RETURN v_prefix || '-' || v_year || v_month || '-' || LPAD(v_sequence::VARCHAR, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Validate journal before posting
CREATE OR REPLACE FUNCTION public.validate_journal_for_posting(
    p_journal_id UUID,
    p_user_id UUID
)
RETURNS TABLE(
    is_valid BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    v_tenant_id UUID;
    v_status VARCHAR;
    v_total_debit DECIMAL(18,2);
    v_total_credit DECIMAL(18,2);
    v_line_count INTEGER;
    v_period_locked BOOLEAN;
    v_has_control_account BOOLEAN;
BEGIN
    -- Get journal details
    SELECT tenant_id, status INTO v_tenant_id, v_status
    FROM public.journals
    WHERE id = p_journal_id;

    -- Check if journal exists
    IF v_tenant_id IS NULL THEN
        RETURN QUERY SELECT false, 'Journal not found'::TEXT;
        RETURN;
    END IF;

    -- Check if journal is in approved status
    IF v_status != 'approved' THEN
        RETURN QUERY SELECT false, 'Journal must be approved before posting. Current status: ' || v_status::TEXT;
        RETURN;
    END IF;

    -- Check if period is locked
    SELECT fp.is_locked INTO v_period_locked
    FROM public.journals j
    JOIN public.fiscal_periods fp ON j.transaction_date BETWEEN fp.start_date AND fp.end_date
    WHERE j.id = p_journal_id;

    IF v_period_locked THEN
        RETURN QUERY SELECT false, 'Cannot post to a locked fiscal period'::TEXT;
        RETURN;
    END IF;

    -- Get totals and line count
    SELECT
        SUM(jl.debit),
        SUM(jl.credit),
        COUNT(*)
    INTO v_total_debit, v_total_credit, v_line_count
    FROM public.journal_lines jl
    WHERE jl.journal_id = p_journal_id;

    -- Check if journal has lines
    IF v_line_count = 0 OR v_line_count IS NULL THEN
        RETURN QUERY SELECT false, 'Journal has no lines'::TEXT;
        RETURN;
    END IF;

    -- Check debit equals credit
    IF ABS(v_total_debit - v_total_credit) > 0.01 THEN
        RETURN QUERY SELECT false, 'Debit (' || v_total_debit::TEXT || ') does not equal credit (' || v_total_credit::TEXT || ')'::TEXT;
        RETURN;
    END IF;

    -- Check for control account posting
    SELECT EXISTS(
        SELECT 1 FROM public.journal_lines jl
        JOIN public.chart_of_accounts coa ON jl.account_id = coa.id
        WHERE jl.journal_id = p_journal_id
        AND coa.is_control_account = true
        AND coa.is_posting_allowed = false
    ) INTO v_has_control_account;

    IF v_has_control_account THEN
        RETURN QUERY SELECT false, 'Cannot post to non-posting control accounts'::TEXT;
        RETURN;
    END IF;

    -- All validations passed
    RETURN QUERY SELECT true, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Post journal function
CREATE OR REPLACE FUNCTION public.post_journal(p_journal_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_is_valid BOOLEAN;
    v_error_message TEXT;
    v_tenant_id UUID;
    v_transaction_date DATE;
BEGIN
    -- Validate journal
    SELECT is_valid, error_message INTO v_is_valid, v_error_message
    FROM public.validate_journal_for_posting(p_journal_id, p_user_id);

    IF NOT v_is_valid THEN
        RAISE EXCEPTION 'Journal validation failed: %', v_error_message;
    END IF;

    -- Get tenant and date
    SELECT tenant_id, transaction_date INTO v_tenant_id, v_transaction_date
    FROM public.journals
    WHERE id = p_journal_id;

    -- Update journal status
    UPDATE public.journals
    SET status = 'posted',
        posting_date = v_transaction_date,
        posted_by = p_user_id,
        posted_at = NOW(),
        updated_at = NOW()
    WHERE id = p_journal_id;

    -- Log workflow
    INSERT INTO public.journal_workflow (
        journal_id, tenant_id, action, from_status, to_status, actioned_by, notes
    )
    VALUES (
        p_journal_id, v_tenant_id, 'posted', 'approved', 'posted', p_user_id, 'Journal posted successfully'
    );

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_centers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiscal_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_workflow ENABLE ROW LEVEL SECURITY;
