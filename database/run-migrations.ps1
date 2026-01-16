# Run all database migrations in order
# This script executes SQL migration files against the Supabase database

$ErrorActionPreference = "Stop"

# Database configuration
$SUPABASE_URL = "https://gbbmicjucestjpxtkjyp.supabase.co"
$DB_CONNECTION = "postgresql://postgres.gbbmicjucestjpxtkjyp:JapSEpjgAl11NTcQ@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres"

# Migration files in order
$migrations = @(
    "01_core_tables.sql",
    "02_accounting_tables.sql",
    "03_business_tables.sql",
    "04_additional_modules.sql",
    "05_rls_policies.sql",
    "06_views.sql",
    "07_triggers.sql",
    "08_seed_data.sql",
    "09_role_permissions_seed.sql",
    "10_coa_vat_seed.sql"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Migration Runner" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path

foreach ($migration in $migrations) {
    $filePath = Join-Path $scriptPath $migration
    
    if (-Not (Test-Path $filePath)) {
        Write-Host "[ERROR] Migration file not found: $migration" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "[RUNNING] $migration" -ForegroundColor Yellow
    
    try {
        # Read the SQL file content
        $sqlContent = Get-Content $filePath -Raw
        
        # Execute using psql if available, otherwise use npx with supabase cli
        if (Get-Command psql -ErrorAction SilentlyContinue) {
            $env:PGPASSWORD = "JapSEpjgAl11NTcQ"
            psql -h aws-0-ap-southeast-1.pooler.supabase.com -p 6543 -U postgres.gbbmicjucestjpxtkjyp -d postgres -f $filePath 2>&1 | Out-Null
        } else {
            # Use temp file for SQL execution
            $tempFile = [System.IO.Path]::GetTempFileName() + ".sql"
            $sqlContent | Out-File -FilePath $tempFile -Encoding UTF8
            
            # Execute using npx supabase
            npx -y supabase db execute --db-url $DB_CONNECTION --file $tempFile 2>&1 | Out-Null
            
            Remove-Item $tempFile -Force
        }
        
        Write-Host "[SUCCESS] $migration completed" -ForegroundColor Green
    }
    catch {
        Write-Host "[ERROR] Failed to run $migration" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
    
    Write-Host ""
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All migrations completed successfully!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
