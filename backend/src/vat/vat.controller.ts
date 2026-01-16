import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VatService } from './vat.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

@ApiTags('vat')
@Controller('vat')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class VatController {
  constructor(private vatService: VatService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Get VAT summary' })
  getSummary(
    @TenantContext('tenantId') tenantId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.vatService.getSummary(
      tenantId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('codes')
  @ApiOperation({ summary: 'Get VAT codes' })
  getCodes(@TenantContext('tenantId') tenantId: string) {
    return this.vatService.getVatCodes(tenantId);
  }
}
