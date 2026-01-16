import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import * as crypto from 'crypto';

interface CreateUserDto {
  email: string;
  name: string;
  roleIds: string[];
  branchId?: string;
}

interface UpdateUserDto {
  name?: string;
  roleIds?: string[];
  branchId?: string;
  status?: string;
}

// Common passwords list for validation
const COMMON_PASSWORDS = [
  'password', 'password123', '12345678', 'qwerty123',
  'abc12345', 'letmein', 'monkey123', 'dragon123',
  'master123', 'hello123', 'login123', 'welcome123',
];

@Injectable()
export class UsersService {
  constructor(private supabaseService: SupabaseService) {}

  async findAll(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        *,
        user_roles(
          roles(*)
        ),
        branches(id, name, name_ar)
      `,
      )
      .eq('tenant_id', tenantId);

    if (error) {
      throw error;
    }

    return data;
  }

  async findOne(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('users')
      .select(
        `
        *,
        user_roles(
          roles(*)
        ),
        branches(id, name, name_ar)
      `,
      )
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async create(createUserDto: CreateUserDto, tenantId: string) {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Create user in Supabase Auth
    const { data: authUser, error: authError } =
      await supabase.auth.admin.createUser({
        email: createUserDto.email,
        password: 'ChangeMe123!',
        email_confirm: true,
        user_metadata: {
          tenant_id: tenantId,
          name: createUserDto.name,
        },
      });

    if (authError) {
      throw authError;
    }

    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        tenant_id: tenantId,
        email: createUserDto.email,
        name: createUserDto.name,
        branch_id: createUserDto.branchId,
        status: 'active',
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    // Assign roles
    if (createUserDto.roleIds && createUserDto.roleIds.length > 0) {
      const rolesToInsert = createUserDto.roleIds.map((roleId) => ({
        user_id: user.id,
        role_id: roleId,
      }));

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);

      if (roleError) {
        throw roleError;
      }
    }

    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update(updateUserDto)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update roles if provided
    if (updateUserDto.roleIds !== undefined) {
      // Delete existing roles
      await supabase.from('user_roles').delete().eq('user_id', id);

      // Insert new roles
      if (updateUserDto.roleIds.length > 0) {
        const rolesToInsert = updateUserDto.roleIds.map((roleId) => ({
          user_id: id,
          role_id: roleId,
        }));

        const { error: roleError } = await supabase
          .from('user_roles')
          .insert(rolesToInsert);

        if (roleError) {
          throw roleError;
        }
      }
    }

    return data;
  }

  async remove(id: string, tenantId: string) {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Delete user from Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) {
      throw authError;
    }

    // RLS will handle deletion from users table
    return { success: true };
  }

  async getUserRoles(userId: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('user_roles')
      .select(
        `
        role_id,
        roles(*)
      `,
      )
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return data.map((ur) => ur.roles);
  }

  async getUserPermissions(userId: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('user_permissions')
      .select('permission_id')
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return data.map((p) => p.permission_id);
  }

  /**
   * Get user profile with full details
   */
  async getProfile(userId: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        user_roles(
          roles(*)
        ),
        branches(id, name, name_ar)
      `)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw new NotFoundException('User not found');
    }

    // Update last login
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', userId);

    return data;
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateDto: UpdateProfileDto, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if user exists and belongs to tenant
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!existingUser) {
      throw new NotFoundException('User not found');
    }

    // If updating email, check if new email is already taken
    if (updateDto.email && updateDto.email !== existingUser.email) {
      const { data: emailCheck } = await supabase
        .from('users')
        .select('id')
        .eq('email', updateDto.email)
        .neq('id', userId)
        .single();

      if (emailCheck) {
        throw new BadRequestException('Email already in use');
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (updateDto.firstNameAr !== undefined) updateData.first_name_ar = updateDto.firstNameAr;
    if (updateDto.firstNameEn !== undefined) updateData.first_name_en = updateDto.firstNameEn;
    if (updateDto.lastNameAr !== undefined) updateData.last_name_ar = updateDto.lastNameAr;
    if (updateDto.lastNameEn !== undefined) updateData.last_name_en = updateDto.lastNameEn;
    if (updateDto.email !== undefined) updateData.email = updateDto.email;
    if (updateDto.phone !== undefined) updateData.phone = updateDto.phone;
    if (updateDto.avatarUrl !== undefined) updateData.avatar_url = updateDto.avatarUrl;
    if (updateDto.preferredLanguage !== undefined) updateData.preferred_language = updateDto.preferredLanguage;
    if (updateDto.timezone !== undefined) updateData.timezone = updateDto.timezone;
    if (updateDto.notificationPreferences !== undefined) {
      updateData.notification_preferences = updateDto.notificationPreferences;
    }

    // Update user profile
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Change user password
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto, tenantId: string) {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Verify current password by attempting to sign in
    const { data: user, error: signInError } = await supabase.auth.admin.getUserById(userId);

    if (signInError || !user) {
      throw new NotFoundException('User not found');
    }

    // Verify current password using Supabase Auth
    const userEmail = user.user.email;
    if (!userEmail) {
      throw new BadRequestException('User email not found');
    }

    const { error: verifyError } = await this.supabaseService.getClient().auth.signInWithPassword({
      email: userEmail,
      password: changePasswordDto.currentPassword,
    });

    if (verifyError) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is common
    const newPasswordLower = changePasswordDto.newPassword.toLowerCase();
    if (COMMON_PASSWORDS.some(pwd => newPasswordLower.includes(pwd))) {
      throw new BadRequestException('Password is too common. Please choose a stronger password.');
    }

    // Check if new password matches current password
    if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Update password in Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(userId, {
      password: changePasswordDto.newPassword,
    });

    if (updateError) {
      throw new BadRequestException('Failed to update password');
    }

    return { success: true, message: 'Password updated successfully' };
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(userId: string, file: any, tenantId: string) {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, avatar_url')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only JPEG, PNG, and WebP are allowed.');
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `avatars/${tenantId}/${userId}_${Date.now()}.${fileExtension}`;

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      throw new BadRequestException('Failed to upload avatar');
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // Update user profile with new avatar URL
    const { data, error } = await supabase
      .from('users')
      .update({ avatar_url: urlData.publicUrl })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Delete old avatar if exists
    if (user.avatar_url) {
      const oldFileName = user.avatar_url.split('/').pop();
      if (oldFileName) {
        await supabase.storage
          .from('avatars')
          .remove([`avatars/${tenantId}/${oldFileName}`]);
      }
    }

    return data;
  }

  /**
   * Invite new user
   */
  async inviteUser(inviteDto: InviteUserDto, tenantId: string, inviterId: string) {
    const supabase = this.supabaseService.getServiceRoleClient();

    // Check if user with email already exists in tenant
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, status')
      .eq('email', inviteDto.email)
      .eq('tenant_id', tenantId)
      .single();

    if (existingUser) {
      throw new BadRequestException('User with this email already exists in your organization');
    }

    // Generate temporary password and invitation token
    const tempPassword = this.generateTempPassword();
    const invitationToken = crypto.randomBytes(32).toString('hex');

    // Create user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: inviteDto.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        tenant_id: tenantId,
        invitation_token: invitationToken,
      },
    });

    if (authError) {
      throw new BadRequestException('Failed to create user account');
    }

    // Create user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        id: authUser.user.id,
        tenant_id: tenantId,
        email: inviteDto.email,
        first_name_ar: inviteDto.firstNameAr,
        first_name_en: inviteDto.firstNameEn,
        last_name_ar: inviteDto.lastNameAr,
        last_name_en: inviteDto.lastNameEn,
        preferred_language: inviteDto.preferredLanguage || 'en',
        timezone: inviteDto.timezone || 'Asia/Qatar',
        branch_id: inviteDto.defaultBranchId,
        status: 'pending',
        invitation_token: invitationToken,
        invitation_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        invited_by: inviterId,
        invited_at: new Date().toISOString(),
        is_active: false,
      })
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    // Assign roles
    if (inviteDto.roleIds && inviteDto.roleIds.length > 0) {
      const rolesToInsert = inviteDto.roleIds.map((roleId) => ({
        user_id: user.id,
        role_id: roleId,
      }));

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert(rolesToInsert);

      if (roleError) {
        throw roleError;
      }
    }

    // TODO: Send invitation email with temp password and accept link
    // This would integrate with your email service

    return {
      user,
      tempPassword, // Only returned for development, remove in production
      message: 'User invited successfully',
    };
  }

  /**
   * List users with filters
   */
  async listUsers(tenantId: string, filters?: {
    status?: string;
    search?: string;
    roleId?: string;
    branchId?: string;
  }) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('users')
      .select(`
        *,
        user_roles(
          roles(*)
        ),
        branches(id, name, name_ar)
      `)
      .eq('tenant_id', tenantId);

    // Apply filters
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    if (filters?.branchId) {
      query = query.eq('branch_id', filters.branchId);
    }

    if (filters?.roleId) {
      query = query.contains('user_roles.roles.id', `[${filters.roleId}]`);
    }

    if (filters?.search) {
      query = query.or(`
        first_name_en.ilike.%${filters.search}%',
        first_name_ar.ilike.%${filters.search}%',
        last_name_en.ilike.%${filters.search}%',
        last_name_ar.ilike.%${filters.search}%',
        email.ilike.%${filters.search}%'
      `);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Update user role
   */
  async updateRole(userId: string, roleId: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if role exists
    const { data: role } = await supabase
      .from('roles')
      .select('id')
      .eq('id', roleId)
      .single();

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    // Delete existing roles
    await supabase.from('user_roles').delete().eq('user_id', userId);

    // Assign new role
    const { error } = await supabase
      .from('user_roles')
      .insert({
        user_id: userId,
        role_id: roleId,
      });

    if (error) {
      throw error;
    }

    return { success: true, message: 'User role updated successfully' };
  }

  /**
   * Deactivate user
   */
  async deactivateUser(userId: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if user exists
    const { data: user } = await supabase
      .from('users')
      .select('id, status, email')
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .single();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Prevent deactivating the last admin
    const { data: adminCount } = await supabase
      .from('user_roles')
      .select('user_id', { count: 'exact', head: true })
      .eq('roles.name', 'admin')
      .eq('user_id', userId);

    if (adminCount && adminCount.length > 0) {
      // Check if this is the last admin
      const { count } = await supabase
        .from('user_roles')
        .select('user_id', { count: 'exact', head: true })
        .eq('roles.name', 'admin');

      if (count === 1) {
        throw new ForbiddenException('Cannot deactivate the last admin user');
      }
    }

    // Deactivate user
    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'inactive',
        is_active: false,
        deactivated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, message: 'User deactivated successfully', user: data };
  }

  /**
   * Activate user
   */
  async activateUser(userId: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('users')
      .update({
        status: 'active',
        is_active: true,
        activated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, message: 'User activated successfully', user: data };
  }

  /**
   * Generate temporary password
   */
  private generateTempPassword(): string {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';

    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];

    // Fill the rest randomly
    for (let i = 3; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }
}
