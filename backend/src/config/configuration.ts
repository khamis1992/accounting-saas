export default () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  supabase: {
    url: process.env.SUPABASE_URL || '',
    anonKey: process.env.SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  email: {
    provider: process.env.EMAIL_PROVIDER || 'smtp',
    sendgridApiKey: process.env.SENDGRID_API_KEY || '',
    mailgunUsername: process.env.MAILGUN_USERNAME || '',
    mailgunPassword: process.env.MAILGUN_PASSWORD || '',
    smtpHost: process.env.SMTP_HOST || 'localhost',
    smtpPort: parseInt(process.env.SMTP_PORT || '587', 10),
    smtpSecure: process.env.SMTP_SECURE === 'true',
    smtpUser: process.env.SMTP_USER || '',
    smtpPass: process.env.SMTP_PASS || '',
    fromName: process.env.EMAIL_FROM_NAME || 'Accounting System',
    fromAddress: process.env.EMAIL_FROM_ADDRESS || 'noreply@accounting-system.com',
    replyTo: process.env.EMAIL_REPLY_TO || 'support@accounting-system.com',
  },
  frontend: {
    url: process.env.FRONTEND_URL || 'http://localhost:3000',
  },
  app: {
    name: process.env.APP_NAME || 'Accounting System',
  },
});
