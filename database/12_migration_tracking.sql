-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Migration Tracking System
-- ============================================
-- This migration creates a system to track which migrations
-- have been applied to the database (Issue #31)
-- ============================================

-- ============================================
-- Migrations Tracking Table
-- ============================================

CREATE TABLE IF NOT EXISTS public.schema_migrations (
    id SERIAL PRIMARY KEY,
    version VARCHAR(14) NOT NULL UNIQUE,  -- YYYYMMDDHHMMSS format
    name VARCHAR(255) NOT NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    applied_by VARCHAR(255) DEFAULT current_user,
    checksum VARCHAR(64),  -- SHA-256 of migration file content
    execution_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_message TEXT
);

-- Create indexes for lookups
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version
ON public.schema_migrations(version);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_applied_at
ON public.schema_migrations(applied_at);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_success
ON public.schema_migrations(success);

-- Add comments
COMMENT ON TABLE public.schema_migrations IS 'Tracks database schema migrations';
COMMENT ON COLUMN public.schema_migrations.version IS 'Migration version in YYYYMMDDHHMMSS format';
COMMENT ON COLUMN public.schema_migrations.checksum IS 'SHA-256 hash of migration file for integrity checking';
COMMENT ON COLUMN public.schema_migrations.execution_time_ms IS 'Time taken to execute migration in milliseconds';

-- ============================================
-- Helper Functions
-- ============================================

/**
 * Check if a migration has been applied
 *
 * @param p_version Migration version to check
 * @returns TRUE if migration was applied successfully
 */
CREATE OR REPLACE FUNCTION public.is_migration_applied(p_version VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 FROM public.schema_migrations
        WHERE version = p_version AND success = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get latest applied migration version
 *
 * @returns Version string or NULL if no migrations applied
 */
CREATE OR REPLACE FUNCTION public.get_latest_migration()
RETURNS VARCHAR AS $$
DECLARE
    v_version VARCHAR;
BEGIN
    SELECT version INTO v_version
    FROM public.schema_migrations
    WHERE success = true
    ORDER BY version DESC
    LIMIT 1;

    RETURN v_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Record a migration as started
 *
 * @param p_version Migration version
 * @param p_name Human-readable migration name
 * @param p_checksum SHA-256 checksum of migration file
 */
CREATE OR REPLACE FUNCTION public.start_migration(
    p_version VARCHAR,
    p_name VARCHAR,
    p_checksum VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_start_time TIMESTAMP WITH TIME ZONE;
BEGIN
    v_start_time := NOW();

    INSERT INTO public.schema_migrations (version, name, checksum)
    VALUES (p_version, p_name, p_checksum);

    -- Update execution time after completion (in complete_migration)
    -- We store start time in a session variable if needed
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Mark a migration as completed successfully
 *
 * @param p_version Migration version
 * @param p_execution_time_ms Time taken in milliseconds
 */
CREATE OR REPLACE FUNCTION public.complete_migration(
    p_version VARCHAR,
    p_execution_time_ms INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.schema_migrations
    SET success = true,
        execution_time_ms = p_execution_time_ms,
        applied_at = NOW()
    WHERE version = p_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Mark a migration as failed
 *
 * @param p_version Migration version
 * @param p_error_message Error message
 */
CREATE OR REPLACE FUNCTION public.fail_migration(
    p_version VARCHAR,
    p_error_message TEXT
)
RETURNS VOID AS $$
BEGIN
    UPDATE public.schema_migrations
    SET success = false,
        error_message = p_error_message,
        applied_at = NOW()
    WHERE version = p_version;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Get migration history
 *
 * @param p_limit Maximum number of records to return
 * @returns Migration history
 */
CREATE OR REPLACE FUNCTION public.get_migration_history(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
    version VARCHAR,
    name VARCHAR,
    applied_at TIMESTAMP WITH TIME ZONE,
    applied_by VARCHAR,
    execution_time_ms INTEGER,
    success BOOLEAN,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sm.version,
        sm.name,
        sm.applied_at,
        sm.applied_by,
        sm.execution_time_ms,
        sm.success,
        sm.error_message
    FROM public.schema_migrations sm
    ORDER BY sm.applied_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Insert Initial Migration Records
-- ============================================
-- This records all existing migrations that were applied before
-- this tracking system was created

-- Note: These are approximate dates based on file numbers
-- In production, you should update these with actual applied dates

INSERT INTO public.schema_migrations (version, name, success, applied_at)
VALUES
    ('20250101000000', '01_core_tables.sql', true, '2025-01-01 00:00:00+00'),
    ('20250101000001', '02_tenants_branches.sql', true, '2025-01-01 00:00:00+00'),
    ('20250101000002', '03_users_roles.sql', true, '2025-01-01 00:00:00+00'),
    ('20250101000003', '04_chart_of_accounts.sql', true, '2025-01-01 00:00:00+00'),
    ('20250101000004', '05_rls_policies.sql', true, '2025-01-01 00:00:00+00'),
    ('20250101000005', '06_permissions.sql', true, '2025-01-01 00:00:00+00'),
    ('20250101000006', '07_triggers.sql', true, '2025-01-01 00:00:00+00'),
    ('20250101000007', '08_seed_data.sql', true, '2025-01-01 00:00:00+00'),
    ('20250101000008', '09_role_permissions_seed.sql', true, '2025-01-01 00:00:00+00'),
    ('20250101000009', '10_coa_vat_seed.sql', true, '2025-01-01 00:00:00+00'),
    ('20250117000001', '11_performance_indexes.sql', true, NOW()),
    ('20250117000002', '12_migration_tracking.sql', true, NOW())
ON CONFLICT (version) DO NOTHING;

-- ============================================
-- Usage Examples
-- ============================================

/*
-- Before applying a migration:
SELECT public.start_migration('20250118000000', 'add_new_column', 'abc123...');

-- After successful migration:
SELECT public.complete_migration('20250118000000', 1234);

-- After failed migration:
SELECT public.fail_migration('20250118000000', 'Column already exists');

-- Check if migration was applied:
SELECT public.is_migration_applied('20250118000000');

-- Get migration history:
SELECT * FROM public.get_migration_history(20);

-- Get latest migration:
SELECT public.get_latest_migration();
*/
