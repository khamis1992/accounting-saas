import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { SupabaseService } from '../../supabase/supabase.service';

@Injectable()
export class DatabaseHealthIndicator extends HealthIndicator {
  constructor(private supabaseService: SupabaseService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const client = this.supabaseService.getServiceRoleClient();

      // Simple query to check database connection
      const startTime = Date.now();
      const { error } = await client.rpc('get_user_context', {
        user_id: '00000000-0000-0000-0000-000000000000',
      });
      const duration = Date.now() - startTime;

      // We expect an error for this fake UUID, but the connection works
      // If we get a connection error, that's the real issue
      const isHealthy =
        !error ||
        !error.message.includes('Failed to fetch') ||
        !error.message.includes('ECONNREFUSED');

      if (isHealthy) {
        return this.getStatus(key, true, {
          responseTime: `${duration}ms`,
          message: 'Database connection is healthy',
        });
      }

      throw new Error('Database connection failed');
    } catch (error) {
      return this.getStatus(key, false, {
        message: error.message,
        error: error.constructor.name,
      });
    }
  }
}
