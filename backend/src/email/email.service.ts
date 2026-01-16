import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { ConfigService } from '../config/config.service';
import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template: string;
  data: Record<string, any>;
  language?: 'ar' | 'en';
  attachments?: Array<{
    filename: string;
    path?: string;
    content?: Buffer;
  }>;
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: nodemailer.Transporter;
  private templates: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor(
    @InjectQueue('email') private emailQueue: Queue,
    private configService: ConfigService,
  ) {
    this.initializeTransporter();
    this.loadTemplates();
  }

  private initializeTransporter() {
    const provider = this.configService.emailProvider;

    switch (provider) {
      case 'smtp':
        this.transporter = nodemailer.createTransport({
          host: this.configService.smtpHost,
          port: this.configService.smtpPort,
          secure: this.configService.smtpSecure,
          auth: {
            user: this.configService.smtpUser,
            pass: this.configService.smtpPass,
          },
        });
        break;

      case 'sendgrid':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.sendgrid.net',
          port: 587,
          secure: false,
          auth: {
            user: 'apikey',
            pass: this.configService.sendgridApiKey,
          },
        });
        break;

      case 'mailgun':
        this.transporter = nodemailer.createTransport({
          host: 'smtp.mailgun.org',
          port: 587,
          secure: false,
          auth: {
            user: this.configService.mailgunUsername,
            pass: this.configService.mailgunPassword,
          },
        });
        break;

      case 'supabase':
        // Use Supabase built-in email (will be handled differently)
        this.logger.warn('Supabase email provider is configured but using nodemailer for templates');
        this.transporter = nodemailer.createTransport({
          // Fallback to SMTP if configured
          host: this.configService.smtpHost || 'localhost',
          port: this.configService.smtpPort || 25,
        });
        break;

      default:
        // Development mode - use ethereal.email for testing
        this.logger.warn(`No email provider configured, using test account`);
        this.transporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          auth: {
            user: 'test@ethereal.email',
            pass: 'test',
          },
        });
    }
  }

  private loadTemplates() {
    const templatesDir = path.join(__dirname, 'templates');

    try {
      if (!fs.existsSync(templatesDir)) {
        this.logger.warn(`Templates directory not found: ${templatesDir}`);
        return;
      }

      const templateFiles = fs.readdirSync(templatesDir);
      templateFiles.forEach((file) => {
        if (file.endsWith('.hbs')) {
          const templateName = file.replace('.hbs', '');
          const templateContent = fs.readFileSync(
            path.join(templatesDir, file),
            'utf-8',
          );
          this.templates.set(templateName, handlebars.compile(templateContent));
          this.logger.debug(`Loaded template: ${templateName}`);
        }
      });

      this.logger.log(`Loaded ${this.templates.size} email templates`);
    } catch (error) {
      this.logger.error(`Failed to load templates: ${error.message}`);
    }
  }

  private async renderTemplate(
    templateName: string,
    data: Record<string, any>,
  ): Promise<{ html: string; text: string }> {
    const language = data.language || 'en';
    const htmlTemplateName = `${templateName}-${language}.hbs`;
    const textTemplateName = `${templateName}-${language}-text.hbs`;

    const htmlTemplate = this.templates.get(htmlTemplateName);
    const textTemplate = this.templates.get(textTemplateName);

    if (!htmlTemplate) {
      throw new Error(`Template not found: ${htmlTemplateName}`);
    }

    // Add current year to template data
    const templateData = {
      ...data,
      currentYear: new Date().getFullYear(),
    };

    const html = htmlTemplate(templateData);
    const text = textTemplate ? textTemplate(templateData) : this.stripHtml(html);

    return { html, text };
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }

  async sendEmail(options: EmailOptions): Promise<EmailResult> {
    try {
      const { html, text } = await this.renderTemplate(
        options.template,
        options.data,
      );

      const mailOptions = {
        from: `${this.configService.emailFromName} <${this.configService.emailFromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        replyTo: this.configService.emailReplyTo,
        subject: options.subject,
        html,
        text,
        attachments: options.attachments,
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`Email sent successfully: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Queue-based email sending
  async queueEmail(options: EmailOptions): Promise<void> {
    await this.emailQueue.add('send-email', options, {
      priority: options.template === 'verification' ? 1 : 5,
    });
    this.logger.log(`Email queued for ${options.to}`);
  }

  // Direct email sending (synchronous)
  async sendVerificationEmail(
    email: string,
    token: string,
    tenantId: string,
    language: 'ar' | 'en' = 'en',
  ): Promise<EmailResult> {
    const verificationUrl = `${this.configService.frontendUrl}/${language}/auth/verify-email?token=${token}`;

    return this.sendEmail({
      to: email,
      subject:
        language === 'ar'
          ? 'تأكيد بريدك الإلكتروني'
          : 'Verify Your Email Address',
      template: 'verification',
      data: {
        verificationUrl,
        tenantId,
        language,
        appName: this.configService.appName,
      },
      language,
    });
  }

  async sendPasswordResetEmail(
    email: string,
    resetToken: string,
    tenantId: string,
    language: 'ar' | 'en' = 'en',
  ): Promise<EmailResult> {
    const resetUrl = `${this.configService.frontendUrl}/${language}/auth/reset-password?token=${resetToken}`;

    return this.sendEmail({
      to: email,
      subject:
        language === 'ar'
          ? 'إعادة تعيين كلمة المرور'
          : 'Reset Your Password',
      template: 'password-reset',
      data: {
        resetUrl,
        tenantId,
        language,
        appName: this.configService.appName,
      },
      language,
    });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
    tenantId: string,
    language: 'ar' | 'en' = 'en',
  ): Promise<EmailResult> {
    const loginUrl = `${this.configService.frontendUrl}/${language}/auth/login`;

    return this.sendEmail({
      to: email,
      subject:
        language === 'ar'
          ? 'مرحباً بك في نظام المحاسبة'
          : 'Welcome to the Accounting System',
      template: 'welcome',
      data: {
        name,
        loginUrl,
        tenantId,
        language,
        appName: this.configService.appName,
      },
      language,
    });
  }

  async sendInvoiceEmail(
    invoiceId: string,
    recipientEmail: string,
    tenantId: string,
    invoiceData: any,
    language: 'ar' | 'en' = 'en',
    attachment?: Buffer,
  ): Promise<EmailResult> {
    const invoiceUrl = `${this.configService.frontendUrl}/${language}/accounting/invoices/${invoiceId}`;

    return this.sendEmail({
      to: recipientEmail,
      subject:
        language === 'ar'
          ? `فاتورة جديدة #${invoiceData.invoiceNumber}`
          : `New Invoice #${invoiceData.invoiceNumber}`,
      template: 'invoice',
      data: {
        invoiceId,
        invoiceNumber: invoiceData.invoiceNumber,
        invoiceUrl,
        amount: invoiceData.totalAmount,
        dueDate: invoiceData.dueDate,
        tenantId,
        language,
        appName: this.configService.appName,
        ...invoiceData,
      },
      language,
      attachments: attachment
        ? [
            {
              filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
              content: attachment,
            },
          ]
        : undefined,
    });
  }

  async sendPaymentReceiptEmail(
    paymentId: string,
    recipientEmail: string,
    tenantId: string,
    paymentData: any,
    language: 'ar' | 'en' = 'en',
    attachment?: Buffer,
  ): Promise<EmailResult> {
    const receiptUrl = `${this.configService.frontendUrl}/${language}/accounting/payments/${paymentId}`;

    return this.sendEmail({
      to: recipientEmail,
      subject:
        language === 'ar'
          ? `إيصال دفع #${paymentData.receiptNumber}`
          : `Payment Receipt #${paymentData.receiptNumber}`,
      template: 'payment-receipt',
      data: {
        paymentId,
        receiptNumber: paymentData.receiptNumber,
        receiptUrl,
        amount: paymentData.amount,
        paymentDate: paymentData.paymentDate,
        invoiceNumber: paymentData.invoiceNumber,
        tenantId,
        language,
        appName: this.configService.appName,
        ...paymentData,
      },
      language,
      attachments: attachment
        ? [
            {
              filename: `receipt-${paymentData.receiptNumber}.pdf`,
              content: attachment,
            },
          ]
        : undefined,
    });
  }

  async sendPaymentReminderEmail(
    invoices: any[],
    recipientEmail: string,
    tenantId: string,
    language: 'ar' | 'en' = 'en',
  ): Promise<EmailResult> {
    const invoicesList = invoices.map((inv) => ({
      invoiceNumber: inv.invoice_number,
      amount: inv.total_amount,
      dueDate: inv.due_date,
      invoiceUrl: `${this.configService.frontendUrl}/${language}/accounting/invoices/${inv.id}`,
    }));

    return this.sendEmail({
      to: recipientEmail,
      subject:
        language === 'ar'
          ? 'تذكير بالفواتير المستحقة'
          : 'Payment Reminder - Overdue Invoices',
      template: 'payment-reminder',
      data: {
        invoices: invoicesList,
        totalAmount: invoices.reduce(
          (sum, inv) => sum + parseFloat(inv.total_amount),
          0,
        ),
        tenantId,
        language,
        appName: this.configService.appName,
      },
      language,
    });
  }

  async sendEmailChangeVerificationEmail(
    email: string,
    token: string,
    tenantId: string,
    language: 'ar' | 'en' = 'en',
  ): Promise<EmailResult> {
    const verificationUrl = `${this.configService.frontendUrl}/${language}/settings/email?token=${token}`;

    return this.sendEmail({
      to: email,
      subject:
        language === 'ar'
          ? 'تأكيد تغيير البريد الإلكتروني'
          : 'Confirm Email Change',
      template: 'email-change-verification',
      data: {
        verificationUrl,
        tenantId,
        language,
        appName: this.configService.appName,
      },
      language,
    });
  }

  // Test email service connection
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      this.logger.log('Email service connection verified');
      return true;
    } catch (error) {
      this.logger.error(`Email service connection failed: ${error.message}`);
      return false;
    }
  }

  // Get email queue stats
  async getQueueStats() {
    const waiting = await this.emailQueue.getWaiting();
    const active = await this.emailQueue.getActive();
    const completed = await this.emailQueue.getCompleted();
    const failed = await this.emailQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }
}
