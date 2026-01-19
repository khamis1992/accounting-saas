import { IsDateString, IsArray, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateDepreciationDto {
  @ApiProperty({
    description: 'The date to calculate depreciation for',
    example: '2026-01-15',
  })
  @IsDateString()
  calculation_date: string;

  @ApiProperty({
    description: 'Optional array of specific asset IDs to calculate depreciation for',
    example: ['uuid-1', 'uuid-2'],
    required: false,
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  asset_ids?: string[];
}
