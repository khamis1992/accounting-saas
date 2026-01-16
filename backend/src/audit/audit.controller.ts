import {
  Controller,
  Get,
  Post,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Param,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { RequestContext } from './decorators/request-context.decorator';
import {
  AuditLogFilters,
  AuditStatistics,
} from './interfaces';

/**
 * Audit Controller
 *
 * Provides endpoints for:
 * - Listing and filtering audit logs
 * - Exporting audit logs to CSV/JSON
 * - Viewing audit statistics
 * - Retrieving specific log entries
 */
@ApiTags('audit')
@Controller('audit')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  /**
   * Get audit logs with filters
   */
  @Get()
  @ApiOperation({
    summary: 'Get audit logs',
    description: 'Retrieve paginated audit logs with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs retrieved successfully',
  })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'entityId', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'sortBy', required: false, type: String })
  @ApiQuery({ name: 'sortOrder', required: false, type: String })
  async findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('action') action?: string | string[],
    @Query('entity') entity?: string | string[],
    @Query('entityId') entityId?: string,
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    const filters: AuditLogFilters = {
      tenantId,
      action,
      entity,
      entityId,
      userId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      search,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 50,
      sortBy,
      sortOrder,
    };

    return this.auditService.getAuditLogs(filters);
  }

  /**
   * Get audit statistics
   */
  @Get('statistics')
  @ApiOperation({
    summary: 'Get audit statistics',
    description: 'Retrieve aggregated statistics about audit logs',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async getStatistics(
    @TenantContext('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<AuditStatistics> {
    return this.auditService.getAuditStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Export audit logs
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export audit logs',
    description: 'Export audit logs to CSV, JSON, or Excel format',
  })
  @ApiResponse({
    status: 200,
    description: 'Audit logs exported successfully',
    content: {
      'text/csv': {},
      'application/json': {},
    },
  })
  @ApiQuery({ name: 'format', required: true, type: String, enum: ['csv', 'json', 'excel'] })
  @ApiQuery({ name: 'action', required: false, type: String })
  @ApiQuery({ name: 'entity', required: false, type: String })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  async exportAuditLogs(
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId: string,
    @Query('format') format: 'csv' | 'json' | 'excel',
    @RequestContext() requestContext: any,
    @Query('action') action?: string,
    @Query('entity') entity?: string,
    @Query('userId') filterUserId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Log the export action
    await this.auditService.logAction({
      action: 'export',
      entity: 'audit_logs',
      userId,
      tenantId,
      metadata: {
        format,
        filters: { action, entity, filterUserId, startDate, endDate },
      },
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
      timestamp: new Date(),
      success: true,
    });

    const filters: AuditLogFilters = {
      tenantId,
      action: action ? [action] : undefined,
      entity: entity ? [entity] : undefined,
      userId: filterUserId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: 1,
      limit: 10000, // Export limit
    };

    const data = await this.auditService.exportAuditLogs({
      format,
      filters,
    });

    // Set appropriate content type
    const contentType = format === 'json' ? 'application/json' : 'text/csv';
    const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.${format}`;

    // Return as file
    return new StreamableFile(Buffer.from(data), {
      type: contentType,
      disposition: `attachment; filename="${filename}"`,
    });
  }

  /**
   * Get statistics by action type
   */
  @Get('stats/actions')
  @ApiOperation({
    summary: 'Get statistics by action type',
    description: 'Retrieve audit statistics grouped by action type',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatsByAction(
    @TenantContext('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.auditService.getAuditStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      actionsByType: stats.actionsByType,
      totalActions: stats.totalActions,
    };
  }

  /**
   * Get statistics by entity type
   */
  @Get('stats/entities')
  @ApiOperation({
    summary: 'Get statistics by entity type',
    description: 'Retrieve audit statistics grouped by entity type',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatsByEntity(
    @TenantContext('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.auditService.getAuditStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      actionsByEntity: stats.actionsByEntity,
      totalActions: stats.totalActions,
    };
  }

  /**
   * Get statistics by user
   */
  @Get('stats/users')
  @ApiOperation({
    summary: 'Get statistics by user',
    description: 'Retrieve audit statistics grouped by user',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getStatsByUser(
    @TenantContext('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.auditService.getAuditStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      actionsByUser: stats.actionsByUser,
      totalActions: stats.totalActions,
    };
  }

  /**
   * Get failed actions
   */
  @Get('stats/failed')
  @ApiOperation({
    summary: 'Get failed actions',
    description: 'Retrieve statistics about failed actions',
  })
  @ApiResponse({
    status: 200,
    description: 'Statistics retrieved successfully',
  })
  async getFailedActions(
    @TenantContext('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.auditService.getAuditStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      failedActions: stats.failedActions,
      totalActions: stats.totalActions,
      failureRate: stats.totalActions > 0
        ? (stats.failedActions / stats.totalActions * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  /**
   * Get performance metrics
   */
  @Get('stats/performance')
  @ApiOperation({
    summary: 'Get performance metrics',
    description: 'Retrieve performance metrics including execution times',
  })
  @ApiResponse({
    status: 200,
    description: 'Performance metrics retrieved successfully',
  })
  async getPerformanceMetrics(
    @TenantContext('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.auditService.getAuditStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      avgExecutionTime: stats.avgExecutionTime,
      slowestActions: stats.slowestActions,
    };
  }

  /**
   * Get actions over time
   */
  @Get('stats/timeline')
  @ApiOperation({
    summary: 'Get actions over time',
    description: 'Retrieve audit statistics grouped by time period',
  })
  @ApiResponse({
    status: 200,
    description: 'Timeline statistics retrieved successfully',
  })
  async getTimeline(
    @TenantContext('tenantId') tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const stats = await this.auditService.getAuditStatistics(
      tenantId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );

    return {
      actionsOverTime: stats.actionsOverTime,
      totalActions: stats.totalActions,
    };
  }
}
