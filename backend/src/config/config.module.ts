import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validationSchema, validationOptions } from './config.validation';
import { ConfigService } from './config.service';

/**
 * Configuration Module
 *
 * Provides global configuration management with validation.
 * This module is Global, so ConfigService can be injected anywhere without importing.
 */
@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
      validationOptions,
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class AppConfigModule {}
