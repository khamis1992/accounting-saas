import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
  IsDate,
  IsArray,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreatePaymentDto } from './create-payment.dto';
import { PaymentAllocationDto } from './payment-allocation.dto';

export class UpdatePaymentDto extends PartialType(CreatePaymentDto) {
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  paymentNumber?: string;

  @IsEnum(['receipt', 'payment'])
  @IsOptional()
  paymentType?: 'receipt' | 'payment';

  @IsUUID()
  @IsOptional()
  partyId?: string;

  @IsEnum(['customer', 'vendor'])
  @IsOptional()
  partyType?: 'customer' | 'vendor';

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  paymentDate?: Date;

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
  amount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  unallocatedAmount?: number;

  @IsEnum(['cash', 'bank_transfer', 'check', 'credit_card', 'online', 'other'])
  @IsOptional()
  paymentMethod?: 'cash' | 'bank_transfer' | 'check' | 'credit_card' | 'online' | 'other';

  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  checkNumber?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  checkDate?: Date;

  @IsUUID()
  @IsOptional()
  bankAccountId?: string;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsEnum(['draft', 'submitted', 'approved', 'posted', 'cancelled'])
  @IsOptional()
  status?: 'draft' | 'submitted' | 'approved' | 'posted' | 'cancelled';

  @IsArray()
  @IsOptional()
  @ValidateNested()
  @Type(() => PaymentAllocationDto)
  allocations?: PaymentAllocationDto[];
}
