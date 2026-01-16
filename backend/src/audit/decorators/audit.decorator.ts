import { AuditService } from '../audit.service';

/**
 * Audit Decorator Parameters
 */
interface AuditDecoratorParams {
  /** Action being performed (e.g., 'create', 'update', 'delete') */
  action: string;

  /** Entity type (e.g., 'customer', 'invoice', 'journal') */
  entity: string;

  /** Enable change tracking (default: true) */
  trackChanges?: boolean;

  /** Extract entity ID from method parameters or result */
  entityIdExtractor?: (...args: any[]) => string | Promise<string>;

  /** Extract user ID from method parameters */
  userIdExtractor?: (...args: any[]) => string;

  /** Extract tenant ID from method parameters */
  tenantIdExtractor?: (...args: any[]) => string;

  /** Extract old data for change tracking */
  oldDataExtractor?: (...args: any[]) => Record<string, any> | Promise<Record<string, any>>;

  /** Extract new data for change tracking */
  newDataExtractor?: (result: any) => Record<string, any> | Promise<Record<string, any>>;

  /** Include additional metadata */
  metadataExtractor?: (...args: any[]) => Record<string, any>;
}

/**
 * Audit Decorator
 *
 * Automatically logs method execution to the audit trail.
 * Wraps the original method to capture:
 * - Execution time
 * - Success/failure status
 * - Changes made (if trackChanges is enabled)
 * - Error information
 *
 * @example
 * ```typescript
 * @Audit({ action: 'create', entity: 'customer' })
 * async create(dto: CreateCustomerDto, tenantId: string) {
 *   // Method implementation
 * }
 *
 * @Audit({
 *   action: 'update',
 *   entity: 'customer',
 *   trackChanges: true,
 *   oldDataExtractor: (id) => this.findOne(id),
 *   newDataExtractor: (result) => result
 * })
 * async update(id: string, dto: UpdateCustomerDto) {
 *   // Method implementation
 * }
 * ```
 */
export function Audit(params: AuditDecoratorParams) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get audit service from instance
      const auditService: AuditService = this.auditService;
      if (!auditService) {
        // If audit service is not available, just execute original method
        return originalMethod.apply(this, args);
      }

      const startTime = Date.now();
      let userId: string | undefined;
      let tenantId: string | undefined;
      let entityId: string | undefined;
      let oldData: Record<string, any> | undefined;
      let newData: Record<string, any> | undefined;
      let metadata: Record<string, any> | undefined;

      try {
        // Extract context information
        if (params.userIdExtractor) {
          userId = params.userIdExtractor(...args);
        }
        if (params.tenantIdExtractor) {
          tenantId = params.tenantIdExtractor(...args);
        }
        if (params.entityIdExtractor) {
          entityId = await params.entityIdExtractor(...args);
        }
        if (params.oldDataExtractor && params.trackChanges !== false) {
          oldData = await params.oldDataExtractor(...args);
        }
        if (params.metadataExtractor) {
          metadata = params.metadataExtractor(...args);
        }

        // Execute original method
        const result = await originalMethod.apply(this, args);
        const executionTime = Date.now() - startTime;

        // Extract new data for change tracking
        if (params.newDataExtractor && params.trackChanges !== false) {
          newData = await params.newDataExtractor(result);
        }

        // Calculate changes
        let changes: Record<string, { from: any; to: any }> | undefined;
        if (oldData && newData && params.trackChanges !== false) {
          changes = auditService.trackChanges(oldData, newData);
        }

        // Log successful action
        await auditService.logCrudOperation(
          params.action as any,
          params.entity,
          entityId || (result?.id),
          userId || 'unknown',
          tenantId || 'unknown',
          changes,
          metadata,
          undefined, // IP address will be set by middleware
          undefined, // User agent will be set by middleware
          executionTime
        );

        return result;
      } catch (error) {
        const executionTime = Date.now() - startTime;

        // Log failed action
        await auditService.logError(error as Error, {
          action: params.action,
          entity: params.entity,
          entityId,
          userId: userId || 'unknown',
          tenantId: tenantId || 'unknown',
          metadata,
        });

        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Convenience decorator for create operations
 */
export function AuditCreate(entity: string, options?: Partial<Omit<AuditDecoratorParams, 'action' | 'entity'>>) {
  return Audit({ action: 'create', entity, ...options });
}

/**
 * Convenience decorator for update operations
 */
export function AuditUpdate(entity: string, options?: Partial<Omit<AuditDecoratorParams, 'action' | 'entity'>>) {
  return Audit({ action: 'update', entity, ...options });
}

/**
 * Convenience decorator for delete operations
 */
export function AuditDelete(entity: string, options?: Partial<Omit<AuditDecoratorParams, 'action' | 'entity'>>) {
  return Audit({ action: 'delete', entity, ...options });
}

/**
 * Convenience decorator for view operations
 */
export function AuditView(entity: string, options?: Partial<Omit<AuditDecoratorParams, 'action' | 'entity'>>) {
  return Audit({ action: 'view', entity, ...options });
}

/**
 * Convenience decorator for export operations
 */
export function AuditExport(entity: string, options?: Partial<Omit<AuditDecoratorParams, 'action' | 'entity'>>) {
  return Audit({ action: 'export', entity, ...options });
}
