import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  applyDecorators,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanySettingsService } from './company-settings.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { UpdateCompanySettingsDto } from './dto/update-company-settings.dto';

// Custom decorator to apply guards to specific routes
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard, PermissionsGuard),
  );
}

@ApiTags('settings')
@Controller('settings/company')
export class CompanySettingsController {
  constructor(private companySettingsService: CompanySettingsService) {}

  @Get()
  @Protected()
  @ApiOperation({ summary: 'Get company settings' })
  @ApiResponse({ status: 200, description: 'Company settings retrieved successfully' })
  @RequirePermissions({ module: 'settings', action: 'read' })
  getCompanySettings(@TenantContext('tenantId') tenantId: string) {
    return this.companySettingsService.getCompanySettings(tenantId);
  }

  @Patch()
  @Protected()
  @ApiOperation({ summary: 'Update company settings' })
  @ApiResponse({ status: 200, description: 'Company settings updated successfully' })
  @RequirePermissions({ module: 'settings', action: 'update' })
  updateCompanySettings(
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') userId: string,
    @Body() updateDto: UpdateCompanySettingsDto,
  ) {
    return this.companySettingsService.updateCompanySettings(tenantId, userId, updateDto);
  }

  @Post('logo')
  @Protected()
  @ApiOperation({ summary: 'Upload company logo' })
  @ApiResponse({ status: 201, description: 'Logo uploaded successfully' })
  @ApiConsumes('multipart/form-data')
  @RequirePermissions({ module: 'settings', action: 'update' })
  @UseInterceptors(FileInterceptor('logo'))
  uploadLogo(
    @TenantContext('tenantId') tenantId: string,
    @UploadedFile() file: any,
  ) {
    return this.companySettingsService.uploadLogo(tenantId, file);
  }
}
