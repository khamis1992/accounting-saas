import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  Put,
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
import { JournalsService } from './journals.service';
import { ExportService } from '../export/export.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CreateJournalDto } from './dto/create-journal.dto';
import { UpdateJournalDto } from './dto/update-journal.dto';

// Custom decorator to apply guards to specific routes (not controller-level)
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard, PermissionsGuard),
  );
}

@ApiTags('journals')
@Controller('journals')
export class JournalsController {
  constructor(
    private journalsService: JournalsService,
    private exportService: ExportService,
  ) {}

  @Get()
  @Protected()
  @ApiOperation({ summary: 'Get all journal entries' })
  @ApiResponse({ status: 200, description: 'List of journal entries' })
  @RequirePermissions({ module: 'journals', action: 'read' })
  findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('journalType') journalType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (journalType) filters.journalType = journalType;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    return this.journalsService.findAll(tenantId, filters);
  }

  @Get(':id')
  @Protected()
  @ApiOperation({ summary: 'Get a specific journal entry' })
  @ApiResponse({ status: 200, description: 'Journal entry details' })
  @RequirePermissions({ module: 'journals', action: 'read' })
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.journalsService.findOne(id, tenantId);
  }

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a new journal entry' })
  @ApiResponse({ status: 201, description: 'Journal entry created' })
  @RequirePermissions({ module: 'journals', action: 'create' })
  create(
    @Body() createJournalDto: CreateJournalDto,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId: string,
    @TenantContext('branchId') branchId?: string,
  ) {
    return this.journalsService.create(createJournalDto, tenantId, userId, branchId);
  }

  @Put(':id/lines')
  @Protected()
  @ApiOperation({ summary: 'Update journal lines (draft only)' })
  @ApiResponse({ status: 200, description: 'Journal lines updated' })
  @RequirePermissions({ module: 'journals', action: 'update' })
  updateLines(
    @Param('id') id: string,
    @Body('lines') lines: Array<{
      lineNumber: number;
      accountId: string;
      descriptionAr?: string;
      descriptionEn?: string;
      costCenterId?: string;
      debit: number;
      credit: number;
    }>,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.journalsService.updateLines(id, lines, tenantId);
  }

  @Post(':id/submit')
  @Protected()
  @ApiOperation({ summary: 'Submit journal for approval' })
  @ApiResponse({ status: 200, description: 'Journal submitted' })
  @RequirePermissions({ module: 'journals', action: 'submit' })
  submit(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId: string,
  ) {
    return this.journalsService.submit(id, tenantId, userId);
  }

  @Post(':id/approve')
  @Protected()
  @ApiOperation({ summary: 'Approve journal entry' })
  @ApiResponse({ status: 200, description: 'Journal approved' })
  @RequirePermissions({ module: 'journals', action: 'approve' })
  approve(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId: string,
  ) {
    return this.journalsService.approve(id, tenantId, userId);
  }

  @Post(':id/post')
  @Protected()
  @ApiOperation({ summary: 'Post journal to General Ledger' })
  @ApiResponse({ status: 200, description: 'Journal posted' })
  @RequirePermissions({ module: 'journals', action: 'post' })
  post(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId: string,
  ) {
    return this.journalsService.post(id, tenantId, userId);
  }

  @Patch(':id')
  @Protected()
  @ApiOperation({ summary: 'Update a draft journal entry' })
  @ApiResponse({ status: 200, description: 'Journal updated' })
  @RequirePermissions({ module: 'journals', action: 'update' })
  update(
    @Param('id') id: string,
    @Body() updateJournalDto: UpdateJournalDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.journalsService.update(id, updateJournalDto, tenantId);
  }

  @Delete(':id')
  @Protected()
  @ApiOperation({ summary: 'Delete a draft journal entry' })
  @ApiResponse({ status: 200, description: 'Journal deleted' })
  @RequirePermissions({ module: 'journals', action: 'delete' })
  remove(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.journalsService.remove(id, tenantId);
  }

  @Get('export/csv')
  @Protected()
  @ApiOperation({ summary: 'Export journal entries as CSV' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'journalType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @RequirePermissions({ module: 'journals', action: 'read' })
  async exportToCsv(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('status') status?: string,
    @Query('journalType') journalType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (journalType) filters.journalType = journalType;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const journals = await this.journalsService.findAll(tenantId, filters);
    const csvBuffer = this.exportService.exportJournalEntriesToCsv(journals, { language });

    if (res) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=journals_${new Date().toISOString().split('T')[0]}.csv`,
        'Content-Length': csvBuffer.length.toString(),
      });
    }

    return new StreamableFile(csvBuffer);
  }

  @Get('export/excel')
  @Protected()
  @ApiOperation({ summary: 'Export journal entries as Excel' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'journalType', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @RequirePermissions({ module: 'journals', action: 'read' })
  async exportToExcel(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('status') status?: string,
    @Query('journalType') journalType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (journalType) filters.journalType = journalType;
    if (startDate && endDate) {
      filters.startDate = startDate;
      filters.endDate = endDate;
    }

    const journals = await this.journalsService.findAll(tenantId, filters);
    const excelBuffer = await this.exportService.exportJournalEntriesToExcel(journals, { language });

    if (res) {
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=journals_${new Date().toISOString().split('T')[0]}.xlsx`,
        'Content-Length': excelBuffer.length.toString(),
      });
    }

    return new StreamableFile(excelBuffer);
  }
}
