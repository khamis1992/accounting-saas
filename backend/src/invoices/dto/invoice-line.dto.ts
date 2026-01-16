import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class InvoiceLineDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  lineNumber: number;

  @IsString()
  @IsOptional()
  @MaxLength(50)
  itemCode?: string;

  @IsString()
  @IsNotEmpty()
  descriptionAr: string;

  @IsString()
  @IsOptional()
  descriptionEn?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  quantity: number;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  unitOfMeasure?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountPercentage?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxableAmount?: number;

  @IsUUID()
  @IsOptional()
  taxCodeId?: string;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxPercentage?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  taxAmount?: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  lineTotal: number;

  @IsUUID()
  @IsOptional()
  accountId?: string;

  @IsUUID()
  @IsOptional()
  costCenterId?: string;
}
