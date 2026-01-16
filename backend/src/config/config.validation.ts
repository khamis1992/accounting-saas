import * as Joi from 'joi';

/**
 * Joi Validation Schema for Environment Variables
 *
 * This schema validates all environment variables on application startup.
 * If validation fails, the application will not start and will display clear error messages.
 */
export const validationSchema = Joi.object({
  // Environment
  NODE_ENV: Joi.string()
    .valid('development', 'staging', 'production', 'test')
    .default('development')
    .description('Application environment (development, staging, production, test)'),

  PORT: Joi.number()
    .port()
    .default(3000)
    .description('Server port number'),

  // Database
  DATABASE_URL: Joi.string()
    .uri()
    .required()
    .description('PostgreSQL database connection URL')
    .messages({
      'string.uri': 'DATABASE_URL must be a valid database connection URL',
      'any.required': 'DATABASE_URL is required',
    }),

  // Supabase
  SUPABASE_URL: Joi.string()
    .uri()
    .required()
    .description('Supabase project URL')
    .messages({
      'string.uri': 'SUPABASE_URL must be a valid URL',
      'any.required': 'SUPABASE_URL is required',
    }),

  SUPABASE_ANON_KEY: Joi.string()
    .required()
    .description('Supabase anonymous/public key')
    .messages({
      'any.required': 'SUPABASE_ANON_KEY is required',
    }),

  SUPABASE_SERVICE_ROLE_KEY: Joi.string()
    .required()
    .description('Supabase service role key (handle with care!)')
    .messages({
      'any.required': 'SUPABASE_SERVICE_ROLE_KEY is required',
    }),

  // JWT Authentication
  JWT_SECRET: Joi.string()
    .min(32)
    .required()
    .description('JWT secret key (minimum 32 characters)')
    .messages({
      'string.min': 'JWT_SECRET must be at least 32 characters long',
      'any.required': 'JWT_SECRET is required',
    }),

  JWT_EXPIRATION: Joi.string()
    .pattern(/^\d+[smhd]$/)
    .default('7d')
    .description('JWT expiration time (e.g., 1h, 7d, 30m)')
    .messages({
      'string.pattern.base': 'JWT_EXPIRATION must match pattern like: 1h, 7d, 30m, 1s',
    }),

  // CORS
  CORS_ORIGINS: Joi.string()
    .default('http://localhost:3000')
    .description('Comma-separated list of allowed CORS origins, or * for all'),

  // Redis
  REDIS_HOST: Joi.string()
    .default('localhost')
    .description('Redis server host'),

  REDIS_PORT: Joi.number()
    .port()
    .default(6379)
    .description('Redis server port'),

  REDIS_PASSWORD: Joi.string()
    .optional()
    .allow('')
    .description('Redis password (optional)'),

  // Frontend
  FRONTEND_URL: Joi.string()
    .uri()
    .required()
    .description('Frontend application URL for redirects')
    .messages({
      'string.uri': 'FRONTEND_URL must be a valid URL',
      'any.required': 'FRONTEND_URL is required',
    }),

  // Logging
  LOG_LEVEL: Joi.string()
    .valid('debug', 'info', 'warn', 'error')
    .default('info')
    .description('Logging level'),
});

/**
 * Validation options
 */
export const validationOptions = {
  abortEarly: false, // Include all errors in the output
  allowUnknown: true, // Allow unknown environment variables
  stripUnknown: false, // Keep unknown environment variables
};
