import {
  Controller,
  Get,
  Post,
  UseGuards,
  applyDecorators,
  Param,
  Query,
  Res,
  NotFoundException,
  StreamableFile,
  Body,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { type Response } from 'express';
import { PdfService } from './pdf.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

// Custom decorator to apply guards to specific routes
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard),
  );
}

@ApiTags('pdf')
@Controller('pdf')
export class PdfController {
  constructor(private pdfService: PdfService) {}

  /**
   * Generate and download invoice PDF
   */
  @Get('invoices/:id')
  @ApiOperation({ summary: 'Download invoice PDF' })
  @Protected()
  async getInvoicePdf(
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

  /**
   * Generate and download payment receipt PDF
   */
  @Get('payments/:id')
  @ApiOperation({ summary: 'Download payment receipt PDF' })
  @Protected()
  async getPaymentReceiptPdf(
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

  /**
   * Generate and download customer statement PDF
   */
  @Get('customers/:id/statement')
  @ApiOperation({ summary: 'Download customer statement PDF' })
  @Protected()
  async getCustomerStatementPdf(
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

  /**
   * Generate invoice PDF via POST for additional options
   */
  @Post('invoices/:id/generate')
  @ApiOperation({ summary: 'Generate invoice PDF with custom options' })
  @Protected()
  async generateInvoicePdf(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
    @Body() options?: any,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generateInvoicePdf(id, tenantId, options);

      return {
        success: true,
        message: 'PDF generated successfully',
        size: pdfBuffer.length,
      };
    } catch (error) {
      throw new NotFoundException('Failed to generate invoice PDF');
    }
  }

  /**
   * Generate payment receipt PDF via POST for additional options
   */
  @Post('payments/:id/generate')
  @ApiOperation({ summary: 'Generate payment receipt PDF with custom options' })
  @Protected()
  async generatePaymentReceiptPdf(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
    @Body() options?: any,
  ) {
    try {
      const pdfBuffer = await this.pdfService.generatePaymentReceiptPdf(id, tenantId, options);

      return {
        success: true,
        message: 'PDF generated successfully',
        size: pdfBuffer.length,
      };
    } catch (error) {
      throw new NotFoundException('Failed to generate payment receipt PDF');
    }
  }
}
