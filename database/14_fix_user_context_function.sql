-- Migration: Fix get_user_context function and add missing permissions
-- Date: 2026-01-19
-- Description: Fixes SQL ambiguity error in get_user_context function and adds dashboard:read permission
-- Author: System Administrator
-- Related Issue: Backend authentication and dashboard loading issues

-- ============================================================================
-- 1. Fix get_user_context function
-- ============================================================================
-- Problem: The function had parameter name conflicts causing SQL ambiguity error
-- Solution: Use qualified column references (get_user_context.user_id)

DROP FUNCTION IF EXISTS public.get_user_context(uuid);

CREATE FUNCTION public.get_user_context(user_id uuid)
RETURNS TABLE(tenant_id uuid, role_names text[], is_platform_admin boolean)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.tenant_id,
        ARRAY_AGG(DISTINCT r.name)::text[],
        EXISTS(
            SELECT 1 FROM public.user_roles ur2
            JOIN public.roles r2 ON ur2.role_id = r2.id
            WHERE ur2.user_id = get_user_context.user_id 
            AND r2.name = 'SUPER_ADMIN'
        ) OR EXISTS(
            SELECT 1 FROM auth.users au 
            WHERE au.id = get_user_context.user_id
            AND (au.raw_user_meta_data->>'is_platform_admin')::BOOLEAN = true
        )
    FROM public.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    LEFT JOIN public.roles r ON ur.role_id = r.id
    WHERE u.id = get_user_context.user_id
    GROUP BY u.tenant_id;
END;
$$;

-- Add comment to document the fix
COMMENT ON FUNCTION public.get_user_context(uuid) IS 
'Returns user tenant context including tenant_id, role names, and platform admin status. 
Fixed: 2026-01-19 - Resolved SQL ambiguity error by using qualified parameter references.';

-- ============================================================================
-- 2. Add missing dashboard:read permission
-- ============================================================================
-- Problem: Backend requires dashboard:read but only dashboard:view existed
-- Solution: Create the permission and assign to COMPANY_ADMIN role

-- Insert the permission if it doesn't exist
INSERT INTO public.permissions (module, action, resource, description)
VALUES ('dashboard', 'read', '*', 'View dashboard data and statistics')
ON CONFLICT (module, action, resource) DO UPDATE
SET description = EXCLUDED.description;

-- Get the permission ID and COMPANY_ADMIN role ID, then create the role_permission
DO $$
DECLARE
    v_permission_id uuid;
    v_role_id uuid;
BEGIN
    -- Get the dashboard:read permission ID
    SELECT id INTO v_permission_id
    FROM public.permissions
    WHERE module = 'dashboard' AND action = 'read' AND resource = '*';

    -- Get the COMPANY_ADMIN role ID
    SELECT id INTO v_role_id
    FROM public.roles
    WHERE name = 'COMPANY_ADMIN';

    -- Insert the role_permission if both IDs exist
    IF v_permission_id IS NOT NULL AND v_role_id IS NOT NULL THEN
        INSERT INTO public.role_permissions (role_id, permission_id)
        VALUES (v_role_id, v_permission_id)
        ON CONFLICT (role_id, permission_id) DO NOTHING;
        
        RAISE NOTICE 'Successfully assigned dashboard:read permission to COMPANY_ADMIN role';
    ELSE
        RAISE WARNING 'Could not find permission or role IDs';
    END IF;
END;
$$;

-- ============================================================================
-- 3. Verification queries
-- ============================================================================
-- Uncomment these to verify the migration was successful:

-- Test the fixed function (replace with actual user_id)
-- SELECT * FROM get_user_context('93e982a9-f55a-41db-a24b-4928bac15835');

-- Verify dashboard:read permission exists
-- SELECT * FROM public.permissions WHERE module = 'dashboard' AND action = 'read';

-- Verify COMPANY_ADMIN has dashboard:read permission
-- SELECT r.name as role_name, p.module, p.action, p.resource
-- FROM public.role_permissions rp
-- JOIN public.roles r ON rp.role_id = r.id
-- JOIN public.permissions p ON rp.permission_id = p.id
-- WHERE r.name = 'COMPANY_ADMIN' AND p.module = 'dashboard';

-- ============================================================================
-- Migration Complete
-- ============================================================================
