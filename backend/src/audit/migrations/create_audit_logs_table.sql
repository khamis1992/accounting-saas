-- ============================================================================
-- Audit Logs Table Migration
-- ============================================================================
-- Purpose: Create comprehensive audit logging table for tracking all user actions
-- Created: 2025-01-16
-- ============================================================================

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant context (for multi-tenancy)
  tenant_id UUID NOT NULL,

  -- User who performed the action
  user_id UUID NOT NULL,

  -- Action performed (create, update, delete, login, logout, view, export, etc.)
  action VARCHAR(50) NOT NULL,

  -- Entity type affected (customer, vendor, invoice, payment, journal, etc.)
  entity VARCHAR(100) NOT NULL,

  -- Optional: ID of the specific entity affected
  entity_id UUID,

  -- Optional: Field-level changes with before/after values
  changes JSONB,

  -- Optional: Additional contextual information
  metadata JSONB,

  -- Request information
  ip_address VARCHAR(45), -- IPv6 compatible
  user_agent TEXT,

  -- Execution tracking
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time INTEGER, -- in milliseconds

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- Indexes for Query Performance
-- ============================================================================

-- Primary index for tenant filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id
  ON public.audit_logs(tenant_id);

-- Index for user filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id
  ON public.audit_logs(user_id);

-- Index for action filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_action
  ON public.audit_logs(action);

-- Index for entity filtering
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
  ON public.audit_logs(entity);

-- Composite index for tenant + date queries (most common)
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created
  ON public.audit_logs(tenant_id, created_at DESC);

-- Composite index for tenant + entity queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_entity
  ON public.audit_logs(tenant_id, entity);

-- Composite index for tenant + user queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_user
  ON public.audit_logs(tenant_id, user_id);

-- Index for entity ID lookups
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id
  ON public.audit_logs(entity_id) WHERE entity_id IS NOT NULL;

-- Index for IP address searches
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address
  ON public.audit_logs(ip_address) WHERE ip_address IS NOT NULL;

-- GIN index for JSONB searches (changes and metadata)
CREATE INDEX IF NOT EXISTS idx_audit_logs_changes
  ON public.audit_logs USING GIN(changes);

CREATE INDEX IF NOT EXISTS idx_audit_logs_metadata
  ON public.audit_logs USING GIN(metadata);

-- Index for failed actions
CREATE INDEX IF NOT EXISTS idx_audit_logs_success
  ON public.audit_logs(success, created_at DESC) WHERE success = false;

-- ============================================================================
-- Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on audit_logs table
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see audit logs for their own tenant
CREATE POLICY "Users can view their tenant's audit logs"
  ON public.audit_logs
  FOR SELECT
  USING (tenant_id = (
    SELECT tenant_id
    FROM public.users
    WHERE id = auth.uid()
  ));

-- Policy: Service role can access all audit logs
CREATE POLICY "Service role can access all audit logs"
  ON public.audit_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ============================================================================
-- Foreign Key Constraints
-- ============================================================================

-- Reference to tenants table
ALTER TABLE public.audit_logs
  ADD CONSTRAINT IF NOT EXISTS fk_audit_logs_tenant_id
  FOREIGN KEY (tenant_id)
  REFERENCES public.tenants(id)
  ON DELETE CASCADE;

-- Reference to users table
ALTER TABLE public.audit_logs
  ADD CONSTRAINT IF NOT EXISTS fk_audit_logs_user_id
  FOREIGN KEY (user_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

-- ============================================================================
-- Comments for Documentation
-- ============================================================================

COMMENT ON TABLE public.audit_logs IS 'Comprehensive audit log tracking all user actions for compliance and security';

COMMENT ON COLUMN public.audit_logs.id IS 'Unique identifier for the audit log entry';
COMMENT ON COLUMN public.audit_logs.tenant_id IS 'Tenant/organization context';
COMMENT ON COLUMN public.audit_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN public.audit_logs.action IS 'Action performed (create, update, delete, login, logout, view, export)';
COMMENT ON COLUMN public.audit_logs.entity IS 'Entity type affected (customer, vendor, invoice, etc.)';
COMMENT ON COLUMN public.audit_logs.entity_id IS 'ID of the specific entity affected';
COMMENT ON COLUMN public.audit_logs.changes IS 'Field-level changes with before/after values (JSONB)';
COMMENT ON COLUMN public.audit_logs.metadata IS 'Additional contextual information (JSONB)';
COMMENT ON COLUMN public.audit_logs.ip_address IS 'IP address of the request';
COMMENT ON COLUMN public.audit_logs.user_agent IS 'User agent of the client';
COMMENT ON COLUMN public.audit_logs.success IS 'Whether the action was successful';
COMMENT ON COLUMN public.audit_logs.error_message IS 'Error message if action failed';
COMMENT ON COLUMN public.audit_logs.execution_time IS 'Execution time in milliseconds';
COMMENT ON COLUMN public.audit_logs.created_at IS 'Timestamp of the action';

-- ============================================================================
-- Trigger for Automatic Timestamp Update
-- ============================================================================

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_audit_logs_created_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.created_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function
DROP TRIGGER IF EXISTS trigger_update_audit_logs_created_at ON public.audit_logs;
CREATE TRIGGER trigger_update_audit_logs_created_at
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_audit_logs_created_at();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to get audit log statistics for a tenant
CREATE OR REPLACE FUNCTION public.get_audit_log_statistics(
  p_tenant_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
)
RETURNS TABLE (
  total_actions BIGINT,
  failed_actions BIGINT,
  unique_users BIGINT,
  avg_execution_time NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_actions,
    COUNT(*) FILTER (WHERE success = false)::BIGINT as failed_actions,
    COUNT(DISTINCT user_id)::BIGINT as unique_users,
    AVG(execution_time)::NUMERIC as avg_execution_time
  FROM public.audit_logs
  WHERE tenant_id = p_tenant_id
    AND (p_start_date IS NULL OR created_at >= p_start_date)
    AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.get_audit_log_statistics IS 'Returns aggregate statistics for audit logs';

-- ============================================================================
-- Partitioning (Optional - for large scale deployments)
-- ============================================================================

-- Note: Partitioning by created_at can significantly improve query performance
-- for large audit log tables. Uncomment and customize if needed.

/*
-- Create partitioned table (PostgreSQL 10+)
CREATE TABLE public.audit_logs_partitioned (
  LIKE public.audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE public.audit_logs_2025_01 PARTITION OF public.audit_logs_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE public.audit_logs_2025_02 PARTITION OF public.audit_logs_partitioned
  FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Add more partitions as needed...
*/

-- ============================================================================
-- Archive Table (Optional - for old logs)
-- ============================================================================

-- Create archive table for old audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs_archive (
  LIKE public.audit_logs INCLUDING ALL
);

COMMENT ON TABLE public.audit_logs_archive IS 'Archive table for old audit logs';

-- ============================================================================
-- Maintenance Views
-- ============================================================================

-- View for recent audit logs (last 30 days)
CREATE OR REPLACE VIEW public.v_recent_audit_logs AS
SELECT
  id,
  tenant_id,
  user_id,
  action,
  entity,
  entity_id,
  ip_address,
  success,
  error_message,
  execution_time,
  created_at
FROM public.audit_logs
WHERE created_at >= NOW() - INTERVAL '30 days';

COMMENT ON VIEW public.v_recent_audit_logs IS 'Recent audit logs from the last 30 days';

-- View for failed actions
CREATE OR REPLACE VIEW public.v_failed_audit_logs AS
SELECT
  id,
  tenant_id,
  user_id,
  action,
  entity,
  entity_id,
  error_message,
  ip_address,
  created_at
FROM public.audit_logs
WHERE success = false
ORDER BY created_at DESC;

COMMENT ON VIEW public.v_failed_audit_logs IS 'View of failed audit log entries';

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Log the migration
DO $$
BEGIN
  RAISE NOTICE 'Audit logs table migration completed successfully';
END $$;
