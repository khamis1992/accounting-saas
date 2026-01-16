/**
 * Audit Log Data Interface
 *
 * Defines the structure for audit log entries tracking all user actions
 * in the system with full context for compliance and security monitoring.
 */
export interface AuditLogData {
  /** Primary action performed (create, update, delete, login, logout, view, export, etc.) */
  action: string;

  /** Entity type affected (customer, vendor, invoice, payment, journal, etc.) */
  entity: string;

  /** Optional: ID of the specific entity affected */
  entityId?: string;

  /** User who performed the action */
  userId: string;

  /** Tenant/organization context */
  tenantId: string;

  /** Optional: Field-level changes with before/after values */
  changes?: Record<string, { from: any; to: any }>;

  /** Optional: Additional contextual information */
  metadata?: Record<string, any>;

  /** Optional: IP address of the request */
  ipAddress?: string;

  /** Optional: User agent of the client */
  userAgent?: string;

  /** Timestamp of the action (defaults to current time if not provided) */
  timestamp: Date;

  /** Optional: Execution time in milliseconds */
  executionTime?: number;

  /** Optional: Whether the action was successful */
  success?: boolean;

  /** Optional: Error message if action failed */
  errorMessage?: string;
}

/**
 * Audit Log Filter Options
 *
 * Used for querying and filtering audit logs
 */
export interface AuditLogFilters {
  /** Filter by action type */
  action?: string | string[];

  /** Filter by entity type */
  entity?: string | string[];

  /** Filter by specific entity ID */
  entityId?: string;

  /** Filter by user ID */
  userId?: string;

  /** Filter by tenant ID */
  tenantId: string;

  /** Filter by date range (start) */
  startDate?: Date;

  /** Filter by date range (end) */
  endDate?: Date;

  /** Filter by IP address */
  ipAddress?: string;

  /** Search in metadata */
  search?: string;

  /** Pagination: page number (1-based) */
  page?: number;

  /** Pagination: items per page */
  limit?: number;

  /** Sort field */
  sortBy?: string;

  /** Sort order (asc or desc) */
  sortOrder?: 'asc' | 'desc';
}

/**
 * Audit Log Export Options
 *
 * Used for exporting audit logs to different formats
 */
export interface AuditLogExportOptions {
  /** Format for export (csv, excel, json) */
  format: 'csv' | 'excel' | 'json';

  /** Filter options for what to export */
  filters: AuditLogFilters;

  /** Optional: Include/exclude specific fields */
  fields?: string[];

  /** Optional: Include field-level changes */
  includeChanges?: boolean;
}

/**
 * Audit Statistics
 *
 * Aggregated statistics about audit logs
 */
export interface AuditStatistics {
  /** Total number of actions in the period */
  totalActions: number;

  /** Actions grouped by type */
  actionsByType: Record<string, number>;

  /** Actions grouped by entity */
  actionsByEntity: Record<string, number>;

  /** Actions grouped by user */
  actionsByUser: Array<{
    userId: string;
    userEmail?: string;
    actionCount: number;
  }>;

  /** Actions over time (by day/hour) */
  actionsOverTime: Array<{
    date: string;
    count: number;
  }>;

  /** Top IP addresses */
  topIPAddresses: Array<{
    ipAddress: string;
    count: number;
  }>;

  /** Failed actions */
  failedActions: number;

  /** Average execution time (in ms) */
  avgExecutionTime?: number;

  /** Slowest actions */
  slowestActions?: Array<{
    action: string;
    entity: string;
    executionTime: number;
    timestamp: Date;
  }>;
}

/**
 * Change Tracking Options
 *
 * Configuration for how to track changes in entities
 */
export interface ChangeTrackingOptions {
  /** Enable/disable change tracking */
  enabled: boolean;

  /** Fields to exclude from tracking (e.g., passwords, tokens) */
  excludeFields: string[];

  /** Track nested objects */
  trackNested: boolean;

  /** Max depth for nested tracking */
  maxDepth: number;

  /** Sanitize sensitive data */
  sanitizeSensitive: boolean;
}
