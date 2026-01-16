import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { TenantsService, TenantWithAdminResponse } from './tenants.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { CreateTenantWithAdminDto } from './dto/create-tenant-with-admin.dto';

class CreateTenantDto {
  name: string;
  nameAr: string;
  status: string;
}

class UpdateTenantDto {
  name?: string;
  nameAr?: string;
  status?: string;
}

// Custom decorator to apply guards to specific routes (not controller-level)
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard, PermissionsGuard),
  );
}

@ApiTags('tenants')
@Controller('tenants')
export class TenantsController {
  constructor(private tenantsService: TenantsService) {}

  @Get()
  @Protected()
  @ApiOperation({ summary: 'Get all tenants' })
  @ApiResponse({ status: 200, description: 'List of tenants' })
  @RequirePermissions({ module: 'tenants', action: 'read' })
  findAll(@TenantContext('tenantId') tenantId: string) {
    return this.tenantsService.findAll();
  }

  @Get('stats')
  @Protected()
  @ApiOperation({ summary: 'Get tenant statistics' })
  @ApiResponse({ status: 200, description: 'Tenant statistics' })
  @RequirePermissions({ module: 'tenants', action: 'read' })
  getStats(@TenantContext('tenantId') tenantId: string) {
    return this.tenantsService.getTenantStats(tenantId);
  }

  @Get(':id')
  @Protected()
  @ApiOperation({ summary: 'Get a specific tenant' })
  @ApiResponse({ status: 200, description: 'Tenant details' })
  @RequirePermissions({ module: 'tenants', action: 'read' })
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.tenantsService.findOne(id);
  }

  @Post()
  @Protected()
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({ status: 201, description: 'Tenant created' })
  @RequirePermissions({ module: 'tenants', action: 'create' })
  create(
    @Body() createTenantDto: CreateTenantDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.tenantsService.create(createTenantDto, tenantId);
  }

  @Patch(':id')
  @Protected()
  @ApiOperation({ summary: 'Update a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant updated' })
  @RequirePermissions({ module: 'tenants', action: 'update' })
  update(
    @Param('id') id: string,
    @Body() updateTenantDto: UpdateTenantDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.tenantsService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @Protected()
  @ApiOperation({ summary: 'Delete a tenant' })
  @ApiResponse({ status: 200, description: 'Tenant deleted' })
  @RequirePermissions({ module: 'tenants', action: 'delete' })
  remove(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.tenantsService.remove(id);
  }

  @Post('create-with-admin')
  @ApiOperation({
    summary: 'Create a new tenant with admin user',
    description: 'Public endpoint to create a new tenant company with an admin user. Copies default COA template and creates fiscal year.',
  })
  @ApiResponse({
    status: 201,
    description: 'Tenant and admin user created successfully',
    schema: {
      example: {
        tenant: {
          id: 'uuid',
          code: 'TEN000001',
          name_en: 'Tech Solutions Qatar',
          name_ar: 'الحلول التقنية قطر',
          status: 'active',
        },
        user: {
          id: 'uuid',
          email: 'admin@techsolutions.qa',
          first_name: 'Ahmed',
          last_name: 'Al-Mansouri',
        },
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refreshToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 409, description: 'Conflict - company name or email already exists' })
  async createTenantWithAdmin(@Body() createTenantDto: CreateTenantWithAdminDto): Promise<TenantWithAdminResponse> {
    return this.tenantsService.createTenantWithAdmin(createTenantDto);
  }
}
