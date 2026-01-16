import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
  IsDate,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateVatCodeDto {
  @IsUUID()
  @IsOptional()
  tenantId?: string;

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

  @IsEnum(['input', 'output'])
  @IsNotEmpty()
  type: 'input' | 'output';

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  rate: number;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isReverseCharge?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  effectiveDate: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUUID()
  @IsOptional()
  createdBy?: string;
}
