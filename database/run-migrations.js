const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

// Using Supabase Transaction pooler for migrations
const client = new Client({
  host: 'aws-1-ap-south-1.pooler.supabase.com',
  port: 6543,
  user: 'postgres.gbbmicjucestjpxtkjyp',
  password: 'Khamees1992#',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

// Migration files in order
const migrations = [
  '01_core_tables.sql',
  '02_accounting_tables.sql',
  '03_business_tables.sql',
  '04_additional_modules.sql',
  '05_rls_policies.sql',
  '06_views.sql',
  '07_triggers.sql',
  '08_seed_data.sql',
  '09_role_permissions_seed.sql',
  '10_coa_vat_seed.sql'
];

// Start from this migration (set via command line if needed)
const START_FROM = process.env.START_FROM || 0;

async function runMigrations() {
  console.log('========================================');
  console.log('Database Migration Runner');
  console.log('========================================');
  console.log('');

  try {
    await client.connect();
    console.log('[CONNECTED] Successfully connected to database\n');

    for (let i = 0; i < migrations.length; i++) {
      const migration = migrations[i];

      // Skip migrations before START_FROM
      if (i < START_FROM) {
        console.log(`[SKIPPING] ${migration} (already completed)\n`);
        continue;
      }

      const filePath = path.join(__dirname, migration);
      
      if (!fs.existsSync(filePath)) {
        console.error(`[ERROR] Migration file not found: ${migration}`);
        process.exit(1);
      }

      console.log(`[RUNNING] ${migration}`);
      
      try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        await client.query(sqlContent);
        console.log(`[SUCCESS] ${migration} completed\n`);
      } catch (error) {
        console.error(`[ERROR] Failed to run ${migration}`);
        console.error(error.message);
        console.error('\nStack trace:', error.stack);
        process.exit(1);
      }
    }

    console.log('========================================');
    console.log('All migrations completed successfully!');
    console.log('========================================');

  } catch (error) {
    console.error('[ERROR] Database connection failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
