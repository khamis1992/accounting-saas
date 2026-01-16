import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FiscalPeriodsService } from './fiscal-periods.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

@ApiTags('fiscal-periods')
@Controller('fiscal-periods')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class FiscalPeriodsController {
  constructor(private fiscalPeriodsService: FiscalPeriodsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all fiscal periods' })
  findAll(@TenantContext('tenantId') tenantId: string) {
    return this.fiscalPeriodsService.findAll(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific fiscal period' })
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.fiscalPeriodsService.findOne(id, tenantId);
  }

  @Post(':id/lock')
  @ApiOperation({ summary: 'Lock a fiscal period' })
  lock(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.fiscalPeriodsService.lock(id, tenantId);
  }

  @Post(':id/unlock')
  @ApiOperation({ summary: 'Unlock a fiscal period' })
  unlock(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.fiscalPeriodsService.unlock(id, tenantId);
  }
}
