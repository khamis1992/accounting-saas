-- ============================================
-- Enterprise Accounting SaaS - Qatar Market
-- Query Performance Monitoring
-- ============================================
-- This migration enables and configures query performance
-- monitoring capabilities (Issue #34)
-- ============================================

-- ============================================
-- Enable pg_stat_statements Extension
-- ============================================

-- Check if extension exists, create if not
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================
-- Performance Monitoring Views
-- ============================================

/**
 * Slow Queries View
 *
 * Shows queries that have average execution time > 100ms
 * Useful for identifying performance bottlenecks
 */
CREATE OR REPLACE VIEW public.slow_queries AS
SELECT
    query,
    calls,
    total_exec_time AS total_time_ms,
    mean_exec_time AS avg_time_ms,
    max_exec_time AS max_time_ms,
    stddev_exec_time AS stddev_time_ms
FROM pg_stat_statements
WHERE mean_exec_time > 100  -- More than 100ms average
ORDER BY mean_exec_time DESC
LIMIT 50;

COMMENT ON VIEW public.slow_queries IS 'Queries with average execution time > 100ms';

/**
 * Most Frequently Executed Queries
 *
 * Shows queries that are called most often
 * Useful for optimization targets
 */
CREATE OR REPLACE VIEW public.frequent_queries AS
SELECT
    query,
    calls,
    total_exec_time AS total_time_ms,
    mean_exec_time AS avg_time_ms,
    max_exec_time AS max_time_ms
FROM pg_stat_statements
ORDER BY calls DESC
LIMIT 50;

COMMENT ON VIEW public.frequent_queries IS 'Most frequently executed queries';

/**
 * Most Time-Consuming Queries
 *
 * Shows queries that consume the most total execution time
 * Useful for identifying where to focus optimization efforts
 */
CREATE OR REPLACE VIEW public.costly_queries AS
SELECT
    query,
    calls,
    total_exec_time AS total_time_ms,
    mean_exec_time AS avg_time_ms,
    max_exec_time AS max_time_ms,
    (total_exec_time / NULLIF(calls, 0)) AS avg_per_call_ms
FROM pg_stat_statements
ORDER BY total_exec_time DESC
LIMIT 50;

COMMENT ON VIEW public.costly_queries IS 'Queries consuming the most total execution time';

/**
 * Missing Indexes Detection
 *
 * Identifies columns that are highly selective but not indexed
 * Useful for finding indexing opportunities
 */
CREATE OR REPLACE VIEW public.potential_missing_indexes AS
SELECT
    schemaname,
    tablename,
    attname AS column_name,
    n_distinct,
    correlation
FROM pg_stats
WHERE schemaname = 'public'
  AND n_distinct > 100  -- Highly selective columns
  AND tablename NOT IN (
      SELECT indexrelid::regclass::text
      FROM pg_index
      JOIN pg_class ON pg_class.oid = pg_index.indexrelid
  )
  AND tablename NOT LIKE 'pg_%'
  AND tablename NOT LIKE 'sql_%'
ORDER BY n_distinct DESC;

COMMENT ON VIEW public.potential_missing_indexes IS 'Columns that might benefit from indexing';

/**
 * Index Usage Statistics
 *
 * Shows how effectively indexes are being used
 */
CREATE OR REPLACE VIEW public.index_usage_stats AS
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan AS index_scans,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched,
    pg_size_pretty(pg_relation_size(indexrelid)) AS index_size,
    CASE
        WHEN idx_scan = 0 THEN 'UNUSED'
        WHEN idx_scan < 10 THEN 'RARELY'
        WHEN idx_scan < 100 THEN 'OCCASIONALLY'
        ELSE 'FREQUENTLY'
    END AS usage_level
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

COMMENT ON VIEW public.index_usage_stats IS 'Statistics on index usage patterns';

/**
 * Table Size Statistics
 *
 * Shows table sizes and row counts to identify large tables
 */
CREATE OR REPLACE VIEW public.table_size_stats AS
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
    pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS index_size,
    n_live_tup AS row_count,
    n_dead_tup AS dead_rows,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

COMMENT ON VIEW public.table_size_stats IS 'Table sizes and statistics';

/**
 * Table Bloat Analysis
 *
 * Identifies tables that may need vacuuming
 */
CREATE OR REPLACE VIEW public.table_bloat_analysis AS
SELECT
    schemaname,
    tablename,
    n_dead_tup AS dead_rows,
    n_live_tup AS live_rows,
    CASE
        WHEN n_live_tup > 0 THEN
            ROUND(100.0 * n_dead_tup / (n_live_tup + n_dead_tup), 2)
        ELSE 0
    END AS bloat_percentage,
    last_vacuum,
    last_autovacuum,
    CASE
        WHEN n_dead_tup > 1000 AND
             (n_dead_tup::FLOAT / GREATEST(n_live_tup + n_dead_tup, 1)) > 0.1
        THEN 'NEEDS VACUUM'
        ELSE 'OK'
    END AS status
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY (n_dead_tup::FLOAT / GREATEST(n_live_tup + n_dead_tup, 1)) DESC;

COMMENT ON VIEW public.table_bloat_analysis IS 'Analysis of table bloat (dead vs live rows)';

/**
 * Cache Hit Ratios
 *
 * Shows how effective the buffer cache is
 */
CREATE OR REPLACE VIEW public.cache_hit_ratio AS
SELECT
    schemaname,
    tablename,
    heap_blks_read,
    heap_blks_hit,
    CASE
        WHEN heap_blks_read + heap_blks_hit > 0 THEN
            ROUND(100.0 * heap_blks_hit / (heap_blks_read + heap_blks_hit), 2)
        ELSE 0
    END AS cache_hit_ratio_percentage
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND heap_blks_read + heap_blks_hit > 0
ORDER BY cache_hit_ratio_percentage ASC;

COMMENT ON VIEW public.cache_hit_ratio IS 'Buffer cache hit ratios (lower = more disk reads)';

-- ============================================
-- Performance Monitoring Functions
-- ============================================

/**
 * Get performance summary
 *
 * Returns a summary of database performance metrics
 */
CREATE OR REPLACE FUNCTION public.get_performance_summary()
RETURNS TABLE (
    metric_name TEXT,
    metric_value TEXT
) AS $$
BEGIN
    -- Total query executions
    RETURN QUERY
    SELECT
        'total_queries'::TEXT,
        calls::TEXT
    FROM pg_stat_statements
    UNION ALL
    -- Total execution time
    SELECT
        'total_execution_time_ms'::TEXT,
        ROUND(SUM(total_exec_time))::TEXT
    FROM pg_stat_statements
    UNION ALL
    -- Average query time
    SELECT
        'avg_query_time_ms'::TEXT,
        ROUND(AVG(mean_exec_time), 2)::TEXT
    FROM pg_stat_statements
    UNION ALL
    -- Slow queries count
    SELECT
        'slow_queries_count'::TEXT,
        COUNT(*)::TEXT
    FROM pg_stat_statements
    WHERE mean_exec_time > 100
    UNION ALL
    -- Total table size
    SELECT
        'total_db_size'::TEXT,
        pg_size_pretty(pg_database_size(current_database()))
    UNION ALL
    -- Cache hit ratio
    SELECT
        'cache_hit_ratio'::TEXT,
        ROUND(
            100.0 * SUM(heap_blks_hit) / NULLIF(SUM(heap_blks_read + heap_blks_hit), 0),
            2
        )::TEXT
    FROM pg_stat_user_tables
    WHERE schemaname = 'public';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/**
 * Reset query statistics
 *
 * Resets pg_stat_statements statistics
 * Useful for measuring performance after changes
 */
CREATE OR REPLACE FUNCTION public.reset_query_stats()
RETURNS VOID AS $$
BEGIN
    PERFORM pg_stat_statements_reset();
    RAISE NOTICE 'Query statistics have been reset';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Scheduled Maintenance Recommendations
-- ============================================

/**
 * Get maintenance recommendations
 *
 * Analyzes database state and provides maintenance recommendations
 */
CREATE OR REPLACE FUNCTION public.get_maintenance_recommendations()
RETURNS TABLE (
    priority TEXT,
    recommendation TEXT,
    details TEXT
) AS $$
BEGIN
    -- Check for tables needing vacuum
    RETURN QUERY
    SELECT
        'HIGH'::TEXT,
        'VACUUM recommended'::TEXT,
        'Table ' || tablename || ' has ' || n_dead_tup || ' dead rows'::TEXT
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND n_dead_tup > 1000
      AND (n_dead_tup::FLOAT / GREATEST(n_live_tup + n_dead_tup, 1)) > 0.1
    UNION ALL
    -- Check for unused indexes
    SELECT
        'MEDIUM'::TEXT,
        'Review unused index'::TEXT,
        'Index ' || indexname || ' on ' || tablename || ' has never been used'::TEXT
    FROM pg_stat_user_indexes
    WHERE schemaname = 'public'
      AND idx_scan = 0
      AND indexname NOT LIKE '%_pkey'
    LIMIT 10
    UNION ALL
    -- Check for slow queries
    SELECT
        'HIGH'::TEXT,
        'Optimize slow query'::TEXT,
        'Query takes ' || ROUND(mean_exec_time) || 'ms on average'::TEXT
    FROM pg_stat_statements
    WHERE mean_exec_time > 500
    ORDER BY mean_exec_time DESC
    LIMIT 5
    UNION ALL
    -- Check for low cache hit ratios
    SELECT
        'MEDIUM'::TEXT,
        'Review cache usage'::TEXT,
        'Table ' || tablename || ' has cache hit ratio of ' ||
        ROUND(100.0 * heap_blks_hit / NULLIF(heap_blks_read + heap_blks_hit, 0), 2) || '%'::TEXT
    FROM pg_stat_user_tables
    WHERE schemaname = 'public'
      AND heap_blks_read + heap_blks_hit > 100
      AND (heap_blks_hit::FLOAT / NULLIF(heap_blks_read + heap_blks_hit, 0)) < 0.9
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Usage Examples
-- ============================================

/*
-- View slow queries
SELECT * FROM public.slow_queries;

-- Check index usage
SELECT * FROM public.index_usage_stats;

-- Get table sizes
SELECT * FROM public.table_size_stats;

-- Check for table bloat
SELECT * FROM public.table_bloat_analysis;

-- Get performance summary
SELECT * FROM public.get_performance_summary();

-- Get maintenance recommendations
SELECT * FROM public.get_maintenance_recommendations();

-- Reset statistics before testing
SELECT public.reset_query_stats();
*/
