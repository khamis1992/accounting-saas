import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsNumber,
  Min,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateAccountDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  nameAr: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  nameEn: string;

  @IsEnum(['asset', 'liability', 'equity', 'revenue', 'expense'])
  @IsNotEmpty()
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

  @IsString()
  @IsOptional()
  @MaxLength(50)
  subtype?: string;

  @IsUUID()
  @IsOptional()
  parentId?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  level: number;

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

  @IsUUID()
  @IsOptional()
  createdBy?: string;
}
