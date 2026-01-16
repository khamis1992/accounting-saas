import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import {
  AuditLogData,
  AuditLogFilters,
  AuditLogExportOptions,
  AuditStatistics,
  ChangeTrackingOptions,
} from './interfaces';

/**
 * Comprehensive Audit Service
 *
 * Provides audit logging for all system actions including:
 * - CRUD operations on entities
 * - Authentication events
 * - Workflow actions
 * - Data exports
 * - Settings changes
 * - User management
 */
@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private readonly auditBatch: AuditLogData[] = [];
  private readonly BATCH_SIZE = 50;
  private readonly BATCH_INTERVAL = 5000; // 5 seconds
  private batchTimer?: NodeJS.Timeout;

  // Sensitive fields that should never be logged
  private readonly SENSITIVE_FIELDS = [
    'password',
    'token',
    'secret',
    'apiKey',
    'accessToken',
    'refreshToken',
    'creditCard',
    'ssn',
    'socialSecurityNumber',
  ];

  // Default change tracking options
  private readonly defaultTrackingOptions: ChangeTrackingOptions = {
    enabled: true,
    excludeFields: [...this.SENSITIVE_FIELDS],
    trackNested: true,
    maxDepth: 3,
    sanitizeSensitive: true,
  };

  constructor(private supabaseService: SupabaseService) {
    this.startBatchProcessor();
  }

  /**
   * Log an action to the audit trail
   */
  async logAction(data: AuditLogData): Promise<void> {
    try {
      // Sanitize data before logging
      const sanitizedData = this.sanitizeAuditData(data);

      // Add to batch for efficient insertion
      this.auditBatch.push(sanitizedData);

      // If batch is full, flush immediately
      if (this.auditBatch.length >= this.BATCH_SIZE) {
        await this.flushAuditBatch();
      }
    } catch (error) {
      this.logger.error(`Failed to log audit action: ${error.message}`, error.stack);
    }
  }

  /**
   * Log an error to the audit trail
   */
  async logError(
    error: Error,
    context: {
      action: string;
      entity: string;
      userId: string;
      tenantId: string;
      entityId?: string;
      metadata?: Record<string, any>;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    await this.logAction({
      action: context.action,
      entity: context.entity,
      entityId: context.entityId,
      userId: context.userId,
      tenantId: context.tenantId,
      metadata: {
        ...context.metadata,
        errorMessage: error.message,
        errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
      timestamp: new Date(),
      success: false,
      errorMessage: error.message,
    });
  }

  /**
   * Log user login
   */
  async logLogin(
    userId: string,
    tenantId: string,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      loginMethod?: string;
      success: boolean;
      failureReason?: string;
    }
  ): Promise<void> {
    await this.logAction({
      action: 'login',
      entity: 'user',
      userId,
      tenantId,
      entityId: userId,
      metadata: {
        loginMethod: metadata.loginMethod || 'password',
        success: metadata.success,
        failureReason: metadata.failureReason,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      timestamp: new Date(),
      success: metadata.success,
      errorMessage: metadata.failureReason,
    });
  }

  /**
   * Log user logout
   */
  async logLogout(
    userId: string,
    tenantId: string,
    metadata: {
      ipAddress?: string;
      userAgent?: string;
      sessionDuration?: number;
    }
  ): Promise<void> {
    await this.logAction({
      action: 'logout',
      entity: 'user',
      userId,
      tenantId,
      entityId: userId,
      metadata: {
        sessionDuration: metadata.sessionDuration,
      },
      ipAddress: metadata.ipAddress,
      userAgent: metadata.userAgent,
      timestamp: new Date(),
      success: true,
    });
  }

  /**
   * Log CRUD operations
   */
  async logCrudOperation(
    action: 'create' | 'update' | 'delete',
    entity: string,
    entityId: string,
    userId: string,
    tenantId: string,
    changes?: Record<string, { from: any; to: any }>,
    metadata?: Record<string, any>,
    ipAddress?: string,
    userAgent?: string,
    executionTime?: number
  ): Promise<void> {
    await this.logAction({
      action,
      entity,
      entityId,
      userId,
      tenantId,
      changes,
      metadata,
      ipAddress,
      userAgent,
      timestamp: new Date(),
      executionTime,
      success: true,
    });
  }

  /**
   * Track changes between two objects
   */
  trackChanges(
    oldData: Record<string, any>,
    newData: Record<string, any>,
    options: Partial<ChangeTrackingOptions> = {}
  ): Record<string, { from: any; to: any }> {
    const opts = { ...this.defaultTrackingOptions, ...options };
    const changes: Record<string, { from: any; to: any }> = {};

    if (!opts.enabled) {
      return changes;
    }

    const allKeys = new Set([...Object.keys(oldData), ...Object.keys(newData)]);

    for (const key of allKeys) {
      // Skip excluded fields
      if (opts.excludeFields.includes(key)) {
        continue;
      }

      const oldValue = oldData[key];
      const newValue = newData[key];

      // Handle nested objects
      if (opts.trackNested && this.isObject(oldValue) && this.isObject(newValue)) {
        const nestedChanges = this.trackChanges(
          oldValue,
          newValue,
          { ...opts, maxDepth: opts.maxDepth - 1 }
        );

        if (Object.keys(nestedChanges).length > 0) {
          changes[key] = { from: oldValue, to: newValue };
        }
        continue;
      }

      // Compare values
      if (!this.isEqual(oldValue, newValue)) {
        changes[key] = {
          from: opts.sanitizeSensitive ? this.sanitizeValue(key, oldValue) : oldValue,
          to: opts.sanitizeSensitive ? this.sanitizeValue(key, newValue) : newValue,
        };
      }
    }

    return changes;
  }

  /**
   * Get audit logs with filters
   */
  async getAuditLogs(filters: AuditLogFilters): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
  }> {
    const supabase = this.supabaseService.getClient();
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .eq('tenant_id', filters.tenantId);

    // Apply filters
    if (filters.action) {
      if (Array.isArray(filters.action)) {
        query = query.in('action', filters.action);
      } else {
        query = query.eq('action', filters.action);
      }
    }

    if (filters.entity) {
      if (Array.isArray(filters.entity)) {
        query = query.in('entity', filters.entity);
      } else {
        query = query.eq('entity', filters.entity);
      }
    }

    if (filters.entityId) {
      query = query.eq('entity_id', filters.entityId);
    }

    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }

    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate.toISOString());
    }

    if (filters.ipAddress) {
      query = query.eq('ip_address', filters.ipAddress);
    }

    if (filters.search) {
      query = query.or(`action.ilike.%${filters.search}%,entity.ilike.%${filters.search}%,metadata.ilike.%${filters.search}%`);
    }

    // Apply sorting
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
    };
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(tenantId: string, startDate?: Date, endDate?: Date): Promise<AuditStatistics> {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('audit_logs')
      .select('*')
      .eq('tenant_id', tenantId);

    if (startDate) {
      query = query.gte('created_at', startDate.toISOString());
    }

    if (endDate) {
      query = query.lte('created_at', endDate.toISOString());
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    const logs = data || [];

    // Calculate statistics
    const actionsByType: Record<string, number> = {};
    const actionsByEntity: Record<string, number> = {};
    const actionsByUserMap = new Map<string, { count: number; email?: string }>();
    const actionsOverTimeMap = new Map<string, number>();
    const ipCounts = new Map<string, number>();
    let failedActions = 0;
    let totalExecutionTime = 0;
    let executionTimeCount = 0;
    const slowActions: Array<{ action: string; entity: string; executionTime: number; timestamp: Date }> = [];

    for (const log of logs) {
      // Count by action type
      actionsByType[log.action] = (actionsByType[log.action] || 0) + 1;

      // Count by entity
      actionsByEntity[log.entity] = (actionsByEntity[log.entity] || 0) + 1;

      // Count by user
      const userKey = log.user_id;
      const userData = actionsByUserMap.get(userKey) || { count: 0 };
      userData.count++;
      actionsByUserMap.set(userKey, userData);

      // Count by date
      const dateKey = new Date(log.created_at).toISOString().split('T')[0];
      actionsOverTimeMap.set(dateKey, (actionsOverTimeMap.get(dateKey) || 0) + 1);

      // Count by IP
      if (log.ip_address) {
        ipCounts.set(log.ip_address, (ipCounts.get(log.ip_address) || 0) + 1);
      }

      // Count failures
      if (log.success === false) {
        failedActions++;
      }

      // Track execution time
      if (log.execution_time) {
        totalExecutionTime += log.execution_time;
        executionTimeCount++;

        if (log.execution_time > 1000) {
          slowActions.push({
            action: log.action,
            entity: log.entity,
            executionTime: log.execution_time,
            timestamp: new Date(log.created_at),
          });
        }
      }
    }

    // Convert maps to arrays and sort
    const actionsByUser = Array.from(actionsByUserMap.entries())
      .map(([userId, data]) => ({
        userId,
        userEmail: logs.find(l => l.user_id === userId)?.metadata?.userEmail,
        actionCount: data.count,
      }))
      .sort((a, b) => b.actionCount - a.actionCount)
      .slice(0, 10);

    const actionsOverTime = Array.from(actionsOverTimeMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const topIPAddresses = Array.from(ipCounts.entries())
      .map(([ipAddress, count]) => ({ ipAddress, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const slowestActions = slowActions
      .sort((a, b) => b.executionTime - a.executionTime)
      .slice(0, 10);

    return {
      totalActions: logs.length,
      actionsByType,
      actionsByEntity,
      actionsByUser,
      actionsOverTime,
      topIPAddresses,
      failedActions,
      avgExecutionTime: executionTimeCount > 0 ? totalExecutionTime / executionTimeCount : undefined,
      slowestActions,
    };
  }

  /**
   * Export audit logs to CSV
   */
  async exportAuditLogs(options: AuditLogExportOptions): Promise<string> {
    const { data } = await this.getAuditLogs(options.filters);

    if (options.format === 'json') {
      return JSON.stringify(data, null, 2);
    }

    if (options.format === 'csv' || options.format === 'excel') {
      const headers = options.fields || [
        'timestamp',
        'action',
        'entity',
        'entityId',
        'userId',
        'ipAddress',
        'userAgent',
        'success',
        'executionTime',
      ];

      const csvRows = [
        headers.join(','),
        ...data.map(row =>
          headers.map(header => {
            const value = row[header.toLowerCase()];
            // Escape CSV values
            if (value === undefined || value === null) return '';
            if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            return `"${String(value).replace(/"/g, '""')}"`;
          }).join(',')
        )
      ];

      return csvRows.join('\n');
    }

    throw new Error(`Unsupported export format: ${options.format}`);
  }

  /**
   * Flush audit batch to database
   */
  private async flushAuditBatch(): Promise<void> {
    if (this.auditBatch.length === 0) {
      return;
    }

    const batch = [...this.auditBatch];
    this.auditBatch.length = 0;

    try {
      const supabase = this.supabaseService.getClient();

      const records = batch.map(log => ({
        tenant_id: log.tenantId,
        user_id: log.userId,
        action: log.action,
        entity: log.entity,
        entity_id: log.entityId,
        changes: log.changes,
        metadata: log.metadata,
        ip_address: log.ipAddress,
        user_agent: log.userAgent,
        success: log.success,
        error_message: log.errorMessage,
        execution_time: log.executionTime,
        created_at: log.timestamp.toISOString(),
      }));

      const { error } = await supabase.from('audit_logs').insert(records);

      if (error) {
        throw error;
      }

      this.logger.debug(`Flushed ${batch.length} audit logs to database`);
    } catch (error) {
      this.logger.error(`Failed to flush audit batch: ${error.message}`, error.stack);
      // Re-add failed batch to try again later
      this.auditBatch.unshift(...batch);
    }
  }

  /**
   * Start batch processor timer
   */
  private startBatchProcessor(): void {
    this.batchTimer = setInterval(() => {
      this.flushAuditBatch();
    }, this.BATCH_INTERVAL);
  }

  /**
   * Sanitize audit data to remove sensitive information
   */
  private sanitizeAuditData(data: AuditLogData): AuditLogData {
    const sanitized = { ...data };

    // Sanitize changes
    if (sanitized.changes) {
      for (const key in sanitized.changes) {
        if (this.SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          sanitized.changes[key] = { from: '[REDACTED]', to: '[REDACTED]' };
        }
      }
    }

    // Sanitize metadata
    if (sanitized.metadata) {
      sanitized.metadata = this.sanitizeObject(sanitized.metadata);
    }

    return sanitized;
  }

  /**
   * Sanitize an object by removing sensitive fields
   */
  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const key in obj) {
      if (this.SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = this.sanitizeObject(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }

    return sanitized;
  }

  /**
   * Sanitize a specific value if it's sensitive
   */
  private sanitizeValue(key: string, value: any): any {
    if (this.SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      return '[REDACTED]';
    }
    return value;
  }

  /**
   * Check if a value is an object (excluding arrays and null)
   */
  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  /**
   * Deep compare two values
   */
  private isEqual(a: any, b: any): boolean {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (typeof a !== typeof b) return false;

    if (this.isObject(a) && this.isObject(b)) {
      const keysA = Object.keys(a);
      const keysB = Object.keys(b);
      if (keysA.length !== keysB.length) return false;
      return keysA.every(key => this.isEqual(a[key], b[key]));
    }

    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => this.isEqual(item, b[index]));
    }

    return false;
  }

  /**
   * Cleanup on module destroy
   */
  onModuleDestroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flushAuditBatch();
  }
}
