import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

export interface ExportFilters {
  startDate?: string;
  endDate?: string;
  status?: string;
  invoiceType?: string;
  partyType?: string;
  journalType?: string;
  includeInactive?: boolean;
  [key: string]: any;
}

export interface ExportOptions {
  language?: 'en' | 'ar' | 'both';
  fields?: string[];
}

@Injectable()
export class ExportService {
  // Format date consistently
  private formatDate(date: Date | string): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  // Format currency with QAR symbol
  private formatCurrency(amount: number): string {
    if (amount === null || amount === undefined) return '';
    return `${amount.toFixed(2)} QAR`;
  }

  // Format boolean as Yes/No in both languages
  private formatBoolean(value: boolean): string {
    if (value === null || value === undefined) return '';
    return value ? 'Yes / نعم' : 'No / لا';
  }

  // Escape CSV value
  private escapeCsvValue(value: string): string {
    if (!value) return '""';
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  // Generate CSV with UTF-8 BOM
  generateCsv(headers: string[], data: any[][]): Buffer {
    const rows = [headers, ...data];
    const csvContent = rows
      .map((row) => row.map((cell) => this.escapeCsvValue(String(cell || ''))).join(','))
      .join('\n');

    // Add UTF-8 BOM for Excel compatibility
    const bom = '\uFEFF';
    return Buffer.from(bom + csvContent, 'utf8');
  }

  // Generate Excel workbook with formatting
  async generateExcel(
    sheetName: string,
    headers: string[],
    data: any[][],
  ): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    // Add header row
    worksheet.addRow(headers);

    // Style header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRow.height = 25;

    // Add data rows
    data.forEach((rowData) => {
      worksheet.addRow(rowData);
    });

    // Add autofilter
    worksheet.autoFilter = {
      from: 'A1',
      to: `${String.fromCharCode(65 + headers.length - 1)}${data.length + 1}`,
    };

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Auto-fit column widths
    worksheet.columns.forEach((column) => {
      let maxLength = 0;
      if (column.eachCell) {
        column.eachCell({ includeEmpty: false }, (cell) => {
          const length = cell.value ? String(cell.value).length : 10;
          if (length > maxLength) {
            maxLength = length;
          }
        });
      }
      column.width = maxLength < 15 ? 15 : maxLength + 2;
    });

    // Add borders to all cells
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
      // Alternate row colors
      if (rowNumber > 1 && rowNumber % 2 === 0) {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF9F9F9' },
        };
      }
    });

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(buffer);
  }

  // Customer Exports
  exportCustomersToCsv(customers: any[], options: ExportOptions = {}): Buffer {
    const headers = [
      'Code / الكود',
      'Name (EN) / الاسم (إنجليزي)',
      'Name (AR) / الاسم (عربي)',
      'Email / البريد الإلكتروني',
      'Phone / الهاتف',
      'Mobile / الجوال',
      'VAT Number / الرقم الضريبي',
      'Credit Limit / حد الائتمان',
      'Payment Terms / شروط الدفع',
      'Active / نشط',
      'Address / العنوان',
      'City / المدينة',
      'Country / الدولة',
    ];

    const data = customers.map((c) => [
      c.code || '',
      c.name_en || '',
      c.name_ar || '',
      c.email || '',
      c.phone || '',
      c.mobile || '',
      c.vat_number || '',
      this.formatCurrency(c.credit_limit || 0),
      `${c.payment_terms_days || 30} days`,
      this.formatBoolean(c.is_active),
      options.language === 'ar' ? c.address_ar || '' : c.address_en || '',
      options.language === 'ar' ? c.city_ar || '' : c.city_en || '',
      c.country || '',
    ]);

    return this.generateCsv(headers, data);
  }

  async exportCustomersToExcel(
    customers: any[],
    options: ExportOptions = {},
  ): Promise<Buffer> {
    const headers = [
      'Code / الكود',
      'Name (EN) / الاسم (إنجليزي)',
      'Name (AR) / الاسم (عربي)',
      'Email / البريد الإلكتروني',
      'Phone / الهاتف',
      'Mobile / الجوال',
      'VAT Number / الرقم الضريبي',
      'Credit Limit / حد الائتمان',
      'Payment Terms / شروط الدفع',
      'Active / نشط',
      'Address / العنوان',
      'City / المدينة',
      'Country / الدولة',
    ];

    const data = customers.map((c) => [
      c.code || '',
      c.name_en || '',
      c.name_ar || '',
      c.email || '',
      c.phone || '',
      c.mobile || '',
      c.vat_number || '',
      c.credit_limit || 0,
      `${c.payment_terms_days || 30} days`,
      c.is_active ? 'Yes / نعم' : 'No / لا',
      options.language === 'ar' ? c.address_ar || '' : c.address_en || '',
      options.language === 'ar' ? c.city_ar || '' : c.city_en || '',
      c.country || '',
    ]);

    return this.generateExcel('Customers / العملاء', headers, data);
  }

  // Vendor Exports
  exportVendorsToCsv(vendors: any[], options: ExportOptions = {}): Buffer {
    const headers = [
      'Code / الكود',
      'Name (EN) / الاسم (إنجليزي)',
      'Name (AR) / الاسم (عربي)',
      'Email / البريد الإلكتروني',
      'Phone / الهاتف',
      'Mobile / الجوال',
      'VAT Number / الرقم الضريبي',
      'Credit Limit / حد الائتمان',
      'Payment Terms / شروط الدفع',
      'Active / نشط',
      'Address / العنوان',
      'City / المدينة',
      'Country / الدولة',
    ];

    const data = vendors.map((v) => [
      v.code || '',
      v.name_en || '',
      v.name_ar || '',
      v.email || '',
      v.phone || '',
      v.mobile || '',
      v.vat_number || '',
      this.formatCurrency(v.credit_limit || 0),
      `${v.payment_terms_days || 30} days`,
      this.formatBoolean(v.is_active),
      options.language === 'ar' ? v.address_ar || '' : v.address_en || '',
      options.language === 'ar' ? v.city_ar || '' : v.city_en || '',
      v.country || '',
    ]);

    return this.generateCsv(headers, data);
  }

  async exportVendorsToExcel(
    vendors: any[],
    options: ExportOptions = {},
  ): Promise<Buffer> {
    const headers = [
      'Code / الكود',
      'Name (EN) / الاسم (إنجليزي)',
      'Name (AR) / الاسم (عربي)',
      'Email / البريد الإلكتروني',
      'Phone / الهاتف',
      'Mobile / الجوال',
      'VAT Number / الرقم الضريبي',
      'Credit Limit / حد الائتمان',
      'Payment Terms / شروط الدفع',
      'Active / نشط',
      'Address / العنوان',
      'City / المدينة',
      'Country / الدولة',
    ];

    const data = vendors.map((v) => [
      v.code || '',
      v.name_en || '',
      v.name_ar || '',
      v.email || '',
      v.phone || '',
      v.mobile || '',
      v.vat_number || '',
      v.credit_limit || 0,
      `${v.payment_terms_days || 30} days`,
      v.is_active ? 'Yes / نعم' : 'No / لا',
      options.language === 'ar' ? v.address_ar || '' : v.address_en || '',
      options.language === 'ar' ? v.city_ar || '' : v.city_en || '',
      v.country || '',
    ]);

    return this.generateExcel('Vendors / الموردون', headers, data);
  }

  // Invoice Exports
  exportInvoicesToCsv(invoices: any[], options: ExportOptions = {}): Buffer {
    const headers = [
      'Invoice No. / رقم الفاتورة',
      'Type / النوع',
      'Date / التاريخ',
      'Party / الطرف',
      'Party Type / نوع الطرف',
      'Subtotal / المجموع الفرعي',
      'Discount / الخصم',
      'Tax Amount / مبلغ الضريبة',
      'Total / الإجمالي',
      'Paid / المدفوع',
      'Balance / الرصيد',
      'Status / الحالة',
      'Due Date / تاريخ الاستحقاق',
      'Notes / ملاحظات',
    ];

    const data = invoices.map((inv) => [
      inv.invoice_number || '',
      inv.invoice_type || '',
      this.formatDate(inv.invoice_date),
      inv.party_name || '',
      inv.party_type || '',
      this.formatCurrency(inv.subtotal || 0),
      this.formatCurrency(inv.discount_amount || 0),
      this.formatCurrency(inv.tax_amount || 0),
      this.formatCurrency(inv.total_amount || 0),
      this.formatCurrency(inv.paid_amount || 0),
      this.formatCurrency(inv.balance_due || 0),
      inv.status || '',
      this.formatDate(inv.due_date),
      inv.notes || '',
    ]);

    return this.generateCsv(headers, data);
  }

  async exportInvoicesToExcel(
    invoices: any[],
    options: ExportOptions = {},
  ): Promise<Buffer> {
    const headers = [
      'Invoice No. / رقم الفاتورة',
      'Type / النوع',
      'Date / التاريخ',
      'Party / الطرف',
      'Party Type / نوع الطرف',
      'Subtotal / المجموع الفرعي',
      'Discount / الخصم',
      'Tax Amount / مبلغ الضريبة',
      'Total / الإجمالي',
      'Paid / المدفوع',
      'Balance / الرصيد',
      'Status / الحالة',
      'Due Date / تاريخ الاستحقاق',
      'Notes / ملاحظات',
    ];

    const data = invoices.map((inv) => [
      inv.invoice_number || '',
      inv.invoice_type || '',
      this.formatDate(inv.invoice_date),
      inv.party_name || '',
      inv.party_type || '',
      inv.subtotal || 0,
      inv.discount_amount || 0,
      inv.tax_amount || 0,
      inv.total_amount || 0,
      inv.paid_amount || 0,
      inv.balance_due || 0,
      inv.status || '',
      this.formatDate(inv.due_date),
      inv.notes || '',
    ]);

    const buffer = await this.generateExcel('Invoices / الفواتير', headers, data);

    // Add totals row
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];

    const totalRow = worksheet.addRow([
      '',
      '',
      '',
      '',
      'TOTALS / الإجماليات:',
      invoices.reduce((sum, i) => sum + (i.subtotal || 0), 0),
      invoices.reduce((sum, i) => sum + (i.discount_amount || 0), 0),
      invoices.reduce((sum, i) => sum + (i.tax_amount || 0), 0),
      invoices.reduce((sum, i) => sum + (i.total_amount || 0), 0),
      invoices.reduce((sum, i) => sum + (i.paid_amount || 0), 0),
      invoices.reduce((sum, i) => sum + (i.balance_due || 0), 0),
      '',
      '',
      '',
    ]);

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E9' },
    };

    return workbook.xlsx.writeBuffer().then((buf) => Buffer.from(buf));
  }

  // Payment Exports
  exportPaymentsToCsv(payments: any[], options: ExportOptions = {}): Buffer {
    const headers = [
      'Payment No. / رقم الدفعة',
      'Date / التاريخ',
      'Type / النوع',
      'Party / الطرف',
      'Amount / المبلغ',
      'Payment Method / طريقة الدفع',
      'Reference No. / رقم المرجع',
      'Notes / ملاحظات',
      'Status / الحالة',
    ];

    const data = payments.map((p) => [
      p.payment_number || '',
      this.formatDate(p.payment_date),
      p.payment_type || '',
      p.party_name || '',
      this.formatCurrency(p.amount || 0),
      p.payment_method || '',
      p.reference_number || '',
      p.notes || '',
      p.status || '',
    ]);

    return this.generateCsv(headers, data);
  }

  async exportPaymentsToExcel(
    payments: any[],
    options: ExportOptions = {},
  ): Promise<Buffer> {
    const headers = [
      'Payment No. / رقم الدفعة',
      'Date / التاريخ',
      'Type / النوع',
      'Party / الطرف',
      'Amount / المبلغ',
      'Payment Method / طريقة الدفع',
      'Reference No. / رقم المرجع',
      'Notes / ملاحظات',
      'Status / الحالة',
    ];

    const data = payments.map((p) => [
      p.payment_number || '',
      this.formatDate(p.payment_date),
      p.payment_type || '',
      p.party_name || '',
      p.amount || 0,
      p.payment_method || '',
      p.reference_number || '',
      p.notes || '',
      p.status || '',
    ]);

    const buffer = await this.generateExcel('Payments / المدفوعات', headers, data);

    // Add totals row
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];

    const totalRow = worksheet.addRow([
      '',
      '',
      '',
      'TOTAL / الإجمالي:',
      payments.reduce((sum, p) => sum + (p.amount || 0), 0),
      '',
      '',
      '',
      '',
    ]);

    totalRow.font = { bold: true };
    totalRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E9' },
    };

    return workbook.xlsx.writeBuffer().then((buf) => Buffer.from(buf));
  }

  // Journal Entry Exports
  exportJournalEntriesToCsv(journals: any[], options: ExportOptions = {}): Buffer {
    const headers = [
      'Journal No. / رقم القيد',
      'Date / التاريخ',
      'Type / النوع',
      'Description (EN) / الوصف (إنجليزي)',
      'Description (AR) / الوصف (عربي)',
      'Account Code / رمز الحساب',
      'Account Name / اسم الحساب',
      'Debit / مدين',
      'Credit / دائن',
      'Reference / مرجع',
      'Status / الحالة',
    ];

    const rows: any[][] = [];
    journals.forEach((journal) => {
      if (journal.journal_lines && journal.journal_lines.length > 0) {
        journal.journal_lines.forEach((line: any, index: number) => {
          rows.push([
            index === 0 ? journal.journal_number || '' : '',
            index === 0 ? this.formatDate(journal.transaction_date) : '',
            index === 0 ? journal.journal_type || '' : '',
            index === 0 ? journal.description_en || '' : '',
            index === 0 ? journal.description_ar || '' : '',
            line.chart_of_accounts?.code || '',
            line.chart_of_accounts?.name_en || '',
            this.formatCurrency(line.debit || 0),
            this.formatCurrency(line.credit || 0),
            line.reference || '',
            index === 0 ? journal.status || '' : '',
          ]);
        });
      }
    });

    return this.generateCsv(headers, rows);
  }

  async exportJournalEntriesToExcel(
    journals: any[],
    options: ExportOptions = {},
  ): Promise<Buffer> {
    const headers = [
      'Journal No. / رقم القيد',
      'Date / التاريخ',
      'Type / النوع',
      'Description (EN) / الوصف (إنجليزي)',
      'Description (AR) / الوصف (عربي)',
      'Account Code / رمز الحساب',
      'Account Name / اسم الحساب',
      'Debit / مدين',
      'Credit / دائن',
      'Reference / مرجع',
      'Status / الحالة',
    ];

    const rows: any[][] = [];
    journals.forEach((journal) => {
      if (journal.journal_lines && journal.journal_lines.length > 0) {
        journal.journal_lines.forEach((line: any, index: number) => {
          rows.push([
            index === 0 ? journal.journal_number || '' : '',
            index === 0 ? this.formatDate(journal.transaction_date) : '',
            index === 0 ? journal.journal_type || '' : '',
            index === 0 ? journal.description_en || '' : '',
            index === 0 ? journal.description_ar || '' : '',
            line.chart_of_accounts?.code || '',
            line.chart_of_accounts?.name_en || '',
            line.debit || 0,
            line.credit || 0,
            line.reference || '',
            index === 0 ? journal.status || '' : '',
          ]);
        });
      }
    });

    return this.generateExcel('Journal Entries / القيود اليومية', headers, rows);
  }

  // Chart of Accounts Exports
  exportChartOfAccountsToCsv(
    accounts: any[],
    options: ExportOptions = {},
  ): Buffer {
    const headers = [
      'Code / الكود',
      'Name (EN) / الاسم (إنجليزي)',
      'Name (AR) / الاسم (عربي)',
      'Type / النوع',
      'Balance Type / نوع الرصيد',
      'Parent / الأب',
      'Level / المستوى',
      'Active / نشط',
    ];

    const data = accounts.map((acc) => [
      acc.code || '',
      acc.name_en || '',
      acc.name_ar || '',
      acc.type || '',
      acc.balance_type || '',
      acc.parent_name || '',
      acc.level || '',
      this.formatBoolean(acc.is_active),
    ]);

    return this.generateCsv(headers, data);
  }

  async exportChartOfAccountsToExcel(
    accounts: any[],
    options: ExportOptions = {},
  ): Promise<Buffer> {
    const headers = [
      'Code / الكود',
      'Name (EN) / الاسم (إنجليزي)',
      'Name (AR) / الاسم (عربي)',
      'Type / النوع',
      'Balance Type / نوع الرصيد',
      'Parent / الأب',
      'Level / المستوى',
      'Active / نشط',
    ];

    const data = accounts.map((acc) => [
      acc.code || '',
      acc.name_en || '',
      acc.name_ar || '',
      acc.type || '',
      acc.balance_type || '',
      acc.parent_name || '',
      acc.level || '',
      acc.is_active ? 'Yes / نعم' : 'No / لا',
    ]);

    return this.generateExcel(
      'Chart of Accounts / دليل الحسابات',
      headers,
      data,
    );
  }

  // Trial Balance Export
  exportTrialBalanceToCsv(
    trialBalance: any[],
    options: ExportOptions = {},
  ): Buffer {
    const headers = [
      'Account Code / رمز الحساب',
      'Account Name / اسم الحساب',
      'Opening Debit / رصيد افتتاحي مدين',
      'Opening Credit / رصيد افتتاحي دائن',
      'Debit / مدين',
      'Credit / دائن',
      'Closing Debit / رصيد ختامي مدين',
      'Closing Credit / رصيد ختامي دائن',
    ];

    const data = trialBalance.map((acc) => [
      acc.code || '',
      acc.name_en || '',
      this.formatCurrency(acc.opening_debit || 0),
      this.formatCurrency(acc.opening_credit || 0),
      this.formatCurrency(acc.debit || 0),
      this.formatCurrency(acc.credit || 0),
      this.formatCurrency(acc.closing_debit || 0),
      this.formatCurrency(acc.closing_credit || 0),
    ]);

    return this.generateCsv(headers, data);
  }

  async exportTrialBalanceToExcel(
    trialBalance: any[],
    options: ExportOptions = {},
  ): Promise<Buffer> {
    const headers = [
      'Account Code / رمز الحساب',
      'Account Name / اسم الحساب',
      'Opening Debit / رصيد افتتاحي مدين',
      'Opening Credit / رصيد افتتاحي دائن',
      'Debit / مدين',
      'Credit / دائن',
      'Closing Debit / رصيد ختامي مدين',
      'Closing Credit / رصيد ختامي دائن',
    ];

    const data = trialBalance.map((acc) => [
      acc.code || '',
      acc.name_en || '',
      acc.opening_debit || 0,
      acc.opening_credit || 0,
      acc.debit || 0,
      acc.credit || 0,
      acc.closing_debit || 0,
      acc.closing_credit || 0,
    ]);

    const buffer = await this.generateExcel(
      'Trial Balance / ميزان المراجعة',
      headers,
      data,
    );

    // Add totals row
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const worksheet = workbook.worksheets[0];

    const totalsRow = worksheet.addRow([
      '',
      'TOTALS / الإجماليات:',
      trialBalance.reduce((sum, a) => sum + (a.opening_debit || 0), 0),
      trialBalance.reduce((sum, a) => sum + (a.opening_credit || 0), 0),
      trialBalance.reduce((sum, a) => sum + (a.debit || 0), 0),
      trialBalance.reduce((sum, a) => sum + (a.credit || 0), 0),
      trialBalance.reduce((sum, a) => sum + (a.closing_debit || 0), 0),
      trialBalance.reduce((sum, a) => sum + (a.closing_credit || 0), 0),
    ]);

    totalsRow.font = { bold: true, size: 12 };
    totalsRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFD700' },
    };

    return workbook.xlsx.writeBuffer().then((buf) => Buffer.from(buf));
  }
}
