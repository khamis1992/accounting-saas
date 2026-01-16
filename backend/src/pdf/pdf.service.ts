import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import PDFDocument from 'pdfkit';
import { Readable } from 'stream';

interface PdfOptions {
  language?: 'ar' | 'en' | 'both';
  fontSize?: number;
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
}

interface InvoiceData {
  id: string;
  invoice_number: string;
  invoice_type: string;
  invoice_date: string;
  due_date?: string;
  status: string;
  currency: string;
  subtotal: number;
  discount_amount: number;
  discount_percentage: number;
  taxable_amount: number;
  tax_amount: number;
  total_amount: number;
  paid_amount: number;
  balance_amount: number;
  notes?: string;
  party?: {
    name: string;
    name_ar?: string;
    email?: string;
    phone?: string;
  };
  tenant?: {
    name_en: string;
    name_ar: string;
    vat_number?: string;
    email?: string;
    phone?: string;
    address?: string;
    city?: string;
    country?: string;
  };
  invoice_lines?: Array<{
    description: string;
    description_ar?: string;
    quantity: number;
    unit_price: number;
    discount_amount: number;
    tax_percentage: number;
    tax_amount: number;
    line_total: number;
  }>;
  invoice_taxes?: Array<{
    tax_name: string;
    tax_name_ar?: string;
    tax_rate: number;
    tax_amount: number;
  }>;
}

interface PaymentData {
  id: string;
  payment_number: string;
  payment_type: string;
  payment_date: string;
  payment_method: string;
  amount: number;
  reference?: string;
  notes?: string;
  party?: {
    name: string;
    name_ar?: string;
    email?: string;
    phone?: string;
  };
  tenant?: {
    name_en: string;
    name_ar: string;
    vat_number?: string;
  };
  allocations?: Array<{
    invoice_number: string;
    amount: number;
  }>;
}

interface CustomerStatementData {
  customer: {
    name: string;
    name_ar?: string;
    email?: string;
    phone?: string;
  };
  tenant: {
    name_en: string;
    name_ar: string;
    vat_number?: string;
  };
  period: {
    from_date: string;
    to_date: string;
  };
  opening_balance: number;
  transactions: Array<{
    date: string;
    type: 'invoice' | 'payment' | 'credit_note' | 'debit_note';
    number: string;
    description: string;
    debit: number;
    credit: number;
    balance: number;
  }>;
  closing_balance: number;
  aging: {
    current: number;
    days_1_30: number;
    days_31_60: number;
    days_61_90: number;
    over_90: number;
  };
}

@Injectable()
export class PdfService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Generate Invoice PDF
   */
  async generateInvoicePdf(invoiceId: string, tenantId: string, options: PdfOptions = {}): Promise<Buffer> {
    const supabase = this.supabaseService.getClient();

    // Fetch invoice with related data
    const { data: invoice, error } = await supabase
      .from('invoices')
      .select(
        `
        *,
        invoice_lines(*),
        invoice_taxes(*),
        tenants!inner(id, name_en, name_ar, vat_number, email, phone, address, city, country)
        `
      )
      .eq('id', invoiceId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !invoice) {
      throw new NotFoundException('Invoice not found');
    }

    // Fetch party (customer or vendor)
    let party;
    if (invoice.party_type === 'customer') {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', invoice.party_id)
        .single();
      party = customer;
    } else {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', invoice.party_id)
        .single();
      party = vendor;
    }

    const invoiceData: InvoiceData = {
      ...invoice,
      party,
      tenant: invoice.tenants,
    };

    return this.generateInvoicePdfDocument(invoiceData, options);
  }

  /**
   * Generate Payment Receipt PDF
   */
  async generatePaymentReceiptPdf(paymentId: string, tenantId: string, options: PdfOptions = {}): Promise<Buffer> {
    const supabase = this.supabaseService.getClient();

    // Fetch payment with related data
    const { data: payment, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        tenants!inner(id, name_en, name_ar, vat_number)
        `
      )
      .eq('id', paymentId)
      .eq('tenant_id', tenantId)
      .single();

    if (error || !payment) {
      throw new NotFoundException('Payment not found');
    }

    // Fetch party
    let party;
    if (payment.party_type === 'customer') {
      const { data: customer } = await supabase
        .from('customers')
        .select('*')
        .eq('id', payment.party_id)
        .single();
      party = customer;
    } else {
      const { data: vendor } = await supabase
        .from('vendors')
        .select('*')
        .eq('id', payment.party_id)
        .single();
      party = vendor;
    }

    // Fetch allocations
    const { data: allocations } = await supabase
      .from('payment_allocations_view') // Assuming this view exists
      .select('invoice_number, amount')
      .eq('payment_id', paymentId);

    const paymentData: PaymentData = {
      ...payment,
      party,
      tenant: payment.tenants,
      allocations: allocations || [],
    };

    return this.generatePaymentReceiptPdfDocument(paymentData, options);
  }

  /**
   * Generate Customer Statement PDF
   */
  async generateCustomerStatementPdf(
    customerId: string,
    tenantId: string,
    options: { fromDate?: string; toDate?: string } & PdfOptions = {},
  ): Promise<Buffer> {
    const supabase = this.supabaseService.getClient();

    // Fetch customer
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .eq('tenant_id', tenantId)
      .single();

    if (customerError || !customer) {
      throw new NotFoundException('Customer not found');
    }

    // Fetch tenant
    const { data: tenant } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', tenantId)
      .single();

    // Fetch transactions (invoices and payments)
    const fromDate = options.fromDate || new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0];
    const toDate = options.toDate || new Date().toISOString().split('T')[0];

    // Get invoices
    const { data: invoices } = await supabase
      .from('invoices')
      .select('*')
      .eq('party_id', customerId)
      .eq('party_type', 'customer')
      .gte('invoice_date', fromDate)
      .lte('invoice_date', toDate)
      .order('invoice_date', { ascending: true });

    // Get payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('party_id', customerId)
      .eq('party_type', 'customer')
      .gte('payment_date', fromDate)
      .lte('payment_date', toDate)
      .order('payment_date', { ascending: true });

    // Calculate opening balance (before from date)
    const openingBalance = 0; // Calculate from historical data

    // Build transaction list
    const transactions: any[] = [];
    let runningBalance = openingBalance;

    // Add invoices
    invoices?.forEach((inv) => {
      runningBalance += inv.total_amount;
      transactions.push({
        date: inv.invoice_date,
        type: 'invoice',
        number: inv.invoice_number,
        description: inv.invoice_type === 'sales' ? 'Sales Invoice' : 'Sales Return',
        debit: inv.total_amount,
        credit: 0,
        balance: runningBalance,
      });
    });

    // Add payments
    payments?.forEach((pay) => {
      runningBalance -= pay.amount;
      transactions.push({
        date: pay.payment_date,
        type: 'payment',
        number: pay.payment_number,
        description: 'Payment Received',
        debit: 0,
        credit: pay.amount,
        balance: runningBalance,
      });
    });

    // Sort by date
    transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // Calculate aging
    const aging = {
      current: 0,
      days_1_30: 0,
      days_31_60: 0,
      days_61_90: 0,
      over_90: 0,
    };

    const statementData: CustomerStatementData = {
      customer,
      tenant,
      period: {
        from_date: fromDate,
        to_date: toDate,
      },
      opening_balance: openingBalance,
      transactions,
      closing_balance: runningBalance,
      aging,
    };

    return this.generateCustomerStatementPdfDocument(statementData, options);
  }

  /**
   * Generate the actual Invoice PDF document
   */
  private async generateInvoicePdfDocument(invoice: InvoiceData, options: PdfOptions = {}): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: options.marginTop || 50,
            bottom: options.marginBottom || 50,
            left: options.marginLeft || 50,
            right: options.marginRight || 50,
          },
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Company header
        this.drawCompanyHeader(doc, invoice);

        // Invoice title and number
        doc.moveDown(2);
        this.drawInvoiceTitle(doc, invoice);

        // Customer/Vendor info
        doc.moveDown(2);
        this.drawPartyInfo(doc, invoice);

        // Invoice details
        doc.moveDown(2);
        this.drawInvoiceDetails(doc, invoice);

        // Invoice lines table
        doc.moveDown(2);
        this.drawInvoiceLinesTable(doc, invoice);

        // Totals section
        this.drawInvoiceTotals(doc, invoice);

        // Tax summary
        if (invoice.invoice_taxes && invoice.invoice_taxes.length > 0) {
          doc.moveDown(1);
          this.drawTaxSummary(doc, invoice);
        }

        // Notes
        if (invoice.notes) {
          doc.moveDown(2);
          this.drawNotes(doc, invoice.notes, options);
        }

        // Footer
        this.drawFooter(doc, invoice);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw company header section
   */
  private drawCompanyHeader(doc: any, invoice: InvoiceData): void {
    const tenant = invoice.tenant;
    if (!tenant) return;

    // Company name (bilingual)
    doc.fontSize(20).font('Helvetica-Bold');
    if (tenant.name_en) {
      doc.text(tenant.name_en, 50, 50, { align: 'left' });
    }
    if (tenant.name_ar) {
      doc.font('Helvetica').fontSize(16);
      doc.text(tenant.name_ar, 50, 75, { align: 'left' });
    }

    // VAT number
    if (tenant.vat_number) {
      doc.fontSize(10).font('Helvetica');
      doc.text(`VAT No: ${tenant.vat_number}`, 50, 100, { align: 'left' });
      doc.text(`رقم الضريبة: ${tenant.vat_number}`, 50, 113, { align: 'left' });
    }

    // Contact info
    doc.fontSize(9);
    let yPos = 130;
    if (tenant.email) {
      doc.text(`Email: ${tenant.email}`, 50, yPos);
      yPos += 13;
    }
    if (tenant.phone) {
      doc.text(`Phone: ${tenant.phone}`, 50, yPos);
      yPos += 13;
    }
    if (tenant.address) {
      doc.text(`${tenant.address}${tenant.city ? ', ' + tenant.city : ''}${tenant.country ? ', ' + tenant.country : ''}`, 50, yPos);
    }
  }

  /**
   * Draw invoice title section
   */
  private drawInvoiceTitle(doc: any, invoice: InvoiceData): void {
    const title = invoice.invoice_type === 'sales' ? 'TAX INVOICE' : 'PURCHASE INVOICE';
    const titleAr = invoice.invoice_type === 'sales' ? 'فاتورة ضريبية' : 'فاتورة شراء';

    // English title
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text(title, 400, 50, { align: 'right', width: 300 });

    // Arabic title
    doc.fontSize(20).font('Helvetica');
    doc.text(titleAr, 400, 80, { align: 'right', width: 300 });

    // Invoice number and date
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Invoice No: ${invoice.invoice_number}`, 400, 120, { align: 'right', width: 300 });
    doc.text(`رقم الفاتورة: ${invoice.invoice_number}`, 400, 133, { align: 'right', width: 300 });

    doc.font('Helvetica');
    doc.text(`Date: ${this.formatDate(invoice.invoice_date)}`, 400, 150, { align: 'right', width: 300 });
    doc.text(`التاريخ: ${this.formatDate(invoice.invoice_date)}`, 400, 163, { align: 'right', width: 300 });

    if (invoice.due_date) {
      doc.text(`Due Date: ${this.formatDate(invoice.due_date)}`, 400, 178, { align: 'right', width: 300 });
      doc.text(`تاريخ الاستحقاق: ${this.formatDate(invoice.due_date)}`, 400, 191, { align: 'right', width: 300 });
    }
  }

  /**
   * Draw party (customer/vendor) information
   */
  private drawPartyInfo(doc: any, invoice: InvoiceData): void {
    const party = invoice.party;
    if (!party) return;

    const yPos = 220;

    doc.fontSize(12).font('Helvetica-Bold');
    const billTo = invoice.invoice_type === 'sales' ? 'Bill To:' : 'Vendor:';
    const billToAr = invoice.invoice_type === 'sales' ? 'فاتورة إلى:' : 'المورد:';

    doc.text(billTo, 50, yPos);
    doc.text(billToAr, 50, yPos + 15);

    doc.fontSize(11).font('Helvetica');
    let nameY = yPos + 35;
    doc.text(party.name || '', 50, nameY);

    if (party.name_ar) {
      doc.text(party.name_ar, 50, nameY + 15);
      nameY += 15;
    }

    if (party.email) {
      doc.fontSize(9);
      doc.text(party.email, 50, nameY + 18);
    }

    if (party.phone) {
      doc.text(party.phone, 50, nameY + 31);
    }
  }

  /**
   * Draw invoice details table
   */
  private drawInvoiceDetails(doc: any, invoice: InvoiceData): void {
    const yPos = 320;

    // Invoice details box
    doc.rect(50, yPos, 500, 40).stroke();

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Currency:', 60, yPos + 12);
    doc.text('العملة:', 60, yPos + 25);

    doc.text('Status:', 200, yPos + 12);
    doc.text('الحالة:', 200, yPos + 25);

    doc.font('Helvetica');
    doc.text(invoice.currency || 'QAR', 130, yPos + 12);
    doc.text(invoice.status.toUpperCase(), 250, yPos + 12);
  }

  /**
   * Draw invoice lines table
   */
  private drawInvoiceLinesTable(doc: any, invoice: InvoiceData): number {
    const tableTop = 380;
    const leftMargin = 50;
    const colWidths = {
      description: 200,
      quantity: 60,
      unitPrice: 80,
      discount: 60,
      tax: 60,
      total: 80,
    };

    // Table header
    doc.fontSize(9).font('Helvetica-Bold');
    doc.rect(leftMargin, tableTop, 500, 25).fillAndStroke('#f0f0f0', '#000000');

    let xPos = leftMargin + 5;
    doc.text('Description', xPos, tableTop + 8);
    doc.text('الوصف', xPos, tableTop + 16);

    xPos += colWidths.description;
    doc.text('Qty', xPos, tableTop + 8);
    doc.text('الكمية', xPos, tableTop + 16);

    xPos += colWidths.quantity;
    doc.text('Unit Price', xPos, tableTop + 8);
    doc.text('سعر الوحدة', xPos, tableTop + 16);

    xPos += colWidths.unitPrice;
    doc.text('Discount', xPos, tableTop + 8);
    doc.text('خصم', xPos, tableTop + 16);

    xPos += colWidths.discount;
    doc.text('Tax %', xPos, tableTop + 8);
    doc.text('ضريبة %', xPos, tableTop + 16);

    xPos += colWidths.tax;
    doc.text('Total', xPos, tableTop + 8);
    doc.text('المجموع', xPos, tableTop + 16);

    // Table rows
    doc.font('Helvetica');
    let yPos = tableTop + 25;

    if (invoice.invoice_lines && invoice.invoice_lines.length > 0) {
      invoice.invoice_lines.forEach((line, index) => {
        // Row border
        doc.rect(leftMargin, yPos, 500, 40).stroke();

        xPos = leftMargin + 5;
        const description = line.description_ar
          ? `${line.description}\n${line.description_ar}`
          : line.description;
        doc.fontSize(8).text(description, xPos, yPos + 5, { width: colWidths.description - 10 });

        xPos += colWidths.description;
        doc.fontSize(9);
        doc.text(line.quantity.toString(), xPos, yPos + 12);

        xPos += colWidths.quantity;
        doc.text(this.formatCurrency(line.unit_price, invoice.currency), xPos, yPos + 12);

        xPos += colWidths.unitPrice;
        doc.text(this.formatCurrency(line.discount_amount, invoice.currency), xPos, yPos + 12);

        xPos += colWidths.discount;
        doc.text(`${line.tax_percentage}%`, xPos, yPos + 12);

        xPos += colWidths.tax;
        doc.text(this.formatCurrency(line.line_total, invoice.currency), xPos, yPos + 12);

        yPos += 40;

        // Add new page if needed
        if (yPos > 700) {
          doc.addPage();
          yPos = 50;
        }
      });
    }

    return yPos;
  }

  /**
   * Draw invoice totals section
   */
  private drawInvoiceTotals(doc: any, invoice: InvoiceData): void {
    const totalsX = 350;
    let yPos = doc.y + 20;

    if (yPos > 600) {
      doc.addPage();
      yPos = 50;
    }

    const lineHeight = 25;
    const labelWidth = 150;
    const valueWidth = 100;

    // Subtotal
    doc.fontSize(9).font('Helvetica');
    doc.rect(totalsX, yPos, 250, lineHeight).stroke();
    doc.text('Subtotal:', totalsX + 5, yPos + 8);
    doc.text('المجموع الفرعي:', totalsX + 5, yPos + 16);
    doc.text(this.formatCurrency(invoice.subtotal, invoice.currency), totalsX + labelWidth, yPos + 8, {
      align: 'right',
      width: valueWidth,
    });

    yPos += lineHeight;

    // Discount
    if (invoice.discount_amount > 0) {
      doc.rect(totalsX, yPos, 250, lineHeight).stroke();
      doc.text(`Discount ${invoice.discount_percentage}%:`, totalsX + 5, yPos + 8);
      doc.text(`خصم ${invoice.discount_percentage}%:`, totalsX + 5, yPos + 16);
      doc.text(
        `(${this.formatCurrency(invoice.discount_amount, invoice.currency)})`,
        totalsX + labelWidth,
        yPos + 8,
        { align: 'right', width: valueWidth },
      );
      yPos += lineHeight;
    }

    // Taxable Amount
    doc.rect(totalsX, yPos, 250, lineHeight).stroke();
    doc.text('Taxable Amount:', totalsX + 5, yPos + 8);
    doc.text('المبلغ الخاضع للضريبة:', totalsX + 5, yPos + 16);
    doc.text(this.formatCurrency(invoice.taxable_amount, invoice.currency), totalsX + labelWidth, yPos + 8, {
      align: 'right',
      width: valueWidth,
    });

    yPos += lineHeight;

    // Tax
    if (invoice.tax_amount > 0) {
      doc.rect(totalsX, yPos, 250, lineHeight).stroke();
      doc.text('VAT:', totalsX + 5, yPos + 8);
      doc.text('ضريبة القيمة المضافة:', totalsX + 5, yPos + 16);
      doc.text(this.formatCurrency(invoice.tax_amount, invoice.currency), totalsX + labelWidth, yPos + 8, {
        align: 'right',
        width: valueWidth,
      });
      yPos += lineHeight;
    }

    // Total
    doc.font('Helvetica-Bold');
    doc.rect(totalsX, yPos, 250, lineHeight + 5).fillAndStroke('#e8e8e8', '#000000');
    doc.fontSize(11).text('Total:', totalsX + 5, yPos + 10);
    doc.fontSize(9).text('الإجمالي:', totalsX + 5, yPos + 20);
    doc.fontSize(11).text(
      this.formatCurrency(invoice.total_amount, invoice.currency),
      totalsX + labelWidth,
      yPos + 10,
      { align: 'right', width: valueWidth },
    );

    yPos += lineHeight + 15;

    // Paid and Balance
    if (invoice.paid_amount > 0 || invoice.balance_amount > 0) {
      doc.font('Helvetica').fontSize(9);
      doc.rect(totalsX, yPos, 250, lineHeight).stroke();
      doc.text('Paid:', totalsX + 5, yPos + 8);
      doc.text('مدفوع:', totalsX + 5, yPos + 16);
      doc.text(this.formatCurrency(invoice.paid_amount, invoice.currency), totalsX + labelWidth, yPos + 8, {
        align: 'right',
        width: valueWidth,
      });

      yPos += lineHeight;

      doc.font('Helvetica-Bold');
      doc.rect(totalsX, yPos, 250, lineHeight + 5).fillAndStroke('#e8e8e8', '#000000');
      doc.text('Balance Due:', totalsX + 5, yPos + 10);
      doc.text('الرصيد المستحق:', totalsX + 5, yPos + 20);
      doc.text(this.formatCurrency(invoice.balance_amount, invoice.currency), totalsX + labelWidth, yPos + 10, {
        align: 'right',
        width: valueWidth,
      });
    }
  }

  /**
   * Draw tax summary section
   */
  private drawTaxSummary(doc: any, invoice: InvoiceData): void {
    if (!invoice.invoice_taxes || invoice.invoice_taxes.length === 0) return;

    const taxY = doc.y + 20;
    doc.rect(50, taxY, 250, 25 + invoice.invoice_taxes.length * 20).stroke();

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Tax Summary', 60, taxY + 8);
    doc.text('ملخص الضريبة', 60, taxY + 16);

    let yPos = taxY + 30;
    doc.font('Helvetica');

    invoice.invoice_taxes.forEach((tax) => {
      const taxName = tax.tax_name_ar ? `${tax.tax_name} / ${tax.tax_name_ar}` : tax.tax_name;
      doc.text(`${taxName} (${tax.tax_rate}%):`, 60, yPos);
      doc.text(this.formatCurrency(tax.tax_amount, invoice.currency), 200, yPos, { align: 'right' });
      yPos += 20;
    });
  }

  /**
   * Draw notes section
   */
  private drawNotes(doc: any, notes: string, options: PdfOptions): void {
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Notes:', 50, doc.y);
    doc.text('ملاحظات:', 50, doc.y + 10);

    doc.font('Helvetica').fontSize(8);
    doc.text(notes, 50, doc.y + 15, { width: 500, align: 'justify' });
  }

  /**
   * Draw footer section
   */
  private drawFooter(doc: any, invoice: InvoiceData): void {
    const footerY = doc.page.height - 80;

    doc.moveTo(50, footerY).lineTo(550, footerY).stroke();

    doc.fontSize(8).font('Helvetica');
    doc.text('Terms & Conditions:', 50, footerY + 15);
    doc.text('1. Payment is due within the specified credit period.', 50, footerY + 25);
    doc.text('2. Late payments may incur interest charges.', 50, footerY + 35);

    // Page number
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30);
    }
  }

  /**
   * Generate the actual Payment Receipt PDF document
   */
  private async generatePaymentReceiptPdfDocument(payment: PaymentData, options: PdfOptions = {}): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: options.marginTop || 50,
            bottom: options.marginBottom || 50,
            left: options.marginLeft || 50,
            right: options.marginRight || 50,
          },
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Company header
        this.drawReceiptHeader(doc, payment);

        // Receipt title
        doc.moveDown(2);
        this.drawReceiptTitle(doc, payment);

        // Party info
        doc.moveDown(2);
        this.drawReceiptPartyInfo(doc, payment);

        // Payment details
        doc.moveDown(2);
        this.drawPaymentDetails(doc, payment);

        // Allocations
        if (payment.allocations && payment.allocations.length > 0) {
          doc.moveDown(2);
          this.drawPaymentAllocations(doc, payment);
        }

        // Signature area
        doc.moveDown(3);
        this.drawSignatureArea(doc, payment);

        // Footer
        this.drawReceiptFooter(doc, payment);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw receipt header
   */
  private drawReceiptHeader(doc: any, payment: PaymentData): void {
    const tenant = payment.tenant;
    if (!tenant) return;

    doc.fontSize(20).font('Helvetica-Bold');
    doc.text(tenant.name_en, 50, 50, { align: 'left' });

    doc.fontSize(16).font('Helvetica');
    doc.text(tenant.name_ar, 50, 75, { align: 'left' });

    if (tenant.vat_number) {
      doc.fontSize(10);
      doc.text(`VAT No: ${tenant.vat_number}`, 50, 100);
    }
  }

  /**
   * Draw receipt title
   */
  private drawReceiptTitle(doc: any, payment: PaymentData): void {
    doc.fontSize(24).font('Helvetica-Bold');
    doc.text('PAYMENT RECEIPT', 50, 150);

    doc.fontSize(20).font('Helvetica');
    doc.text('إيصال دفع', 50, 180);

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Receipt No: ${payment.payment_number}`, 400, 150, { align: 'right', width: 200 });
    doc.text(`Date: ${this.formatDate(payment.payment_date)}`, 400, 165, { align: 'right', width: 200 });
  }

  /**
   * Draw receipt party info
   */
  private drawReceiptPartyInfo(doc: any, payment: PaymentData): void {
    const party = payment.party;
    if (!party) return;

    const yPos = 220;

    doc.fontSize(12).font('Helvetica-Bold');
    const receivedFrom = payment.payment_type === 'receipt' ? 'Received From:' : 'Paid To:';
    doc.text(receivedFrom, 50, yPos);

    doc.fontSize(11).font('Helvetica');
    doc.text(party.name || '', 50, yPos + 20);

    if (party.name_ar) {
      doc.text(party.name_ar, 50, yPos + 35);
    }

    if (party.email) {
      doc.fontSize(9);
      doc.text(party.email, 50, yPos + 50);
    }

    if (party.phone) {
      doc.text(party.phone, 50, yPos + 63);
    }
  }

  /**
   * Draw payment details
   */
  private drawPaymentDetails(doc: any, payment: PaymentData): void {
    const yPos = 320;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Payment Details / تفاصيل الدفع', 50, yPos);

    doc.moveDown(1);

    // Details box
    doc.rect(50, doc.y, 500, 100).stroke();

    let currentY = doc.y + 10;
    doc.fontSize(10).font('Helvetica');

    doc.text('Amount Received:', 60, currentY);
    doc.text('المبلغ المستلم:', 60, currentY + 13);
    doc.text(this.formatCurrency(payment.amount, 'QAR'), 200, currentY);

    currentY += 30;
    doc.text('Payment Method:', 60, currentY);
    doc.text('طريقة الدفع:', 60, currentY + 13);
    doc.text(payment.payment_method, 200, currentY);

    if (payment.reference) {
      currentY += 30;
      doc.text('Reference:', 60, currentY);
      doc.text('المرجع:', 60, currentY + 13);
      doc.text(payment.reference, 200, currentY);
    }

    if (payment.notes) {
      currentY += 30;
      doc.text('Notes:', 60, currentY);
      doc.text('ملاحظات:', 60, currentY + 13);
      doc.fontSize(9);
      doc.text(payment.notes, 200, currentY, { width: 300 });
    }
  }

  /**
   * Draw payment allocations
   */
  private drawPaymentAllocations(doc: any, payment: PaymentData): void {
    if (!payment.allocations || payment.allocations.length === 0) return;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Allocation Details / تفاصيل التخصيص', 50, doc.y);

    doc.moveDown(1);

    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 25).fillAndStroke('#f0f0f0', '#000000');

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Invoice No', 60, tableTop + 8);
    doc.text('رقم الفاتورة', 60, tableTop + 16);
    doc.text('Amount', 400, tableTop + 8);
    doc.text('المبلغ', 400, tableTop + 16);

    let yPos = tableTop + 25;
    doc.font('Helvetica');

    payment.allocations.forEach((allocation) => {
      doc.rect(50, yPos, 500, 25).stroke();
      doc.text(allocation.invoice_number, 60, yPos + 8);
      doc.text(this.formatCurrency(allocation.amount, 'QAR'), 400, yPos + 8);
      yPos += 25;
    });
  }

  /**
   * Draw signature area
   */
  private drawSignatureArea(doc: any, payment: PaymentData): void {
    const sigY = doc.y;

    doc.fontSize(9).font('Helvetica');
    doc.text('Authorized Signature:', 50, sigY);
    doc.text('التوقيع المعتمد:', 50, sigY + 12);

    doc.moveTo(50, sigY + 50).lineTo(200, sigY + 50).stroke();

    doc.text('Date:', 350, sigY);
    doc.text('التاريخ:', 350, sigY + 12);

    doc.moveTo(350, sigY + 50).lineTo(500, sigY + 50).stroke();
  }

  /**
   * Draw receipt footer
   */
  private drawReceiptFooter(doc: any, payment: PaymentData): void {
    const footerY = doc.page.height - 80;

    doc.moveTo(50, footerY).lineTo(550, footerY).stroke();

    doc.fontSize(8).font('Helvetica');
    doc.text('This is a computer-generated receipt and does not require a physical signature.', 50, footerY + 15);
    doc.text('هذا إيصال مُنشأ بواسطة الحاسوب ولا يتطلب توقيعاً مادياً.', 50, footerY + 25);

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30);
    }
  }

  /**
   * Generate the actual Customer Statement PDF document
   */
  private async generateCustomerStatementPdfDocument(
    statement: CustomerStatementData,
    options: PdfOptions = {},
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({
          size: 'A4',
          margins: {
            top: options.marginTop || 50,
            bottom: options.marginBottom || 50,
            left: options.marginLeft || 50,
            right: options.marginRight || 50,
          },
          bufferPages: true,
        });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // Company header
        this.drawStatementHeader(doc, statement);

        // Statement title and period
        doc.moveDown(2);
        this.drawStatementTitle(doc, statement);

        // Customer info
        doc.moveDown(2);
        this.drawStatementCustomerInfo(doc, statement);

        // Opening balance
        doc.moveDown(2);
        this.drawStatementOpeningBalance(doc, statement);

        // Transactions table
        doc.moveDown(2);
        const finalY = this.drawStatementTransactions(doc, statement);

        // Closing balance
        if (finalY < 600) {
          doc.moveDown(2);
          this.drawStatementClosingBalance(doc, statement);
        } else {
          doc.addPage();
          this.drawStatementClosingBalance(doc, statement);
        }

        // Aging analysis
        doc.moveDown(2);
        this.drawStatementAging(doc, statement);

        // Footer
        this.drawStatementFooter(doc, statement);

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Draw statement header
   */
  private drawStatementHeader(doc: any, statement: CustomerStatementData): void {
    const tenant = statement.tenant;
    if (!tenant) return;

    doc.fontSize(20).font('Helvetica-Bold');
    doc.text(tenant.name_en, 50, 50);

    doc.fontSize(16).font('Helvetica');
    doc.text(tenant.name_ar, 50, 75);

    if (tenant.vat_number) {
      doc.fontSize(10);
      doc.text(`VAT No: ${tenant.vat_number}`, 50, 100);
    }
  }

  /**
   * Draw statement title
   */
  private drawStatementTitle(doc: any, statement: CustomerStatementData): void {
    doc.fontSize(22).font('Helvetica-Bold');
    doc.text('STATEMENT OF ACCOUNT', 50, 150);

    doc.fontSize(18).font('Helvetica');
    doc.text('كشف حساب', 50, 180);

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text(`Period: ${this.formatDate(statement.period.from_date)} to ${this.formatDate(statement.period.to_date)}`, 50, 210);
  }

  /**
   * Draw statement customer info
   */
  private drawStatementCustomerInfo(doc: any, statement: CustomerStatementData): void {
    const customer = statement.customer;
    if (!customer) return;

    const yPos = 250;

    doc.fontSize(12).font('Helvetica-Bold');
    doc.text('Customer:', 50, yPos);
    doc.text('العميل:', 50, yPos + 15);

    doc.fontSize(11).font('Helvetica');
    doc.text(customer.name || '', 50, yPos + 35);

    if (customer.name_ar) {
      doc.text(customer.name_ar, 50, yPos + 50);
    }

    if (customer.email) {
      doc.fontSize(9);
      doc.text(customer.email, 50, yPos + 65);
    }

    if (customer.phone) {
      doc.text(customer.phone, 50, yPos + 78);
    }
  }

  /**
   * Draw opening balance
   */
  private drawStatementOpeningBalance(doc: any, statement: CustomerStatementData): void {
    doc.rect(50, doc.y, 500, 30).fillAndStroke('#f0f0f0', '#000000');

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Opening Balance:', 60, doc.y + 8);
    doc.text('الرصيد الافتتاحي:', 60, doc.y + 18);

    doc.text(this.formatCurrency(statement.opening_balance, 'QAR'), 400, doc.y + 8, { align: 'right', width: 100 });
  }

  /**
   * Draw statement transactions
   */
  private drawStatementTransactions(doc: any, statement: CustomerStatementData): number {
    const tableTop = doc.y + 40;
    doc.rect(50, tableTop, 500, 25).fillAndStroke('#f0f0f0', '#000000');

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Date', 60, tableTop + 8);
    doc.text('التاريخ', 60, tableTop + 16);

    doc.text('Type', 120, tableTop + 8);
    doc.text('النوع', 120, tableTop + 16);

    doc.text('Number', 200, tableTop + 8);
    doc.text('الرقم', 200, tableTop + 16);

    doc.text('Debit', 300, tableTop + 8);
    doc.text('مدين', 300, tableTop + 16);

    doc.text('Credit', 380, tableTop + 8);
    doc.text('دائن', 380, tableTop + 16);

    doc.text('Balance', 460, tableTop + 8);
    doc.text('الرصيد', 460, tableTop + 16);

    let yPos = tableTop + 25;
    doc.font('Helvetica');

    statement.transactions.forEach((transaction) => {
      doc.rect(50, yPos, 500, 25).stroke();

      doc.fontSize(8);
      doc.text(this.formatDate(transaction.date), 60, yPos + 8);
      doc.text(transaction.type, 120, yPos + 8);
      doc.text(transaction.number, 200, yPos + 8);

      if (transaction.debit > 0) {
        doc.text(this.formatCurrency(transaction.debit, 'QAR'), 300, yPos + 8);
      }
      if (transaction.credit > 0) {
        doc.text(this.formatCurrency(transaction.credit, 'QAR'), 380, yPos + 8);
      }

      doc.text(this.formatCurrency(transaction.balance, 'QAR'), 460, yPos + 8);

      yPos += 25;

      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }
    });

    return yPos;
  }

  /**
   * Draw closing balance
   */
  private drawStatementClosingBalance(doc: any, statement: CustomerStatementData): void {
    doc.rect(50, doc.y, 500, 30).fillAndStroke('#e8e8e8', '#000000');

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('Closing Balance:', 60, doc.y + 8);
    doc.text('الرصيد النهائي:', 60, doc.y + 18);

    doc.fontSize(12);
    doc.text(this.formatCurrency(statement.closing_balance, 'QAR'), 400, doc.y + 8, { align: 'right', width: 100 });
  }

  /**
   * Draw aging analysis
   */
  private drawStatementAging(doc: any, statement: CustomerStatementData): void {
    const agingY = doc.y + 20;

    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('Aging Analysis / تحليل التقادم', 50, agingY);

    doc.moveDown(1);

    const tableTop = doc.y;
    doc.rect(50, tableTop, 500, 25).fillAndStroke('#f0f0f0', '#000000');

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Current', 60, tableTop + 8);
    doc.text('حالي', 60, tableTop + 16);

    doc.text('1-30 Days', 160, tableTop + 8);
    doc.text('1-30 يوم', 160, tableTop + 16);

    doc.text('31-60 Days', 260, tableTop + 8);
    doc.text('31-60 يوم', 260, tableTop + 16);

    doc.text('61-90 Days', 360, tableTop + 8);
    doc.text('61-90 يوم', 360, tableTop + 16);

    doc.text('Over 90 Days', 460, tableTop + 8);
    doc.text('أكثر من 90 يوم', 460, tableTop + 16);

    const yPos = tableTop + 25;
    doc.rect(50, yPos, 500, 25).stroke();

    doc.font('Helvetica').fontSize(10);
    doc.text(this.formatCurrency(statement.aging.current, 'QAR'), 60, yPos + 8);
    doc.text(this.formatCurrency(statement.aging.days_1_30, 'QAR'), 160, yPos + 8);
    doc.text(this.formatCurrency(statement.aging.days_31_60, 'QAR'), 260, yPos + 8);
    doc.text(this.formatCurrency(statement.aging.days_61_90, 'QAR'), 360, yPos + 8);
    doc.text(this.formatCurrency(statement.aging.over_90, 'QAR'), 460, yPos + 8);
  }

  /**
   * Draw statement footer
   */
  private drawStatementFooter(doc: any, statement: CustomerStatementData): void {
    const footerY = doc.page.height - 80;

    doc.moveTo(50, footerY).lineTo(550, footerY).stroke();

    doc.fontSize(8).font('Helvetica');
    doc.text('For any inquiries, please contact our accounts department.', 50, footerY + 15);
    doc.text('للاستفسارات، يرجى الاتصال بقسم الحسابات.', 50, footerY + 25);

    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc.fontSize(8).text(`Page ${i + 1} of ${range.count}`, 50, doc.page.height - 30);
    }
  }

  /**
   * Helper: Format currency
   */
  private formatCurrency(amount: number, currency: string = 'QAR'): string {
    return `${currency} ${amount.toFixed(2)}`;
  }

  /**
   * Helper: Format date
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB'); // DD/MM/YYYY format
  }
}
