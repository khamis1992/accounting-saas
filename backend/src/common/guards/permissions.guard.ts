import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  PERMISSIONS_KEY,
  RequirePermissions,
} from '../decorators/permissions.decorator';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private supabaseService: SupabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<
      RequirePermissions[]
    >(PERMISSIONS_KEY, [context.getHandler(), context.getClass()]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const { userId, roles } = request.tenantContext || {};

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check super admin first
    const isSuperAdmin = roles?.includes('SUPER_ADMIN');
    if (isSuperAdmin) {
      return true;
    }

    // Check each required permission
    for (const permission of requiredPermissions) {
      const hasPermission = await this.supabaseService.checkPermission(
        userId,
        permission.module,
        permission.action,
        permission.resource,
      );

      if (!hasPermission) {
        throw new ForbiddenException(
          `Missing required permission: ${permission.module}:${permission.action}`,
        );
      }
    }

    return true;
  }
}
