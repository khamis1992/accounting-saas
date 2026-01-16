import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  applyDecorators,
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { type Response } from 'express';
import { CoaService } from './coa.service';
import { ExportService } from '../export/export.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CreateAccountDto } from './dto/create-account.dto';
import { UpdateAccountDto } from './dto/update-account.dto';

// Custom decorator to apply guards to specific routes (not controller-level)
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard, PermissionsGuard),
  );
}

@ApiTags('coa')
@Controller('coa')
export class CoaController {
  constructor(
    private coaService: CoaService,
    private exportService: ExportService,
  ) {}

  @Get()
  @Protected()
  @ApiOperation({ summary: 'Get Chart of Accounts (hierarchical)' })
  @ApiResponse({ status: 200, description: 'Chart of Accounts' })
  @RequirePermissions({ module: 'coa', action: 'read' })
  findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('includeInactive') includeInactive?: string,
  ) {
    return this.coaService.findAll(tenantId, includeInactive === 'true');
  }

  @Get('by-type/:type')
  @Protected()
  @ApiOperation({ summary: 'Get accounts by type' })
  @ApiResponse({ status: 200, description: 'Accounts of specified type' })
  @RequirePermissions({ module: 'coa', action: 'read' })
  getByType(
    @Param('type') type: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.coaService.getAccountsByType(tenantId, type);
  }

  @Get(':id')
  @Protected()
  @ApiOperation({ summary: 'Get a specific account' })
  @ApiResponse({ status: 200, description: 'Account details' })
  @RequirePermissions({ module: 'coa', action: 'read' })
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.coaService.findOne(id, tenantId);
  }

  @Get('code/:code')
  @Protected()
  @ApiOperation({ summary: 'Get account by code' })
  @ApiResponse({ status: 200, description: 'Account details' })
  @RequirePermissions({ module: 'coa', action: 'read' })
  findByCode(
    @Param('code') code: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.coaService.findByCode(code, tenantId);
  }

  @Get(':id/balance')
  @Protected()
  @ApiOperation({ summary: 'Get account balance' })
  @ApiResponse({ status: 200, description: 'Account balance' })
  @RequirePermissions({ module: 'coa', action: 'read' })
  getBalance(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @Query('asOf') asOf?: string,
  ) {
    const asOfDate = asOf ? new Date(asOf) : undefined;
    return this.coaService.getAccountBalance(id, tenantId, asOfDate);
  }

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a new account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  @RequirePermissions({ module: 'coa', action: 'create' })
  create(
    @Body() createAccountDto: CreateAccountDto,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId: string,
  ) {
    return this.coaService.create(createAccountDto, tenantId, userId);
  }

  @Patch(':id')
  @Protected()
  @ApiOperation({ summary: 'Update an account' })
  @ApiResponse({ status: 200, description: 'Account updated' })
  @RequirePermissions({ module: 'coa', action: 'update' })
  update(
    @Param('id') id: string,
    @Body() updateAccountDto: UpdateAccountDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.coaService.update(id, updateAccountDto, tenantId);
  }

  @Delete(':id')
  @Protected()
  @ApiOperation({ summary: 'Delete an account' })
  @ApiResponse({ status: 200, description: 'Account deleted' })
  @RequirePermissions({ module: 'coa', action: 'delete' })
  remove(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.coaService.remove(id, tenantId);
  }

  @Get('export/csv')
  @Protected()
  @ApiOperation({ summary: 'Export Chart of Accounts as CSV' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @RequirePermissions({ module: 'coa', action: 'read' })
  async exportToCsv(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('includeInactive') includeInactive?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const accounts = await this.coaService.findAll(tenantId, includeInactive === 'true');
    const csvBuffer = this.exportService.exportChartOfAccountsToCsv(accounts, { language });

    if (res) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=chart_of_accounts_${new Date().toISOString().split('T')[0]}.csv`,
        'Content-Length': csvBuffer.length.toString(),
      });
    }

    return new StreamableFile(csvBuffer);
  }

  @Get('export/excel')
  @Protected()
  @ApiOperation({ summary: 'Export Chart of Accounts as Excel' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @RequirePermissions({ module: 'coa', action: 'read' })
  async exportToExcel(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('includeInactive') includeInactive?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const accounts = await this.coaService.findAll(tenantId, includeInactive === 'true');
    const excelBuffer = await this.exportService.exportChartOfAccountsToExcel(accounts, { language });

    if (res) {
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=chart_of_accounts_${new Date().toISOString().split('T')[0]}.xlsx`,
        'Content-Length': excelBuffer.length.toString(),
      });
    }

    return new StreamableFile(excelBuffer);
  }
}
