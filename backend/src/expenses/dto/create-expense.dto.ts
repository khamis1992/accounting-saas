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
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExpenseDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  expenseNumber?: string;

  @IsString()
  @IsNotEmpty()
  titleAr: string;

  @IsString()
  @IsOptional()
  titleEn?: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  expenseDate: Date;

  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @IsUUID()
  @IsOptional()
  vendorId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

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
  totalAmount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  paidAmount?: number;

  @IsEnum(['pending', 'approved', 'rejected', 'cancelled'])
  @IsOptional()
  approvalStatus?: 'pending' | 'approved' | 'rejected' | 'cancelled';

  @IsString()
  @IsOptional()
  rejectionReason?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(['draft', 'submitted', 'posted', 'paid'])
  @IsOptional()
  status?: 'draft' | 'submitted' | 'posted' | 'paid';
}
