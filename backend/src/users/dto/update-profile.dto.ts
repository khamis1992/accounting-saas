import {
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MinLength,
  MaxLength,
  IsUrl,
} from 'class-validator';

export class UpdateProfileDto {
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

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsUrl()
  @IsOptional()
  avatarUrl?: string;

  @IsEnum(['ar', 'en'])
  @IsOptional()
  preferredLanguage?: 'ar' | 'en';

  @IsString()
  @IsOptional()
  @MaxLength(50)
  timezone?: string;

  @IsString()
  @IsOptional()
  notificationPreferences?: string;
}
