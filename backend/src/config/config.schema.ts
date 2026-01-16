/**
 * Environment Configuration Schema
 *
 * Defines the structure and validation rules for all environment variables.
 * This ensures type safety and provides clear documentation of required configuration.
 */

export interface EnvConfig {
  // Environment
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;

  // Database
  DATABASE_URL: string;

  // Supabase
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  SUPABASE_SERVICE_ROLE_KEY: string;

  // JWT Authentication
  JWT_SECRET: string;
  JWT_EXPIRATION: string;

  // CORS
  CORS_ORIGINS: string;

  // Redis (for BullMQ queues)
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;

  // Frontend URL (for redirects)
  FRONTEND_URL: string;

  // Email Configuration
  EMAIL_PROVIDER?: 'smtp' | 'sendgrid' | 'mailgun' | 'supabase';
  SENDGRID_API_KEY?: string;
  MAILGUN_USERNAME?: string;
  MAILGUN_PASSWORD?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: number;
  SMTP_SECURE?: boolean;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  EMAIL_FROM_NAME?: string;
  EMAIL_FROM_ADDRESS?: string;
  EMAIL_REPLY_TO?: string;

  // App Configuration
  APP_NAME?: string;

  // Logging
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Validation rules for environment variables
 */
export const configValidationRules = {
  // Environment
  NODE_ENV: {
    allowedValues: ['development', 'staging', 'production'],
    defaultValue: 'development',
  },
  PORT: {
    min: 1024,
    max: 65535,
    defaultValue: 3000,
  },
  JWT_SECRET: {
    minLength: 32,
    description: 'Must be at least 32 characters for security',
  },
  JWT_EXPIRATION: {
    pattern: /^\d+[smhd]$/,
    examples: ['1h', '7d', '30m', '1s'],
    defaultValue: '7d',
  },
  LOG_LEVEL: {
    allowedValues: ['debug', 'info', 'warn', 'error'],
    defaultValue: 'info',
  },
};
