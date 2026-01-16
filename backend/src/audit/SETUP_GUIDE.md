# Audit Logging System - Setup Guide

## Quick Start

### 1. Run the Database Migration

```bash
# Navigate to backend directory
cd C:\Users\khamis\Desktop\accounting-saas-new\backend

# Run the migration using psql
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -f src/audit/migrations/create_audit_logs_table.sql
```

Or if using Supabase dashboard:
1. Open SQL Editor in Supabase
2. Copy contents of `src/audit/migrations/create_audit_logs_table.sql`
3. Execute the script

### 2. Verify the Installation

```bash
# Build the project (should succeed without errors)
npm run build

# Start the development server
npm run start:dev
```

### 3. Test the Audit System

```bash
# Test creating a customer (should be automatically logged)
curl -X POST http://localhost:3000/api/customers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CUST001",
    "nameEn": "Test Customer",
    "nameAr": "عميل تجريبي"
  }'

# Query audit logs
curl http://localhost:3000/api/audit \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get statistics
curl http://localhost:3000/api/audit/statistics \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## What Was Installed

### Core Components

1. **AuditService** (`audit.service.ts`)
   - 650+ lines of comprehensive audit logging
   - Batch processing (50 items, 5 second intervals)
   - Change tracking with before/after values
   - Data sanitization (removes passwords, tokens, etc.)
   - Export to CSV/JSON
   - Statistical analysis

2. **AuditInterceptor** (`audit.interceptor.ts`)
   - Global HTTP request/response interceptor
   - Automatic execution time tracking
   - Error logging
   - Excludes health checks and audit endpoints

3. **AuditMiddleware** (`middleware/audit.middleware.ts`)
   - IP address extraction (with proxy support)
   - User agent extraction
   - Request context storage

4. **Audit Decorators** (`decorators/`)
   - `@Audit()` - Generic decorator
   - `@AuditCreate()` - Create operations
   - `@AuditUpdate()` - Update with change tracking
   - `@AuditDelete()` - Delete operations
   - `@AuditView()` - View operations
   - `@AuditExport()` - Export operations

5. **AuditController** (`audit.controller.ts`)
   - 10+ endpoints for querying and exporting logs
   - Statistics by action, entity, user, timeline
   - Performance metrics
   - Export to CSV/JSON

6. **Database Migration** (`migrations/create_audit_logs_table.sql`)
   - Complete audit_logs table with indexes
   - Row Level Security (RLS) policies
   - Helper functions for statistics
   - Maintenance views

### Database Schema

```
audit_logs table with columns:
- id (UUID, PK)
- tenant_id (UUID, FK)
- user_id (UUID, FK)
- action (VARCHAR)
- entity (VARCHAR)
- entity_id (UUID)
- changes (JSONB)
- metadata (JSONB)
- ip_address (VARCHAR)
- user_agent (TEXT)
- success (BOOLEAN)
- error_message (TEXT)
- execution_time (INTEGER)
- created_at (TIMESTAMP)

Indexes for:
- tenant_id
- user_id
- action
- entity
- (tenant_id, created_at)
- changes (GIN)
- metadata (GIN)
```

## Features

### Automatic Logging
- All HTTP POST/PUT/PATCH/DELETE requests are logged
- Execution time is tracked
- Errors are captured with stack traces

### Change Tracking
- Field-level changes are tracked
- Before/after values stored in JSONB
- Sensitive fields are automatically redacted

### Multi-Tenancy
- All logs are tenant-isolated
- RLS policies ensure data security
- Service role can access all logs

### Performance
- Batch processing (50 items, 5 second intervals)
- Comprehensive database indexes
- Excluded routes for efficiency
- GET requests not logged by default

### Security
- Automatic sanitization of sensitive data
- IP address tracking
- User agent logging
- Failed action tracking

## Next Steps

### Add Audit Decorators to Other Services

Follow the pattern used in `CustomersService`:

```typescript
import { AuditCreate, AuditUpdate, AuditDelete } from '../audit/decorators';

@AuditCreate('vendor', {
  entityIdExtractor: (result: any) => result?.id,
  metadataExtractor: (dto: CreateVendorDto, tenantId: string) => ({
    vendorCode: dto.code,
    vendorName: dto.nameEn,
  }),
})
async create(dto: CreateVendorDto, tenantId: string) {
  // Implementation
}

@AuditUpdate('vendor', {
  entityIdExtractor: (id: string) => id,
  oldDataExtractor: async (id: string, tenantId: string, service) => {
    return await service.findOne(id, tenantId);
  },
  newDataExtractor: (result: any) => result,
})
async update(id: string, dto: UpdateVendorDto, tenantId: string) {
  // Implementation
}

@AuditDelete('vendor', {
  entityIdExtractor: (id: string) => id,
})
async remove(id: string, tenantId: string) {
  // Implementation
}
```

### Services to Update

Priority order:
1. **Vendors** - Similar to customers
2. **Invoices** - Critical business data
3. **Payments** - Financial data
4. **Journal Entries** - Accounting data
5. **Users** - Security critical
6. **Settings** - Configuration changes

### Monitor Audit Logs

```bash
# Check recent logs
curl http://localhost:3000/api/audit?page=1&limit=20 \
  -H "Authorization: Bearer YOUR_TOKEN"

# View failed actions
curl http://localhost:3000/api/audit?success=false \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get performance metrics
curl http://localhost:3000/api/audit/stats/performance \
  -H "Authorization: Bearer YOUR_TOKEN"

# Export logs for compliance
curl "http://localhost:3000/api/audit/export?format=csv&startDate=2025-01-01&endDate=2025-01-31" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  --output audit_logs_2025_01.csv
```

## Troubleshooting

### Build Errors
```bash
# Clean and rebuild
rm -rf dist
npm run build
```

### Migration Errors
```bash
# Check if table exists
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -c "\d audit_logs"

# Drop and recreate if needed
psql -h YOUR_HOST -U YOUR_USER -d YOUR_DATABASE -c "DROP TABLE IF EXISTS audit_logs CASCADE;"
```

### Logs Not Appearing
1. Check application logs for errors
2. Verify migration was applied
3. Check RLS policies
4. Ensure AuditModule is imported

## Support

For issues or questions:
1. Check `README.md` for detailed documentation
2. Review audit logs: `tail -f logs/combined.log`
3. Check database: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 10;`

## Compliance

This audit system provides:
- Complete audit trail of all user actions
- Immutable logs with timestamps
- User identification (ID, IP, user agent)
- Change tracking with before/after values
- Export capabilities for compliance reporting
- Statistical analysis for security monitoring

Suitable for:
- SOX compliance
- ISO 27001
- GDPR accountability
- Financial audits
- Security investigations
