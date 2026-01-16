import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class JournalLineDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  lineNumber: number;

  @IsUUID()
  @IsNotEmpty()
  accountId: string;

  @IsString()
  @IsOptional()
  descriptionAr?: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsUUID()
  @IsOptional()
  costCenterId?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  debit: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  credit: number;

  @IsString()
  @IsOptional()
  @MaxLength(3)
  currency?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  exchangeRate?: number;

  @IsNumber()
  @IsOptional()
  foreignAmount?: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  reference?: string;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  referenceType?: string;

  @IsUUID()
  @IsOptional()
  referenceId?: string;
}
