import { IsString, IsOptional, IsBoolean, IsNumber, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCompanySettingsDto {
  @ApiProperty({ description: 'Company name in English', required: false })
  @IsString()
  @IsOptional()
  company_name_en?: string;

  @ApiProperty({ description: 'Company name in Arabic', required: false })
  @IsString()
  @IsOptional()
  company_name_ar?: string;

  @ApiProperty({ description: 'Legal name', required: false })
  @IsString()
  @IsOptional()
  legal_name?: string;

  @ApiProperty({ description: 'Business type', required: false })
  @IsString()
  @IsOptional()
  business_type?: string;

  @ApiProperty({ description: 'Tax number', required: false })
  @IsString()
  @IsOptional()
  tax_number?: string;

  @ApiProperty({ description: 'Registration number', required: false })
  @IsString()
  @IsOptional()
  registration_number?: string;

  @ApiProperty({ description: 'Industry', required: false })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Email', required: false })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ description: 'Phone', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ description: 'Website', required: false })
  @IsString()
  @IsOptional()
  website?: string;

  @ApiProperty({ description: 'Logo URL', required: false })
  @IsString()
  @IsOptional()
  logo_url?: string;

  @ApiProperty({ description: 'Address object', required: false })
  @IsObject()
  @IsOptional()
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };

  @ApiProperty({ description: 'Tax settings object', required: false })
  @IsObject()
  @IsOptional()
  tax_settings?: {
    vat_enabled?: boolean;
    vat_number?: string;
    default_tax_rate?: number;
    tax_calculation_method?: string;
    is_tax_enabled?: boolean;
  };

  @ApiProperty({ description: 'Currency settings object', required: false })
  @IsObject()
  @IsOptional()
  currency_settings?: {
    base_currency?: string;
    decimal_places?: number;
    thousands_separator?: string;
    decimal_separator?: string;
    symbol_position?: string;
  };
}
