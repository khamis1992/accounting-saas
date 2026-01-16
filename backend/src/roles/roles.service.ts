import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

interface CreateRoleDto {
  name: string;
  nameAr: string;
  description?: string;
  descriptionAr?: string;
  permissions: string[];
}

interface UpdateRoleDto {
  name?: string;
  nameAr?: string;
  description?: string;
  descriptionAr?: string;
  permissions?: string[];
}

@Injectable()
export class RolesService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('roles')
      .select(
        `
        *,
        role_permissions(
          permissions(*)
        )
      `,
      )
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`);

    if (error) {
      throw error;
    }

    return data;
  }

  async findOne(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('roles')
      .select(
        `
        *,
        role_permissions(
          permissions(*)
        )
      `,
      )
      .eq('id', id)
      .or(`tenant_id.eq.${tenantId},tenant_id.is.null`)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async create(createRoleDto: CreateRoleDto, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Create role
    const { data, error } = await supabase
      .from('roles')
      .insert({
        name: createRoleDto.name,
        name_ar: createRoleDto.nameAr,
        description: createRoleDto.description,
        description_ar: createRoleDto.descriptionAr,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Assign permissions
    if (createRoleDto.permissions && createRoleDto.permissions.length > 0) {
      const permissionsToInsert = createRoleDto.permissions.map(
        (permissionId) => ({
          role_id: data.id,
          permission_id: permissionId,
        }),
      );

      const { error: permissionError } = await supabase
        .from('role_permissions')
        .insert(permissionsToInsert);

      if (permissionError) {
        throw permissionError;
      }
    }

    return this.findOne(data.id, tenantId);
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Update role
    const { data, error } = await supabase
      .from('roles')
      .update({
        name: updateRoleDto.name,
        name_ar: updateRoleDto.nameAr,
        description: updateRoleDto.description,
        description_ar: updateRoleDto.descriptionAr,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update permissions if provided
    if (updateRoleDto.permissions !== undefined) {
      // Delete existing permissions
      await supabase.from('role_permissions').delete().eq('role_id', id);

      // Insert new permissions
      if (updateRoleDto.permissions.length > 0) {
        const permissionsToInsert = updateRoleDto.permissions.map(
          (permissionId) => ({
            role_id: id,
            permission_id: permissionId,
          }),
        );

        const { error: permissionError } = await supabase
          .from('role_permissions')
          .insert(permissionsToInsert);

        if (permissionError) {
          throw permissionError;
        }
      }
    }

    return this.findOne(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const { error } = await supabase.from('roles').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  async findAllPermissions() {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('category');

    if (error) {
      throw error;
    }

    return data;
  }
}
