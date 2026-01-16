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
import { PaymentsService } from './payments.service';
import { PdfService } from '../pdf/pdf.service';
import { ExportService } from '../export/export.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

// Custom decorator to apply guards to specific routes
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard),
  );
}

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private paymentsService: PaymentsService,
    private pdfService: PdfService,
    private exportService: ExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @Protected()
  findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('paymentType') paymentType?: string,
    @Query('status') status?: string,
    @Query('partyType') partyType?: string,
  ) {
    return this.paymentsService.findAll(tenantId, { paymentType, status, partyType });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a payment by ID' })
  @Protected()
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.paymentsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new payment' })
  @Protected()
  create(
    @Body() createDto: CreatePaymentDto,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
    @TenantContext('branchId') branchId?: string,
  ) {
    return this.paymentsService.create(createDto, tenantId, userId, branchId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a payment' })
  @Protected()
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdatePaymentDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.paymentsService.update(id, updateDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment' })
  @Protected()
  remove(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.paymentsService.remove(id, tenantId);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a payment for approval' })
  @Protected()
  submit(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
  ) {
    return this.paymentsService.submit(id, tenantId, userId);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve a submitted payment' })
  @Protected()
  approve(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
  ) {
    return this.paymentsService.approve(id, tenantId, userId);
  }

  @Post(':id/post')
  @ApiOperation({ summary: 'Post an approved payment to the ledger' })
  @Protected()
  post(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
  ) {
    return this.paymentsService.post(id, tenantId, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a payment' })
  @Protected()
  cancel(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
  ) {
    return this.paymentsService.cancel(id, tenantId, userId);
  }

  @Get(':id/pdf')
  @ApiOperation({ summary: 'Download payment receipt PDF' })
  @Protected()
  async getPdf(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'ar' | 'en' | 'both',
    @Res({ passthrough: true }) res?: Response,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generatePaymentReceiptPdf(id, tenantId, {
        language: language || 'both',
      });

      if (res) {
        res.set({
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename=receipt-${id}.pdf`,
          'Content-Length': pdfBuffer.length.toString(),
        });
      }

      return new StreamableFile(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new NotFoundException('Failed to generate payment receipt PDF');
    }
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export payments as CSV' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'paymentType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'partyType', required: false })
  @Protected()
  async exportToCsv(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('paymentType') paymentType?: string,
    @Query('status') status?: string,
    @Query('partyType') partyType?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const payments = await this.paymentsService.findAll(tenantId, { paymentType, status, partyType });
    const csvBuffer = this.exportService.exportPaymentsToCsv(payments, { language });

    if (res) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=payments_${new Date().toISOString().split('T')[0]}.csv`,
        'Content-Length': csvBuffer.length.toString(),
      });
    }

    return new StreamableFile(csvBuffer);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export payments as Excel' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'paymentType', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'partyType', required: false })
  @Protected()
  async exportToExcel(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('paymentType') paymentType?: string,
    @Query('status') status?: string,
    @Query('partyType') partyType?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const payments = await this.paymentsService.findAll(tenantId, { paymentType, status, partyType });
    const excelBuffer = await this.exportService.exportPaymentsToExcel(payments, { language });

    if (res) {
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=payments_${new Date().toISOString().split('T')[0]}.xlsx`,
        'Content-Length': excelBuffer.length.toString(),
      });
    }

    return new StreamableFile(excelBuffer);
  }
}
