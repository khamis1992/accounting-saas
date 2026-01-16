import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

@ApiTags('assets')
@Controller('assets')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all fixed assets' })
  findAll(@TenantContext('tenantId') tenantId: string) {
    return this.assetsService.findAll(tenantId);
  }
}
