import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
  IsDate,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentAllocationDto } from './payment-allocation.dto';

export class CreatePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  paymentNumber?: string;

  @IsEnum(['receipt', 'payment'])
  @IsNotEmpty()
  paymentType: 'receipt' | 'payment';

  @IsUUID()
  @IsNotEmpty()
  partyId: string;

  @IsEnum(['customer', 'vendor'])
  @IsNotEmpty()
  partyType: 'customer' | 'vendor';

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  paymentDate: Date;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  exchangeRate?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

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
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations?: PaymentAllocationDto[];
}
