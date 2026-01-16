import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { CreateRoleDto } from './create-role.dto';

export class UpdateRoleDto extends PartialType(CreateRoleDto) {
  @IsString()
  @IsOptional()
  @MinLength(2)
  @MaxLength(50)
  name?: string;

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
  description?: string;

  @IsBoolean()
  @IsOptional()
  isSystem?: boolean;

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
