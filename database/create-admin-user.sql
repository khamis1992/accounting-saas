-- ============================================
-- Create Admin User for Testing
-- ============================================
-- This script creates an admin user in Supabase Auth
-- Email: admin@admin.com
-- Password: 123456

-- Note: You need to run this in Supabase SQL Editor
-- Go to: https://app.supabase.com/project/gbbmicjucestjpxtkjyp/editor

-- 1. Create user in auth.users (Supabase Auth)
-- Note: You CANNOT insert directly into auth.users via SQL for security reasons
-- You MUST use one of these methods:
-- 
-- METHOD 1: Supabase Dashboard
-- - Go to Authentication → Users → Add User
-- - Email: admin@admin.com
-- - Password: 123456
-- - Auto Confirm: YES
--
-- METHOD 2: Use Supabase Admin API (from backend)
-- See backend/scripts/create-demo-admin.ts

-- 2. After creating the user via Dashboard, get the user ID and run this:
-- Replace 'USER_ID_HERE' with the actual UUID from auth.users

DO $$
DECLARE
    v_user_id UUID;
    v_tenant_id UUID;
    v_role_id UUID;
BEGIN
    -- Get the user ID (replace with actual user ID after creating via dashboard)
    -- SELECT id INTO v_user_id FROM auth.users WHERE email = 'admin@admin.com';
    
    -- For now, let's check if DEMO001 tenant exists
    SELECT id INTO v_tenant_id FROM public.tenants WHERE code = 'DEMO001' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        -- Create demo tenant if it doesn't exist
        INSERT INTO public.tenants (
            code,
            name_ar,
            name_en,
            cr_number,
            vat_number,
            base_currency,
            language,
            status,
            subscription_plan
        ) VALUES (
            'DEMO001',
            'شركة تجريبية',
            'Demo Company Ltd.',
            '12345678',
            '302012345600001',
            'QAR',
            'ar',
            'active',
            'professional'
        )
        RETURNING id INTO v_tenant_id;
        
        RAISE NOTICE 'Created demo tenant with ID: %', v_tenant_id;
    ELSE
        RAISE NOTICE 'Demo tenant already exists with ID: %', v_tenant_id;
    END IF;
    
    -- Get COMPANY_ADMIN role
    SELECT id INTO v_role_id FROM public.roles WHERE name = 'COMPANY_ADMIN' LIMIT 1;
    
    RAISE NOTICE 'Tenant ID: %', v_tenant_id;
    RAISE NOTICE 'Role ID: %', v_role_id;
    RAISE NOTICE '';
    RAISE NOTICE 'NEXT STEPS:';
    RAISE NOTICE '1. Go to Supabase Dashboard → Authentication → Users';
    RAISE NOTICE '2. Click "Add User" → "Create new user"';
    RAISE NOTICE '3. Email: admin@admin.com';
    RAISE NOTICE '4. Password: 123456';
    RAISE NOTICE '5. Auto Confirm User: YES';
    RAISE NOTICE '6. After creating, copy the user UUID and run the following SQL:';
    RAISE NOTICE '';
    RAISE NOTICE '-- Replace YOUR_USER_ID_HERE with the actual UUID';
    RAISE NOTICE 'INSERT INTO public.users (id, tenant_id, email, status)';
    RAISE NOTICE 'VALUES (''YOUR_USER_ID_HERE'', ''%'', ''admin@admin.com'', ''active'');', v_tenant_id;
    RAISE NOTICE '';
    RAISE NOTICE 'INSERT INTO public.user_roles (user_id, role_id, tenant_id)';
    RAISE NOTICE 'VALUES (''YOUR_USER_ID_HERE'', ''%'', ''%'');', v_role_id, v_tenant_id;
    
END $$;
