import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigService } from '@nestjs/config';

/**
 * Throttler Module Configuration
 *
 * Provides rate limiting to prevent abuse and DDoS attacks.
 * Configured with multiple tiers for different use cases.
 */
@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isProduction = config.get<'development' | 'staging' | 'production'>('NODE_ENV') === 'production';

        return {
          throttlers: [
            {
              // Short-term throttling: Prevent burst attacks
              name: 'short',
              ttl: 1000, // 1 second
              limit: isProduction ? 3 : 10, // Stricter in production
            },
            {
              // Medium-term throttling: General rate limiting
              name: 'medium',
              ttl: 60000, // 1 minute
              limit: isProduction ? 100 : 200,
            },
            {
              // Long-term throttling: Sustained request limiting
              name: 'long',
              ttl: 900000, // 15 minutes
              limit: isProduction ? 1000 : 2000,
            },
            {
              // Auth-specific throttling: Stricter limits for auth endpoints
              name: 'auth',
              ttl: 60000, // 1 minute
              limit: isProduction ? 10 : 20, // 10-20 requests per minute
            },
          ],
          // Custom error message
          errorMessage: 'Too many requests. Please try again later.',
        };
      },
    }),
  ],
  exports: [ThrottlerModule],
})
export class ThrottlerConfigModule {}
