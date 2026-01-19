import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { DepreciationService } from './depreciation.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CalculateDepreciationDto } from './dto/calculate-depreciation.dto';
import type { Response } from 'express';

@ApiTags('assets/depreciation')
@Controller('assets/depreciation')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class DepreciationController {
  constructor(private depreciationService: DepreciationService) {}

  @Get()
  @ApiOperation({ summary: 'Get all depreciation records' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'asset_id', required: false })
  @ApiQuery({ name: 'start_date', required: false })
  @ApiQuery({ name: 'end_date', required: false })
  findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('asset_id') asset_id?: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
  ) {
    return this.depreciationService.findAll(tenantId, { status, asset_id, start_date, end_date });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single depreciation record by ID' })
  findOne(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.depreciationService.findOne(id, tenantId);
  }

  @Post('calculate')
  @ApiOperation({ summary: 'Calculate depreciation for assets' })
  calculate(
    @Body() calculateDepreciationDto: CalculateDepreciationDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.depreciationService.calculate(tenantId, calculateDepreciationDto);
  }

  @Post(':id/post')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Post depreciation to journal' })
  postToJournal(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.depreciationService.postToJournal(id, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a depreciation record' })
  delete(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.depreciationService.delete(id, tenantId);
  }

  @Get(':id/export/pdf')
  @ApiOperation({ summary: 'Export depreciation to PDF' })
  async exportToPDF(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.depreciationService.exportToPDF(id, tenantId);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="depreciation-${id}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }

  @Get(':id/export/excel')
  @ApiOperation({ summary: 'Export depreciation to Excel' })
  async exportToExcel(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
    @Res() res: Response,
  ) {
    const buffer = await this.depreciationService.exportToExcel(id, tenantId);
    res.set({
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="depreciation-${id}.xlsx"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  }
}
