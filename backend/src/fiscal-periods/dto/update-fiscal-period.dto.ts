import {
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { CreateFiscalPeriodDto } from './create-fiscal-period.dto';

export class UpdateFiscalPeriodDto extends PartialType(CreateFiscalPeriodDto) {
  @IsUUID()
  @IsOptional()
  fiscalYearId?: string;

  @IsUUID()
  @IsOptional()
  tenantId?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  name?: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  nameAr?: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(12)
  periodNumber?: number;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  startDate?: Date;

  @IsDate()
  @IsOptional()
  @Type(() => Date)
  endDate?: Date;

  @IsBoolean()
  @IsOptional()
  isLocked?: boolean;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  overrideCode?: string;
}
