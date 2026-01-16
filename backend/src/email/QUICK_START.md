# Email System Quick Start Guide

## Setup in 5 Minutes

### 1. Install Dependencies (Already Done)
```bash
npm install nodemailer handlebars @types/nodemailer @types/handlebars
```

### 2. Configure Email Provider

Copy the example configuration:
```bash
cp .env.email.example .env.local
```

Edit `.env.local` with your email provider settings:

#### Option A: SendGrid (Recommended for Production)
```bash
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key_here
EMAIL_FROM_NAME=Accounting System
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_REPLY_TO=support@yourdomain.com
```

#### Option B: Mailgun
```bash
EMAIL_PROVIDER=mailgun
MAILGUN_USERNAME=postmaster@yourdomain.com
MAILGUN_PASSWORD=your_mailgun_password
EMAIL_FROM_NAME=Accounting System
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
```

#### Option C: SMTP (Gmail Example - Not Recommended for Production)
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM_NAME=Accounting System
EMAIL_FROM_ADDRESS=your_email@gmail.com
```

#### Option D: For Testing (Mailtrap)
```bash
EMAIL_PROVIDER=smtp
SMTP_HOST=sandbox.smtp.mailtrap.io
SMTP_PORT=2525
SMTP_SECURE=false
SMTP_USER=your_mailtrap_username
SMTP_PASS=your_mailtrap_password
```

### 3. Start the Application

```bash
npm run start:dev
```

### 4. Test Email Sending

Using curl:
```bash
# Test verification email
curl -X POST "http://localhost:3000/email/test-verification?email=test@example.com&language=en"

# Check email service status
curl "http://localhost:3000/email/status"

# Get queue statistics
curl "http://localhost:3000/email/queue-stats"
```

Using browser:
- Visit: `http://localhost:3000/email/status`
- Check if service shows as connected

## Common Usage Patterns

### Sending Emails from Services

```typescript
import { EmailService } from '../email/email.service';

constructor(private emailService: EmailService) {}

// Send verification email
await this.emailService.sendVerificationEmail(
  'user@example.com',
  'verification_token',
  'tenant_123',
  'en' // or 'ar' for Arabic
);

// Send invoice with PDF
await this.emailService.sendInvoiceEmail(
  'invoice_123',
  'customer@example.com',
  'tenant_123',
  {
    invoiceNumber: 'INV-2024-001',
    totalAmount: 1500.00,
    dueDate: '2024-12-31',
  },
  'en',
  pdfBuffer // Optional: PDF attachment
);

// Send payment reminder for multiple invoices
await this.emailService.sendPaymentReminderEmail(
  [
    {
      id: 'inv_1',
      invoice_number: 'INV-2024-001',
      total_amount: 1500,
      due_date: '2024-12-31',
    },
  ],
  'customer@example.com',
  'tenant_123',
  'en'
);
```

### Queue-Based Sending (Recommended for Bulk)

```typescript
await this.emailService.queueEmail({
  to: 'customer@example.com',
  subject: 'Your Invoice',
  template: 'invoice',
  data: {
    invoiceId: 'inv_123',
    invoiceNumber: 'INV-2024-001',
    amount: 1500,
    dueDate: '2024-12-31',
    language: 'en',
    appName: 'Accounting System',
  },
  language: 'en',
});
```

## Troubleshooting

### Problem: Emails Not Sending

**Check 1: Configuration**
```bash
# Verify environment variables are loaded
npm run start:dev

# Look for: "Email service connection verified" in logs
```

**Check 2: Queue Status**
```bash
curl "http://localhost:3000/email/queue-stats"
# Should show: { "waiting": 0, "active": 0, "completed": N, "failed": 0 }
```

**Check 3: API Credentials**
- Verify API key is correct
- Check email provider dashboard
- Ensure API key has sending permissions

### Problem: Template Not Found

**Solution:**
1. Check template exists: `ls src/email/templates/`
2. Verify naming: `templateName-language.hbs`
3. Restart application

### Problem: Queue Not Processing

**Check Redis:**
```bash
# If using Docker
docker ps | grep redis

# Check Redis is running
redis-cli ping
# Should return: PONG
```

## Testing Checklist

- [ ] Configuration loaded correctly
- [ ] Email service connection verified
- [ ] Test verification email sent successfully
- [ ] Test password reset email sent successfully
- [ ] Test welcome email sent successfully
- [ ] Test invoice email sent successfully
- [ ] Queue statistics showing correct data
- [ ] Emails received in inbox (check spam folder too)

## Production Readiness

Before deploying to production:

### 1. Use Production Email Provider
- ✅ SendGrid or Mailgun (recommended)
- ❌ Gmail (not for production)
- ❌ Development SMTP services

### 2. Configure Domain
- Add SPF record
- Add DKIM record
- Verify domain in email provider

### 3. Set Up Monitoring
- Monitor queue size
- Track email delivery rates
- Set up alerts for failures

### 4. Security
- Use environment variables for all credentials
- Never commit `.env` files
- Rotate API keys regularly

### 5. Testing
- Test all email templates
- Verify both English and Arabic versions
- Test with real email addresses
- Check email rendering on multiple clients

## Next Steps

1. **Customize Templates**
   - Edit templates in `src/email/templates/`
   - Add your company branding
   - Modify colors and styling

2. **Add More Email Types**
   - Create new templates
   - Add methods in `EmailService`
   - Update documentation

3. **Integrate with Business Logic**
   - Send emails on invoice creation
   - Send payment confirmations
   - Set up automated reminders

4. **Monitor and Optimize**
   - Track email metrics
   - Optimize send times
   - Improve templates based on data

## Support

For detailed documentation, see: `src/email/README.md`

For implementation details, see: `EMAIL_IMPLEMENTATION_SUMMARY.md`

## Quick Reference

| Task | Endpoint/Method |
|------|----------------|
| Send verification | `emailService.sendVerificationEmail()` |
| Send password reset | `emailService.sendPasswordResetEmail()` |
| Send welcome email | `emailService.sendWelcomeEmail()` |
| Send invoice | `emailService.sendInvoiceEmail()` |
| Send receipt | `emailService.sendPaymentReceiptEmail()` |
| Send reminder | `emailService.sendPaymentReminderEmail()` |
| Queue email | `emailService.queueEmail()` |
| Check status | `GET /email/status` |
| Queue stats | `GET /email/queue-stats` |
| Test verification | `POST /email/test-verification` |
| Test password reset | `POST /email/test-password-reset` |
| Test welcome | `POST /email/test-welcome` |

## Example Environment File

```bash
# .env.local
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxx
EMAIL_FROM_NAME=My Accounting App
EMAIL_FROM_ADDRESS=noreply@myapp.com
EMAIL_REPLY_TO=support@myapp.com
APP_NAME=My Accounting App
FRONTEND_URL=https://myapp.com
```

That's it! You're ready to send emails! 🚀
