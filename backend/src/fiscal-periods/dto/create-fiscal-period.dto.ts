import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsDate,
  IsNumber,
  Min,
  Max,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateFiscalPeriodDto {
  @IsUUID()
  @IsNotEmpty()
  fiscalYearId: string;

  @IsUUID()
  @IsNotEmpty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(20)
  name: string;

  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(20)
  nameAr?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  @Max(12)
  periodNumber: number;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  startDate: Date;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  endDate: Date;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  overrideCode?: string;
}
