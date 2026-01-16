import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class SupabaseHealthIndicator extends HealthIndicator {
  constructor(private supabaseService: SupabaseService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.supabaseService.getClient();

      // Test Supabase connection by checking session
      const startTime = Date.now();
      const { data, error } = await client.auth.getSession();
      const duration = Date.now() - startTime;

      // If we can reach Supabase (even with no session), the connection works
      const isHealthy = !error || error.message === 'Auth session missing!';

      if (isHealthy) {
        return this.getStatus(key, true, {
          responseTime: `${duration}ms`,
          message: 'Supabase connection is healthy',
        });
      }

      throw new Error('Supabase connection failed');
    } catch (error) {
      return this.getStatus(key, false, {
        message: error.message,
        error: error.constructor.name,
      });
    }
  }

  async checkAuth(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.supabaseService.getServiceRoleClient();

      const startTime = Date.now();
      const { error } = await client.auth.getUser(
        'fake.jwt.token.for.testing',
      );
      const duration = Date.now() - startTime;

      // Invalid JWT is expected, but connection should work
      const isHealthy =
        error && (error.message === 'Invalid JWT' || error.message.includes('JWT'));

      if (isHealthy || !error) {
        return this.getStatus(key, true, {
          responseTime: `${duration}ms`,
          message: 'Supabase Auth service is healthy',
        });
      }

      throw new Error('Supabase Auth check failed');
    } catch (error) {
      return this.getStatus(key, false, {
        message: error.message,
        error: error.constructor.name,
      });
    }
  }
}
