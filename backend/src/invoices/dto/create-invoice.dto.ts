import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
  IsDate,
  IsArray,
  MaxLength,
  ValidateNested,
  ArrayNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceLineDto } from './invoice-line.dto';
import { InvoiceTaxDto } from './invoice-tax.dto';

export class CreateInvoiceDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  invoiceNumber?: string;

  @IsEnum(['sales', 'purchase', 'sales_return', 'purchase_return'])
  @IsNotEmpty()
  invoiceType: 'sales' | 'purchase' | 'sales_return' | 'purchase_return';

  @IsUUID()
  @IsNotEmpty()
  partyId: string;

  @IsEnum(['customer', 'vendor'])
  @IsNotEmpty()
  partyType: 'customer' | 'vendor';

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  invoiceDate: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  dueDate?: Date;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  exchangeRate?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  subtotal?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPercentage?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxableAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  totalAmount: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  internalNotes?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsEnum([
    'draft',
    'submitted',
    'approved',
    'posted',
    'paid',
    'partially_paid',
    'overdue',
    'cancelled',
  ])
  @IsOptional()
  status?:
    | 'draft'
    | 'submitted'
    | 'approved'
    | 'posted'
    | 'paid'
    | 'partially_paid'
    | 'overdue'
    | 'cancelled';

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => InvoiceLineDto)
  lines: InvoiceLineDto[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => InvoiceTaxDto)
  taxes?: InvoiceTaxDto[];
}
