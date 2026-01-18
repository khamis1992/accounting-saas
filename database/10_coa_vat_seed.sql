-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Seed Data: Bilingual Qatar COA Template & VAT Codes
-- ============================================

-- ============================================
-- VAT CODES FOR QATAR
-- ============================================
INSERT INTO public.vat_codes (tenant_id, code, name_ar, name_en, type, rate, is_default, is_active, effective_date, description)
VALUES
    (NULL, 'VAT0', 'معفى من الضريبة', 'VAT Exempt', 'output', 0, false, true, '2020-01-01'::DATE, 'Goods and services exempt from VAT'),
    (NULL, 'VAT5_OUT', 'ضريبة القيمة المضافة 5% - مبيعات', 'VAT 5% - Output', 'output', 5, true, true, '2020-01-01'::DATE, 'Standard VAT rate for sales in Qatar'),
    (NULL, 'VAT5_IN', 'ضريبة القيمة المضافة 5% - مشتريات', 'VAT 5% - Input', 'input', 5, true, true, '2020-01-01'::DATE, 'Standard VAT rate for purchases in Qatar'),
    (NULL, 'VAT5_ZR', 'ضريبة القيمة المضافة 5% - عكس الخصم', 'VAT 5% - Reverse Charge', 'input', 5, false, true, '2020-01-01'::DATE, 'Reverse charge mechanism for cross-border supplies'),
    (NULL, 'VAT5_OG', 'ضريبة القيمة المضافة 5% - صفر', 'VAT 5% - Outside Gulf', 'output', 5, false, true, '2020-01-01'::DATE, 'VAT on exports outside the Gulf Cooperation Council'),
    (NULL, 'VAT0_OG', 'معفى من الضريبة - خارج دول الخليج', 'VAT Exempt - Outside Gulf', 'output', 0, false, true, '2020-01-01'::DATE, 'Exempt for exports outside GCC')
ON CONFLICT (tenant_id, code) DO NOTHING;

-- ============================================
-- CHART OF ACCOUNTS - QATAR STANDARD TEMPLATE
-- Structure: Assets (1xxx), Liabilities (2xxx), Equity (3xxx), Revenue (4xxx), Expenses (5xxx)
-- ============================================
DO $$
DECLARE
    v_tenant_id UUID;
BEGIN
    -- Get demo tenant ID
    SELECT id INTO v_tenant_id FROM public.tenants WHERE code = 'DEMO001' LIMIT 1;

    IF v_tenant_id IS NULL THEN
        RAISE NOTICE 'Demo tenant not found. Skipping COA seed.';
        RETURN;
    END IF;

    -- ============================================
    -- ASSETS (1xxx) - الأصول
    -- ============================================

    -- 1000 - Current Assets - الأصول المتداولة
    INSERT INTO public.chart_of_accounts (tenant_id, code, name_ar, name_en, type, subtype, level, is_control_account, is_posting_allowed, balance_type)
    VALUES
        (v_tenant_id, '1000', 'الأصول المتداولة', 'Current Assets', 'asset', NULL, 1, true, false, 'debit'),
        (v_tenant_id, '1100', 'النقدية والبنوك', 'Cash and Banks', 'asset', 'current', 2, true, false, 'debit'),
        (v_tenant_id, '1110', 'الصندوق', 'Cash on Hand', 'asset', 'cash', 3, false, true, 'debit'),
        (v_tenant_id, '1120', 'البنوك المحلية', 'Local Banks', 'asset', 'bank', 3, false, true, 'debit'),
        (v_tenant_id, '1130', 'البنوك الأجنبية', 'Foreign Banks', 'asset', 'bank', 3, false, true, 'debit'),
        (v_tenant_id, '1200', 'الذمم المدينة', 'Accounts Receivable', 'asset', 'receivables', 2, true, false, 'debit'),
        (v_tenant_id, '1210', 'العملاء', 'Customers', 'asset', 'customers', 3, false, true, 'debit'),
        (v_tenant_id, '1220', 'مدينون آخرون', 'Other Receivables', 'asset', 'other_receivables', 3, false, true, 'debit'),
        (v_tenant_id, '1300', 'المخزون', 'Inventory', 'asset', 'inventory', 2, true, false, 'debit'),
        (v_tenant_id, '1310', 'مخزون البضائع', 'Merchandise Inventory', 'asset', 'merchandise', 3, false, true, 'debit'),
        (v_tenant_id, '1320', 'مواد خام', 'Raw Materials', 'asset', 'materials', 3, false, true, 'debit'),
        (v_tenant_id, '1400', 'المصروفات المدفوعة مسبقاً', 'Prepaid Expenses', 'asset', 'prepaid', 2, false, true, 'debit'),
        (v_tenant_id, '1500', 'الضريبة القابلة للاسترداد', 'Recoverable VAT', 'asset', 'vat_recoverable', 2, false, true, 'debit');

    -- Update parent IDs for level 2-3 accounts
    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '1000')
    WHERE tenant_id = v_tenant_id AND code IN ('1100', '1200', '1300', '1400', '1500');

    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '1100')
    WHERE tenant_id = v_tenant_id AND code IN ('1110', '1120', '1130');

    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '1200')
    WHERE tenant_id = v_tenant_id AND code IN ('1210', '1220');

    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '1300')
    WHERE tenant_id = v_tenant_id AND code IN ('1310', '1320');

    -- 2000 - Non-Current Assets - الأصول الثابتة
    INSERT INTO public.chart_of_accounts (tenant_id, code, name_ar, name_en, type, subtype, level, is_control_account, is_posting_allowed, balance_type)
    VALUES
        (v_tenant_id, '2000', 'الأصول الثابتة', 'Non-Current Assets', 'asset', NULL, 1, true, false, 'debit'),
        (v_tenant_id, '2100', 'الأصول الملموسة', 'Tangible Assets', 'asset', 'tangible', 2, true, false, 'debit'),
        (v_tenant_id, '2110', 'الأراضي والمباني', 'Land and Buildings', 'asset', 'land_building', 3, false, true, 'debit'),
        (v_tenant_id, '2120', 'الآلات والمعدات', 'Machinery and Equipment', 'asset', 'machinery', 3, false, true, 'debit'),
        (v_tenant_id, '2130', 'الأثاث والتركيبات', 'Furniture and Fixtures', 'asset', 'furniture', 3, false, true, 'debit'),
        (v_tenant_id, '2140', 'وسائل النقل', 'Transport Vehicles', 'asset', 'vehicles', 3, false, true, 'debit'),
        (v_tenant_id, '2150', 'أجهزة الكمبيوتر', 'Computer Equipment', 'asset', 'computers', 3, false, true, 'debit'),
        (v_tenant_id, '2200', 'الأصول غير الملموسة', 'Intangible Assets', 'asset', 'intangible', 2, false, true, 'debit'),
        (v_tenant_id, '2300', 'مخصص الاهتلاك', 'Accumulated Depreciation', 'asset', 'depreciation', 2, false, true, 'credit');

    -- Update parent IDs for non-current assets
    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '2000')
    WHERE tenant_id = v_tenant_id AND code IN ('2100', '2200', '2300');

    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '2100')
    WHERE tenant_id = v_tenant_id AND code IN ('2110', '2120', '2130', '2140', '2150');

    -- ============================================
    -- LIABILITIES (2xxx) - الالتزامات
    -- ============================================

    -- 3000 - Current Liabilities - الالتزامات المتداولة
    INSERT INTO public.chart_of_accounts (tenant_id, code, name_ar, name_en, type, subtype, level, is_control_account, is_posting_allowed, balance_type)
    VALUES
        (v_tenant_id, '3000', 'الالتزامات المتداولة', 'Current Liabilities', 'liability', NULL, 1, true, false, 'credit'),
        (v_tenant_id, '3100', 'الموردين', 'Accounts Payable', 'liability', 'payables', 2, true, false, 'credit'),
        (v_tenant_id, '3110', 'الموردون المحليون', 'Local Suppliers', 'liability', 'local_suppliers', 3, false, true, 'credit'),
        (v_tenant_id, '3120', 'الموردون الأجانب', 'Foreign Suppliers', 'liability', 'foreign_suppliers', 3, false, true, 'credit'),
        (v_tenant_id, '3200', 'الذمم الدائنة', 'Accrued Liabilities', 'liability', 'accrued', 2, false, true, 'credit'),
        (v_tenant_id, '3300', 'ضريبة القيمة المضافة المستحقة', 'VAT Payable', 'liability', 'vat_payable', 2, false, true, 'credit'),
        (v_tenant_id, '3400', 'المستحقات العمالية', 'Payroll Liabilities', 'liability', 'payroll', 2, false, true, 'credit'),
        (v_tenant_id, '3500', 'القروض والسحوبات البنكية', 'Bank Loans and Overdrafts', 'liability', 'loans', 2, false, true, 'credit');

    -- Update parent IDs for current liabilities
    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '3000')
    WHERE tenant_id = v_tenant_id AND code IN ('3100', '3200', '3300', '3400', '3500');

    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '3100')
    WHERE tenant_id = v_tenant_id AND code IN ('3110', '3120');

    -- ============================================
    -- EQUITY (3xxx) - حقوق الملكية
    -- ============================================

    -- 4000 - Owner's Equity - حقوق الملكية
    INSERT INTO public.chart_of_accounts (tenant_id, code, name_ar, name_en, type, subtype, level, is_control_account, is_posting_allowed, balance_type)
    VALUES
        (v_tenant_id, '4000', 'حقوق الملكية', 'Owner''s Equity', 'equity', NULL, 1, true, false, 'credit'),
        (v_tenant_id, '4100', 'رأس المال', 'Capital', 'equity', 'capital', 2, false, true, 'credit'),
        (v_tenant_id, '4200', 'الأرباح المحتجزة', 'Retained Earnings', 'equity', 'retained', 2, false, true, 'credit'),
        (v_tenant_id, '4300', 'الأسهم', 'Shares', 'equity', 'shares', 2, false, true, 'credit');

    -- Update parent IDs for equity
    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '4000')
    WHERE tenant_id = v_tenant_id AND code IN ('4100', '4200', '4300');

    -- ============================================
    -- REVENUE (4xxx) - الإيرادات
    -- ============================================

    -- 5000 - Operating Revenue - الإيرادات التشغيلية
    INSERT INTO public.chart_of_accounts (tenant_id, code, name_ar, name_en, type, subtype, level, is_control_account, is_posting_allowed, balance_type)
    VALUES
        (v_tenant_id, '5000', 'الإيرادات التشغيلية', 'Operating Revenue', 'revenue', NULL, 1, true, false, 'credit'),
        (v_tenant_id, '5100', 'مبيعات السلع والخدمات', 'Sales of Goods and Services', 'revenue', 'sales', 2, true, false, 'credit'),
        (v_tenant_id, '5110', 'مبيعات السلع', 'Sales of Goods', 'revenue', 'goods_sales', 3, false, true, 'credit'),
        (v_tenant_id, '5120', 'مبيعات الخدمات', 'Service Revenue', 'revenue', 'service_sales', 3, false, true, 'credit'),
        (v_tenant_id, '5200', 'إيرادات أخرى', 'Other Revenue', 'revenue', 'other', 2, false, true, 'credit'),
        (v_tenant_id, '5300', 'مردودات المبيعات وخصومات', 'Sales Returns and Allowances', 'revenue', 'returns', 2, false, true, 'debit');

    -- Update parent IDs for revenue
    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '5000')
    WHERE tenant_id = v_tenant_id AND code IN ('5100', '5200', '5300');

    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '5100')
    WHERE tenant_id = v_tenant_id AND code IN ('5110', '5120');

    -- ============================================
    -- EXPENSES (5xxx) - المصروفات
    -- ============================================

    -- 6000 - Cost of Sales - تكلفة المبيعات
    INSERT INTO public.chart_of_accounts (tenant_id, code, name_ar, name_en, type, subtype, level, is_control_account, is_posting_allowed, balance_type)
    VALUES
        (v_tenant_id, '6000', 'تكلفة المبيعات', 'Cost of Goods Sold', 'expense', 'cogs', 1, false, true, 'debit'),
        (v_tenant_id, '6100', 'تكلفة البضائع المباعة', 'Cost of Merchandise Sold', 'expense', 'merchandise_cogs', 2, false, true, 'debit'),
        (v_tenant_id, '6200', 'تكلفة الخدمات المباعة', 'Cost of Services Rendered', 'expense', 'service_cogs', 2, false, true, 'debit');

    -- 7000 - Operating Expenses - المصروفات التشغيلية
    INSERT INTO public.chart_of_accounts (tenant_id, code, name_ar, name_en, type, subtype, level, is_control_account, is_posting_allowed, balance_type)
    VALUES
        (v_tenant_id, '7000', 'المصروفات التشغيلية', 'Operating Expenses', 'expense', NULL, 1, true, false, 'debit'),
        (v_tenant_id, '7100', 'المرتبات والأجور', 'Salaries and Wages', 'expense', 'salaries', 2, false, true, 'debit'),
        (v_tenant_id, '7200', 'الإيجار', 'Rent Expense', 'expense', 'rent', 2, false, true, 'debit'),
        (v_tenant_id, '7300', 'الكهرباء والماء', 'Utilities', 'expense', 'utilities', 2, false, true, 'debit'),
        (v_tenant_id, '7400', 'الصيانة والإصلاحات', 'Maintenance and Repairs', 'expense', 'maintenance', 2, false, true, 'debit'),
        (v_tenant_id, '7500', 'الإعلان والتسويق', 'Advertising and Marketing', 'expense', 'marketing', 2, false, true, 'debit'),
        (v_tenant_id, '7600', 'المواصلات والسفر', 'Travel and Transportation', 'expense', 'travel', 2, false, true, 'debit'),
        (v_tenant_id, '7700', 'المكتب والإمدادات', 'Office Supplies', 'expense', 'supplies', 2, false, true, 'debit'),
        (v_tenant_id, '7800', 'الاتصالات والإنترنت', 'Communication and Internet', 'expense', 'communication', 2, false, true, 'debit'),
        (v_tenant_id, '7900', 'استهلاك الأصول الثابتة', 'Depreciation Expense', 'expense', 'depreciation', 2, false, true, 'debit');

    -- 8000 - Financial Expenses - المصروفات المالية
    INSERT INTO public.chart_of_accounts (tenant_id, code, name_ar, name_en, type, subtype, level, is_control_account, is_posting_allowed, balance_type)
    VALUES
        (v_tenant_id, '8000', 'المصروفات المالية', 'Financial Expenses', 'expense', NULL, 1, false, true, 'debit'),
        (v_tenant_id, '8100', 'فوائد القروض', 'Interest Expense', 'expense', 'interest', 2, false, true, 'debit'),
        (v_tenant_id, '8200', 'خسائر صرف العملات', 'Foreign Exchange Loss', 'expense', 'forex_loss', 2, false, true, 'debit');

    -- 9000 - Other Expenses - مصروفات أخرى
    INSERT INTO public.chart_of_accounts (tenant_id, code, name_ar, name_en, type, subtype, level, is_control_account, is_posting_allowed, balance_type)
    VALUES
        (v_tenant_id, '9000', 'مصروفات أخرى', 'Other Expenses', 'expense', NULL, 1, false, true, 'debit');

    -- Update parent IDs for expenses
    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '7000')
    WHERE tenant_id = v_tenant_id AND code IN ('7100', '7200', '7300', '7400', '7500', '7600', '7700', '7800', '7900');

    UPDATE public.chart_of_accounts SET parent_id = (SELECT id FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND code = '8000')
    WHERE tenant_id = v_tenant_id AND code IN ('8100', '8200');

    -- ============================================
    -- Summary Output
    -- ============================================
    RAISE NOTICE '========================================';
    RAISE NOTICE 'COA Template Seeded Successfully!';
    RAISE NOTICE 'Tenant ID: %', v_tenant_id;
    RAISE NOTICE 'Total Accounts Created: %', (SELECT COUNT(*) FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id);
    RAISE NOTICE 'Account Types:';
    RAISE NOTICE '  - Assets: %', (SELECT COUNT(*) FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND type = 'asset');
    RAISE NOTICE '  - Liabilities: %', (SELECT COUNT(*) FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND type = 'liability');
    RAISE NOTICE '  - Equity: %', (SELECT COUNT(*) FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND type = 'equity');
    RAISE NOTICE '  - Revenue: %', (SELECT COUNT(*) FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND type = 'revenue');
    RAISE NOTICE '  - Expenses: %', (SELECT COUNT(*) FROM public.chart_of_accounts WHERE tenant_id = v_tenant_id AND type = 'expense');
    RAISE NOTICE '========================================';

END $$;

-- ============================================
-- Summary Output
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'VAT Codes Seeded Successfully!';
    RAISE NOTICE 'Total VAT Codes: %', (SELECT COUNT(*) FROM public.vat_codes);
    RAISE NOTICE '========================================';
END $$;
