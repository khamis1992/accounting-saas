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
  applyDecorators,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { type Response } from 'express';
import { VendorsService } from './vendors.service';
import { ExportService } from '../export/export.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

// Custom decorator to apply guards to specific routes
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard),
  );
}

@ApiTags('vendors')
@Controller('vendors')
export class VendorsController {
  constructor(
    private vendorsService: VendorsService,
    private exportService: ExportService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all vendors' })
  @Protected()
  findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('includeInactive') includeInactive?: boolean,
  ) {
    return this.vendorsService.findAll(tenantId, includeInactive);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vendor by ID' })
  @Protected()
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.vendorsService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new vendor' })
  @Protected()
  create(
    @Body() createDto: CreateVendorDto,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId?: string,
  ) {
    return this.vendorsService.create(createDto, tenantId, userId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a vendor' })
  @Protected()
  update(
    @Param('id') id: string,
    @Body() updateDto: UpdateVendorDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.vendorsService.update(id, updateDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vendor' })
  @Protected()
  remove(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.vendorsService.remove(id, tenantId);
  }

  @Get('export/csv')
  @ApiOperation({ summary: 'Export vendors as CSV' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @Protected()
  async exportToCsv(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('includeInactive') includeInactive?: boolean,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const vendors = await this.vendorsService.findAll(tenantId, includeInactive);
    const csvBuffer = this.exportService.exportVendorsToCsv(vendors, { language });

    if (res) {
      res.set({
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename=vendors_${new Date().toISOString().split('T')[0]}.csv`,
        'Content-Length': csvBuffer.length.toString(),
      });
    }

    return new StreamableFile(csvBuffer);
  }

  @Get('export/excel')
  @ApiOperation({ summary: 'Export vendors as Excel' })
  @ApiQuery({ name: 'language', required: false, enum: ['en', 'ar', 'both'] })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @Protected()
  async exportToExcel(
    @TenantContext('tenantId') tenantId: string,
    @Query('language') language?: 'en' | 'ar' | 'both',
    @Query('includeInactive') includeInactive?: boolean,
    @Res({ passthrough: true }) res?: Response,
  ) {
    const vendors = await this.vendorsService.findAll(tenantId, includeInactive);
    const excelBuffer = await this.exportService.exportVendorsToExcel(vendors, { language });

    if (res) {
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=vendors_${new Date().toISOString().split('T')[0]}.xlsx`,
        'Content-Length': excelBuffer.length.toString(),
      });
    }

    return new StreamableFile(excelBuffer);
  }
}
