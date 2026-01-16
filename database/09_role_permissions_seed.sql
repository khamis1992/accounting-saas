-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Seed Data: Role Permissions Assignments
-- ============================================

-- ============================================
-- SUPER ADMIN - All permissions
-- ============================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'SUPER_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- COMPANY ADMIN - Full company access except platform admin
-- ============================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
JOIN public.permissions p ON p.module NOT IN ('platform')
WHERE r.name = 'COMPANY_ADMIN'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- FINANCE MANAGER - Full financial access
-- ============================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'FINANCE_MANAGER'
  AND p.module IN (
      'dashboard', 'coa', 'journals', 'invoices', 'payments',
      'banking', 'expenses', 'assets', 'reports', 'settings'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- ACCOUNTANT - Create and post transactions
-- ============================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'ACCOUNTANT'
  AND (
      -- Dashboard
      (p.module = 'dashboard' AND p.action = 'view')
      -- COA
      OR (p.module = 'coa' AND p.action = 'view')
      -- Journals
      OR (p.module = 'journals' AND p.action IN ('view', 'create', 'edit', 'submit', 'post'))
      -- Invoices
      OR (p.module = 'invoices' AND p.action IN ('view', 'create', 'edit', 'post'))
      -- Payments
      OR (p.module = 'payments' AND p.action IN ('view', 'create', 'allocate'))
      -- Banking (view only)
      OR (p.module = 'banking' AND p.action = 'view')
      -- Expenses
      OR (p.module = 'expenses' AND p.action IN ('view', 'create'))
      -- Reports
      OR (p.module = 'reports' AND p.action = 'view')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- AUDITOR - Read-only access to all financial data
-- ============================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'AUDITOR'
  AND (
      -- Dashboard
      (p.module = 'dashboard' AND p.action = 'view')
      -- COA
      OR (p.module = 'coa' AND p.action = 'view')
      -- Journals
      OR (p.module = 'journals' AND p.action = 'view')
      -- Invoices
      OR (p.module = 'invoices' AND p.action = 'view')
      -- Payments
      OR (p.module = 'payments' AND p.action = 'view')
      -- Banking
      OR (p.module = 'banking' AND p.action IN ('view', 'reconcile'))
      -- Expenses
      OR (p.module = 'expenses' AND p.action = 'view')
      -- Assets
      OR (p.module = 'assets' AND p.action = 'view')
      -- Reports (with export)
      OR (p.module = 'reports' AND p.action IN ('view', 'export'))
      -- VAT
      OR (p.module = 'vat' AND p.action = 'view')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- VIEWER - Limited read access
-- ============================================
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r
CROSS JOIN public.permissions p
WHERE r.name = 'VIEWER'
  AND (
      -- Dashboard
      (p.module = 'dashboard' AND p.action = 'view')
      -- COA
      OR (p.module = 'coa' AND p.action = 'view')
      -- Journals
      OR (p.module = 'journals' AND p.action = 'view')
      -- Invoices
      OR (p.module = 'invoices' AND p.action = 'view')
      -- Payments
      OR (p.module = 'payments' AND p.action = 'view')
      -- Reports
      OR (p.module = 'reports' AND p.action = 'view')
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================
-- Summary of Role Permissions
-- ============================================
DO $$
DECLARE
    v_role_name VARCHAR(50);
    v_permission_count INTEGER;
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Role Permissions Summary';
    RAISE NOTICE '========================================';

    FOR v_role_name, v_permission_count IN
        SELECT r.name, COUNT(rp.permission_id)
        FROM public.roles r
        LEFT JOIN public.role_permissions rp ON r.id = rp.role_id
        GROUP BY r.name
        ORDER BY r.id
    LOOP
        RAISE NOTICE 'Role: % | Permissions: %', v_role_name, v_permission_count;
    END LOOP;

    RAISE NOTICE '========================================';
END $$;
