# Audit Logging System

Comprehensive audit logging system for tracking all user actions in the accounting SaaS platform.

## Features

- **Automatic HTTP Request Logging**: Intercepts all HTTP requests/responses automatically
- **Decorator-Based Logging**: Easy-to-use decorators for service methods
- **Change Tracking**: Field-level change tracking with before/after values
- **Batch Processing**: Efficient batch insertions for performance
- **Data Sanitization**: Automatic removal of sensitive data (passwords, tokens, etc.)
- **Export Capabilities**: Export logs to CSV or JSON
- **Statistical Analysis**: View audit statistics by action, entity, user, and timeline
- **Performance Metrics**: Track execution times and identify slow operations
- **Multi-Tenancy**: Full support for tenant-isolated audit logs

## Architecture

### Components

1. **AuditService** (`audit.service.ts`)
   - Core service for logging audit events
   - Batch processing for performance
   - Change tracking utilities
   - Query and export methods

2. **AuditInterceptor** (`audit.interceptor.ts`)
   - Intercepts all HTTP requests/responses
   - Logs execution time
   - Captures errors

3. **AuditMiddleware** (`middleware/audit.middleware.ts`)
   - Extracts IP address (with proxy support)
   - Extracts user agent
   - Stores audit context in request

4. **Audit Decorators** (`decorators/`)
   - `@Audit()` - Generic decorator for custom actions
   - `@AuditCreate()` - Create operations
   - `@AuditUpdate()` - Update operations with change tracking
   - `@AuditDelete()` - Delete operations
   - `@AuditView()` - View operations
   - `@AuditExport()` - Export operations

5. **AuditController** (`audit.controller.ts`)
   - REST API for querying and exporting logs
   - Statistical endpoints
   - Filter and pagination support

## Database Schema

### audit_logs Table

```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  entity VARCHAR(100) NOT NULL,
  entity_id UUID,
  changes JSONB,
  metadata JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  execution_time INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Indexes

- `tenant_id` - Primary filter for multi-tenancy
- `user_id` - Filter by user
- `action` - Filter by action type
- `entity` - Filter by entity type
- `(tenant_id, created_at)` - Common query pattern
- `changes` - GIN index for JSONB searches
- `metadata` - GIN index for JSONB searches

## Usage

### 1. Manual Logging

```typescript
import { AuditService } from '../audit';

constructor(private auditService: AuditService) {}

// Log an action
await this.auditService.logAction({
  action: 'custom_action',
  entity: 'my_entity',
  userId: 'user-123',
  tenantId: 'tenant-456',
  entityId: 'entity-789',
  changes: { field1: { from: 'old', to: 'new' } },
  metadata: { customField: 'value' },
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0...',
  timestamp: new Date(),
  success: true,
});

// Log an error
await this.auditService.logError(error, {
  action: 'failed_action',
  entity: 'my_entity',
  userId: 'user-123',
  tenantId: 'tenant-456',
  metadata: { context: 'additional info' },
});

// Track changes
const changes = this.auditService.trackChanges(oldData, newData);
```

### 2. Decorator-Based Logging

#### Create Operation

```typescript
@AuditCreate('customer', {
  entityIdExtractor: (result: any) => result?.id,
  metadataExtractor: (dto: CreateCustomerDto, tenantId: string) => ({
    customerCode: dto.code,
    customerName: dto.nameEn,
  }),
})
async create(dto: CreateCustomerDto, tenantId: string) {
  // Method implementation
  return createdCustomer;
}
```

#### Update Operation with Change Tracking

```typescript
@AuditUpdate('customer', {
  entityIdExtractor: (id: string) => id,
  oldDataExtractor: async (id: string, tenantId: string) => {
    return await this.findOne(id, tenantId);
  },
  newDataExtractor: (result: any) => result,
  metadataExtractor: (id: string) => ({ customerId: id }),
})
async update(id: string, dto: UpdateCustomerDto, tenantId: string) {
  // Method implementation
  return updatedCustomer;
}
```

#### Delete Operation

```typescript
@AuditDelete('customer', {
  entityIdExtractor: (id: string) => id,
  metadataExtractor: (id: string) => ({ customerId: id }),
})
async remove(id: string, tenantId: string) {
  // Method implementation
  return { success: true };
}
```

### 3. Authentication Events

```typescript
// Login
await this.auditService.logLogin(userId, tenantId, {
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  loginMethod: 'password',
  success: true,
});

// Logout
await this.auditService.logLogout(userId, tenantId, {
  ipAddress: req.ip,
  userAgent: req.get('user-agent'),
  sessionDuration: 3600, // seconds
});
```

## API Endpoints

### Get Audit Logs

```
GET /api/audit
Query Parameters:
  - action: string | string[]
  - entity: string | string[]
  - entityId: string
  - userId: string
  - startDate: string (ISO date)
  - endDate: string (ISO date)
  - search: string
  - page: number (default: 1)
  - limit: number (default: 50)
  - sortBy: string (default: created_at)
  - sortOrder: 'asc' | 'desc' (default: desc)
```

### Get Statistics

```
GET /api/audit/statistics
Query Parameters:
  - startDate: string
  - endDate: string
```

### Export Logs

```
GET /api/audit/export
Query Parameters:
  - format: 'csv' | 'json' | 'excel' (required)
  - action: string
  - entity: string
  - userId: string
  - startDate: string
  - endDate: string
```

### Statistics Endpoints

```
GET /api/audit/stats/actions    # Stats by action type
GET /api/audit/stats/entities   # Stats by entity type
GET /api/audit/stats/users      # Stats by user
GET /api/audit/stats/failed     # Failed actions
GET /api/audit/stats/performance  # Performance metrics
GET /api/audit/stats/timeline   # Actions over time
```

## Data Sanitization

Sensitive fields are automatically redacted from audit logs:

- `password`
- `token`
- `secret`
- `apiKey`
- `accessToken`
- `refreshToken`
- `creditCard`
- `ssn`
- `socialSecurityNumber`

## Performance Considerations

1. **Batch Processing**: Logs are batched (50 items) and flushed every 5 seconds
2. **Indexes**: Comprehensive indexes for fast queries
3. **Excluded Routes**: Health checks, metrics, and audit endpoints are not logged
4. **GET Requests**: Not logged by default (read-only operations)
5. **JSONB Storage**: Efficient storage and querying of metadata

## Maintenance

### Archiving Old Logs

For long-running systems, consider archiving old logs:

```sql
-- Move logs older than 1 year to archive table
INSERT INTO audit_logs_archive
SELECT * FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';

-- Delete archived logs
DELETE FROM audit_logs
WHERE created_at < NOW() - INTERVAL '1 year';
```

### Partitioning (Optional)

For high-volume systems, consider table partitioning by date:

```sql
-- Create partitioned table
CREATE TABLE audit_logs_partitioned (
  LIKE audit_logs INCLUDING ALL
) PARTITION BY RANGE (created_at);

-- Create monthly partitions
CREATE TABLE audit_logs_2025_01 PARTITION OF audit_logs_partitioned
  FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');
```

## Security

- **Row Level Security**: Users can only view their tenant's audit logs
- **Service Role**: Only service role can access all logs
- **IP Tracking**: All logs include IP address for forensic analysis
- **Error Logging**: Failed actions are logged with error details

## Testing

Run the migration:

```bash
psql -U your_user -d your_database -f src/audit/migrations/create_audit_logs_table.sql
```

Test the audit logging:

```typescript
// Create a test log
await auditService.logAction({
  action: 'test',
  entity: 'test_entity',
  userId: 'test-user',
  tenantId: 'test-tenant',
  timestamp: new Date(),
  success: true,
});

// Query the logs
const logs = await auditService.getAuditLogs({
  tenantId: 'test-tenant',
  page: 1,
  limit: 10,
});
```

## Troubleshooting

### Logs Not Appearing

1. Check if audit_logs table exists: `\d audit_logs`
2. Verify RLS policies are not blocking inserts
3. Check application logs for errors
4. Ensure AuditModule is imported

### Performance Issues

1. Reduce batch size in `AuditService`
2. Add more specific indexes
3. Archive old logs
4. Consider partitioning for large datasets

### Missing IP Addresses

1. Verify `AuditMiddleware` is registered in `AppModule`
2. Check proxy configuration (`X-Forwarded-For` header)
3. Test with `curl -v` to see headers

## Best Practices

1. **Use Decorators**: Prefer decorators over manual logging for consistency
2. **Track Changes**: Enable change tracking for critical entities
3. **Add Metadata**: Include relevant business context in metadata
4. **Review Logs**: Regularly review audit logs for security issues
5. **Export Regularly**: Export logs for compliance and archival
6. **Monitor Performance**: Use statistics endpoints to identify slow operations

## License

Proprietary - Qatar Accounting SaaS
