import {
  IsString,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  IsEmail,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateVendorDto } from './create-vendor.dto';

export class UpdateVendorDto extends PartialType(CreateVendorDto) {
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

  @IsString()
  @IsOptional()
  @MaxLength(50)
  vatNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  nationalId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  contactPerson?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  mobile?: string;

  @IsString()
  @IsOptional()
  addressAr?: string;

  @IsString()
  @IsOptional()
  addressEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  cityAr?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  cityEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2)
  country?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  paymentTermsDays?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  bankName?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  bankAccountNumber?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  iban?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  swiftCode?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
