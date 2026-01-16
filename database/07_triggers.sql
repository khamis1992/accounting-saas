-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Triggers: Audit Logging, Timestamps
-- ============================================

-- ============================================
-- Helper Function: Log Audit
-- ============================================
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_user_email VARCHAR(255);
    v_user_name VARCHAR(255);
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed_fields TEXT[];
BEGIN
    -- Get user info
    SELECT id, email,
           CONCAT(first_name_en, ' ', last_name_en)
    INTO v_user_id, v_user_email, v_user_name
    FROM public.users
    WHERE id = auth.uid();

    -- Determine old/new values based on operation
    IF TG_OP = 'DELETE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    ELSIF TG_OP = 'INSERT' THEN
        v_old_values := NULL;
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'UPDATE' THEN
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    END IF;

    -- Get changed fields for UPDATE
    IF TG_OP = 'UPDATE' THEN
        SELECT ARRAY_AGG(key)
        INTO v_changed_fields
        FROM jsonb_each_text(v_old_values)
        WHERE value != (v_new_values->>key);
    END IF;

    -- Insert audit log
    INSERT INTO public.audit_logs (
        tenant_id,
        table_name,
        record_id,
        action,
        old_values,
        new_values,
        changed_fields,
        user_id,
        user_email,
        user_name
    ) VALUES (
        COALESCE(NEW.tenant_id, OLD.tenant_id),
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        TG_OP,
        v_old_values,
        v_new_values,
        v_changed_fields,
        v_user_id,
        v_user_email,
        v_user_name
    );

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Helper Function: Update Timestamp
-- ============================================
CREATE OR REPLACE FUNCTION public.update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Create Audit Triggers for Critical Tables
-- ============================================

-- Chart of Accounts
DROP TRIGGER IF EXISTS chart_of_accounts_audit_trigger ON public.chart_of_accounts;
CREATE TRIGGER chart_of_accounts_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.chart_of_accounts
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Journals
DROP TRIGGER IF EXISTS journals_audit_trigger ON public.journals;
CREATE TRIGGER journals_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.journals
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Journal Lines
DROP TRIGGER IF EXISTS journal_lines_audit_trigger ON public.journal_lines;
CREATE TRIGGER journal_lines_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.journal_lines
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Invoices
DROP TRIGGER IF EXISTS invoices_audit_trigger ON public.invoices;
CREATE TRIGGER invoices_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Payments
DROP TRIGGER IF EXISTS payments_audit_trigger ON public.payments;
CREATE TRIGGER payments_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Expenses
DROP TRIGGER IF EXISTS expenses_audit_trigger ON public.expenses;
CREATE TRIGGER expenses_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Assets
DROP TRIGGER IF EXISTS assets_audit_trigger ON public.assets;
CREATE TRIGGER assets_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Customers
DROP TRIGGER IF EXISTS customers_audit_trigger ON public.customers;
CREATE TRIGGER customers_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Vendors
DROP TRIGGER IF EXISTS vendors_audit_trigger ON public.vendors;
CREATE TRIGGER vendors_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Bank Accounts
DROP TRIGGER IF EXISTS bank_accounts_audit_trigger ON public.bank_accounts;
CREATE TRIGGER bank_accounts_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Fiscal Periods
DROP TRIGGER IF EXISTS fiscal_periods_audit_trigger ON public.fiscal_periods;
CREATE TRIGGER fiscal_periods_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.fiscal_periods
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- Users (critical)
DROP TRIGGER IF EXISTS users_audit_trigger ON public.users;
CREATE TRIGGER users_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();

-- ============================================
-- Create Update Timestamp Triggers
-- ============================================

-- Tenants
DROP TRIGGER IF EXISTS tenants_update_timestamp ON public.tenants;
CREATE TRIGGER tenants_update_timestamp
BEFORE UPDATE ON public.tenants
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Branches
DROP TRIGGER IF EXISTS branches_update_timestamp ON public.branches;
CREATE TRIGGER branches_update_timestamp
BEFORE UPDATE ON public.branches
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Settings
DROP TRIGGER IF EXISTS settings_update_timestamp ON public.settings;
CREATE TRIGGER settings_update_timestamp
BEFORE UPDATE ON public.settings
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Users
DROP TRIGGER IF EXISTS users_update_timestamp ON public.users;
CREATE TRIGGER users_update_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Roles
DROP TRIGGER IF EXISTS roles_update_timestamp ON public.roles;
CREATE TRIGGER roles_update_timestamp
BEFORE UPDATE ON public.roles
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Permissions
DROP TRIGGER IF EXISTS permissions_update_timestamp ON public.permissions;
CREATE TRIGGER permissions_update_timestamp
BEFORE UPDATE ON public.permissions
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Chart of Accounts
DROP TRIGGER IF EXISTS chart_of_accounts_update_timestamp ON public.chart_of_accounts;
CREATE TRIGGER chart_of_accounts_update_timestamp
BEFORE UPDATE ON public.chart_of_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Cost Centers
DROP TRIGGER IF EXISTS cost_centers_update_timestamp ON public.cost_centers;
CREATE TRIGGER cost_centers_update_timestamp
BEFORE UPDATE ON public.cost_centers
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Fiscal Years
DROP TRIGGER IF EXISTS fiscal_years_update_timestamp ON public.fiscal_years;
CREATE TRIGGER fiscal_years_update_timestamp
BEFORE UPDATE ON public.fiscal_years
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Fiscal Periods
DROP TRIGGER IF EXISTS fiscal_periods_update_timestamp ON public.fiscal_periods;
CREATE TRIGGER fiscal_periods_update_timestamp
BEFORE UPDATE ON public.fiscal_periods
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Journals
DROP TRIGGER IF EXISTS journals_update_timestamp ON public.journals;
CREATE TRIGGER journals_update_timestamp
BEFORE UPDATE ON public.journals
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Journal Lines
DROP TRIGGER IF EXISTS journal_lines_update_timestamp ON public.journal_lines;
CREATE TRIGGER journal_lines_update_timestamp
BEFORE UPDATE ON public.journal_lines
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Customers
DROP TRIGGER IF EXISTS customers_update_timestamp ON public.customers;
CREATE TRIGGER customers_update_timestamp
BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Vendors
DROP TRIGGER IF EXISTS vendors_update_timestamp ON public.vendors;
CREATE TRIGGER vendors_update_timestamp
BEFORE UPDATE ON public.vendors
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Invoices
DROP TRIGGER IF EXISTS invoices_update_timestamp ON public.invoices;
CREATE TRIGGER invoices_update_timestamp
BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Invoice Lines
DROP TRIGGER IF EXISTS invoice_lines_update_timestamp ON public.invoice_lines;
CREATE TRIGGER invoice_lines_update_timestamp
BEFORE UPDATE ON public.invoice_lines
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Payments
DROP TRIGGER IF EXISTS payments_update_timestamp ON public.payments;
CREATE TRIGGER payments_update_timestamp
BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Payment Allocations
DROP TRIGGER IF EXISTS payment_allocations_update_timestamp ON public.payment_allocations;
CREATE TRIGGER payment_allocations_update_timestamp
BEFORE UPDATE ON public.payment_allocations
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- VAT Codes
DROP TRIGGER IF EXISTS vat_codes_update_timestamp ON public.vat_codes;
CREATE TRIGGER vat_codes_update_timestamp
BEFORE UPDATE ON public.vat_codes
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Bank Accounts
DROP TRIGGER IF EXISTS bank_accounts_update_timestamp ON public.bank_accounts;
CREATE TRIGGER bank_accounts_update_timestamp
BEFORE UPDATE ON public.bank_accounts
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Bank Transactions
DROP TRIGGER IF EXISTS bank_transactions_update_timestamp ON public.bank_transactions;
CREATE TRIGGER bank_transactions_update_timestamp
BEFORE UPDATE ON public.bank_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Bank Reconciliations
DROP TRIGGER IF EXISTS bank_reconciliations_update_timestamp ON public.bank_reconciliations;
CREATE TRIGGER bank_reconciliations_update_timestamp
BEFORE UPDATE ON public.bank_reconciliations
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Expenses
DROP TRIGGER IF EXISTS expenses_update_timestamp ON public.expenses;
CREATE TRIGGER expenses_update_timestamp
BEFORE UPDATE ON public.expenses
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Expense Lines
DROP TRIGGER IF EXISTS expense_lines_update_timestamp ON public.expense_lines;
CREATE TRIGGER expense_lines_update_timestamp
BEFORE UPDATE ON public.expense_lines
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Assets
DROP TRIGGER IF EXISTS assets_update_timestamp ON public.assets;
CREATE TRIGGER assets_update_timestamp
BEFORE UPDATE ON public.assets
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- Asset Depreciation Runs
DROP TRIGGER IF EXISTS asset_depreciation_runs_update_timestamp ON public.asset_depreciation_runs;
CREATE TRIGGER asset_depreciation_runs_update_timestamp
BEFORE UPDATE ON public.asset_depreciation_runs
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- VAT Transactions
DROP TRIGGER IF EXISTS vat_transactions_update_timestamp ON public.vat_transactions;
CREATE TRIGGER vat_transactions_update_timestamp
BEFORE UPDATE ON public.vat_transactions
FOR EACH ROW EXECUTE FUNCTION public.update_timestamp();

-- ============================================
-- Special Triggers for Business Logic
-- ============================================

-- Trigger: Auto-create VAT transactions when invoice is posted
CREATE OR REPLACE FUNCTION public.create_vat_transactions_on_invoice_post()
RETURNS TRIGGER AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- Only create VAT transactions when invoice is posted
    IF NEW.status = 'posted' AND OLD.status != 'posted' THEN
        -- Delete existing VAT transactions for this invoice
        DELETE FROM public.vat_transactions
        WHERE source_type = 'invoice'
        AND source_id = NEW.id;

        -- Create VAT transactions from invoice taxes
        FOR v_record IN
            SELECT it.*, i.party_id, i.invoice_date
            FROM public.invoice_taxes it
            JOIN public.invoices i ON it.invoice_id = i.id
            WHERE it.invoice_id = NEW.id
        LOOP
            INSERT INTO public.vat_transactions (
                tenant_id,
                transaction_type,
                transaction_date,
                source_type,
                source_id,
                vat_type,
                vat_code_id,
                vat_percentage,
                taxable_amount,
                vat_amount,
                currency,
                exchange_rate,
                fiscal_period_id
            )
            SELECT
                NEW.tenant_id,
                CASE WHEN NEW.invoice_type IN ('sales', 'sales_return') THEN 'sales' ELSE 'purchases' END,
                v_record.invoice_date,
                'invoice',
                NEW.id,
                v_record.vat_type,
                v_record.vat_code_id,
                v_record.vat_percentage,
                v_record.taxable_amount,
                v_record.tax_amount,
                NEW.currency,
                NEW.exchange_rate,
                fp.id
            FROM public.fiscal_periods fp
            WHERE NEW.invoice_date BETWEEN fp.start_date AND fp.end_date
            AND fp.tenant_id = NEW.tenant_id;
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS create_vat_transactions_on_invoice_post_trigger ON public.invoices;
CREATE TRIGGER create_vat_transactions_on_invoice_post_trigger
AFTER UPDATE ON public.invoices
FOR EACH ROW
WHEN (NEW.status = 'posted' AND OLD.status != 'posted')
EXECUTE FUNCTION public.create_vat_transactions_on_invoice_post();

-- Trigger: Update invoice status based on payments
CREATE OR REPLACE FUNCTION public.update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    v_total_paid DECIMAL(18,2);
    v_invoice_amount DECIMAL(18,2);
BEGIN
    -- Only check after allocation insert/update/delete
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        -- Get invoice details
        SELECT i.total_amount
        INTO v_invoice_amount
        FROM public.invoices i
        WHERE i.id = COALESCE(NEW.invoice_id, OLD.invoice_id);

        -- Calculate total paid
        SELECT COALESCE(SUM(amount), 0)
        INTO v_total_paid
        FROM public.payment_allocations
        WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);

        -- Update invoice status based on payment
        IF v_total_paid >= v_invoice_amount THEN
            UPDATE public.invoices
            SET paid_amount = v_total_paid,
                balance_amount = v_invoice_amount - v_total_paid,
                status = CASE WHEN balance_amount <= 0 THEN 'paid' ELSE 'partially_paid' END
            WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
        ELSEIF v_total_paid > 0 THEN
            UPDATE public.invoices
            SET paid_amount = v_total_paid,
                balance_amount = v_invoice_amount - v_total_paid,
                status = 'partially_paid'
            WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
        END IF;
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_invoice_payment_status_trigger ON public.payment_allocations;
CREATE TRIGGER update_invoice_payment_status_trigger
AFTER INSERT OR UPDATE OR DELETE ON public.payment_allocations
FOR EACH ROW EXECUTE FUNCTION public.update_invoice_payment_status();
