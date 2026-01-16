import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ConfigService } from '../config/config.service';

@Injectable()
export class SupabaseService {
  private supabase: SupabaseClient;
  private serviceRoleSupabase: SupabaseClient;

  constructor(private configService: ConfigService) {
    const supabaseUrl = this.configService.supabaseUrl;
    const anonKey = this.configService.supabaseAnonKey;
    const serviceRoleKey = this.configService.supabaseServiceRoleKey;

    this.supabase = createClient(supabaseUrl, anonKey);
    this.serviceRoleSupabase = createClient(supabaseUrl, serviceRoleKey);
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getServiceRoleClient(): SupabaseClient {
    return this.serviceRoleSupabase;
  }

  async verifyJwt(token: string) {
    const { data, error } = await this.supabase.auth.getUser(token);
    if (error) {
      throw new Error('Invalid JWT token');
    }
    return data.user;
  }

  async getUserTenant(
    userId: string,
  ): Promise<{ tenantId: string; roles: string[] } | null> {
    const { data, error } = await this.supabase.rpc('get_user_context', {
      user_id: userId,
    });

    if (error) {
      return null;
    }

    if (data && data.length > 0) {
      return {
        tenantId: data[0].tenant_id,
        roles: data[0].role_names || [],
      };
    }

    return null;
  }

  async checkPermission(
    userId: string,
    module: string,
    action: string,
    resource: string = '*',
  ): Promise<boolean> {
    const { data, error } = await this.supabase.rpc('user_has_permission', {
      p_user_id: userId,
      p_module: module,
      p_action: action,
      p_resource: resource,
    });

    if (error) {
      return false;
    }

    return data || false;
  }

  async getUserPermissions(userId: string) {
    const { data, error } = await this.supabase.rpc('get_user_permissions', {
      user_id: userId,
    });

    if (error) {
      return [];
    }

    return data || [];
  }
}
