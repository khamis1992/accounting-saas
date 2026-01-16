import {
  IsEmail,
  IsString,
  IsEnum,
  IsUUID,
  IsArray,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstNameAr: string;

  @IsString()
  @MinLength(2)
  @MaxLength(100)
  firstNameEn: string;

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

  @IsEnum(['ar', 'en'])
  @IsOptional()
  preferredLanguage?: 'ar' | 'en';

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @IsUUID()
  @IsOptional()
  defaultBranchId?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  roleIds: string[];

  @IsString()
  @IsOptional()
  @MaxLength(500)
  message?: string;
}
