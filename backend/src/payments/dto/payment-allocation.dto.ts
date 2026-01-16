import {
  IsUUID,
  IsNotEmpty,
  IsNumber,
  Min,
  IsDate,
  IsOptional,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PaymentAllocationDto {
  @IsUUID()
  @IsNotEmpty()
  paymentId: string;

  @IsUUID()
  @IsNotEmpty()
  invoiceId: string;

  @IsDate()
  @IsNotEmpty()
  @Type(() => Date)
  allocationDate: Date;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  amount: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  discountAllowed?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  writeOff?: number;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsUUID()
  @IsOptional()
  createdBy?: string;
}
