import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsUUID,
} from 'class-validator';

export class CreateUserDto {
  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  firstNameAr?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  firstNameEn?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  lastNameAr?: string;

  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(100)
  lastNameEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @IsEnum(['active', 'inactive', 'suspended'])
  @IsOptional()
  status?: 'active' | 'inactive' | 'suspended';

  @IsEnum(['ar', 'en'])
  @IsOptional()
  language?: 'ar' | 'en';

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @IsUUID()
  @IsOptional()
  defaultBranchId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  roleIds?: string[];
}

import { IsArray } from 'class-validator';
