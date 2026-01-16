import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { TenantContextGuard } from '../common/guards/tenant-context.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { TenantContext } from '../common/decorators/tenant-context.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InviteUserDto } from './dto/invite-user.dto';

// Custom decorator to apply guards to specific routes
function Protected() {
  return applyDecorators(
    ApiBearerAuth(),
    UseGuards(TenantContextGuard),
  );
}

function AdminOnly() {
  return applyDecorators(
    Protected(),
    UseGuards(PermissionsGuard),
    RequirePermissions({ module: 'users', action: 'manage' }),
  );
}

@ApiTags('users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(TenantContextGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  @AdminOnly()
  findAll(
    @TenantContext('tenantId') tenantId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('roleId') roleId?: string,
    @Query('branchId') branchId?: string,
  ) {
    return this.usersService.listUsers(tenantId, { status, search, roleId, branchId });
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Current user details' })
  @Protected()
  getMe(
    @TenantContext('userId') userId: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.usersService.getProfile(userId, tenantId);
  }

  @Get('me/roles')
  @ApiOperation({ summary: 'Get current user roles' })
  @ApiResponse({ status: 200, description: 'User roles' })
  @Protected()
  getMyRoles(
    @TenantContext('userId') userId: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.usersService.getUserRoles(userId, tenantId);
  }

  @Get('me/permissions')
  @ApiOperation({ summary: 'Get current user permissions' })
  @ApiResponse({ status: 200, description: 'User permissions' })
  @Protected()
  getMyPermissions(
    @TenantContext('userId') userId: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.usersService.getUserPermissions(userId, tenantId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific user' })
  @ApiResponse({ status: 200, description: 'User details' })
  @AdminOnly()
  findOne(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.usersService.findOne(id, tenantId);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Update current user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated' })
  @Protected()
  updateProfile(
    @TenantContext('userId') userId: string,
    @TenantContext('tenantId') tenantId: string,
    @Body() updateDto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, updateDto, tenantId);
  }

  @Post('me/change-password')
  @ApiOperation({ summary: 'Change current user password' })
  @ApiResponse({ status: 200, description: 'Password changed' })
  @Protected()
  changePassword(
    @TenantContext('userId') userId: string,
    @TenantContext('tenantId') tenantId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    return this.usersService.changePassword(userId, changePasswordDto, tenantId);
  }

  @Post('me/avatar')
  @ApiOperation({ summary: 'Upload user avatar' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded' })
  @ApiConsumes('multipart/form-data')
  @Protected()
  @UseInterceptors(FileInterceptor('file'))
  uploadAvatar(
    @TenantContext('userId') userId: string,
    @TenantContext('tenantId') tenantId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpeg|jpg|png|webp)$/ }),
        ],
      }),
    )
    file: any,
  ) {
    return this.usersService.uploadAvatar(userId, file, tenantId);
  }

  @Post('invite')
  @ApiOperation({ summary: 'Invite a new user' })
  @ApiResponse({ status: 201, description: 'User invited' })
  @AdminOnly()
  inviteUser(
    @Body() inviteDto: InviteUserDto,
    @TenantContext('tenantId') tenantId: string,
    @TenantContext('userId') inviterId: string,
  ) {
    return this.usersService.inviteUser(inviteDto, tenantId, inviterId);
  }

  @Patch(':id/role')
  @ApiOperation({ summary: 'Update user role' })
  @ApiResponse({ status: 200, description: 'Role updated' })
  @AdminOnly()
  updateRole(
    @Param('id') id: string,
    @Body('roleId') roleId: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.usersService.updateRole(id, roleId, tenantId);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate user' })
  @ApiResponse({ status: 200, description: 'User deactivated' })
  @AdminOnly()
  deactivateUser(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.usersService.deactivateUser(id, tenantId);
  }

  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated' })
  @AdminOnly()
  activateUser(
    @Param('id') id: string,
    @TenantContext('tenantId') tenantId: string,
  ) {
    return this.usersService.activateUser(id, tenantId);
  }
}
