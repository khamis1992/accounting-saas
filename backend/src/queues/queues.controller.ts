import { Controller, Post, Get, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QueuesService } from './queues.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

class CalculateDepreciationDto {
  assetId?: string;
  asOfDate: string;
}

@ApiTags('queues')
@Controller('queues')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class QueuesController {
  constructor(private queuesService: QueuesService) {}

  @Post('depreciation/calculate')
  @ApiOperation({ summary: 'Calculate depreciation for assets' })
  @ApiResponse({ status: 201, description: 'Depreciation job created' })
  calculateDepreciation(
    @Body() dto: CalculateDepreciationDto,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId: string,
  ) {
    return this.queuesService.calculateDepreciation({
      tenantId,
      assetId: dto.assetId,
      asOfDate: new Date(dto.asOfDate),
      userId,
    });
  }

  @Post('depreciation/calculate-all')
  @ApiOperation({ summary: 'Calculate depreciation for all assets' })
  @ApiResponse({ status: 201, description: 'Batch depreciation job created' })
  calculateDepreciationForAllAssets(
    @Body() dto: { asOfDate: string },
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId: string,
  ) {
    return this.queuesService.calculateDepreciationForAllAssets({
      tenantId,
      asOfDate: new Date(dto.asOfDate),
      userId,
    });
  }

  @Get('depreciation/jobs')
  @ApiOperation({ summary: 'Get all depreciation jobs' })
  @ApiResponse({ status: 200, description: 'List of depreciation jobs' })
  getDepreciationJobs(@TenantContext('tenantId') tenantId: string) {
    return this.queuesService.getDepreciationJobs(tenantId);
  }

  @Get('depreciation/jobs/:jobId')
  @ApiOperation({ summary: 'Get depreciation job status' })
  @ApiResponse({ status: 200, description: 'Job status details' })
  getJobStatus(@Param('jobId') jobId: string) {
    return this.queuesService.getDepreciationJobStatus(jobId);
  }
}
