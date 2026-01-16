# 🗄️ Database Migration Guide
## Production Deployment - Audit Logs Table

**Date:** 2025-01-16
**Migration:** Create Audit Logs Table
**Status:** ✅ READY TO EXECUTE

---

## 📋 Overview

This guide will walk you through executing the audit logs table migration in your PostgreSQL/Supabase database. The audit logs table is essential for tracking all user actions, compliance, and security monitoring.

**Migration File:** `backend/src/audit/migrations/create_audit_logs_table.sql`

---

## ⚠️ Pre-Migration Checklist

Before executing the migration, ensure:

- ✅ Database backup created (recommended)
- ✅ Database access credentials available
- ✅ PostgreSQL client or Supabase SQL editor access
- ✅ `tenants` and `users` tables exist (foreign key dependencies)
- ✅ Sufficient database storage available

---

## 🚀 Method 1: Supabase Dashboard (Recommended for Supabase)

### Step 1: Access Supabase Dashboard

1. Navigate to your Supabase project: `https://supabase.com/dashboard`
2. Select your project
3. Click on **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Execute Migration

1. Copy the contents of `backend/src/audit/migrations/create_audit_logs_table.sql`
2. Paste into the SQL editor
3. Review the SQL to ensure it's correct
4. Click **Run** or press `Ctrl+Enter`
5. Verify success message: "Audit logs table migration completed successfully"

### Step 3: Verify Migration

```sql
-- Check if table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'audit_logs';

-- Check table structure
\d+ public.audit_logs

-- Verify indexes
SELECT indexname
FROM pg_indexes
WHERE tablename = 'audit_logs';

-- Verify RLS policies
SELECT policyname, permissive, roles, cmd
FROM pg_policies
WHERE tablename = 'audit_logs';

-- Verify foreign keys
SELECT
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS foreign_table_name
FROM pg_constraint
WHERE conrelid = 'public.audit_logs'::regclass
  AND contype = 'f';
```

### Step 4: Test Audit Logging

```sql
-- Insert a test audit log entry
INSERT INTO public.audit_logs (
  tenant_id,
  user_id,
  action,
  entity,
  changes,
  ip_address,
  user_agent,
  success
) VALUES (
  (SELECT id FROM public.tenants LIMIT 1),
  (SELECT id FROM public.users LIMIT 1),
  'test',
  'migration',
  '{"test": "data"}'::jsonb,
  '127.0.0.1',
  'test-agent',
  true
);

-- Query the test entry
SELECT * FROM public.audit_logs WHERE action = 'test';

-- Clean up test entry
DELETE FROM public.audit_logs WHERE action = 'test';
```

---

## 🖥️ Method 2: PostgreSQL CLI (psql)

### Step 1: Connect to Database

```bash
# Using psql command line
psql -h <HOST> -p <PORT> -U <USER> -d <DATABASE>

# Example:
psql -h db.xxx.supabase.co -p 5432 -U postgres -d postgres
```

### Step 2: Execute Migration File

```bash
# Execute the migration file directly
psql -h <HOST> -p <PORT> -U <USER> -d <DATABASE> -f backend/src/audit/migrations/create_audit_logs_table.sql

# Or paste the content after connecting
\i backend/src/audit/migrations/create_audit_logs_table.sql
```

### Step 3: Verify Migration

```sql
-- Run verification queries (same as Method 1, Step 3)
```

---

## 🔧 Method 3: Using Node.js Script

Create a script `scripts/run-migration.js`:

```javascript
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    const migrationSQL = fs.readFileSync(
      path.join(__dirname, '../backend/src/audit/migrations/create_audit_logs_table.sql'),
      'utf8'
    );

    console.log('🔄 Executing migration...');
    await client.query(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify table creation
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'audit_logs'
    `);

    if (result.rows.length > 0) {
      console.log('✅ Table "audit_logs" verified');
    } else {
      console.log('❌ Table "audit_logs" not found');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

runMigration();
```

Run the script:

```bash
DB_HOST=your_host DB_USER=your_user DB_PASSWORD=your_password DB_NAME=your_db node scripts/run-migration.js
```

---

## ✅ Post-Migration Verification

### Check All Components

```sql
-- 1. Table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
    AND table_name = 'audit_logs'
);

-- 2. Indexes created (should be 13 indexes)
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE tablename = 'audit_logs';
-- Expected: 13

-- 3. RLS enabled
SELECT relrowsecurity
FROM pg_class
WHERE relname = 'audit_logs';
-- Expected: true

-- 4. RLS policies (should be 2 policies)
SELECT COUNT(*) as policy_count
FROM pg_policies
WHERE tablename = 'audit_logs';
-- Expected: 2

-- 5. Foreign keys (should be 2 foreign keys)
SELECT COUNT(*) as fk_count
FROM pg_constraint
WHERE conrelid = 'public.audit_logs'::regclass
  AND contype = 'f';
-- Expected: 2

-- 6. Functions created
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name LIKE '%audit%';
-- Expected: get_audit_log_statistics, update_audit_logs_created_at

-- 7. Views created
SELECT table_name
FROM information_schema.views
WHERE table_schema = 'public'
  AND table_name LIKE 'v_%audit%';
-- Expected: v_recent_audit_logs, v_failed_audit_logs

-- 8. Triggers created
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE event_object_table = 'audit_logs';
-- Expected: 1
```

---

## 🧪 Integration Testing

After migration, test the audit logging from the backend:

### Test 1: Create Audit Log via Backend

```bash
# Start the backend server
cd backend
npm run start:dev

# In another terminal, test the audit endpoint
curl -X GET http://localhost:3001/audit \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "tenant-id: YOUR_TENANT_ID"
```

### Test 2: Verify Audit Logs in Database

```sql
-- Check if audit logs are being created
SELECT
  action,
  entity,
  success,
  created_at
FROM public.audit_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Test 3: Test Statistics Endpoint

```bash
# Test audit statistics
curl -X GET http://localhost:3001/audit/statistics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "tenant-id: YOUR_TENANT_ID"
```

---

## 📊 Migration Summary

After successful execution, you should have:

### ✅ Tables Created (1)
- `audit_logs` - Main audit logging table
- `audit_logs_archive` - Archive table for old logs

### ✅ Indexes Created (13)
- Primary indexes: tenant_id, user_id, action, entity
- Composite indexes: tenant+created, tenant+entity, tenant+user
- Specialized indexes: entity_id, ip_address, success
- JSONB indexes: changes (GIN), metadata (GIN)

### ✅ RLS Policies Created (2)
- "Users can view their tenant's audit logs"
- "Service role can access all audit logs"

### ✅ Foreign Keys Created (2)
- `fk_audit_logs_tenant_id` → tenants(id)
- `fk_audit_logs_user_id` → users(id)

### ✅ Functions Created (2)
- `update_audit_logs_created_at()` - Auto-timestamp trigger
- `get_audit_log_statistics()` - Aggregate statistics

### ✅ Views Created (2)
- `v_recent_audit_logs` - Last 30 days
- `v_failed_audit_logs` - Failed actions only

### ✅ Triggers Created (1)
- `trigger_update_audit_logs_created_at` - Auto-update created_at

---

## 🔍 Troubleshooting

### Issue 1: Table Already Exists

**Error:** `relation "audit_logs" already exists`

**Solution:**
```sql
-- Drop existing table (WARNING: This will delete all data!)
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- Re-run migration
```

### Issue 2: Foreign Key Constraint Fails

**Error:** `foreign key constraint "fk_audit_logs_tenant_id" cannot be implemented`

**Solution:**
```sql
-- Verify tenants table exists
SELECT table_name
FROM information_schema.tables
WHERE table_name = 'tenants';

-- If not exists, create tenants table first
```

### Issue 3: RLS Policy Fails

**Error:** `must be owner of table audit_logs`

**Solution:**
```sql
-- Ensure you're connecting as the database owner
-- Or grant necessary permissions:
GRANT ALL ON public.audit_logs TO your_user;
```

---

## 📝 Rollback Procedure (If Needed)

If you need to rollback the migration:

```sql
-- Drop views
DROP VIEW IF EXISTS public.v_failed_audit_logs;
DROP VIEW IF EXISTS public.v_recent_audit_logs;

-- Drop functions
DROP FUNCTION IF EXISTS public.get_audit_log_statistics(UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS public.update_audit_logs_created_at();

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_update_audit_logs_created_at ON public.audit_logs;

-- Drop table
DROP TABLE IF EXISTS public.audit_logs_archive;
DROP TABLE IF EXISTS public.audit_logs;

-- Verify deletion
SELECT table_name
FROM information_schema.tables
WHERE table_name LIKE 'audit_log%';
```

---

## 🎯 Next Steps After Migration

1. ✅ Verify application can write to audit_logs table
2. ✅ Check audit endpoint returns data
3. ✅ Test audit statistics endpoint
4. ✅ Monitor audit logs for any errors
5. ✅ Set up archival process for old logs (optional)
6. ✅ Configure alerts for failed actions

---

## 📞 Support

If you encounter any issues:

1. Check the PostgreSQL logs: `SELECT * FROM pg_stat_activity;`
2. Review Supabase logs in the dashboard
3. Verify database permissions
4. Check foreign key dependencies exist

---

**Migration Status:** ✅ READY
**Estimated Execution Time:** < 1 minute
**Database Downtime:** None (online migration)
**Rollback:** Supported (see rollback procedure above)

---

**Last Updated:** 2025-01-16
**Version:** 1.0.0
