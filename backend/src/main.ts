import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import compression from 'compression';
import helmet from 'helmet';
import { xss } from 'express-xss-sanitizer';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';
import { SecurityMiddleware, RequestLoggingMiddleware } from './common/middleware';
import { XssSanitizerPipe } from './common/pipes';
import { Request, Response, NextFunction } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Configure body size limits
    rawBody: true,
  });

  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // ============================================================================
  // SECURITY MIDDLEWARE ORDER (important!)
  // 1. CORS configuration (MUST be first to handle preflight)
  // 2. Security headers (Helmet)
  // 3. XSS protection
  // 4. Compression
  // 5. Custom middleware
  // ============================================================================

  // 1. CORS Configuration - MUST be before other middleware
  const corsOrigins = configService.corsOrigins;
  logger.log(`Configuring CORS for origins: ${JSON.stringify(corsOrigins)}`);
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }
      
      // Allow all origins if wildcard is set
      if (corsOrigins.includes('*')) {
        return callback(null, true);
      }
      
      // Check if origin is in the allowed list
      if (corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log rejected origins for debugging
      logger.warn(`CORS rejected origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers',
      'X-CSRF-Token',
    ],
    exposedHeaders: ['Content-Range', 'X-Content-Range'],
    maxAge: 86400, // 24 hours
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // 2. Helmet: Security headers
  app.use(
    helmet({
      // Content Security Policy
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          fontSrc: ["'self'"],
          connectSrc: ["'self'", ...corsOrigins.filter(o => o !== '*')],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          mediaSrc: ["'self'"],
          manifestSrc: ["'self'"],
        },
      },
      // Disable COEP for compatibility with Next.js frontend
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false, // Disable to allow cross-origin requests
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow cross-origin resource sharing
      // HSTS (only in production)
      hsts: configService.isProduction
        ? {
            maxAge: 31536000, // 1 year
            includeSubDomains: true,
            preload: true,
          }
        : false,
      // Other security headers
      noSniff: true,
      xssFilter: true,
      // Hide X-Powered-By header
      hidePoweredBy: true,
    })
  );

  // 4. XSS Protection middleware
  app.use(xss());

  // 5. Response compression
  app.use(
    compression({
      filter: (req: Request, res: Response) => {
        // Don't compress if client doesn't accept it
        if (req.headers['x-no-compression']) {
          return false;
        }
        // Compress everything
        return compression.filter(req, res);
      },
      threshold: 1024, // Only compress responses larger than 1KB
      level: 6, // Compression level (1-9)
    })
  );

  // 6. Custom security middleware
  const securityMiddleware = app.get(SecurityMiddleware);
  const requestLoggingMiddleware = app.get(RequestLoggingMiddleware);

  app.use((req: Request, res: Response, next: NextFunction) => securityMiddleware.use(req, res, next));
  app.use((req: Request, res: Response, next: NextFunction) => requestLoggingMiddleware.use(req, res, next));

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
    new XssSanitizerPipe()
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('Qatar Accounting SaaS API')
    .setDescription('Enterprise-level accounting platform for Qatar market')
    .setVersion('1.0')
    .addTag('auth', 'Authentication')
    .addTag('tenants', 'Tenant management')
    .addTag('users', 'User management')
    .addTag('roles', 'Role management')
    .addTag('coa', 'Chart of Accounts')
    .addTag('journals', 'Journal entries')
    .addTag('fiscal-periods', 'Fiscal periods')
    .addTag('customers', 'Customer management')
    .addTag('vendors', 'Vendor management')
    .addTag('invoices', 'Invoicing')
    .addTag('payments', 'Payments and receipts')
    .addTag('banking', 'Bank accounts and reconciliation')
    .addTag('expenses', 'Expense claims')
    .addTag('assets', 'Fixed assets')
    .addTag('vat', 'VAT reporting')
    .addTag('reports', 'Financial reports')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.port;
  await app.listen(port);

  // Security logging
  logger.log(`==================================================`);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API Documentation: http://localhost:${port}/api/docs`);
  logger.log(`Environment: ${configService.nodeEnv}`);
  logger.log(`CORS Origins: ${corsOrigins.join(', ')}`);
  logger.log(`Security Features:`);
  logger.log(`  - Helmet: Enabled`);
  logger.log(`  - CORS: Enabled`);
  logger.log(`  - Rate Limiting: Enabled`);
  logger.log(`  - XSS Protection: Enabled`);
  logger.log(`  - Compression: Enabled`);
  logger.log(`  - HSTS: ${configService.isProduction ? 'Enabled' : 'Disabled (dev only)'}`);
  logger.log(`==================================================`);
}

bootstrap();
