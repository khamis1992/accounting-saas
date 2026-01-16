-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Business Tables: Customers, Vendors, Invoices, Payments
-- ============================================

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    vat_number VARCHAR(50),
    national_id VARCHAR(50),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address_ar TEXT,
    address_en TEXT,
    city_ar VARCHAR(100),
    city_en VARCHAR(100),
    country VARCHAR(2) DEFAULT 'QA',
    credit_limit DECIMAL(18,2) DEFAULT 0,
    payment_terms_days INTEGER DEFAULT 30,
    tax_number VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_customers_tenant_id ON public.customers(tenant_id);
CREATE INDEX idx_customers_is_active ON public.customers(is_active);
CREATE INDEX idx_customers_vat_number ON public.customers(vat_number);

-- ============================================
-- VENDORS (Suppliers)
-- ============================================
CREATE TABLE IF NOT EXISTS public.vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    vat_number VARCHAR(50),
    national_id VARCHAR(50),
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address_ar TEXT,
    address_en TEXT,
    city_ar VARCHAR(100),
    city_en VARCHAR(100),
    country VARCHAR(2) DEFAULT 'QA',
    payment_terms_days INTEGER DEFAULT 30,
    bank_name VARCHAR(255),
    bank_account_number VARCHAR(100),
    iban VARCHAR(50),
    swift_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_vendors_tenant_id ON public.vendors(tenant_id);
CREATE INDEX idx_vendors_is_active ON public.vendors(is_active);
CREATE INDEX idx_vendors_vat_number ON public.vendors(vat_number);

-- ============================================
-- INVOICES
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    invoice_number VARCHAR(50) NOT NULL,
    invoice_type VARCHAR(20) NOT NULL CHECK (invoice_type IN ('sales', 'purchase', 'sales_return', 'purchase_return')),
    party_id UUID NOT NULL, -- customer_id for sales, vendor_id for purchase
    party_type VARCHAR(20) NOT NULL CHECK (party_type IN ('customer', 'vendor')),
    invoice_date DATE NOT NULL,
    due_date DATE,
    currency VARCHAR(3) NOT NULL DEFAULT 'QAR',
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    subtotal DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    taxable_amount DECIMAL(18,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    total_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    paid_amount DECIMAL(18,2) DEFAULT 0,
    balance_amount DECIMAL(18,2) DEFAULT 0,
    notes TEXT,
    internal_notes TEXT,
    attachment_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'approved', 'posted', 'paid', 'partially_paid', 'overdue', 'cancelled'
    )),
    posted_journal_id UUID REFERENCES public.journals(id),
    submitted_by UUID REFERENCES public.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID REFERENCES public.users(id),
    posted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, invoice_number)
);

CREATE INDEX idx_invoices_tenant_id ON public.invoices(tenant_id);
CREATE INDEX idx_invoices_branch_id ON public.invoices(branch_id);
CREATE INDEX idx_invoices_invoice_date ON public.invoices(invoice_date);
CREATE INDEX idx_invoices_party ON public.invoices(party_type, party_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_invoice_type ON public.invoices(invoice_type);
CREATE INDEX idx_invoices_posted_journal_id ON public.invoices(posted_journal_id);

-- ============================================
-- INVOICE LINES
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    line_number INTEGER NOT NULL,
    item_code VARCHAR(50),
    description_ar TEXT NOT NULL,
    description_en TEXT,
    quantity DECIMAL(18,2) NOT NULL DEFAULT 1,
    unit_of_measure VARCHAR(20),
    unit_price DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(18,2) DEFAULT 0,
    discount_percentage DECIMAL(5,2) DEFAULT 0,
    taxable_amount DECIMAL(18,2) DEFAULT 0,
    tax_code_id UUID,
    tax_percentage DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(18,2) DEFAULT 0,
    line_total DECIMAL(18,2) NOT NULL DEFAULT 0,
    account_id UUID REFERENCES public.chart_of_accounts(id),
    cost_center_id UUID REFERENCES public.cost_centers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(invoice_id, line_number),
    CHECK (quantity >= 0)
);

CREATE INDEX idx_invoice_lines_invoice_id ON public.invoice_lines(invoice_id);
CREATE INDEX idx_invoice_lines_account_id ON public.invoice_lines(account_id);

-- ============================================
-- INVOICE TAXES
-- ============================================
CREATE TABLE IF NOT EXISTS public.invoice_taxes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    tax_code_id UUID NOT NULL,
    tax_type VARCHAR(20) NOT NULL CHECK (tax_type IN ('output', 'input')),
    tax_name VARCHAR(100) NOT NULL,
    tax_percentage DECIMAL(5,2) NOT NULL,
    taxable_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(invoice_id, tax_code_id)
);

CREATE INDEX idx_invoice_taxes_invoice_id ON public.invoice_taxes(invoice_id);

-- ============================================
-- PAYMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id),
    payment_number VARCHAR(50) NOT NULL,
    payment_type VARCHAR(20) NOT NULL CHECK (payment_type IN ('receipt', 'payment')),
    party_id UUID NOT NULL, -- customer_id for receipts, vendor_id for payments
    party_type VARCHAR(20) NOT NULL CHECK (party_type IN ('customer', 'vendor')),
    payment_date DATE NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'QAR',
    exchange_rate DECIMAL(18,6) DEFAULT 1,
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    unallocated_amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR(50) CHECK (payment_method IN (
        'cash', 'bank_transfer', 'check', 'credit_card', 'online', 'other'
    )),
    reference_number VARCHAR(100),
    check_number VARCHAR(50),
    check_date DATE,
    bank_account_id UUID,
    description_ar TEXT,
    description_en TEXT,
    notes TEXT,
    attachment_url TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'approved', 'posted', 'cancelled'
    )),
    posted_journal_id UUID REFERENCES public.journals(id),
    submitted_by UUID REFERENCES public.users(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID REFERENCES public.users(id),
    posted_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    deleted_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(tenant_id, payment_number)
);

CREATE INDEX idx_payments_tenant_id ON public.payments(tenant_id);
CREATE INDEX idx_payments_branch_id ON public.payments(branch_id);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_party ON public.payments(party_type, party_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_posted_journal_id ON public.payments(posted_journal_id);

-- ============================================
-- PAYMENT ALLOCATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.payment_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    invoice_id UUID NOT NULL REFERENCES public.invoices(id),
    allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    discount_allowed DECIMAL(18,2) DEFAULT 0,
    write_off DECIMAL(18,2) DEFAULT 0,
    notes TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payment_allocations_payment_id ON public.payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_invoice_id ON public.payment_allocations(invoice_id);

-- ============================================
-- VAT CODES
-- ============================================
CREATE TABLE IF NOT EXISTS public.vat_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    name_en VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('input', 'output')),
    rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    is_default BOOLEAN DEFAULT false,
    is_reverse_charge BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    effective_date DATE NOT NULL,
    expiry_date DATE,
    description TEXT,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tenant_id, code)
);

CREATE INDEX idx_vat_codes_tenant_id ON public.vat_codes(tenant_id);
CREATE INDEX idx_vat_codes_is_active ON public.vat_codes(is_active);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Generate invoice number
CREATE OR REPLACE FUNCTION public.generate_invoice_number(
    p_tenant_id UUID,
    p_invoice_type VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_sequence BIGINT;
    v_year VARCHAR(4);
BEGIN
    v_prefix := CASE
        WHEN p_invoice_type = 'sales' THEN 'INV'
        WHEN p_invoice_type = 'purchase' THEN 'BIL'
        WHEN p_invoice_type = 'sales_return' THEN 'CRN'
        WHEN p_invoice_type = 'purchase_return' THEN 'DRN'
        ELSE 'INV'
    END;

    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;

    v_sequence := COALESCE(
        (SELECT (value->>'sequence')::BIGINT FROM public.settings
         WHERE tenant_id = p_tenant_id AND key = 'invoice_sequence_' || p_invoice_type),
        0
    ) + 1;

    INSERT INTO public.settings (tenant_id, key, value)
    VALUES (p_tenant_id, 'invoice_sequence_' || p_invoice_type, jsonb_build_object('sequence', v_sequence))
    ON CONFLICT (tenant_id, key)
    DO UPDATE SET value = jsonb_build_object('sequence', v_sequence), updated_at = NOW();

    RETURN v_prefix || '-' || v_year || '-' || LPAD(v_sequence::VARCHAR, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Generate payment number
CREATE OR REPLACE FUNCTION public.generate_payment_number(
    p_tenant_id UUID,
    p_payment_type VARCHAR
)
RETURNS VARCHAR AS $$
DECLARE
    v_prefix VARCHAR(10);
    v_sequence BIGINT;
    v_year VARCHAR(4);
BEGIN
    v_prefix := CASE
        WHEN p_payment_type = 'receipt' THEN 'RCT'
        WHEN p_payment_type = 'payment' THEN 'PAY'
        ELSE 'PAY'
    END;

    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::VARCHAR;

    v_sequence := COALESCE(
        (SELECT (value->>'sequence')::BIGINT FROM public.settings
         WHERE tenant_id = p_tenant_id AND key = 'payment_sequence_' || p_payment_type),
        0
    ) + 1;

    INSERT INTO public.settings (tenant_id, key, value)
    VALUES (p_tenant_id, 'payment_sequence_' || p_payment_type, jsonb_build_object('sequence', v_sequence))
    ON CONFLICT (tenant_id, key)
    DO UPDATE SET value = jsonb_build_object('sequence', v_sequence), updated_at = NOW();

    RETURN v_prefix || '-' || v_year || '-' || LPAD(v_sequence::VARCHAR, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_taxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vat_codes ENABLE ROW LEVEL SECURITY;
