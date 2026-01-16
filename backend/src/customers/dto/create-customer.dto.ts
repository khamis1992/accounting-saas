import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  IsEmail,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';

export class CreateCustomerDto {
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
  creditLimit?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  paymentTermsDays?: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  taxNumber?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  createdBy?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
