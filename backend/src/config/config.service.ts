import { Injectable, Logger } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
import { EnvConfig } from './config.schema';

/**
 * Configuration Service
 *
 * Provides type-safe access to environment variables with validation.
 * All configuration values should be accessed through this service.
 */
@Injectable()
export class ConfigService {
  private readonly logger = new Logger(ConfigService.name);

  constructor(private configService: NestConfigService<EnvConfig>) {
    this.validateConfig();
  }

  /**
   * Environment Detection
   */
  get nodeEnv(): 'development' | 'staging' | 'production' {
    return this.configService.get<EnvConfig['NODE_ENV']>('NODE_ENV', 'development');
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === 'development';
  }

  get isStaging(): boolean {
    return this.nodeEnv === 'staging';
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get isTest(): boolean {
    return (process.env.NODE_ENV as string) === 'test';
  }

  /**
   * Server Configuration
   */
  get port(): number {
    return this.configService.get<number>('PORT', 3000);
  }

  /**
   * Database Configuration
   */
  get databaseUrl(): string {
    const url = this.configService.get<string>('DATABASE_URL');

    if (!url) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    return url;
  }

  /**
   * Supabase Configuration
   */
  get supabaseUrl(): string {
    const url = this.configService.get<string>('SUPABASE_URL');

    if (!url) {
      throw new Error('SUPABASE_URL is not defined in environment variables');
    }

    return url;
  }

  get supabaseAnonKey(): string {
    const key = this.configService.get<string>('SUPABASE_ANON_KEY');

    if (!key) {
      throw new Error('SUPABASE_ANON_KEY is not defined in environment variables');
    }

    return key;
  }

  get supabaseServiceRoleKey(): string {
    const key = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not defined in environment variables');
    }

    return key;
  }

  /**
   * JWT Configuration
   */
  get jwtSecret(): string {
    const secret = this.configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    if (secret.length < 32) {
      this.logger.warn('JWT_SECRET is less than 32 characters. This is not secure!');
    }

    return secret;
  }

  get jwtExpiration(): string {
    return this.configService.get<string>('JWT_EXPIRATION', '7d');
  }

  /**
   * CORS Configuration
   */
  get corsOrigins(): string[] {
    const origins = this.configService.get<string>('CORS_ORIGINS', '*');

    if (origins === '*') {
      return ['*'];
    }

    return origins.split(',').map(origin => origin.trim());
  }

  /**
   * Redis Configuration
   */
  get redisHost(): string {
    return this.configService.get<string>('REDIS_HOST', 'localhost');
  }

  get redisPort(): number {
    return this.configService.get<number>('REDIS_PORT', 6379);
  }

  get redisPassword(): string | undefined {
    return this.configService.get<string>('REDIS_PASSWORD');
  }

  get redisConfig(): {
    host: string;
    port: number;
    password?: string;
  } {
    return {
      host: this.redisHost,
      port: this.redisPort,
      password: this.redisPassword,
    };
  }

  /**
   * Frontend Configuration
   */
  get frontendUrl(): string {
    const url = this.configService.get<string>('FRONTEND_URL');

    if (!url) {
      throw new Error('FRONTEND_URL is not defined in environment variables');
    }

    return url;
  }

  /**
   * Logging Configuration
   */
  get logLevel(): 'debug' | 'info' | 'warn' | 'error' {
    return this.configService.get<'debug' | 'info' | 'warn' | 'error'>(
      'LOG_LEVEL',
      'info'
    );
  }

  /**
   * Email Configuration
   */
  get emailProvider(): 'smtp' | 'sendgrid' | 'mailgun' | 'supabase' {
    return this.configService.get<'smtp' | 'sendgrid' | 'mailgun' | 'supabase'>(
      'EMAIL_PROVIDER',
      'smtp'
    );
  }

  get sendgridApiKey(): string {
    return this.configService.get<string>('SENDGRID_API_KEY', '');
  }

  get mailgunUsername(): string {
    return this.configService.get<string>('MAILGUN_USERNAME', '');
  }

  get mailgunPassword(): string {
    return this.configService.get<string>('MAILGUN_PASSWORD', '');
  }

  get smtpHost(): string {
    return this.configService.get<string>('SMTP_HOST', 'localhost');
  }

  get smtpPort(): number {
    return this.configService.get<number>('SMTP_PORT', 587);
  }

  get smtpSecure(): boolean {
    return this.configService.get<boolean>('SMTP_SECURE', false);
  }

  get smtpUser(): string {
    return this.configService.get<string>('SMTP_USER', '');
  }

  get smtpPass(): string {
    return this.configService.get<string>('SMTP_PASS', '');
  }

  get emailFromName(): string {
    return this.configService.get<string>('EMAIL_FROM_NAME', 'Accounting System');
  }

  get emailFromAddress(): string {
    return this.configService.get<string>('EMAIL_FROM_ADDRESS', 'noreply@accounting-system.com');
  }

  get emailReplyTo(): string {
    return this.configService.get<string>('EMAIL_REPLY_TO', 'support@accounting-system.com');
  }

  /**
   * App Configuration
   */
  get appName(): string {
    return this.configService.get<string>('APP_NAME', 'Accounting System');
  }

  /**
   * Validation
   * Performs basic validation checks on startup
   */
  private validateConfig(): void {
    const errors: string[] = [];

    // Validate critical configuration
    try {
      this.databaseUrl;
    } catch (e) {
      errors.push('DATABASE_URL is required');
    }

    try {
      this.supabaseUrl;
    } catch (e) {
      errors.push('SUPABASE_URL is required');
    }

    try {
      this.supabaseAnonKey;
    } catch (e) {
      errors.push('SUPABASE_ANON_KEY is required');
    }

    try {
      this.supabaseServiceRoleKey;
    } catch (e) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is required');
    }

    try {
      this.jwtSecret;
    } catch (e) {
      errors.push('JWT_SECRET is required');
    }

    try {
      this.frontendUrl;
    } catch (e) {
      errors.push('FRONTEND_URL is required');
    }

    // Log warnings for insecure configurations
    if (this.isProduction && this.jwtSecret.length < 32) {
      this.logger.warn('Production environment detected with weak JWT_SECRET!');
    }

    if (this.isProduction && this.corsOrigins.includes('*')) {
      this.logger.warn('Production environment detected with wildcard CORS origins!');
    }

    // Throw if critical configuration is missing
    if (errors.length > 0) {
      throw new Error(
        `Configuration validation failed:\n${errors.map(e => `  - ${e}`).join('\n')}`
      );
    }

    this.logger.log(`Configuration loaded for ${this.nodeEnv} environment`);
  }
}
