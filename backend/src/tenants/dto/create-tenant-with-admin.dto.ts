import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateTenantWithAdminDto {
  @ApiProperty({
    description: 'Company name in English',
    example: 'Tech Solutions Qatar',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3, { message: 'Company name (English) must be at least 3 characters' })
  @MaxLength(200, { message: 'Company name (English) must not exceed 200 characters' })
  companyNameEn: string;

  @ApiProperty({
    description: 'Company name in Arabic',
    example: 'الحلول التقنية قطر',
    minLength: 3,
    maxLength: 200,
  })
  @IsString()
  @MinLength(3, { message: 'Company name (Arabic) must be at least 3 characters' })
  @MaxLength(200, { message: 'Company name (Arabic) must not exceed 200 characters' })
  companyNameAr: string;

  @ApiProperty({
    description: 'Admin user email',
    example: 'admin@techsolutions.qa',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    description: 'Admin user password',
    example: 'SecurePass123!',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    description: 'Admin first name',
    example: 'Ahmed',
  })
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Al-Mansouri',
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Admin phone number',
    example: '+97455551234',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format',
  })
  phone?: string;
}
