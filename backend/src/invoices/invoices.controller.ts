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
import { InvoicesService } from './invoices.service';
import { PdfService } from '../pdf/pdf.service';
import { ExportService } from '../export/export.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

// Custom decorator to apply guards to specific routes
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard),
  );
}

@ApiTags('invoices')
@Controller('invoices')
export class InvoicesController {
  constructor(
    private invoicesService: InvoicesService,
    private pdfService: PdfService,
    private exportService: ExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all invoices' })
  @Protected()
  findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('invoiceType') invoiceType?: string,
    @Query('status') status?: string,
    @Query('partyType') partyType?: string,
  ) {
    return this.invoicesService.findAll(tenantId, { invoiceType, status, partyType });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an invoice by ID' })
  @Protected()
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.invoicesService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new invoice' })
  @Protected()
  create(
    @Body() createDto: CreateInvoiceDto,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
    @TenantContext('branchId') branchId?: string,
  ) {
    return this.invoicesService.create(createDto, tenantId, userId, branchId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an invoice' })
  @Protected()
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateInvoiceDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.invoicesService.update(id, updateDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an invoice' })
  @Protected()
  remove(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.invoicesService.remove(id, tenantId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit an invoice for approval' })
  @Protected()
  submit(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
  ) {
    return this.invoicesService.submit(id, tenantId, userId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a submitted invoice' })
  @Protected()
  approve(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
  ) {
    return this.invoicesService.approve(id, tenantId, userId);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post an approved invoice to the ledger' })
  @Protected()
  post(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
  ) {
    return this.invoicesService.post(id, tenantId, userId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @Protected()
  async getPdf(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'ar' | 'en' | 'both',
    @Res({ passthrough: true }) res?: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateInvoicePdf(id, tenantId, { language: language || 'both' });

      if (res) {
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=invoice-${id}.pdf`,
          'Content-Length': pdfBuffer.length.toString(),
        });
      }

      return new StreamableFile(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to generate invoice PDF');
    }
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export invoices as CSV' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'invoiceType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'partyType', required: false })
  @Protected()
  async exportToCsv(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('invoiceType') invoiceType?: string,
    @Query('status') status?: string,
    @Query('partyType') partyType?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const invoices = await this.invoicesService.findAll(tenantId, { invoiceType, status, partyType });
    const csvBuffer = this.exportService.exportInvoicesToCsv(invoices, { language });

    if (res) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=invoices_${new Date().toISOString().split('T')[0]}.csv`,
        'Content-Length': csvBuffer.length.toString(),
      });
    }

    return new StreamableFile(csvBuffer);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export invoices as Excel' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'invoiceType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'partyType', required: false })
  @Protected()
  async exportToExcel(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('invoiceType') invoiceType?: string,
    @Query('status') status?: string,
    @Query('partyType') partyType?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const invoices = await this.invoicesService.findAll(tenantId, { invoiceType, status, partyType });
    const excelBuffer = await this.exportService.exportInvoicesToExcel(invoices, { language });

    if (res) {
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=invoices_${new Date().toISOString().split('T')[0]}.xlsx`,
        'Content-Length': excelBuffer.length.toString(),
      });
    }

    return new StreamableFile(excelBuffer);
  }
}
