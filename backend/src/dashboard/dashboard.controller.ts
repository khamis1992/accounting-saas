import { Controller, Get, Query, UseGuards, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

/**
 * Dashboard Controller
 * Handles all dashboard-related routes
 */
@Controller('dashboard')
@UseGuards(TenantContextGuard, PermissionsGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * Get complete dashboard data
   * GET /api/dashboard
   */
  @Get()
  @Permissions('dashboard:read')
  async getDashboardData(@TenantContext() tenantContext: { tenantId: string }) {
    try {
      const data = await this.dashboardService.getDashboardData(tenantContext.tenantId);
      return {
        status: 'success',
        data,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get dashboard statistics
   * GET /api/dashboard/stats
   */
  @Get('stats')
  @Permissions('dashboard:read')
  async getStats(@TenantContext() tenantContext: { tenantId: string }) {
    try {
      const stats = await this.dashboardService.getStats(tenantContext.tenantId);
      return {
        status: 'success',
        data: stats,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get revenue vs expenses chart data
   * GET /api/dashboard/chart
   */
  @Get('chart')
  @Permissions('dashboard:read')
  async getChartData(@TenantContext() tenantContext: { tenantId: string }) {
    try {
      const chartData = await this.dashboardService.getChartData(tenantContext.tenantId);
      return {
        status: 'success',
        data: chartData,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get recent invoices
   * GET /api/dashboard/invoices?limit=5
   */
  @Get('invoices')
  @Permissions('dashboard:read')
  async getRecentInvoices(
    @TenantContext() tenantContext: { tenantId: string },
    @Query('limit') limit?: string,
  ) {
    try {
      const invoices = await this.dashboardService.getRecentInvoices(
        tenantContext.tenantId,
        limit ? parseInt(limit, 10) : 5,
      );
      return {
        status: 'success',
        data: invoices,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }

  /**
   * Get recent payments
   * GET /api/dashboard/payments?limit=5
   */
  @Get('payments')
  @Permissions('dashboard:read')
  async getRecentPayments(
    @TenantContext() tenantContext: { tenantId: string },
    @Query('limit') limit?: string,
  ) {
    try {
      const payments = await this.dashboardService.getRecentPayments(
        tenantContext.tenantId,
        limit ? parseInt(limit, 10) : 5,
      );
      return {
        status: 'success',
        data: payments,
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
      };
    }
  }
}
