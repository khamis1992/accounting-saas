import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { EmailService } from './email.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('email')
@Controller('email')
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('test-verification')
  @ApiOperation({ summary: 'Send test verification email' })
  @ApiQuery({ name: 'email', required: true })
  @ApiQuery({ name: 'language', required: false, enum: ['ar', 'en'] })
  async testVerificationEmail(
    @Query('email') email: string,
    @Query('language') language: 'ar' | 'en' = 'en',
  ) {
    const testToken = 'test-verification-token-' + Date.now();
    const tenantId = 'test-tenant-id';

    return this.emailService.sendVerificationEmail(
      email,
      testToken,
      tenantId,
      language,
    );
  }

  @Post('test-password-reset')
  @ApiOperation({ summary: 'Send test password reset email' })
  @ApiQuery({ name: 'email', required: true })
  @ApiQuery({ name: 'language', required: false, enum: ['ar', 'en'] })
  async testPasswordResetEmail(
    @Query('email') email: string,
    @Query('language') language: 'ar' | 'en' = 'en',
  ) {
    const testToken = 'test-reset-token-' + Date.now();
    const tenantId = 'test-tenant-id';

    return this.emailService.sendPasswordResetEmail(
      email,
      testToken,
      tenantId,
      language,
    );
  }

  @Post('test-welcome')
  @ApiOperation({ summary: 'Send test welcome email' })
  @ApiQuery({ name: 'email', required: true })
  @ApiQuery({ name: 'name', required: true })
  @ApiQuery({ name: 'language', required: false, enum: ['ar', 'en'] })
  async testWelcomeEmail(
    @Query('email') email: string,
    @Query('name') name: string,
    @Query('language') language: 'ar' | 'en' = 'en',
  ) {
    const tenantId = 'test-tenant-id';

    return this.emailService.sendWelcomeEmail(email, name, tenantId, language);
  }

  @Post('test-invoice')
  @ApiOperation({ summary: 'Send test invoice email' })
  async testInvoiceEmail(@Body() body: any) {
    const {
      email,
      invoiceId,
      invoiceNumber,
      totalAmount,
      dueDate,
      language = 'en',
    } = body;

    const tenantId = 'test-tenant-id';
    const invoiceData = {
      invoiceNumber,
      totalAmount,
      dueDate,
    };

    return this.emailService.sendInvoiceEmail(
      invoiceId,
      email,
      tenantId,
      invoiceData,
      language,
    );
  }

  @Post('test-payment-receipt')
  @ApiOperation({ summary: 'Send test payment receipt email' })
  async testPaymentReceiptEmail(@Body() body: any) {
    const {
      email,
      paymentId,
      receiptNumber,
      amount,
      paymentDate,
      invoiceNumber,
      language = 'en',
    } = body;

    const tenantId = 'test-tenant-id';
    const paymentData = {
      receiptNumber,
      amount,
      paymentDate,
      invoiceNumber,
    };

    return this.emailService.sendPaymentReceiptEmail(
      paymentId,
      email,
      tenantId,
      paymentData,
      language,
    );
  }

  @Post('test-payment-reminder')
  @ApiOperation({ summary: 'Send test payment reminder email' })
  async testPaymentReminderEmail(@Body() body: any) {
    const { email, invoices, language = 'en' } = body;

    const tenantId = 'test-tenant-id';

    return this.emailService.sendPaymentReminderEmail(
      invoices,
      email,
      tenantId,
      language,
    );
  }

  @Get('status')
  @ApiOperation({ summary: 'Check email service status' })
  async getStatus() {
    const isConnected = await this.emailService.verifyConnection();
    const queueStats = await this.emailService.getQueueStats();

    return {
      connected: isConnected,
      queue: queueStats,
    };
  }

  @Get('queue-stats')
  @ApiOperation({ summary: 'Get email queue statistics' })
  async getQueueStats() {
    return this.emailService.getQueueStats();
  }
}
