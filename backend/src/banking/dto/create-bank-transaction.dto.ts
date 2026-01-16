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

export class CreateBankTransactionDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsNotEmpty()
  bankAccountId: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  transactionDate: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  valueDate?: Date;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsNumber()
  @IsOptional()
  balance?: number;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsEnum(['debit', 'credit'])
  @IsOptional()
  transactionType?: 'debit' | 'credit';

  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @IsBoolean()
  @IsOptional()
  isReconciled?: boolean;

  @IsUUID()
  @IsOptional()
  reconciliationId?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;
}

import { IsBoolean } from 'class-validator';
