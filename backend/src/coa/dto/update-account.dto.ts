import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateAccountDto } from './create-account.dto';

export class UpdateAccountDto extends PartialType(CreateAccountDto) {
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  code?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(255)
  nameAr?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(255)
  nameEn?: string;

  @IsEnum(['asset', 'liability', 'equity', 'revenue', 'expense'])
  @IsOptional()
  type?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

  @IsString()
  @IsOptional()
  @MaxLength(50)
  subtype?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  level?: number;

  @IsBoolean()
  @IsOptional()
  isControlAccount?: boolean;

  @IsBoolean()
  @IsOptional()
  isPostingAllowed?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsEnum(['debit', 'credit'])
  @IsOptional()
  balanceType?: 'debit' | 'credit';

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsBoolean()
  @IsOptional()
  costCenterRequired?: boolean;
}
