import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private supabaseService: SupabaseService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      throw new UnauthorizedException('No authorization header provided');
    }

    const token = authHeader.replace('Bearer ', '');
    try {
      const user = await this.supabaseService.verifyJwt(token);
      const tenantInfo = await this.supabaseService.getUserTenant(user.id);

      if (!tenantInfo || !tenantInfo.tenantId) {
        throw new UnauthorizedException('User is not associated with a tenant');
      }

      // Attach tenant context to request
      request.tenantContext = {
        tenantId: tenantInfo.tenantId,
        userId: user.id,
        roles: tenantInfo.roles,
        email: user.email,
      };

      request.user = user;
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
