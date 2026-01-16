# 🚀 Database Setup Guide - Run These Migrations

## Quick Answer: **YES**, you need to run the database migrations first!

---

## 📋 Migration Files (10 files total)

These files are located in: `C:\Users\khamis\Desktop\accounting-saas-new\database\`

1. `01_core_tables.sql` - Tenants, Users, Roles, Permissions
2. `02_accounting_tables.sql` - Chart of Accounts, Journals
3. `03_business_tables.sql` - Customers, Vendors, Invoices, Payments
4. `04_additional_modules.sql` - Banking, Expenses, Assets, VAT
5. `05_rls_policies.sql` - Row Level Security (multi-tenancy)
6. `06_views.sql` - Database views
7. `07_triggers.sql` - Database triggers
8. `08_seed_data.sql` - Default Chart of Accounts
9. `09_role_permissions_seed.sql` - Admin role with permissions
10. `10_coa_vat_seed.sql` - VAT codes

---

## 🎯 Method 1: Run in Supabase Dashboard (RECOMMENDED)

### Step 1: Open Supabase SQL Editor
1. Go to: https://supabase.com/dashboard
2. Click on your project: **gbbmicjucestjpxtkjyp**
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run Each Migration File

**Copy and paste the contents of each file into the SQL Editor and run them in order:**

#### File 1: 01_core_tables.sql
```bash
# Open this file:
C:\Users\khamis\Desktop\accounting-saas-new\database\01_core_tables.sql

# Copy ALL contents
# Paste in Supabase SQL Editor
# Click "Run" or press Ctrl+Enter
```

#### File 2: 02_accounting_tables.sql
```bash
# Open this file:
C:\Users\khamis\Desktop\accounting-saas-new\database\02_accounting_tables.sql

# Copy ALL contents
# Paste in Supabase SQL Editor
# Click "Run"
```

#### File 3: 03_business_tables.sql
```bash
# Open and run...
C:\Users\khamis\Desktop\accounting-saas-new\database\03_business_tables.sql
```

#### File 4: 04_additional_modules.sql
```bash
C:\Users\khamis\Desktop\accounting-saas-new\database\04_additional_modules.sql
```

#### File 5: 05_rls_policies.sql
```bash
C:\Users\khamis\Desktop\accounting-saas-new\database\05_rls_policies.sql
```

#### File 6: 06_views.sql
```bash
C:\Users\khamis\Desktop\accounting-saas-new\database\06_views.sql
```

#### File 7: 07_triggers.sql
```bash
C:\Users\khamis\Desktop\accounting-saas-new\database\07_triggers.sql
```

#### File 8: 08_seed_data.sql
```bash
C:\Users\khamis\Desktop\accounting-saas-new\database\08_seed_data.sql
```

#### File 9: 09_role_permissions_seed.sql
```bash
C:\Users\khamis\Desktop\accounting-saas-new\database\09_role_permissions_seed.sql
```

#### File 10: 10_coa_vat_seed.sql
```bash
C:\Users\khamis\Desktop\accounting-saas-new\database\10_coa_vat_seed.sql
```

---

## 🎯 Method 2: Use Command Line (Faster)

If you have `psql` installed:

```bash
# Set your Supabase connection details
SUPABASE_HOST="db.gbbmicjucestjpxtkjyp.supabase.co"
SUPABASE_DB="postgres"
SUPABASE_USER="postgres"
SUPABASE_PASSWORD="your-database-password"

# Run all migrations
for file in database/*.sql; do
  echo "Running $file..."
  psql -h $SUPABASE_HOST -U $SUPABASE_USER -d $SUPABASE_DB < "$file"
done
```

---

## ✅ Verification

After running all migrations, verify they worked:

### In Supabase Dashboard:
1. Click **Table Editor** in left sidebar
2. You should see these tables:
   - ✅ tenants
   - ✅ users
   - ✅ roles
   - ✅ user_roles
   - ✅ chart_of_accounts
   - ✅ journal_entries
   - ✅ customers
   - ✅ vendors
   - ✅ invoices
   - ✅ payments
   - And more...

### Check with SQL:
```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

---

## 🎉 After Migrations Complete

Once you've run all migrations, come back and tell me, then I'll:

1. ✅ Create your demo admin account
2. ✅ Add sample data (customers, vendors, etc.)
3. ✅ Verify everything is working

---

## ❓ What If You Get Errors?

### Error: "relation already exists"
**Solution:** Table already created, skip to next file ✅

### Error: "permission denied"
**Solution:** Make sure you're using the service role key in Supabase SQL Editor

### Error: "must be owner of table"
**Solution:** Run in Supabase SQL Editor (has service role permissions)

---

## 📞 Need Help?

1. **Can I run these for you automatically?** Not directly, but I can guide you step-by-step
2. **Do you have your database password?** You'll need it for command-line method
3. **Which method is easier?** Method 1 (Supabase Dashboard) is easiest for most users

---

**Next Steps:**
1. Run all 10 migration files in Supabase SQL Editor
2. Let me know when done
3. I'll create your demo admin account!

**Estimated time:** 5-10 minutes
