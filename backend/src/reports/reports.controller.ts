import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

@ApiTags('reports')
@Controller('reports')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('trial-balance')
  @ApiOperation({ summary: 'Get Trial Balance' })
  getTrialBalance(
    @TenantContext('tenantId') tenantId: string,
    @Query('fiscalPeriodId') fiscalPeriodId: string,
  ) {
    return this.reportsService.getTrialBalance(tenantId, fiscalPeriodId);
  }

  @Get('general-ledger')
  @ApiOperation({ summary: 'Get General Ledger' })
  getGeneralLedger(
    @TenantContext('tenantId') tenantId: string,
    @Query('accountId') accountId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (accountId) filters.accountId = accountId;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    return this.reportsService.getGeneralLedger(tenantId, filters);
  }

  @Get('balance-sheet')
  @ApiOperation({ summary: 'Get Balance Sheet' })
  getBalanceSheet(
    @TenantContext('tenantId') tenantId: string,
    @Query('fiscalPeriodId') fiscalPeriodId: string,
  ) {
    return this.reportsService.getBalanceSheet(tenantId, fiscalPeriodId);
  }

  @Get('income-statement')
  @ApiOperation({ summary: 'Get Income Statement' })
  getIncomeStatement(
    @TenantContext('tenantId') tenantId: string,
    @Query('fiscalPeriodId') fiscalPeriodId: string,
  ) {
    return this.reportsService.getIncomeStatement(tenantId, fiscalPeriodId);
  }

  @Get('customer-balance')
  @ApiOperation({ summary: 'Get Customer Balances' })
  getCustomerBalance(@TenantContext('tenantId') tenantId: string) {
    return this.reportsService.getCustomerBalance(tenantId);
  }

  @Get('vendor-balance')
  @ApiOperation({ summary: 'Get Vendor Balances' })
  getVendorBalance(@TenantContext('tenantId') tenantId: string) {
    return this.reportsService.getVendorBalance(tenantId);
  }
}
