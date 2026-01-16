import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsBoolean,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';

export class CreateBankAccountDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  code: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(255)
  accountName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  accountNumber: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  iban?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  bankBranch?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  swiftCode?: string;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsEnum(['checking', 'savings', 'current', 'credit_card'])
  @IsOptional()
  accountType?: 'checking' | 'savings' | 'current' | 'credit_card';

  @IsUUID()
  @IsOptional()
  glAccountId?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsNumber()
  @IsOptional()
  @Min(0)
  balance?: number;
}
