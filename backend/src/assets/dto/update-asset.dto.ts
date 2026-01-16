import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  Min,
  IsUUID,
  IsDate,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateAssetDto } from './create-asset.dto';

export class UpdateAssetDto extends PartialType(CreateAssetDto) {
  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  assetCode?: string;

  @IsString()
  @IsOptional()
  assetNameAr?: string;

  @IsString()
  @IsOptional()
  assetNameEn?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  assetCategory?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  purchaseDate?: Date;

  @IsNumber()
  @IsOptional()
  @Min(0)
  purchaseValue?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  salvageValue?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  usefulLifeYears?: number;

  @IsEnum(['straight_line', 'declining_balance', 'double_declining_balance'])
  @IsOptional()
  depreciationMethod?: 'straight_line' | 'declining_balance' | 'double_declining_balance';

  @IsNumber()
  @IsOptional()
  @Min(0)
  depreciationRate?: number;

  @IsUUID()
  @IsOptional()
  assetAccountId?: string;

  @IsUUID()
  @IsOptional()
  depreciationAccountId?: string;

  @IsUUID()
  @IsOptional()
  accumulatedDepreciationAccountId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  location?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  locationAr?: string;

  @IsUUID()
  @IsOptional()
  responsiblePersonId?: string;

  @IsEnum(['active', 'disposed', 'sold', 'scrapped'])
  @IsOptional()
  status?: 'active' | 'disposed' | 'sold' | 'scrapped';

  @IsString()
  @IsOptional()
  notes?: string;
}
