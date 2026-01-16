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
import { RolesService } from './roles.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';

class CreateRoleDto {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  permissions: string[];
}

class UpdateRoleDto {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  permissions?: string[];
}

@ApiTags('roles')
@Controller('roles')
@ApiBearerAuth()
@UseGuards(TenantContextGuard, PermissionsGuard)
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'List of roles' })
  findAll(@TenantContext('tenantId') tenantId: string) {
    return this.rolesService.findAll(tenantId);
  }

  @Get('permissions')
  @ApiOperation({ summary: 'Get all available permissions' })
  @ApiResponse({ status: 200, description: 'List of permissions' })
  findAllPermissions() {
    return this.rolesService.findAllPermissions();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific role' })
  @ApiResponse({ status: 200, description: 'Role details' })
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.rolesService.findOne(id, tenantId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created' })
  @RequirePermissions({ module: 'roles', action: 'create' })
  create(
    @Body() createRoleDto: CreateRoleDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.rolesService.create(createRoleDto, tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @RequirePermissions({ module: 'roles', action: 'update' })
  update(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.rolesService.update(id, updateRoleDto, tenantId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted' })
  @RequirePermissions({ module: 'roles', action: 'delete' })
  remove(@Param('id') id: string, @TenantContext('tenantId') tenantId: string) {
    return this.rolesService.remove(id, tenantId);
  }
}
