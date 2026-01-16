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
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateJournalDto } from './create-journal.dto';
import { JournalLineDto } from './journal-line.dto';

export class UpdateJournalDto extends PartialType(CreateJournalDto) {
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  journalNumber?: string;

  @IsEnum([
    'general',
    'sales',
    'purchase',
    'receipt',
    'payment',
    'expense',
    'depreciation',
    'adjustment',
    'opening',
    'closing',
  ])
  @IsOptional()
  journalType?:
    | 'general'
    | 'sales'
    | 'purchase'
    | 'receipt'
    | 'payment'
    | 'expense'
    | 'depreciation'
    | 'adjustment'
    | 'opening'
    | 'closing';

  @IsString()
  @IsOptional()
  @MaxLength(50)
  referenceNumber?: string;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  transactionDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  postingDate?: Date;

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
  totalDebit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalCredit?: number;

  @IsEnum(['draft', 'submitted', 'approved', 'posted', 'reversed'])
  @IsOptional()
  status?: 'draft' | 'submitted' | 'approved' | 'posted' | 'reversed';

  @IsString()
  @IsOptional()
  notes?: string;

  @IsString()
  @IsOptional()
  attachmentUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  sourceModule?: string;

  @IsUUID()
  @IsOptional()
  sourceId?: string;

  @IsArray()
  @IsOptional()
  lines?: JournalLineDto[];
}
