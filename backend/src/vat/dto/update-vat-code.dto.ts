import {
  IsString,
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
import { PartialType } from '@nestjs/mapped-types';
import { CreateVatCodeDto } from './create-vat-code.dto';

export class UpdateVatCodeDto extends PartialType(CreateVatCodeDto) {
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

  @IsEnum(['input', 'output'])
  @IsOptional()
  type?: 'input' | 'output';

  @IsNumber()
  @IsOptional()
  @Min(0)
  rate?: number;

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
  @IsOptional()
  @Type(() => Date)
  effectiveDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  expiryDate?: Date;

  @IsString()
  @IsOptional()
  description?: string;
}
