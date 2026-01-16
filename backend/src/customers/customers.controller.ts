import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  applyDecorators,
  Res,
  StreamableFile,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { type Response } from 'express';
import { CustomersService } from './customers.service';
import { PdfService } from '../pdf/pdf.service';
import { ExportService } from '../export/export.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

// Custom decorator to apply guards to specific routes
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard),
  );
}

@ApiTags('customers')
@Controller('customers')
export class CustomersController {
  constructor(
    private customersService: CustomersService,
    private pdfService: PdfService,
    private exportService: ExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all customers' })
  @Protected()
  findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.customersService.findAll(tenantId, includeInactive);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get a customer by code' })
  @Protected()
  findByCode(
    @Param('code') code: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.customersService.findByCode(code, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @Protected()
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.customersService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new customer' })
  @Protected()
  create(
    @Body() createDto: CreateCustomerDto,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
  ) {
    return this.customersService.create(createDto, tenantId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a customer' })
  @Protected()
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateCustomerDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.customersService.update(id, updateDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a customer' })
  @Protected()
  remove(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.customersService.remove(id, tenantId);
  }

  @Get(':id/statement/pdf')
  @ApiOperation({ summary: 'Download customer statement PDF' })
  @Protected()
  async getStatementPdf(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('language') language?: 'ar' | 'en' | 'both',
    @Res({ passthrough: true }) res?: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateCustomerStatementPdf(id, tenantId, {
        fromDate,
        toDate,
        language: language || 'both',
      });

      if (res) {
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=statement-${id}.pdf`,
          'Content-Length': pdfBuffer.length.toString(),
        });
      }

      return new StreamableFile(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to generate customer statement PDF');
    }
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export customers as CSV' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @Protected()
  async exportToCsv(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('includeInactive') includeInactive?: boolean,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const customers = await this.customersService.findAll(tenantId, includeInactive);
    const csvBuffer = this.exportService.exportCustomersToCsv(customers, { language });

    if (res) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=customers_${new Date().toISOString().split('T')[0]}.csv`,
        'Content-Length': csvBuffer.length.toString(),
      });
    }

    return new StreamableFile(csvBuffer);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export customers as Excel' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @Protected()
  async exportToExcel(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('includeInactive') includeInactive?: boolean,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const customers = await this.customersService.findAll(tenantId, includeInactive);
    const excelBuffer = await this.exportService.exportCustomersToExcel(customers, { language });

    if (res) {
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=customers_${new Date().toISOString().split('T')[0]}.xlsx`,
        'Content-Length': excelBuffer.length.toString(),
      });
    }

    return new StreamableFile(excelBuffer);
  }
}
