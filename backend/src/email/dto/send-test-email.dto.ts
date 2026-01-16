import { IsEmail, IsString, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendTestEmailDto {
  @IsEmail()
  @ApiProperty({ example: 'test@example.com' })
  email: string;

  @IsOptional()
  @IsEnum(['ar', 'en'])
  @ApiProperty({ example: 'en', enum: ['ar', 'en'] })
  language?: 'ar' | 'en';
}

export class SendTestInvoiceDto extends SendTestEmailDto {
  @IsString()
  @ApiProperty({ example: 'inv-123' })
  invoiceId: string;

  @IsString()
  @ApiProperty({ example: 'INV-2024-001' })
  invoiceNumber: string;

  @IsNumber()
  @ApiProperty({ example: 1500.00 })
  totalAmount: number;

  @IsString()
  @ApiProperty({ example: '2024-12-31' })
  dueDate: string;
}

export class SendTestPaymentReceiptDto extends SendTestEmailDto {
  @IsString()
  @ApiProperty({ example: 'pay-123' })
  paymentId: string;

  @IsString()
  @ApiProperty({ example: 'RCP-2024-001' })
  receiptNumber: string;

  @IsNumber()
  @ApiProperty({ example: 1500.00 })
  amount: number;

  @IsString()
  @ApiProperty({ example: '2024-01-15' })
  paymentDate: string;

  @IsString()
  @ApiProperty({ example: 'INV-2024-001' })
  invoiceNumber: string;
}

export class SendTestPaymentReminderDto extends SendTestEmailDto {
  @IsArray()
  @ApiProperty({
    example: [
      {
        id: 'inv-1',
        invoice_number: 'INV-2024-001',
        total_amount: 1500.00,
        due_date: '2024-12-31',
      },
    ],
  })
  invoices: Array<{
    id: string;
    invoice_number: string;
    total_amount: number;
    due_date: string;
  }>;
}
