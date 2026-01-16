import {
  IsUUID,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsNumber,
  Min,
} from 'class-validator';

export class InvoiceTaxDto {
  @IsUUID()
  @IsNotEmpty()
  taxCodeId: string;

  @IsEnum(['output', 'input'])
  @IsNotEmpty()
  taxType: 'output' | 'input';

  @IsString()
  @IsNotEmpty()
  taxName: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  taxPercentage: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  taxableAmount: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  taxAmount: number;
}
