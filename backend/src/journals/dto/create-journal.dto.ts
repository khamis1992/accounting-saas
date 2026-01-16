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
  validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { JournalLineDto } from './journal-line.dto';

export class CreateJournalDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

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
  @IsNotEmpty()
  journalType:
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
  @IsNotEmpty()
  descriptionAr: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  transactionDate: Date;

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
  @IsNotEmpty()
  lines: JournalLineDto[];
}
