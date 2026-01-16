-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Seed Data: Demo Tenant, Branches, Settings
-- ============================================

-- ============================================
-- DEMO TENANT
-- ============================================
DO $$
DECLARE
    v_tenant_id UUID;
    v_demo_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- Placeholder for demo user
BEGIN
    -- Create demo tenant
    INSERT INTO public.tenants (
        id,
        code,
        name_ar,
        name_en,
        cr_number,
        vat_number,
        address_ar,
        address_en,
        city_ar,
        city_en,
        country,
        phone,
        email,
        base_currency,
        language,
        status,
        subscription_plan
    ) VALUES (
        '10000000-0000-0000-0000-000000000001',
        'DEMO001',
        'شركة تجريبية',
        'Demo Company Ltd.',
        '12345678',
        '302012345600001',
        'طريق الدوحة، منطقة عين خالد، الدوحة',
        'Doha Ring Road, Ain Khalid Area, Doha',
        'الدوحة',
        'Doha',
        'QA',
        '+974 4444 4444',
        'info@demo-company.qa',
        'QAR',
        'ar',
        'active',
        'professional'
    )
    ON CONFLICT (id) DO NOTHING
    RETURNING id INTO v_tenant_id;

    -- Create default cost center
    INSERT INTO public.cost_centers (
        id,
        tenant_id,
        code,
        name_ar,
        name_en,
        is_active
    ) VALUES (
        '10000000-0000-0000-0000-000000000002',
        v_tenant_id,
        'CC001',
        'مركز تكلفة عام',
        'General Cost Center',
        true
    )
    ON CONFLICT DO NOTHING;

    -- Create default settings for tenant
    INSERT INTO public.settings (tenant_id, key, value, description)
    VALUES
        (v_tenant_id, 'company.language', '"ar"', 'Default company language'),
        (v_tenant_id, 'company.date_format', '"DD/MM/YYYY"', 'Date format'),
        (v_tenant_id, 'company.number_format', '"1,234.56"', 'Number format'),
        (v_tenant_id, 'journal_sequence_general', jsonb_build_object('sequence', 0), 'General journal sequence'),
        (v_tenant_id, 'journal_sequence_sales', jsonb_build_object('sequence', 0), 'Sales journal sequence'),
        (v_tenant_id, 'journal_sequence_purchase', jsonb_build_object('sequence', 0), 'Purchase journal sequence'),
        (v_tenant_id, 'journal_sequence_receipt', jsonb_build_object('sequence', 0), 'Receipt journal sequence'),
        (v_tenant_id, 'journal_sequence_payment', jsonb_build_object('sequence', 0), 'Payment journal sequence'),
        (v_tenant_id, 'invoice_sequence_sales', jsonb_build_object('sequence', 0), 'Sales invoice sequence'),
        (v_tenant_id, 'invoice_sequence_purchase', jsonb_build_object('sequence', 0), 'Purchase invoice sequence'),
        (v_tenant_id, 'payment_sequence_receipt', jsonb_build_object('sequence', 0), 'Receipt sequence'),
        (v_tenant_id, 'payment_sequence_payment', jsonb_build_object('sequence', 0), 'Payment sequence'),
        (v_tenant_id, 'expense_sequence', jsonb_build_object('sequence', 0), 'Expense sequence'),
        (v_tenant_id, 'reconciliation_sequence', jsonb_build_object('sequence', 0), 'Reconciliation sequence'),
        (v_tenant_id, 'fiscal.year_start_month', '1', 'Fiscal year start month (1=January)'),
        (v_tenant_id, 'vat.included_in_prices', 'true', 'VAT included in prices by default'),
        (v_tenant_id, 'vat.default_rate', '5', 'Default VAT rate percentage')
    ON CONFLICT (tenant_id, key) DO NOTHING;

    RAISE NOTICE 'Demo tenant created with ID: %', v_tenant_id;
END $$;

-- ============================================
-- DEMO BRANCHES
-- ============================================
INSERT INTO public.branches (
    id,
    tenant_id,
    code,
    name_ar,
    name_en,
    address_ar,
    address_en,
    city_ar,
    city_en,
    phone,
    email,
    is_active
)
SELECT
    gen_random_uuid()::text::uuid,
    id,
    'BR001',
    'الفرع الرئيسي',
    'Main Branch',
    address_ar,
    address_en,
    city_ar,
    city_en,
    phone,
    email,
    true
FROM public.tenants
WHERE code = 'DEMO001'
ON CONFLICT DO NOTHING;

-- Create second branch
INSERT INTO public.branches (
    id,
    tenant_id,
    code,
    name_ar,
    name_en,
    address_ar,
    address_en,
    city_ar,
    city_en,
    phone,
    email,
    is_active
)
SELECT
    gen_random_uuid()::text::uuid,
    id,
    'BR002',
    'فرع لوسيل',
    'Lusail Branch',
    'اللؤلؤة، لوسيل، قطر',
    'The Pearl, Lusail, Qatar',
    'لوسيل',
    'Lusail',
    '+974 5555 5555',
    'lusail@demo-company.qa',
    true
FROM public.tenants
WHERE code = 'DEMO001'
ON CONFLICT DO NOTHING;

-- ============================================
-- DEMO FISCAL YEAR (2026)
-- ============================================
INSERT INTO public.fiscal_years (
    id,
    tenant_id,
    name,
    name_ar,
    start_date,
    end_date,
    is_closed,
    created_by
)
SELECT
    gen_random_uuid()::text::uuid,
    id,
    'FY2026',
    'العام المالي 2026',
    '2026-01-01'::DATE,
    '2026-12-31'::DATE,
    false,
    '00000000-0000-0000-0000-000000000001'::UUID
FROM public.tenants
WHERE code = 'DEMO001'
ON CONFLICT DO NOTHING;

-- ============================================
-- DEMO FISCAL PERIODS (Monthly)
-- ============================================
INSERT INTO public.fiscal_periods (
    id,
    fiscal_year_id,
    tenant_id,
    name,
    name_ar,
    period_number,
    start_date,
    end_date,
    is_locked
)
SELECT
    gen_random_uuid()::text::uuid,
    fy.id,
    fy.tenant_id,
    'Month ' || m::TEXT,
    'شهر ' || m::TEXT,
    m,
    DATE '2026-01-01' + (m - 1 || ' month')::INTERVAL,
    DATE '2026-01-01' + m || ' month'::INTERVAL - INTERVAL '1 day',
    false
FROM public.fiscal_years fy,
    generate_series(1, 12) AS m
WHERE fy.name = 'FY2026'
ON CONFLICT (fiscal_year_id, period_number) DO NOTHING;

-- ============================================
-- DEMO BANK ACCOUNTS
-- ============================================
INSERT INTO public.bank_accounts (
    id,
    tenant_id,
    branch_id,
    code,
    account_name,
    account_number,
    iban,
    bank_name,
    account_type,
    currency,
    is_active,
    is_default
)
SELECT
    gen_random_uuid()::text::uuid,
    t.id,
    b.id,
    'BANK001',
    'البنك التجاري - الرئيسي',
    'Qatar National Bank - Main Account',
    'QA12QNBA000000000000000000012345',
    'QA12QNBA000000000000000000012345',
    'QNB',
    'current',
    'QAR',
    true,
    true
FROM public.tenants t
JOIN public.branches b ON t.id = b.tenant_id AND b.code = 'BR001'
WHERE t.code = 'DEMO001'
ON CONFLICT DO NOTHING;

-- Create cash account
INSERT INTO public.bank_accounts (
    id,
    tenant_id,
    branch_id,
    code,
    account_name,
    account_number,
    bank_name,
    account_type,
    currency,
    is_active,
    is_default
)
SELECT
    gen_random_uuid()::text::uuid,
    t.id,
    b.id,
    'CASH001',
    'الصندوق الرئيسي',
    'Main Cash',
    'CASH',
    'Cash',
    'checking',
    'QAR',
    true,
    false
FROM public.tenants t
JOIN public.branches b ON t.id = b.tenant_id AND b.code = 'BR001'
WHERE t.code = 'DEMO001'
ON CONFLICT DO NOTHING;

-- ============================================
-- DEMO COST CENTERS
-- ============================================
INSERT INTO public.cost_centers (
    tenant_id,
    code,
    name_ar,
    name_en,
    branch_id,
    is_active,
    description
)
SELECT
    t.id,
    'CC' || LPAD(s::TEXT, 3, '0'),
    CASE s
        WHEN 1 THEN 'قسم المبيعات'
        WHEN 2 THEN 'قسم المشتريات'
        WHEN 3 THEN 'قسم الإدارة'
        WHEN 4 THEN 'قسم العمليات'
    END,
    CASE s
        WHEN 1 THEN 'Sales Department'
        WHEN 2 THEN 'Purchasing Department'
        WHEN 3 THEN 'Administration Department'
        WHEN 4 THEN 'Operations Department'
    END,
    b.id,
    true,
    CASE s
        WHEN 1 THEN 'جميع الأنشطة المتعلقة بالمبيعات'
        WHEN 2 THEN 'جميع الأنشطة المتعلقة بالمشتريات'
        WHEN 3 THEN 'جميع الأنشطة الإدارية'
        WHEN 4 THEN 'جميع الأنشطة التشغيلية'
    END
FROM public.tenants t
JOIN public.branches b ON t.id = b.tenant_id AND b.code = 'BR001'
CROSS JOIN generate_series(1, 4) AS s
WHERE t.code = 'DEMO001'
ON CONFLICT DO NOTHING;

-- Output success message
DO $$
BEGIN
    RAISE NOTICE 'Demo data seeded successfully!';
    RAISE NOTICE 'Tenant: DEMO001';
    RAISE NOTICE 'Branches: BR001 (Main), BR002 (Lusail)';
    RAISE NOTICE 'Fiscal Year: FY2026 with 12 periods';
    RAISE NOTICE 'Bank Accounts: BANK001 (QNB), CASH001 (Cash)';
    RAISE NOTICE 'Cost Centers: 4 departments created';
END $$;
