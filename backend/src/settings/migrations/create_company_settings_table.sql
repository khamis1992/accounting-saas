-- Create company_settings table
-- Stores company configuration and settings for each tenant

CREATE TABLE IF NOT EXISTS company_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  -- Basic Company Information
  company_name_en VARCHAR(255) NOT NULL,
  company_name_ar VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  business_type VARCHAR(50) DEFAULT 'other',
  tax_number VARCHAR(100),
  registration_number VARCHAR(100),
  industry VARCHAR(50) DEFAULT 'other',
  description TEXT,

  -- Contact Information
  email VARCHAR(255),
  phone VARCHAR(50),
  website VARCHAR(255),
  logo_url TEXT,

  -- Address (stored as JSONB for flexibility)
  address JSONB DEFAULT '{"street":null,"city":null,"state":null,"postal_code":null,"country":"QA"}'::jsonb,

  -- Tax Settings (stored as JSONB)
  tax_settings JSONB DEFAULT '{"vat_enabled":false,"vat_number":null,"default_tax_rate":0,"tax_calculation_method":"exclusive","is_tax_enabled":false}'::jsonb,

  -- Currency Settings (stored as JSONB)
  currency_settings JSONB DEFAULT '{"base_currency":"QAR","decimal_places":2,"thousands_separator":",","decimal_separator":".","symbol_position":"before"}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),

  -- Ensure one company settings record per tenant
  UNIQUE(tenant_id)
);

-- Create index on tenant_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_company_settings_tenant_id ON company_settings(tenant_id);

-- Create index on company names for search
CREATE INDEX IF NOT EXISTS idx_company_settings_name_en ON company_settings(company_name_en);
CREATE INDEX IF NOT EXISTS idx_company_settings_name_ar ON company_settings(company_name_ar);

-- Add comment
COMMENT ON TABLE company_settings IS 'Company settings and configuration for each tenant';
COMMENT ON COLUMN company_settings.address IS 'Company address as JSONB: {street, city, state, postal_code, country}';
COMMENT ON COLUMN company_settings.tax_settings IS 'Tax settings as JSONB: {vat_enabled, vat_number, default_tax_rate, tax_calculation_method, is_tax_enabled}';
COMMENT ON COLUMN company_settings.currency_settings IS 'Currency settings as JSONB: {base_currency, decimal_places, thousands_separator, decimal_separator, symbol_position}';

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_company_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_settings_updated_at
  BEFORE UPDATE ON company_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_company_settings_updated_at();
