# 🚀 Production Deployment Guide
## Enterprise Accounting SaaS - Complete Production Launch

**Version:** 2.0.0
**Status:** ✅ PRODUCTION READY
**Last Updated:** 2025-01-16

---

## 📋 Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Database Setup](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Post-Deployment Verification](#post-deployment-verification)
6. [Monitoring & Maintenance](#monitoring--maintenance)
7. [Rollback Procedure](#rollback-procedure)

---

## ✅ Pre-Deployment Checklist

### Infrastructure Requirements

- ✅ Server/VPS with minimum specifications:
  - **CPU:** 4 cores
  - **RAM:** 8GB
  - **Storage:** 50GB SSD
  - **OS:** Ubuntu 22.04 LTS or similar

- ✅ Database:
  - **Supabase Pro tier** or managed PostgreSQL
  - **Backups:** Automated daily backups
  - **Replication:** Optional (recommended for production)

- ✅ Domain & SSL:
  - **Domain:** Registered and configured
  - **SSL Certificate:** Let's Encrypt or commercial certificate
  - **DNS:** A records configured for API and frontend

### Required Services & Software

- ✅ **Node.js:** v20.x LTS or v18.x LTS
- ✅ **PostgreSQL:** v15+ or Supabase
- ✅ **Redis:** v7+ (optional, for Bull queue)
- ✅ **Nginx:** v1.24+ or similar reverse proxy
- � **PM2:** Latest version (for process management)

### Access & Credentials

- ✅ Server SSH access
- ✅ Supabase/PostgreSQL credentials
- ✅ Domain DNS management access
- ✅ SSL certificate files (if not using Let's Encrypt)
- ✅ Email provider credentials (SMTP/SendGrid/Mailgun)
- ✅ Git repository access

---

## 🗄️ Database Setup

### Step 1: Supabase Project Setup

1. **Create Supabase Project**
   ```bash
   # Navigate to https://supabase.com
   # Click "New Project"
   # Fill in project details:
   - Name: accounting-saas-prod
   - Database Password: [generate secure password]
   - Region: Choose region closest to your users
   - Pricing Plan: Pro tier (recommended for production)
   ```

2. **Configure Database Settings**
   ```bash
   # In Supabase Dashboard:
   # 1. Navigate to Database > Settings
   # 2. Verify connection details
   # 3. Enable Row Level Security (RLS)
   # 4. Configure connection pooling (if needed)
   ```

3. **Run Database Migrations**
   ```bash
   # Navigate to Supabase SQL Editor
   # Execute migrations in order:

   # 1. Run audit_logs table migration
   # Copy contents of: backend/src/audit/migrations/create_audit_logs_table.sql
   # Paste in SQL Editor and execute

   # 2. Verify table creation
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   ORDER BY table_name;
   ```

4. **Configure RLS Policies**
   ```sql
   -- Enable RLS on all tables
   ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
   ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
   ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
   ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
   -- etc. for all tables

   -- Create tenant isolation policy
   CREATE POLICY "Users can view their tenant data"
   ON customers
   FOR SELECT
   USING (tenant_id = (
     SELECT tenant_id
     FROM users
     WHERE id = auth.uid()
   ));
   -- Repeat for all tables
   ```

### Step 2: Configure Storage Buckets

```bash
# In Supabase Dashboard:
# 1. Navigate to Storage
# 2. Create buckets:

# Avatars bucket
- Bucket Name: avatars
- Public: true
- File Size Limit: 5MB
- Allowed MIME Types: image/jpeg, image/png, image/gif, image/webp

# Documents bucket
- Bucket Name: documents
- Public: false
- File Size Limit: 10MB
- Allowed MIME Types: application/pdf

# Invoices bucket
- Bucket Name: invoices
- Public: false
- File Size Limit: 10MB
- Allowed MIME Types: application/pdf

# 3. Configure bucket policies for RLS
```

### Step 3: Seed Initial Data

```sql
-- Create default Chart of Accounts template
INSERT INTO chart_of_accounts_templates (tenant_id, name_en, name_ar)
VALUES ('default', 'Default Chart of Accounts', 'الافتراضي');

-- Add default accounts
INSERT INTO chart_of_accounts (tenant_id, code, name_en, name_ar, type, balance_type, is_active, is_posting_allowed)
VALUES
  ('default', '1000', 'Assets', 'الأصول', 'asset', 'debit', true, true),
  ('default', '1100', 'Current Assets', 'الأصول المتداولة', 'asset', 'debit', true, true),
  ('default', '1110', 'Cash', 'النقدية', 'asset', 'debit', true, true),
  ('default', '1120', 'Bank', 'البنك', 'asset', 'debit', true, true),
  ('default', '1130', 'Accounts Receivable', 'الذمم المدينة', 'asset', 'debit', true, true),
  ('default', '2000', 'Liabilities', 'الخصوم', 'liability', 'credit', true, true),
  ('default', '2100', 'Current Liabilities', 'الخصوم المتداولة', 'liability', 'credit', true, true),
  ('default', '2110', 'Accounts Payable', 'الذمم الدائنة', 'liability', 'credit', true, true),
  ('default', '3000', 'Equity', 'حقوق الملكية', 'equity', 'credit', true, true),
  ('default', '4000', 'Revenue', 'الإيرادات', 'revenue', 'credit', true, true),
  ('default', '5000', 'Expenses', 'المصروفات', 'expense', 'debit', true, true);
```

---

## 🔧 Backend Deployment

### Step 1: Server Preparation

```bash
# SSH into your server
ssh user@your-server.com

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Verify installations
node --version  # Should be v20.x.x
npm --version   # Should be 10.x.x
pm2 --version
nginx -v
```

### Step 2: Clone & Configure Backend

```bash
# Create application directory
sudo mkdir -p /var/www/accounting-saas
sudo chown -R $USER:$USER /var/www/accounting-saas
cd /var/www/accounting-saas

# Clone repository (replace with your repo URL)
git clone https://github.com/yourusername/accounting-saas-new.git backend
cd backend

# Install dependencies
npm ci --only=production

# Create production environment file
cp .env.production.template .env.production

# Edit environment file
nano .env.production
# IMPORTANT: Replace ALL placeholder values with actual production values
```

### Step 3: Configure Environment Variables

```bash
# Edit .env.production
nano .env.production

# Critical variables to configure:
APP_NAME="Accounting SaaS"
APP_ENV="production"
APP_URL="https://api.yourdomain.com"
FRONTEND_URL="https://yourdomain.com"
PORT=3001

# Database
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# JWT (Generate secure secret!)
JWT_SECRET="openssl rand -base64 64"

# Email
EMAIL_PROVIDER="smtp"  # or sendgrid, mailgun
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT=587
SMTP_USER="your-smtp-username"
SMTP_PASSWORD="your-smtp-password"
EMAIL_FROM_ADDRESS="noreply@yourdomain.com"
EMAIL_FROM_NAME="Accounting SaaS"

# Feature Flags
FEATURE_USER_MANAGEMENT=true
FEATURE_AUDIT_LOGGING=true
FEATURE_DATA_EXPORT=true
FEATURE_PDF_GENERATION=true
FEATURE_EMAIL_SYSTEM=true

# Security
JWT_SECRET="your-secure-secret"
CORS_ORIGIN="https://yourdomain.com"
RATE_LIMIT_LIMIT=100
```

### Step 4: Build & Start Backend

```bash
# Build the application
npm run build

# Test the build
npm run start:prod

# Verify server is running
curl http://localhost:3001/health

# Stop the test server
# Press Ctrl+C

# Start with PM2
pm2 start dist/main.js --name accounting-api

# Configure PM2 to start on system boot
pm2 startup
# Run the command output by the above command
pm2 save

# Check PM2 status
pm2 status
pm2 logs accounting-api
```

### Step 5: Configure Nginx Reverse Proxy

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/accounting-api

# Add the following configuration:
```

```nginx
# API Server Configuration
upstream accounting_backend {
    server 127.0.0.1:3001;
}

# HTTP to HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name api.yourdomain.com;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/accounting-api-access.log;
    error_log /var/log/nginx/accounting-api-error.log;

    # Proxy Settings
    location / {
        proxy_pass http://accounting_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # File Upload Size
    client_max_body_size 10M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json application/javascript;
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/accounting-api /etc/nginx/sites-enabled/

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

### Step 6: Obtain SSL Certificate

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d api.yourdomain.com

# Certbot will automatically configure SSL in Nginx
# Follow the prompts to enter your email and agree to terms

# Test auto-renewal
sudo certbot renew --dry-run
```

---

## 🎨 Frontend Deployment

### Step 1: Build Frontend for Production

```bash
# On your local machine or build server
cd frontend

# Install dependencies
npm ci

# Create production environment file
cp .env.production.template .env.production.local

# Edit environment file
nano .env.production.local

# Configure:
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
NEXT_PUBLIC_API_URL="https://api.yourdomain.com"
NEXT_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# Build the application
npm run build

# Test the build locally (optional)
npm run start
# Visit http://localhost:3000 to verify
```

### Step 2: Deploy to Vercel (Recommended)

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
cd frontend
vercel --prod

# Follow the prompts:
# - Set up and deploy: Y
# - Which scope: Select your account
# - Link to existing project: N
# - Project name: accounting-saas-frontend
# - Directory: . (current directory)
# - Override settings: N

# Vercel will provide you with a URL
# Configure custom domain in Vercel dashboard:
# https://vercel.com/dashboard

# Add domain: yourdomain.com
# Configure DNS records as instructed by Vercel
```

### Step 3: Alternative: Deploy to VPS with Nginx

```bash
# If deploying to VPS instead of Vercel:

# On the server
cd /var/www/accounting-saas

# Copy build files from local machine to server
# On local machine:
scp -r frontend/.next frontend/node_modules frontend/package.json user@your-server.com:/var/www/accounting-saas/frontend/

# On server:
cd frontend
npm install -g serve
pm2 start npm --name accounting-frontend -- start

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/accounting-frontend
```

```nginx
# Frontend Configuration
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Logging
    access_log /var/log/nginx/accounting-frontend-access.log;
    error_log /var/log/nginx/accounting-frontend-error.log;

    # Next.js Static Files
    location /_next/static {
        alias /var/www/accounting-saas/frontend/.next/static;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Next.js Images
    location /_next/image {
        proxy_pass http://127.0.0.1:3000;
        proxy_cache_bypass $http_upgrade;
    }

    # Proxy to Next.js Server
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/accounting-frontend /etc/nginx/sites-enabled/

# Test Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## ✅ Post-Deployment Verification

### Step 1: Health Checks

```bash
# Test API health endpoint
curl https://api.yourdomain.com/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2025-01-16T...",
  "database": {
    "status": "up",
    "latency": 15
  },
  "supabase": {
    "status": "up",
    "latency": 20
  }
}

# Test frontend
curl https://yourdomain.com
# Should return HTML with Next.js app
```

### Step 2: API Endpoints Verification

```bash
# Test authentication
curl -X POST https://api.yourdomain.com/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!",
    "tenantName": "Test Company"
  }'

# Test login
curl -X POST https://api.yourdomain.com/auth/signin \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePassword123!"
  }'

# Save the JWT token from response
JWT_TOKEN="your-jwt-token"
TENANT_ID="your-tenant-id"

# Test authenticated endpoint
curl https://api.yourdomain.com/coa \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "tenant-id: $TENANT_ID"
```

### Step 3: Feature Testing

```bash
# Test PDF Generation
curl https://api.yourdomain.com/pdf/invoices/$INVOICE_ID \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "tenant-id: $TENANT_ID" \
  --output invoice.pdf
# Verify invoice.pdf is created

# Test Data Export
curl "https://api.yourdomain.com/customers/export/csv" \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "tenant-id: $TENANT_ID" \
  --output customers.csv
# Verify customers.csv is created

# Test Audit Logging
curl https://api.yourdomain.com/audit/statistics \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "tenant-id: $TENANT_ID"
# Should return audit statistics
```

### Step 4: Email Testing

```bash
# Access backend logs
pm2 logs accounting-api

# Trigger test email (from application or API)
# Verify email is received
# Check logs for any errors
```

### Step 5: Frontend Testing

```bash
# Visit frontend in browser
https://yourdomain.com

# Test user flow:
1. Sign up new user
2. Sign in
3. Create customer
4. Create invoice
5. Generate PDF
6. Export data
7. View audit logs
8. Update profile

# Verify all features work correctly
```

---

## 📊 Monitoring & Maintenance

### Step 1: Set Up Monitoring

```bash
# Install PM2 Plus (optional but recommended)
pm2 link <secret-key>

# Or use basic monitoring
pm2 monit

# Set up log rotation
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Step 2: Configure Automated Backups

```bash
# For Supabase (automatic):
# Supabase Pro tier includes automatic backups

# For self-hosted PostgreSQL:
# Create backup script
nano /usr/local/bin/backup-db.sh
```

```bash
#!/bin/bash
# Database Backup Script
BACKUP_DIR="/var/backups/accounting-saas"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="accounting_saas"
DB_USER="postgres"
BACKUP_FILE="$BACKUP_DIR/db_backup_$DATE.sql.gz"

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_FILE

# Delete backups older than 30 days
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
```

```bash
# Make script executable
chmod +x /usr/local/bin/backup-db.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /usr/local/bin/backup-db.sh
```

### Step 3: Set Up Alerts

```bash
# Install monitoring tools (optional)
sudo apt install -y htop iotop

# Configure email alerts for critical errors
# Add to backend .env.production:
ALERT_EMAIL="devops@yourdomain.com"

# Test alerts
# Trigger a test error and verify email is received
```

### Step 4: Log Management

```bash
# Configure log rotation
sudo nano /etc/logrotate.d/accounting-saas
```

```
/var/log/nginx/accounting-api-access.log
/var/log/nginx/accounting-api-error.log
/var/log/nginx/accounting-frontend-access.log
/var/log/nginx/accounting-frontend-error.log
{
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 www-data adm
    sharedscripts
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
```

---

## 🔄 Rollback Procedure

### If Backend Deployment Fails

```bash
# Stop current version
pm2 stop accounting-api

# Revert to previous version
cd /var/www/accounting-saas/backend
git log --oneline -10  # Find previous commit
git checkout <previous-commit-hash>

# Rebuild
npm run build

# Start with PM2
pm2 restart accounting-api

# Verify
curl https://api.yourdomain.com/health
```

### If Frontend Deployment Fails

```bash
# For Vercel deployment:
vercel rollback
# Or revert to previous deployment in Vercel dashboard

# For VPS deployment:
pm2 stop accounting-frontend
cd /var/www/accounting-saas/frontend
git checkout <previous-commit-hash>
npm run build
pm2 restart accounting-frontend
```

### Database Rollback

```bash
# Restore from backup
gunzip < /var/backups/accounting-saas/db_backup_YYYYMMDD_HHMMSS.sql.gz | psql -h localhost -U postgres accounting_saas

# Verify restoration
psql -h localhost -U postgres accounting_saas -c "\dt"
```

---

## 🎯 Success Criteria

### Deployment is successful when:

- ✅ All health endpoints return "ok"
- ✅ Frontend loads without errors
- ✅ User can sign up and sign in
- ✅ All CRUD operations work
- ✅ PDF generation works
- ✅ Email sending works
- ✅ Audit logging is active
- ✅ Data export functions
- ✅ SSL certificates are valid
- ✅ Backups are automated
- ✅ Monitoring is active
- ✅ Alerts are configured

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue 1: Database Connection Failed**
```bash
# Check database credentials
# Verify Supabase URL
# Test connection: psql -h db.xxx.supabase.co -U postgres -d postgres
```

**Issue 2: CORS Errors**
```bash
# Check CORS_ORIGIN in .env.production
# Verify frontend URL is whitelisted
# Check Nginx configuration
```

**Issue 3: Email Not Sending**
```bash
# Check email provider credentials
# Verify SMTP settings
# Check PM2 logs: pm2 logs accounting-api
# Test SMTP connection: telnet smtp.your-provider.com 587
```

**Issue 4: PDF Generation Fails**
```bash
# Check /tmp/pdf directory exists
# Verify font files are present
# Check disk space
# Check PM2 logs for errors
```

**Issue 5: High Memory Usage**
```bash
# Check PM2 process status: pm2 status
# Restart PM2: pm2 restart accounting-api
# Check memory leaks: pm2 monit
```

---

## 📝 Post-Deployment Checklist

- [ ] All health checks passing
- [ ] SSL certificates valid
- [ ] DNS records configured correctly
- [ ] Database backups automated
- [ ] Monitoring active
- [ ] Alerts configured
- [ ] Log rotation configured
- [ ] PM2 startup configured
- [ ] Email system tested
- [ ] PDF generation tested
- [ ] Data export tested
- [ ] Audit logging tested
- [ ] User management tested
- [ ] Load testing completed
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Team trained

---

**Deployment Status:** ✅ READY
**Estimated Deployment Time:** 2-3 hours
**Required Downtime:** None (zero-downtime deployment)
**Rollback:** Supported

---

**Last Updated:** 2025-01-16
**Version:** 2.0.0
**Status:** PRODUCTION READY

🚀 **Your application is now ready for production deployment!**
