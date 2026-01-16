-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Views: Trial Balance, General Ledger, VAT Summaries
-- ============================================

-- ============================================
-- GENERAL LEDGER VIEW
-- Derived from posted journal lines only
-- ============================================
CREATE OR REPLACE VIEW public.v_general_ledger AS
SELECT
    jl.id,
    jl.tenant_id,
    jl.journal_id,
    j.journal_number,
    j.journal_type,
    j.transaction_date,
    j.posting_date,
    coa.code AS account_code,
    coa.name_ar AS account_name_ar,
    coa.name_en AS account_name_en,
    coa.type AS account_type,
    jl.line_number,
    jl.description_ar,
    jl.description_en,
    jl.debit,
    jl.credit,
    jl.cost_center_id,
    cc.code AS cost_center_code,
    cc.name_ar AS cost_center_name_ar,
    cc.name_en AS cost_center_name_en,
    jl.reference,
    jl.reference_type,
    jl.reference_id,
    b.name_ar AS branch_name_ar,
    b.name_en AS branch_name_en,
    j.currency,
    j.exchange_rate,
    jl.created_at
FROM public.journal_lines jl
JOIN public.journals j ON jl.journal_id = j.id
JOIN public.chart_of_accounts coa ON jl.account_id = coa.id
LEFT JOIN public.cost_centers cc ON jl.cost_center_id = cc.id
LEFT JOIN public.branches b ON j.branch_id = b.id
WHERE j.status = 'posted'
  AND jl.tenant_id = j.tenant_id
  AND jl.deleted_at IS NULL;

-- ============================================
-- TRIAL BALANCE VIEW
-- Balance per account from GL
-- ============================================
CREATE OR REPLACE VIEW public.v_trial_balance AS
WITH account_balances AS (
    SELECT
        gl.tenant_id,
        gl.account_code,
        gl.account_name_ar,
        gl.account_name_en,
        gl.account_type,
        gl.currency,
        SUM(gl.debit) AS total_debit,
        SUM(gl.credit) AS total_credit,
        -- Calculate balance based on account type
        CASE
            WHEN gl.account_type IN ('asset', 'expense') THEN
                SUM(gl.debit) - SUM(gl.credit)
            ELSE
                SUM(gl.credit) - SUM(gl.debit)
        END AS balance,
        MIN(gl.transaction_date) AS first_transaction_date,
        MAX(gl.transaction_date) AS last_transaction_date
    FROM public.v_general_ledger gl
    GROUP BY
        gl.tenant_id,
        gl.account_code,
        gl.account_name_ar,
        gl.account_name_en,
        gl.account_type,
        gl.currency
)
SELECT
    ab.tenant_id,
    ab.account_code,
    ab.account_name_ar,
    ab.account_name_en,
    ab.account_type,
    ab.currency,
    ab.total_debit,
    ab.total_credit,
    ab.balance,
    -- For Balance Sheet accounts
    CASE
        WHEN ab.account_type IN ('asset', 'liability', 'equity') THEN
            CASE
                WHEN ab.balance >= 0 THEN ab.balance
                ELSE 0
            END
        ELSE 0
    END AS debit_balance,
    CASE
        WHEN ab.account_type IN ('asset', 'liability', 'equity') THEN
            CASE
                WHEN ab.balance < 0 THEN ABS(ab.balance)
                ELSE 0
            END
        ELSE 0
    END AS credit_balance,
    ab.first_transaction_date,
    ab.last_transaction_date
FROM account_balances ab
WHERE ab.total_debit > 0 OR ab.total_credit > 0;

-- ============================================
-- BALANCE SHEET VIEW
-- ============================================
CREATE OR REPLACE VIEW public.v_balance_sheet AS
SELECT
    tb.tenant_id,
    tb.account_code,
    tb.account_name_ar,
    tb.account_name_en,
    tb.account_type,
    tb.currency,
    tb.balance,
    CASE
        WHEN tb.account_type = 'asset' THEN tb.balance
        WHEN tb.balance >= 0 THEN tb.balance
        ELSE 0
    END AS asset_amount,
    CASE
        WHEN tb.account_type = 'liability' THEN tb.balance
        WHEN tb.balance < 0 THEN ABS(tb.balance)
        ELSE 0
    END AS liability_amount,
    CASE
        WHEN tb.account_type = 'equity' THEN tb.balance
        ELSE 0
    END AS equity_amount
FROM public.v_trial_balance tb
WHERE tb.account_type IN ('asset', 'liability', 'equity');

-- ============================================
-- INCOME STATEMENT VIEW
-- ============================================
CREATE OR REPLACE VIEW public.v_income_statement AS
SELECT
    tb.tenant_id,
    tb.account_code,
    tb.account_name_ar,
    tb.account_name_en,
    tb.account_type,
    tb.currency,
    tb.balance,
    CASE
        WHEN tb.account_type = 'revenue' THEN tb.balance
        ELSE 0
    END AS revenue_amount,
    CASE
        WHEN tb.account_type = 'expense' THEN tb.balance
        ELSE 0
    END AS expense_amount
FROM public.v_trial_balance tb
WHERE tb.account_type IN ('revenue', 'expense');

-- ============================================
-- VAT SUMMARY VIEW
-- Per fiscal period
-- ============================================
CREATE OR REPLACE VIEW public.v_vat_summary AS
SELECT
    vt.tenant_id,
    fp.id AS fiscal_period_id,
    fp.name AS fiscal_period_name,
    fp.period_number,
    fp.start_date,
    fp.end_date,
    vt.vat_type,
    SUM(vt.taxable_amount) AS total_taxable_amount,
    SUM(vt.vat_amount) AS total_vat_amount,
    -- Count by rate
    jsonb_object_agg(
        vt.vat_percentage::TEXT,
        jsonb_build_object(
            'taxable_amount', SUM(vt.taxable_amount)
                FILTER (WHERE vt.vat_percentage = vt.vat_percentage),
            'vat_amount', SUM(vt.vat_amount)
                FILTER (WHERE vt.vat_percentage = vt.vat_percentage),
            'count', COUNT(*) FILTER (WHERE vt.vat_percentage = vt.vat_percentage)
        )
    ) AS by_rate
FROM public.vat_transactions vt
LEFT JOIN public.fiscal_periods fp ON vt.fiscal_period_id = fp.id
WHERE vt.is_reportable = true
GROUP BY
    vt.tenant_id,
    fp.id,
    fp.name,
    fp.period_number,
    fp.start_date,
    fp.end_date,
    vt.vat_type;

-- ============================================
-- VAT SUMMARY BY PERIOD VIEW (Simplified)
-- ============================================
CREATE OR REPLACE VIEW public.v_vat_summary_by_period AS
SELECT
    tenant_id,
    fiscal_period_id,
    fiscal_period_name,
    period_number,
    start_date,
    end_date,
    SUM(CASE WHEN vat_type = 'output' THEN total_taxable_amount ELSE 0 END) AS output_taxable_amount,
    SUM(CASE WHEN vat_type = 'output' THEN total_vat_amount ELSE 0 END) AS output_vat_amount,
    SUM(CASE WHEN vat_type = 'input' THEN total_taxable_amount ELSE 0 END) AS input_taxable_amount,
    SUM(CASE WHEN vat_type = 'input' THEN total_vat_amount ELSE 0 END) AS input_vat_amount,
    SUM(CASE WHEN vat_type = 'output' THEN total_vat_amount ELSE 0 END) -
    SUM(CASE WHEN vat_type = 'input' THEN total_vat_amount ELSE 0 END) AS net_vat_payable
FROM public.v_vat_summary
GROUP BY
    tenant_id,
    fiscal_period_id,
    fiscal_period_name,
    period_number,
    start_date,
    end_date
ORDER BY start_date DESC;

-- ============================================
-- CUSTOMER BALANCE VIEW
-- For AR Aging
-- ============================================
CREATE OR REPLACE VIEW public.v_customer_balance AS
WITH customer_invoices AS (
    SELECT
        i.tenant_id,
        i.party_id AS customer_id,
        c.code AS customer_code,
        c.name_ar AS customer_name_ar,
        c.name_en AS customer_name_en,
        c.vat_number,
        CASE WHEN i.invoice_type IN ('sales', 'purchase_return') THEN i.total_amount ELSE 0 END AS debit_amount,
        CASE WHEN i.invoice_type IN ('sales_return', 'purchase') THEN i.total_amount ELSE 0 END AS credit_amount,
        i.paid_amount,
        i.invoice_date,
        i.due_date,
        i.balance_amount AS invoice_balance,
        CASE
            WHEN i.due_date < CURRENT_DATE AND i.balance_amount > 0 THEN true
            ELSE false
        END AS is_overdue,
        EXTRACT(DAY FROM (CURRENT_DATE - i.due_date))::INTEGER AS days_overdue
    FROM public.invoices i
    JOIN public.customers c ON i.party_id = c.id
    WHERE i.party_type = 'customer'
    AND i.status NOT IN ('draft', 'cancelled')
),
customer_payments AS (
    SELECT
        p.tenant_id,
        p.party_id AS customer_id,
        -p.amount AS credit_amount
    FROM public.payments p
    WHERE p.party_type = 'customer'
    AND p.status = 'posted'
)
SELECT
    ci.tenant_id,
    ci.customer_id,
    ci.customer_code,
    ci.customer_name_ar,
    ci.customer_name_en,
    ci.vat_number,
    SUM(ci.debit_amount - ci.credit_amount) AS invoice_balance,
    SUM(CASE WHEN ci.is_overdue THEN ci.invoice_balance ELSE 0 END) AS overdue_amount,
    SUM(CASE
        WHEN ci.days_overdue BETWEEN 0 AND 30 AND ci.is_overdue THEN ci.invoice_balance
        ELSE 0
    END) AS overdue_0_30,
    SUM(CASE
        WHEN ci.days_overdue BETWEEN 31 AND 60 AND ci.is_overdue THEN ci.invoice_balance
        ELSE 0
    END) AS overdue_31_60,
    SUM(CASE
        WHEN ci.days_overdue BETWEEN 61 AND 90 AND ci.is_overdue THEN ci.invoice_balance
        ELSE 0
    END) AS overdue_61_90,
    SUM(CASE
        WHEN ci.days_overdue > 90 AND ci.is_overdue THEN ci.invoice_balance
        ELSE 0
    END) AS overdue_90_plus
FROM customer_invoices ci
GROUP BY
    ci.tenant_id,
    ci.customer_id,
    ci.customer_code,
    ci.customer_name_ar,
    ci.customer_name_en,
    ci.vat_number
HAVING SUM(ci.debit_amount - ci.credit_amount) != 0;

-- ============================================
-- VENDOR BALANCE VIEW
-- For AP Aging
-- ============================================
CREATE OR REPLACE VIEW public.v_vendor_balance AS
WITH vendor_invoices AS (
    SELECT
        i.tenant_id,
        i.party_id AS vendor_id,
        v.code AS vendor_code,
        v.name_ar AS vendor_name_ar,
        v.name_en AS vendor_name_en,
        v.vat_number,
        CASE WHEN i.invoice_type IN ('purchase', 'sales_return') THEN i.total_amount ELSE 0 END AS credit_amount,
        CASE WHEN i.invoice_type IN ('purchase_return', 'sales') THEN i.total_amount ELSE 0 END AS debit_amount,
        i.paid_amount,
        i.invoice_date,
        i.due_date,
        i.balance_amount AS invoice_balance,
        CASE
            WHEN i.due_date < CURRENT_DATE AND i.balance_amount > 0 THEN true
            ELSE false
        END AS is_overdue,
        EXTRACT(DAY FROM (CURRENT_DATE - i.due_date))::INTEGER AS days_overdue
    FROM public.invoices i
    JOIN public.vendors v ON i.party_id = v.id
    WHERE i.party_type = 'vendor'
    AND i.status NOT IN ('draft', 'cancelled')
)
SELECT
    vi.tenant_id,
    vi.vendor_id,
    vi.vendor_code,
    vi.vendor_name_ar,
    vi.vendor_name_en,
    vi.vat_number,
    SUM(vi.credit_amount - vi.debit_amount) AS invoice_balance,
    SUM(CASE WHEN vi.is_overdue THEN vi.invoice_balance ELSE 0 END) AS overdue_amount,
    SUM(CASE
        WHEN vi.days_overdue BETWEEN 0 AND 30 AND vi.is_overdue THEN vi.invoice_balance
        ELSE 0
    END) AS overdue_0_30,
    SUM(CASE
        WHEN vi.days_overdue BETWEEN 31 AND 60 AND vi.is_overdue THEN vi.invoice_balance
        ELSE 0
    END) AS overdue_31_60,
    SUM(CASE
        WHEN vi.days_overdue BETWEEN 61 AND 90 AND vi.is_overdue THEN vi.invoice_balance
        ELSE 0
    END) AS overdue_61_90,
    SUM(CASE
        WHEN vi.days_overdue > 90 AND vi.is_overdue THEN vi.invoice_balance
        ELSE 0
    END) AS overdue_90_plus
FROM vendor_invoices vi
GROUP BY
    vi.tenant_id,
    vi.vendor_id,
    vi.vendor_code,
    vi.vendor_name_ar,
    vi.vendor_name_en,
    vi.vat_number
HAVING SUM(vi.credit_amount - vi.debit_amount) != 0;

-- ============================================
-- ACCOUNT MOVEMENTS VIEW
-- Drill-down from reports to journal lines
-- ============================================
CREATE OR REPLACE VIEW public.v_account_movements AS
SELECT
    gl.tenant_id,
    gl.account_code,
    gl.account_name_ar,
    gl.account_name_en,
    gl.account_type,
    gl.journal_id,
    gl.journal_number,
    gl.journal_type,
    gl.transaction_date,
    gl.posting_date,
    gl.line_number,
    gl.description_ar,
    gl.description_en,
    gl.debit,
    gl.credit,
    -- Running balance
    SUM(
        CASE
            WHEN gl.account_type IN ('asset', 'expense') THEN gl.debit - gl.credit
            ELSE gl.credit - gl.debit
        END
    ) OVER (
        PARTITION BY gl.tenant_id, gl.account_id
        ORDER BY gl.transaction_date, gl.journal_number, gl.line_number
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS running_balance,
    gl.cost_center_id,
    gl.cost_center_code,
    gl.branch_name_ar,
    gl.branch_name_en,
    gl.reference,
    gl.reference_type,
    gl.reference_id
FROM public.v_general_ledger gl
ORDER BY
    gl.transaction_date DESC,
    gl.journal_number DESC,
    gl.line_number;

-- ============================================
-- FISCAL PERIOD STATUS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.v_fiscal_period_status AS
SELECT
    fp.tenant_id,
    fp.fiscal_year_id,
    fy.name AS fiscal_year_name,
    fp.id AS fiscal_period_id,
    fp.name AS fiscal_period_name,
    fp.period_number,
    fp.start_date,
    fp.end_date,
    fp.is_locked,
    -- Count transactions in period
    COUNT(DISTINCT j.id) FILTER (WHERE j.status = 'posted') AS posted_journal_count,
    COUNT(DISTINCT j.id) FILTER (WHERE j.status != 'posted') AS draft_journal_count,
    -- Sum of posted amounts
    SUM(j.total_debit) FILTER (WHERE j.status = 'posted') AS total_debit,
    SUM(j.total_credit) FILTER (WHERE j.status = 'posted') AS total_credit,
    -- Check if period can be locked
    CASE
        WHEN fp.is_locked THEN 'locked'
        WHEN COUNT(DISTINCT j.id) FILTER (WHERE j.status != 'posted') > 0 THEN 'has_drafts'
        ELSE 'can_lock'
    END AS lock_status
FROM public.fiscal_periods fp
JOIN public.fiscal_years fy ON fp.fiscal_year_id = fy.id
LEFT JOIN public.journals j ON
    j.tenant_id = fp.tenant_id
    AND j.transaction_date BETWEEN fp.start_date AND fp.end_date
GROUP BY
    fp.tenant_id,
    fp.fiscal_year_id,
    fy.name,
    fp.id,
    fp.name,
    fp.period_number,
    fp.start_date,
    fp.end_date,
    fp.is_locked
ORDER BY
    fy.start_date DESC,
    fp.period_number;
