# Email System Documentation

## Overview

The email system provides comprehensive email functionality for the accounting application, including:
- User verification emails
- Password reset emails
- Welcome emails
- Transactional emails (invoices, receipts)
- Payment reminders

## Features

- **Multiple Email Providers**: Support for SMTP, SendGrid, Mailgun, and Supabase
- **Bilingual Templates**: English and Arabic email templates
- **Queue-Based Processing**: Uses Bull for async email processing with retry logic
- **Responsive Design**: Mobile-friendly email templates
- **Template System**: Handlebars-based dynamic templates

## Configuration

### Environment Variables

```bash
# Email Provider Selection
EMAIL_PROVIDER=smtp|sendgrid|mailgun|supabase

# SendGrid Configuration
SENDGRID_API_KEY=your_sendgrid_api_key

# Mailgun Configuration
MAILGUN_USERNAME=your_mailgun_username
MAILGUN_PASSWORD=your_mailgun_password

# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

# Email Settings
EMAIL_FROM_NAME=Accounting System
EMAIL_FROM_ADDRESS=noreply@example.com
EMAIL_REPLY_TO=support@example.com

# App Settings
APP_NAME=Accounting System
FRONTEND_URL=http://localhost:3000
```

## Email Service Methods

### `sendVerificationEmail(email, token, tenantId, language?)`
Sends email verification link to new users.

### `sendPasswordResetEmail(email, resetToken, tenantId, language?)`
Sends password reset link to users.

### `sendWelcomeEmail(email, name, tenantId, language?)`
Sends welcome email to new users.

### `sendInvoiceEmail(invoiceId, recipientEmail, tenantId, invoiceData, language?, attachment?)`
Sends invoice to customers with optional PDF attachment.

### `sendPaymentReceiptEmail(paymentId, recipientEmail, tenantId, paymentData, language?, attachment?)`
Sends payment receipt to customers.

### `sendPaymentReminderEmail(invoices, recipientEmail, tenantId, language?)`
Sends payment reminder for overdue invoices.

### `queueEmail(options)`
Adds email to queue for async processing.

## Email Templates

Templates are located in `src/email/templates/` and follow the naming convention:
- `{templateName}-{language}.hbs` - HTML version
- `{templateName}-{language}-text.hbs` - Plain text version

### Available Templates

1. **Verification Email** (`verification-en.hbs`, `verification-ar.hbs`)
   - Used for email verification
   - Includes verification link

2. **Password Reset** (`password-reset-en.hbs`, `password-reset-ar.hbs`)
   - Used for password reset requests
   - Includes reset link with expiry warning

3. **Welcome Email** (`welcome-en.hbs`, `welcome-ar.hbs`)
   - Sent to new users after signup
   - Includes login link and feature overview

4. **Invoice Email** (`invoice-en.hbs`, `invoice-ar.hbs`)
   - Sent when invoices are created
   - Includes invoice details and payment link

5. **Payment Receipt** (`payment-receipt-en.hbs`, `payment-receipt-ar.hbs`)
   - Sent after payment is received
   - Includes payment confirmation

6. **Payment Reminder** (`payment-reminder-en.hbs`, `payment-reminder-ar.hbs`)
   - Sent for overdue invoices
   - Includes list of outstanding invoices

## Usage Examples

### Direct Email Sending (Synchronous)

```typescript
import { EmailService } from './email/email.service';

constructor(private emailService: EmailService) {}

async sendInvoice(invoiceId: string, email: string) {
  const result = await this.emailService.sendInvoiceEmail(
    invoiceId,
    email,
    tenantId,
    {
      invoiceNumber: 'INV-2024-001',
      totalAmount: 1500,
      dueDate: '2024-12-31',
    },
    'en'
  );

  if (result.success) {
    console.log('Email sent:', result.messageId);
  }
}
```

### Queue-Based Email Sending (Asynchronous)

```typescript
await this.emailService.queueEmail({
  to: 'customer@example.com',
  subject: 'Invoice #INV-2024-001',
  template: 'invoice',
  data: {
    invoiceId: 'inv-123',
    invoiceNumber: 'INV-2024-001',
    amount: 1500,
    dueDate: '2024-12-31',
    language: 'en',
    appName: 'Accounting System',
  },
  language: 'en',
});
```

## Testing

### Test Email Endpoints

The following endpoints are available for testing email functionality:

- `POST /email/test-verification?email=test@example.com&language=en`
- `POST /email/test-password-reset?email=test@example.com&language=en`
- `POST /email/test-welcome?email=test@example.com&name=John&language=en`
- `POST /email/test-invoice` (with request body)
- `POST /email/test-payment-receipt` (with request body)
- `POST /email/test-payment-reminder` (with request body)
- `GET /email/status` - Check email service status
- `GET /email/queue-stats` - Get queue statistics

## Queue Monitoring

### Get Queue Statistics

```typescript
const stats = await this.emailService.getQueueStats();
// Returns: { waiting, active, completed, failed }
```

### Check Email Service Status

```typescript
const isConnected = await this.emailService.verifyConnection();
```

## Error Handling

Email sending failures are handled gracefully:

1. **Queue Processing**: Failed emails are automatically retried (3 attempts with exponential backoff)
2. **Error Logging**: All email failures are logged with detailed error messages
3. **Graceful Degradation**: Email failures don't block critical operations (e.g., user signup)

## Best Practices

1. **Always Use Queue for Bulk Emails**: Use `queueEmail()` for sending multiple emails
2. **Provide Language**: Always specify language parameter ('en' or 'ar')
3. **Handle Attachments Properly**: Use Buffer for PDF attachments
4. **Test Templates**: Test email templates before production deployment
5. **Monitor Queue**: Regularly check queue statistics for issues

## Development

### Adding New Email Templates

1. Create HTML template: `templates/{name}-en.hbs` and `templates/{name}-ar.hbs`
2. Create text template: `templates/{name}-en-text.hbs` and `templates/{name}-ar-text.hbs`
3. Add method in `EmailService`:
```typescript
async sendCustomEmail(email: string, data: any, language: 'ar' | 'en' = 'en') {
  return this.sendEmail({
    to: email,
    subject: 'Custom Email',
    template: 'custom',
    data,
    language,
  });
}
```

### Template Variables

All templates have access to:
- `{{appName}}` - Application name
- `{{currentYear}}` - Current year (auto-injected)
- Any custom data passed via `data` parameter

## Troubleshooting

### Emails Not Sending

1. Check email provider configuration
2. Verify API credentials (SendGrid/Mailgun)
3. Check SMTP settings (if using SMTP)
4. Verify email queue status: `GET /email/queue-stats`

### Template Not Found

1. Ensure template file exists in `src/email/templates/`
2. Check file naming: `{templateName}-{language}.hbs`
3. Restart application after adding new templates

### Queue Not Processing

1. Verify Redis is running
2. Check Redis configuration
3. Ensure Bull queue processor is running

## Security Considerations

1. **API Keys**: Never commit API keys to version control
2. **Rate Limiting**: Implement rate limiting for email endpoints
3. **User Privacy**: Validate email addresses before sending
4. **Unsubscribe**: Include unsubscribe links for marketing emails

## Production Deployment

1. Use production email service (SendGrid/Mailgun recommended)
2. Configure proper SPF/DKIM records
3. Set up email monitoring and alerts
4. Implement retry logic for failed emails
5. Use queue for all email operations
6. Monitor queue size and processing time

## Support

For issues or questions:
1. Check application logs
2. Review queue statistics
3. Verify email provider status
4. Test with test endpoints
