import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { ConfigService } from '../config/config.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class AuthService {
  constructor(
    private supabaseService: SupabaseService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {}

  async signIn(email: string, password: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async signUp(email: string, password: string, tenantId: string, language: 'ar' | 'en' = 'en') {
    const supabase = this.supabaseService.getServiceRoleClient();

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification
      user_metadata: {
        tenant_id: tenantId,
      },
    });

    if (error) {
      throw new UnauthorizedException(error.message);
    }

    // Create user profile
    const { error: profileError } = await supabase.from('users').insert({
      id: data.user.id,
      tenant_id: tenantId,
      email: email,
      status: 'pending', // Pending email verification
    });

    if (profileError) {
      throw new Error('Failed to create user profile');
    }

    // Send verification email
    // Supabase handles email verification automatically when email_confirm: false
    // We can optionally send a custom welcome email
    try {
      await this.emailService.sendWelcomeEmail(email, email.split('@')[0], tenantId, language);
    } catch (emailError) {
      // Log email error but don't fail signup
      console.error('Failed to send welcome email:', emailError);
    }

    return {
      user: data.user,
      message: language === 'ar'
        ? 'تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني.'
        : 'Account created successfully. Please verify your email.',
    };
  }

  async refreshToken(refreshToken: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (error) {
      throw new UnauthorizedException('Failed to refresh token');
    }

    return data.session;
  }

  async signOut(accessToken: string) {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw new Error('Failed to sign out');
    }

    return { success: true };
  }

  async resetPassword(email: string, language: 'ar' | 'en' = 'en') {
    const supabase = this.supabaseService.getClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${this.configService.frontendUrl}/${language}/auth/reset-password`,
    });

    if (error) {
      throw new Error('Failed to send reset email');
    }

    return {
      success: true,
      message: language === 'ar'
        ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني'
        : 'Password reset link has been sent to your email',
    };
  }

  async verifySession(accessToken: string) {
    const { data, error } = await this.supabaseService
      .getClient()
      .auth.getUser(accessToken);

    if (error || !data.user) {
      throw new UnauthorizedException('Invalid session');
    }

    // Get user context with tenant and roles
    const tenantInfo = await this.supabaseService.getUserTenant(data.user.id);

    return {
      user: data.user,
      tenantId: tenantInfo?.tenantId,
      roles: tenantInfo?.roles || [],
    };
  }
}
