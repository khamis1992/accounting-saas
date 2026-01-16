import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsUUID,
  IsArray,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

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
