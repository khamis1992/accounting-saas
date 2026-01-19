import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AssetsService } from './assets.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CreateAssetDto } from './dto/create-asset.dto';
import { UpdateAssetDto } from './dto/update-asset.dto';

@ApiTags('assets')
@Controller('assets')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class AssetsController {
  constructor(private assetsService: AssetsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all fixed assets' })
  @ApiQuery({ name: 'category', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('category') category?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.assetsService.findAll(tenantId, { category, status, search });
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get asset summary statistics' })
  getSummary(@TenantContext('tenantId') tenantId: string) {
    return this.assetsService.getSummary(tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single fixed asset by ID' })
  findOne(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.assetsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new fixed asset' })
  create(
    @Body() createAssetDto: CreateAssetDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.assetsService.create(tenantId, createAssetDto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing fixed asset' })
  update(
    @Param('id') id: string,
    @Body() updateAssetDto: UpdateAssetDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.assetsService.update(id, tenantId, updateAssetDto);
  }

  @Post(':id/dispose')
  @ApiOperation({ summary: 'Dispose an asset' })
  dispose(
    @Param('id') id: string,
    @Body() body: { disposal_date: string; disposal_amount: number },
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.assetsService.disposeOrSell(id, tenantId, body.disposal_date, body.disposal_amount, 'dispose');
  }

  @Post(':id/sell')
  @ApiOperation({ summary: 'Sell an asset' })
  sell(
    @Param('id') id: string,
    @Body() body: { disposal_date: string; disposal_amount: number },
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.assetsService.disposeOrSell(id, tenantId, body.disposal_date, body.disposal_amount, 'sell');
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an asset' })
  delete(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.assetsService.delete(id, tenantId);
  }
}
