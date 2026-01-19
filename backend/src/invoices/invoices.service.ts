import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JournalsService } from '../journals/journals.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { InvoiceLineDto } from './dto/invoice-line.dto';
import { InvoiceTaxDto } from './dto/invoice-tax.dto';

// Re-export types for backward compatibility
type InvoiceLine = InvoiceLineDto;
type InvoiceTax = InvoiceTaxDto;

@Injectable()
export class InvoicesService {
  constructor(
    private supabaseService: SupabaseService,
    private journalsService: JournalsService,
  ) {}

  async findAll(tenantId: string, filters?: { invoiceType?: string; status?: string; partyType?: string }) {
    const supabase = this.supabaseService.getClient();

    // PERFORMANCE: Fetch invoices first, then batch load party info
    let query = supabase
      .from('invoices')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('invoice_date', { ascending: false });

    if (filters?.invoiceType) {
      query = query.eq('invoice_type', filters.invoiceType);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.partyType) {
      query = query.eq('party_type', filters.partyType);
    }

    const { data: invoices, error } = await query;

    if (error) {
      throw error;
    }

    if (!invoices || invoices.length === 0) {
      return [];
    }

    // PERFORMANCE: Batch load all customers and vendors in 2 queries instead of N queries
    const customerIds = [...new Set(
      invoices.filter(inv => inv.party_type === 'customer').map(inv => inv.party_id)
    )];
    const vendorIds = [...new Set(
      invoices.filter(inv => inv.party_type === 'vendor').map(inv => inv.party_id)
    )];

    const [customersResult, vendorsResult] = await Promise.all([
      customerIds.length > 0
        ? supabase.from('customers').select('id, name_en, name_ar').in('id', customerIds)
        : Promise.resolve({ data: [] }),
      vendorIds.length > 0
        ? supabase.from('vendors').select('id, name_en, name_ar').in('id', vendorIds)
        : Promise.resolve({ data: [] }),
    ]);

    // Create lookup maps for O(1) access
    const customerMap = new Map(
      (customersResult.data || []).map(c => [c.id, c])
    );
    const vendorMap = new Map(
      (vendorsResult.data || []).map(v => [v.id, v])
    );

    // Attach party info to each invoice
    const invoicesWithParty = invoices.map(invoice => ({
      ...invoice,
      party: invoice.party_type === 'customer'
        ? customerMap.get(invoice.party_id) || { name_en: 'Unknown', name_ar: 'غير معروف' }
        : vendorMap.get(invoice.party_id) || { name_en: 'Unknown', name_ar: 'غير معروف' },
    }));

    return invoicesWithParty;
  }

  async findOne(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('invoices')
      .select(
        `
        *,
        invoice_lines(*),
        invoice_taxes(*)
      `,
      )
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException('Invoice not found');
    }

    return data;
  }

  async generateInvoiceNumber(tenantId: string, invoiceType: string): Promise<string> {
    const supabase = this.supabaseService.getClient();

    // Call the database function to generate invoice number
    const { data, error } = await supabase.rpc('generate_invoice_number', {
      p_tenant_id: tenantId,
      p_invoice_type: invoiceType,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async calculateInvoiceTotals(lines: InvoiceLine[], taxes: InvoiceTax[] = [], discountAmount = 0, discountPercentage = 0) {
    // Calculate line totals
    let subtotal = 0;
    let totalTax = 0;

    for (const line of lines) {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineDiscount = line.discountAmount || (lineSubtotal * (line.discountPercentage || 0)) / 100;
      const lineTaxable = lineSubtotal - lineDiscount;
      const lineTax = line.taxAmount || (lineTaxable * (line.taxPercentage || 0)) / 100;
      const lineTotal = lineTaxable + lineTax;

      subtotal += lineTaxable;
      totalTax += lineTax;

      // Update line values
      line.taxableAmount = lineTaxable;
      line.taxAmount = lineTax;
      line.lineTotal = lineTotal;
    }

    // Calculate invoice-level discount
    const invoiceDiscount = discountAmount || (subtotal * discountPercentage) / 100;
    const taxableAmount = Math.max(0, subtotal - invoiceDiscount);

    // Sum taxes from tax details
    let taxAmount = 0;
    for (const tax of taxes) {
      taxAmount += tax.taxAmount;
    }

    const totalAmount = taxableAmount + taxAmount;

    return {
      subtotal,
      discountAmount: invoiceDiscount,
      discountPercentage,
      taxableAmount,
      taxAmount,
      totalAmount,
      paidAmount: 0,
      balanceAmount: totalAmount,
    };
  }

  async create(createDto: CreateInvoiceDto, tenantId: string, createdBy?: string, branchId?: string) {
    const supabase = this.supabaseService.getClient();

    // Validate party type matches invoice type
    if (createDto.invoiceType === 'sales' || createDto.invoiceType === 'sales_return') {
      if (createDto.partyType !== 'customer') {
        throw new BadRequestException('Sales invoices must have a customer');
      }
    } else if (createDto.invoiceType === 'purchase' || createDto.invoiceType === 'purchase_return') {
      if (createDto.partyType !== 'vendor') {
        throw new BadRequestException('Purchase invoices must have a vendor');
      }
    }

    // Validate lines
    if (!createDto.lines || createDto.lines.length === 0) {
      throw new BadRequestException('Invoice must have at least one line');
    }

    // Calculate totals
    const totals = await this.calculateInvoiceTotals(
      createDto.lines,
      createDto.taxes || [],
      createDto.discountAmount,
      createDto.discountPercentage,
    );

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(tenantId, createDto.invoiceType);

    // Create invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        invoice_number: invoiceNumber,
        invoice_type: createDto.invoiceType,
        party_id: createDto.partyId,
        party_type: createDto.partyType,
        invoice_date: createDto.invoiceDate.toISOString().split('T')[0],
        due_date: createDto.dueDate?.toISOString().split('T')[0],
        currency: createDto.currency || 'QAR',
        exchange_rate: createDto.exchangeRate || 1,
        subtotal: totals.subtotal,
        discount_amount: totals.discountAmount,
        discount_percentage: totals.discountPercentage,
        taxable_amount: totals.taxableAmount,
        tax_amount: totals.taxAmount,
        total_amount: totals.totalAmount,
        paid_amount: 0,
        balance_amount: totals.totalAmount,
        notes: createDto.notes,
        internal_notes: createDto.internalNotes,
        attachment_url: createDto.attachmentUrl,
        status: 'draft',
        created_by: createdBy,
      })
      .select()
      .single();

    if (invoiceError) {
      throw invoiceError;
    }

    // Create invoice lines
    for (const line of createDto.lines) {
      const { error: lineError } = await supabase.from('invoice_lines').insert({
        invoice_id: invoice.id,
        tenant_id: tenantId,
        line_number: line.lineNumber,
        item_code: line.itemCode,
        description_ar: line.descriptionAr,
        description_en: line.descriptionEn,
        quantity: line.quantity,
        unit_of_measure: line.unitOfMeasure,
        unit_price: line.unitPrice,
        discount_amount: line.discountAmount || 0,
        discount_percentage: line.discountPercentage || 0,
        taxable_amount: line.taxableAmount || 0,
        tax_code_id: line.taxCodeId,
        tax_percentage: line.taxPercentage || 0,
        tax_amount: line.taxAmount || 0,
        line_total: line.lineTotal,
        account_id: line.accountId,
        cost_center_id: line.costCenterId,
      });

      if (lineError) {
        throw lineError;
      }
    }

    // Create invoice taxes
    if (createDto.taxes && createDto.taxes.length > 0) {
      for (const tax of createDto.taxes) {
        const { error: taxError } = await supabase.from('invoice_taxes').insert({
          invoice_id: invoice.id,
          tenant_id: tenantId,
          tax_code_id: tax.taxCodeId,
          tax_type: tax.taxType,
          tax_name: tax.taxName,
          tax_percentage: tax.taxPercentage,
          taxable_amount: tax.taxableAmount,
          tax_amount: tax.taxAmount,
        });

        if (taxError) {
          throw taxError;
        }
      }
    }

    return this.findOne(invoice.id, tenantId);
  }

  async update(id: string, updateDto: UpdateInvoiceDto, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if invoice exists and is in draft status
    const existing = await this.findOne(id, tenantId);
    if (existing.status !== 'draft') {
      throw new BadRequestException('Can only update draft invoices');
    }

    const updateData: any = {};

    if (updateDto.invoiceDate !== undefined) updateData.invoice_date = updateDto.invoiceDate.toISOString().split('T')[0];
    if (updateDto.dueDate !== undefined) updateData.due_date = updateDto.dueDate?.toISOString().split('T')[0];
    if (updateDto.currency !== undefined) updateData.currency = updateDto.currency;
    if (updateDto.exchangeRate !== undefined) updateData.exchange_rate = updateDto.exchangeRate;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;
    if (updateDto.internalNotes !== undefined) updateData.internal_notes = updateDto.internalNotes;
    if (updateDto.attachmentUrl !== undefined) updateData.attachment_url = updateDto.attachmentUrl;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;

    // Recalculate totals if lines or taxes changed
    if (updateDto.lines || updateDto.taxes || updateDto.discountAmount !== undefined || updateDto.discountPercentage !== undefined) {
      const lines = updateDto.lines || existing.invoice_lines;
      const taxes = updateDto.taxes || existing.invoice_taxes;
      const discountAmount = updateDto.discountAmount !== undefined ? updateDto.discountAmount : existing.discount_amount;
      const discountPercentage = updateDto.discountPercentage !== undefined ? updateDto.discountPercentage : existing.discount_percentage;

      const totals = await this.calculateInvoiceTotals(lines, taxes, discountAmount, discountPercentage);

      updateData.subtotal = totals.subtotal;
      updateData.discount_amount = totals.discountAmount;
      updateData.discount_percentage = totals.discountPercentage;
      updateData.taxable_amount = totals.taxableAmount;
      updateData.tax_amount = totals.taxAmount;
      updateData.total_amount = totals.totalAmount;
      updateData.balance_amount = totals.totalAmount - existing.paid_amount;
    }

    const { data, error } = await supabase
      .from('invoices')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update lines if provided
    if (updateDto.lines) {
      // Delete existing lines
      await supabase.from('invoice_lines').delete().eq('invoice_id', id);

      // Insert new lines
      for (const line of updateDto.lines) {
        const { error: lineError } = await supabase.from('invoice_lines').insert({
          invoice_id: id,
          tenant_id: tenantId,
          line_number: line.lineNumber,
          item_code: line.itemCode,
          description_ar: line.descriptionAr,
          description_en: line.descriptionEn,
          quantity: line.quantity,
          unit_of_measure: line.unitOfMeasure,
          unit_price: line.unitPrice,
          discount_amount: line.discountAmount || 0,
          discount_percentage: line.discountPercentage || 0,
          taxable_amount: line.taxableAmount || 0,
          tax_code_id: line.taxCodeId,
          tax_percentage: line.taxPercentage || 0,
          tax_amount: line.taxAmount || 0,
          line_total: line.lineTotal,
          account_id: line.accountId,
          cost_center_id: line.costCenterId,
        });

        if (lineError) {
          throw lineError;
        }
      }
    }

    // Update taxes if provided
    if (updateDto.taxes) {
      // Delete existing taxes
      await supabase.from('invoice_taxes').delete().eq('invoice_id', id);

      // Insert new taxes
      for (const tax of updateDto.taxes) {
        const { error: taxError } = await supabase.from('invoice_taxes').insert({
          invoice_id: id,
          tenant_id: tenantId,
          tax_code_id: tax.taxCodeId,
          tax_type: tax.taxType,
          tax_name: tax.taxName,
          tax_percentage: tax.taxPercentage,
          taxable_amount: tax.taxableAmount,
          tax_amount: tax.taxAmount,
        });

        if (taxError) {
          throw taxError;
        }
      }
    }

    return this.findOne(id, tenantId);
  }

  async submit(id: string, tenantId: string, userId?: string) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findOne(id, tenantId);
    if (existing.status !== 'draft') {
      throw new BadRequestException('Can only submit draft invoices');
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'submitted',
        submitted_by: userId,
        submitted_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async approve(id: string, tenantId: string, userId?: string) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findOne(id, tenantId);
    if (existing.status !== 'submitted') {
      throw new BadRequestException('Can only approve submitted invoices');
    }

    const { data, error } = await supabase
      .from('invoices')
      .update({
        status: 'approved',
        approved_by: userId,
        approved_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  async post(id: string, tenantId: string, userId?: string) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findOne(id, tenantId);
    if (existing.status !== 'approved') {
      throw new BadRequestException('Can only post approved invoices');
    }

    try {
      // Create journal entry for the invoice
      const journalId = await this.createInvoiceJournal(existing, tenantId, userId);

      // Update invoice status and link to journal
      const { data, error } = await supabase
        .from('invoices')
        .update({
          status: 'posted',
          posted_journal_id: journalId,
          posted_by: userId,
          posted_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      // If journal creation fails, don't post the invoice
      throw new BadRequestException(`Failed to create journal entry: ${error.message}`);
    }
  }

  async remove(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findOne(id, tenantId);
    if (existing.status !== 'draft') {
      throw new BadRequestException('Can only delete draft invoices');
    }

    const { error } = await supabase.from('invoices').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  /**
   * Create journal entry for invoice posting
   *
   * Accounting Logic:
   * -----------------
   * SALES INVOICE (Debit AR / Credit Revenue):
   * - Debit: Accounts Receivable (total amount including tax)
   * - Credit: Revenue/Sales Account (subtotal)
   * - Credit: Tax Payable Account (tax amount)
   *
   * PURCHASE INVOICE (Credit AP / Debit Expense):
   * - Debit: Expense/Purchase Account (subtotal)
   * - Debit: Tax Recoverable Account (tax amount)
   * - Credit: Accounts Payable (total amount including tax)
   *
   * SALES RETURN (Credit AR / Debit Revenue):
   * - Debit: Sales Returns Account (subtotal)
   * - Debit: Tax Payable Account (tax amount)
   * - Credit: Accounts Receivable (total amount including tax)
   *
   * PURCHASE RETURN (Debit AP / Credit Expense):
   * - Debit: Accounts Payable (total amount including tax)
   * - Credit: Purchase Returns Account (subtotal)
   * - Credit: Tax Recoverable Account (tax amount)
   */
  private async createInvoiceJournal(
    invoice: any,
    tenantId: string,
    userId?: string,
  ): Promise<string> {
    const supabase = this.supabaseService.getClient();

    // Determine journal type based on invoice type
    const journalTypeMap: Record<string, 'sales' | 'purchase'> = {
      sales: 'sales',
      purchase: 'purchase',
      sales_return: 'sales',
      purchase_return: 'purchase',
    };

    const journalType = journalTypeMap[invoice.invoice_type];
    if (!journalType) {
      throw new BadRequestException(`Invalid invoice type: ${invoice.invoice_type}`);
    }

    // Get or determine default accounts for this tenant
    const defaultAccounts = await this.getDefaultAccounts(tenantId, invoice.invoice_type);

    // Build journal lines based on invoice type
    const journalLines = this.buildInvoiceJournalLines(invoice, defaultAccounts);

    // Create journal entry
    const journal = await this.journalsService.create(
      {
        journalType,
        referenceNumber: invoice.invoice_number,
        descriptionAr: this.getInvoiceDescriptionAr(invoice),
        descriptionEn: this.getInvoiceDescriptionEn(invoice),
        transactionDate: new Date(invoice.invoice_date),
        currency: invoice.currency,
        exchangeRate: invoice.exchange_rate,
        sourceModule: 'invoices',
        sourceId: invoice.id,
        lines: journalLines,
      },
      tenantId,
      userId || invoice.created_by,
      invoice.branch_id,
    );

    return journal.id;
  }

  /**
   * Build journal lines based on invoice type and invoice lines
   */
  private buildInvoiceJournalLines(invoice: any, defaultAccounts: any): Array<{
    lineNumber: number;
    accountId: string;
    descriptionAr?: string;
    descriptionEn?: string;
    debit: number;
    credit: number;
  }> {
    const lines: Array<{
      lineNumber: number;
      accountId: string;
      descriptionAr?: string;
      descriptionEn?: string;
      debit: number;
      credit: number;
    }> = [];

    let lineNumber = 1;

    // Group invoice lines by account to consolidate entries
    const accountGroups = new Map<string, { subtotal: number; descriptions: string[] }>();

    for (const line of invoice.invoice_lines) {
      const accountId = line.account_id || defaultAccounts.revenue_account_id;
      const taxableAmount = line.taxable_amount || (line.quantity * line.unit_price);

      if (!accountGroups.has(accountId)) {
        accountGroups.set(accountId, { subtotal: 0, descriptions: [] });
      }

      const group = accountGroups.get(accountId)!;
      group.subtotal += taxableAmount;
      if (line.description_ar) {
        group.descriptions.push(line.description_ar);
      }
    }

    // Build journal lines based on invoice type
    switch (invoice.invoice_type) {
      case 'sales':
        // SALES: Debit AR, Credit Revenue + Credit Tax
        // Debit: Accounts Receivable
        lines.push({
          lineNumber: lineNumber++,
          accountId: defaultAccounts.receivable_account_id,
          descriptionAr: `العميل: ${invoice.party_id}`,
          descriptionEn: `Customer: ${invoice.party_id}`,
          debit: invoice.total_amount,
          credit: 0,
        });

        // Credit: Revenue accounts (grouped by account)
        accountGroups.forEach((group, accountId) => {
          lines.push({
            lineNumber: lineNumber++,
            accountId: accountId,
            descriptionAr: group.descriptions.join('; '),
            debit: 0,
            credit: group.subtotal,
          });
        });

        // Credit: Tax Payable
        if (invoice.tax_amount > 0) {
          lines.push({
            lineNumber: lineNumber++,
            accountId: defaultAccounts.tax_payable_account_id,
            descriptionAr: 'ضريبة المبيعات',
            descriptionEn: 'Sales Tax',
            debit: 0,
            credit: invoice.tax_amount,
          });
        }
        break;

      case 'purchase':
        // PURCHASE: Debit Expense + Debit Tax, Credit AP
        // Debit: Expense/Purchase accounts (grouped by account)
        accountGroups.forEach((group, accountId) => {
          lines.push({
            lineNumber: lineNumber++,
            accountId: accountId,
            descriptionAr: group.descriptions.join('; '),
            debit: group.subtotal,
            credit: 0,
          });
        });

        // Debit: Tax Recoverable
        if (invoice.tax_amount > 0) {
          lines.push({
            lineNumber: lineNumber++,
            accountId: defaultAccounts.tax_recoverable_account_id,
            descriptionAr: 'ضريبة قابلة للاسترداد',
            descriptionEn: 'Recoverable Tax',
            debit: invoice.tax_amount,
            credit: 0,
          });
        }

        // Credit: Accounts Payable
        lines.push({
          lineNumber: lineNumber++,
          accountId: defaultAccounts.payable_account_id,
          descriptionAr: `المورد: ${invoice.party_id}`,
          descriptionEn: `Vendor: ${invoice.party_id}`,
          debit: 0,
          credit: invoice.total_amount,
        });
        break;

      case 'sales_return':
        // SALES RETURN: Debit Returns, Debit Tax, Credit AR
        // Debit: Sales Returns Account
        accountGroups.forEach((group, accountId) => {
          lines.push({
            lineNumber: lineNumber++,
            accountId: defaultAccounts.sales_returns_account_id || accountId,
            descriptionAr: 'مرتجعات مبيعات',
            descriptionEn: 'Sales Returns',
            debit: group.subtotal,
            credit: 0,
          });
        });

        // Debit: Tax Payable (reduce tax liability)
        if (invoice.tax_amount > 0) {
          lines.push({
            lineNumber: lineNumber++,
            accountId: defaultAccounts.tax_payable_account_id,
            descriptionAr: 'ضريبة المبيعات (مرتجع)',
            descriptionEn: 'Sales Tax (Return)',
            debit: invoice.tax_amount,
            credit: 0,
          });
        }

        // Credit: Accounts Receivable
        lines.push({
          lineNumber: lineNumber++,
          accountId: defaultAccounts.receivable_account_id,
          descriptionAr: `مرتجع عميل: ${invoice.party_id}`,
          descriptionEn: `Customer Return: ${invoice.party_id}`,
          debit: 0,
          credit: invoice.total_amount,
        });
        break;

      case 'purchase_return':
        // PURCHASE RETURN: Debit AP, Credit Returns, Credit Tax
        // Debit: Accounts Payable
        lines.push({
          lineNumber: lineNumber++,
          accountId: defaultAccounts.payable_account_id,
          descriptionAr: `مرتجع مورد: ${invoice.party_id}`,
          descriptionEn: `Vendor Return: ${invoice.party_id}`,
          debit: invoice.total_amount,
          credit: 0,
        });

        // Credit: Purchase Returns Account
        accountGroups.forEach((group, accountId) => {
          lines.push({
            lineNumber: lineNumber++,
            accountId: defaultAccounts.purchase_returns_account_id || accountId,
            descriptionAr: 'مرتجعات مشتريات',
            descriptionEn: 'Purchase Returns',
            debit: 0,
            credit: group.subtotal,
          });
        });

        // Credit: Tax Recoverable (reduce recoverable tax)
        if (invoice.tax_amount > 0) {
          lines.push({
            lineNumber: lineNumber++,
            accountId: defaultAccounts.tax_recoverable_account_id,
            descriptionAr: 'ضريبة قابلة للاسترداد (مرتجع)',
            descriptionEn: 'Recoverable Tax (Return)',
            debit: 0,
            credit: invoice.tax_amount,
          });
        }
        break;

      default:
        throw new BadRequestException(`Unsupported invoice type: ${invoice.invoice_type}`);
    }

    return lines;
  }

  /**
   * Get default accounts for invoice posting
   * PERFORMANCE OPTIMIZED: Single query with filtering in code instead of 8 queries
   */
  private async getDefaultAccounts(tenantId: string, invoiceType: string) {
    const supabase = this.supabaseService.getClient();

    // PERFORMANCE: Single query to get all relevant accounts
    const { data: accounts, error } = await supabase
      .from('chart_of_accounts')
      .select('id, name_en, type')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .in('type', ['asset', 'liability', 'revenue', 'expense']);

    if (error) {
      throw error;
    }

    const accountList = accounts || [];
    const nameLower = (name: string) => (name || '').toLowerCase();

    // Find accounts by pattern matching in code (O(n) single pass)
    let arAccount: { id: string } | undefined;
    let apAccount: { id: string } | undefined;
    let taxPayableAccount: { id: string } | undefined;
    let taxRecoverableAccount: { id: string } | undefined;
    let revenueAccount: { id: string } | undefined;
    let expenseAccount: { id: string } | undefined;
    let salesReturnsAccount: { id: string } | undefined;
    let purchaseReturnsAccount: { id: string } | undefined;

    for (const acc of accountList) {
      const name = nameLower(acc.name_en);
      
      // Accounts Receivable (asset with "receivable")
      if (!arAccount && acc.type === 'asset' && name.includes('receivable')) {
        arAccount = acc;
      }
      
      // Accounts Payable (liability with "payable")
      if (!apAccount && acc.type === 'liability' && name.includes('payable') && !name.includes('tax')) {
        apAccount = acc;
      }
      
      // Tax Payable (liability with "tax" and "payable")
      if (!taxPayableAccount && acc.type === 'liability' && name.includes('tax') && name.includes('payable')) {
        taxPayableAccount = acc;
      }
      
      // Tax Recoverable (asset with "tax" and "recoverable" or "input")
      if (!taxRecoverableAccount && acc.type === 'asset' && 
          (name.includes('tax') && (name.includes('recoverable') || name.includes('input')))) {
        taxRecoverableAccount = acc;
      }
      
      // Sales Revenue (revenue with "sales")
      if (!revenueAccount && acc.type === 'revenue' && name.includes('sales') && !name.includes('return')) {
        revenueAccount = acc;
      }
      
      // Purchase/Expense (expense with "purchase")
      if (!expenseAccount && acc.type === 'expense' && name.includes('purchase') && !name.includes('return')) {
        expenseAccount = acc;
      }
      
      // Sales Returns
      if (!salesReturnsAccount && name.includes('sales') && name.includes('return')) {
        salesReturnsAccount = acc;
      }
      
      // Purchase Returns
      if (!purchaseReturnsAccount && name.includes('purchase') && name.includes('return')) {
        purchaseReturnsAccount = acc;
      }
    }

    // Validation
    if (!arAccount?.id) {
      throw new BadRequestException('Accounts Receivable account not found. Please create an asset account with "receivable" in the name.');
    }
    if (!apAccount?.id) {
      throw new BadRequestException('Accounts Payable account not found. Please create a liability account with "payable" in the name.');
    }

    return {
      receivable_account_id: arAccount.id,
      payable_account_id: apAccount.id,
      tax_payable_account_id: taxPayableAccount?.id || arAccount.id,
      tax_recoverable_account_id: taxRecoverableAccount?.id || apAccount.id,
      revenue_account_id: revenueAccount?.id,
      expense_account_id: expenseAccount?.id,
      sales_returns_account_id: salesReturnsAccount?.id,
      purchase_returns_account_id: purchaseReturnsAccount?.id,
    };
  }

  private getInvoiceDescriptionAr(invoice: any): string {
    const descriptions: Record<string, string> = {
      sales: `فاتورة مبيعات رقم ${invoice.invoice_number}`,
      purchase: `فاتورة مشتريات رقم ${invoice.invoice_number}`,
      sales_return: `مرتجع مبيعات رقم ${invoice.invoice_number}`,
      purchase_return: `مرتجع مشتريات رقم ${invoice.invoice_number}`,
    };
    return descriptions[invoice.invoice_type] || `فاتورة رقم ${invoice.invoice_number}`;
  }

  private getInvoiceDescriptionEn(invoice: any): string {
    const descriptions: Record<string, string> = {
      sales: `Sales Invoice ${invoice.invoice_number}`,
      purchase: `Purchase Invoice ${invoice.invoice_number}`,
      sales_return: `Sales Return ${invoice.invoice_number}`,
      purchase_return: `Purchase Return ${invoice.invoice_number}`,
    };
    return descriptions[invoice.invoice_type] || `Invoice ${invoice.invoice_number}`;
  }
}

export type { InvoiceLine, InvoiceTax };
