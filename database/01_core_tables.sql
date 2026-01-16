-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Core Tables: Tenants, Users, Roles, Permissions
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TENANTS (Companies)
-- ============================================
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL UNIQUE,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    cr_number VARCHAR(50),
    vat_number VARCHAR(50),
    address_ar TEXT,
    address_en TEXT,
    city_ar VARCHAR(100),
    city_en VARCHAR(100),
    country VARCHAR(2) DEFAULT 'QA',
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    logo_url TEXT,
    base_currency VARCHAR(3) DEFAULT 'QAR',
    language VARCHAR(2) DEFAULT 'ar',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'trial')),
    subscription_plan VARCHAR(50) DEFAULT 'trial',
    trial_ends_at TIMESTAMP WITH TIME ZONE,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_tenants_code ON public.tenants(code);
CREATE INDEX idx_tenants_status ON public.tenants(status);
CREATE INDEX idx_tenants_deleted_at ON public.tenants(deleted_at) WHERE deleted_at IS NOT NULL;

-- ============================================
-- BRANCHES
-- ============================================
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    address_ar TEXT,
    address_en TEXT,
    phone VARCHAR(20),
    email VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_branches_tenant_id ON public.branches(tenant_id);
CREATE INDEX idx_branches_is_active ON public.branches(is_active);

-- ============================================
-- SETTINGS (Company-wide settings)
-- ============================================
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, key)
);

CREATE INDEX idx_settings_tenant_id ON public.settings(tenant_id);
CREATE INDEX idx_settings_key ON public.settings(key);

-- ============================================
-- ROLES
-- ============================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) NOT NULL UNIQUE,
    name_ar VARCHAR(255),
    name_en VARCHAR(255) NOT NULL,
    description TEXT,
    is_system BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default roles
INSERT INTO public.roles (name, name_ar, name_en, description, is_system, is_default) VALUES
('SUPER_ADMIN', 'مسؤول النظام', 'System Super Admin', 'Can manage all tenants and platform settings', true, false),
('COMPANY_ADMIN', 'مدير الشركة', 'Company Admin', 'Full access to company data and settings', true, true),
('FINANCE_MANAGER', 'مدير مالي', 'Finance Manager', 'Full financial access, can approve transactions', true, true),
('ACCOUNTANT', 'محاسب', 'Accountant', 'Can create and post transactions', true, true),
('AUDITOR', 'مدقق', 'Auditor', 'Read-only access to all financial data', true, false),
('VIEWER', 'مستعرض', 'Viewer', 'Limited read access', true, false);

-- ============================================
-- PERMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,
    resource VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(module, action, resource)
);

-- Insert default permissions (will be expanded as needed)
INSERT INTO public.permissions (module, action, resource, description) VALUES
-- Dashboard
('dashboard', 'view', '*', 'View dashboard'),
-- COA
('coa', 'view', '*', 'View chart of accounts'),
('coa', 'create', '*', 'Create chart of accounts'),
('coa', 'edit', '*', 'Edit chart of accounts'),
('coa', 'delete', '*', 'Delete chart of accounts'),
-- Journals
('journals', 'view', '*', 'View journals'),
('journals', 'create', '*', 'Create journals'),
('journals', 'edit', '*', 'Edit journals'),
('journals', 'submit', '*', 'Submit journals for approval'),
('journals', 'approve', '*', 'Approve journals'),
('journals', 'post', '*', 'Post journals to GL'),
('journals', 'reverse', '*', 'Reverse posted journals'),
-- Invoices
('invoices', 'view', '*', 'View invoices'),
('invoices', 'create', 'sales', 'Create sales invoices'),
('invoices', 'create', 'purchases', 'Create purchase bills'),
('invoices', 'edit', '*', 'Edit invoices'),
('invoices', 'approve', '*', 'Approve invoices'),
('invoices', 'post', '*', 'Post invoices to GL'),
-- Payments
('payments', 'view', '*', 'View payments'),
('payments', 'create', 'receipts', 'Create receipt vouchers'),
('payments', 'create', 'payments', 'Create payment vouchers'),
('payments', 'allocate', '*', 'Allocate payments to invoices'),
-- Reports
('reports', 'view', '*', 'View reports'),
('reports', 'export', '*', 'Export reports'),
-- Banking
('banking', 'view', '*', 'View banking'),
('banking', 'reconcile', '*', 'Reconcile bank accounts'),
-- Expenses
('expenses', 'view', '*', 'View expenses'),
('expenses', 'create', '*', 'Create expense claims'),
('expenses', 'approve', '*', 'Approve expenses'),
-- Assets
('assets', 'view', '*', 'View fixed assets'),
('assets', 'create', '*', 'Create fixed assets'),
('assets', 'depreciate', '*', 'Run depreciation'),
-- Settings
('settings', 'view', '*', 'View settings'),
('settings', 'edit', 'company', 'Edit company settings'),
('settings', 'edit', 'users', 'Manage users and roles'),
('settings', 'edit', 'fiscal', 'Manage fiscal periods'),
('settings', 'lock', 'period', 'Lock/unlock fiscal periods');

-- ============================================
-- ROLE_PERMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES public.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role_id ON public.role_permissions(role_id);

-- ============================================
-- USERS (linked to Supabase Auth)
-- ============================================
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name_ar VARCHAR(100),
    first_name_en VARCHAR(100),
    last_name_ar VARCHAR(100),
    last_name_en VARCHAR(100),
    phone VARCHAR(20),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    language VARCHAR(2) DEFAULT 'ar',
    timezone VARCHAR(50) DEFAULT 'Asia/Qatar',
    default_branch_id UUID REFERENCES public.branches(id),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_tenant_id ON public.users(tenant_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_status ON public.users(status);

-- ============================================
-- USER_ROLES (Many-to-Many)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES public.users(id),
    UNIQUE(user_id, role_id, tenant_id)
);

CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON public.user_roles(role_id);
CREATE INDEX idx_user_roles_tenant_id ON public.user_roles(tenant_id);

-- Enable Row Level Security on tenant tables
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Helper Functions
-- ============================================

-- Function to get user tenant and roles
CREATE OR REPLACE FUNCTION public.get_user_context(user_id UUID)
RETURNS TABLE(
    tenant_id UUID,
    role_names TEXT[],
    is_platform_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.tenant_id,
        ARRAY_AGG(DISTINCT r.name),
        EXISTS(
            SELECT 1 FROM public.user_roles ur2
            JOIN public.roles r2 ON ur2.role_id = r2.id
            WHERE ur2.user_id = user_id AND r2.name = 'SUPER_ADMIN'
        ) OR EXISTS(
            -- Check if user has platform admin flag in auth.users metadata
            SELECT 1 FROM auth.users au WHERE au.id = user_id
            AND (au.raw_user_meta_data->>'is_platform_admin')::BOOLEAN = true
        )
    FROM public.users u
    LEFT JOIN public.user_roles ur ON ur.user_id = u.id
    LEFT JOIN public.roles r ON ur.role_id = r.id
    WHERE u.id = user_id
    GROUP BY u.tenant_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION public.user_has_permission(
    user_id UUID,
    p_module VARCHAR,
    p_action VARCHAR,
    p_resource VARCHAR DEFAULT '*'
)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1
        FROM public.user_roles ur
        JOIN public.role_permissions rp ON ur.role_id = rp.role_id
        JOIN public.permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = user_id
        AND p.module = p_module
        AND p.action = p_action
        AND (p.resource = p_resource OR p.resource = '*')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all user permissions
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_id UUID)
RETURNS TABLE(
    module VARCHAR,
    action VARCHAR,
    resource VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT
        p.module,
        p.action,
        p.resource
    FROM public.user_roles ur
    JOIN public.role_permissions rp ON ur.role_id = rp.role_id
    JOIN public.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
