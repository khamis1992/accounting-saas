import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { JournalsService } from '../journals/journals.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentAllocationDto } from './dto/payment-allocation.dto';

// Re-export types for backward compatibility
type PaymentAllocation = PaymentAllocationDto;

@Injectable()
export class PaymentsService {
  constructor(
    private supabaseService: SupabaseService,
    private journalsService: JournalsService,
  ) {}

  async findAll(tenantId: string, filters?: { paymentType?: string; status?: string; partyType?: string }) {
    const supabase = this.supabaseService.getClient();

    let query = supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('payment_date', { ascending: false });

    if (filters?.paymentType) {
      query = query.eq('payment_type', filters.paymentType);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.partyType) {
      query = query.eq('party_type', filters.partyType);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data;
  }

  async findOne(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const { data, error } = await supabase
      .from('payments')
      .select(
        `
        *,
        payment_allocations(*)
      `,
      )
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      throw new NotFoundException('Payment not found');
    }

    return data;
  }

  async generatePaymentNumber(tenantId: string, paymentType: string): Promise<string> {
    const supabase = this.supabaseService.getClient();

    // Call the database function to generate payment number
    const { data, error } = await supabase.rpc('generate_payment_number', {
      p_tenant_id: tenantId,
      p_payment_type: paymentType,
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async calculateAllocatedAmount(allocations: PaymentAllocation[]) {
    let totalAllocated = 0;
    for (const allocation of allocations) {
      totalAllocated += allocation.amount;
    }
    return totalAllocated;
  }

  async create(createDto: CreatePaymentDto, tenantId: string, createdBy?: string, branchId?: string) {
    const supabase = this.supabaseService.getClient();

    // Validate party type matches payment type
    if (createDto.paymentType === 'receipt') {
      if (createDto.partyType !== 'customer') {
        throw new BadRequestException('Receipts must be from customers');
      }
    } else if (createDto.paymentType === 'payment') {
      if (createDto.partyType !== 'vendor') {
        throw new BadRequestException('Payments must be to vendors');
      }
    }

    // Validate payment method
    if (createDto.paymentMethod === 'check') {
      if (!createDto.checkNumber) {
        throw new BadRequestException('Check number is required for check payments');
      }
      if (!createDto.checkDate) {
        throw new BadRequestException('Check date is required for check payments');
      }
    }

    // Calculate allocated amount
    const allocatedAmount = createDto.allocations
      ? await this.calculateAllocatedAmount(createDto.allocations)
      : 0;

    // Validate allocated amount doesn't exceed payment amount
    if (allocatedAmount > createDto.amount) {
      throw new BadRequestException('Allocated amount cannot exceed payment amount');
    }

    const unallocatedAmount = createDto.amount - allocatedAmount;

    // Generate payment number
    const paymentNumber = await this.generatePaymentNumber(tenantId, createDto.paymentType);

    // Create payment
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        tenant_id: tenantId,
        branch_id: branchId,
        payment_number: paymentNumber,
        payment_type: createDto.paymentType,
        party_id: createDto.partyId,
        party_type: createDto.partyType,
        payment_date: createDto.paymentDate.toISOString().split('T')[0],
        currency: createDto.currency || 'QAR',
        exchange_rate: createDto.exchangeRate || 1,
        amount: createDto.amount,
        unallocated_amount: unallocatedAmount,
        payment_method: createDto.paymentMethod,
        reference_number: createDto.referenceNumber,
        check_number: createDto.checkNumber,
        check_date: createDto.checkDate?.toISOString().split('T')[0],
        bank_account_id: createDto.bankAccountId,
        description_ar: createDto.descriptionAr,
        description_en: createDto.descriptionEn,
        notes: createDto.notes,
        attachment_url: createDto.attachmentUrl,
        status: 'draft',
        created_by: createdBy,
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // Create payment allocations
    if (createDto.allocations && createDto.allocations.length > 0) {
      for (const allocation of createDto.allocations) {
        const { error: allocationError } = await supabase.from('payment_allocations').insert({
          payment_id: payment.id,
          tenant_id: tenantId,
          invoice_id: allocation.invoiceId,
          amount: allocation.amount,
          discount_allowed: allocation.discountAllowed || 0,
          write_off: allocation.writeOff || 0,
          notes: allocation.notes,
          created_by: createdBy,
        });

        if (allocationError) {
          throw allocationError;
        }

        // Update invoice balance
        await this.updateInvoiceBalance(allocation.invoiceId, tenantId);
      }
    }

    return this.findOne(payment.id, tenantId);
  }

  async update(id: string, updateDto: UpdatePaymentDto, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Check if payment exists and is in draft status
    const existing = await this.findOne(id, tenantId);
    if (existing.status !== 'draft') {
      throw new BadRequestException('Can only update draft payments');
    }

    const updateData: any = {};

    if (updateDto.paymentDate !== undefined) updateData.payment_date = updateDto.paymentDate.toISOString().split('T')[0];
    if (updateDto.currency !== undefined) updateData.currency = updateDto.currency;
    if (updateDto.exchangeRate !== undefined) updateData.exchange_rate = updateDto.exchangeRate;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;
    if (updateDto.descriptionAr !== undefined) updateData.description_ar = updateDto.descriptionAr;
    if (updateDto.descriptionEn !== undefined) updateData.description_en = updateDto.descriptionEn;
    if (updateDto.attachmentUrl !== undefined) updateData.attachment_url = updateDto.attachmentUrl;
    if (updateDto.status !== undefined) updateData.status = updateDto.status;
    if (updateDto.paymentMethod !== undefined) updateData.payment_method = updateDto.paymentMethod;
    if (updateDto.referenceNumber !== undefined) updateData.reference_number = updateDto.referenceNumber;
    if (updateDto.checkNumber !== undefined) updateData.check_number = updateDto.checkNumber;
    if (updateDto.checkDate !== undefined) updateData.check_date = updateDto.checkDate.toISOString().split('T')[0];
    if (updateDto.bankAccountId !== undefined) updateData.bank_account_id = updateDto.bankAccountId;

    // Recalculate allocations if changed
    if (updateDto.allocations) {
      const allocatedAmount = await this.calculateAllocatedAmount(updateDto.allocations);
      const amount = updateDto.amount !== undefined ? updateDto.amount : existing.amount;

      if (allocatedAmount > amount) {
        throw new BadRequestException('Allocated amount cannot exceed payment amount');
      }

      updateData.unallocated_amount = amount - allocatedAmount;
      updateData.amount = amount;
    } else if (updateDto.amount !== undefined) {
      const currentAllocated = existing.amount - existing.unallocated_amount;
      updateData.amount = updateDto.amount;
      updateData.unallocated_amount = Math.max(0, updateDto.amount - currentAllocated);
    }

    const { data, error } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Update allocations if provided
    if (updateDto.allocations) {
      // Delete existing allocations and restore invoice balances
      for (const existingAllocation of existing.payment_allocations) {
        await supabase.from('payment_allocations').delete().eq('id', existingAllocation.id);
        await this.updateInvoiceBalance(existingAllocation.invoice_id, tenantId);
      }

      // Insert new allocations
      for (const allocation of updateDto.allocations) {
        const { error: allocationError } = await supabase.from('payment_allocations').insert({
          payment_id: id,
          tenant_id: tenantId,
          invoice_id: allocation.invoiceId,
          amount: allocation.amount,
          discount_allowed: allocation.discountAllowed || 0,
          write_off: allocation.writeOff || 0,
          notes: allocation.notes,
          created_by: existing.created_by,
        });

        if (allocationError) {
          throw allocationError;
        }

        // Update invoice balance
        await this.updateInvoiceBalance(allocation.invoiceId, tenantId);
      }
    }

    return this.findOne(id, tenantId);
  }

  async updateInvoiceBalance(invoiceId: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Calculate total payments for this invoice
    const { data: allocations, error: allocError } = await supabase
      .from('payment_allocations')
      .select('amount')
      .eq('invoice_id', invoiceId);

    if (allocError) {
      throw allocError;
    }

    const totalPaid = allocations?.reduce((sum, alloc) => sum + alloc.amount, 0) || 0;

    // Get invoice details
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('id', invoiceId)
      .single();

    if (invError) {
      throw invError;
    }

    const balanceAmount = invoice.total_amount - totalPaid;

    // Update invoice balance and status
    let status = 'posted';
    if (totalPaid === 0) {
      status = 'posted';
    } else if (totalPaid < invoice.total_amount) {
      status = 'partially_paid';
    } else if (totalPaid >= invoice.total_amount) {
      status = 'paid';
    }

    await supabase
      .from('invoices')
      .update({
        paid_amount: totalPaid,
        balance_amount: balanceAmount,
        status: status,
      })
      .eq('id', invoiceId);
  }

  async submit(id: string, tenantId: string, userId?: string) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findOne(id, tenantId);
    if (existing.status !== 'draft') {
      throw new BadRequestException('Can only submit draft payments');
    }

    const { data, error } = await supabase
      .from('payments')
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
      throw new BadRequestException('Can only approve submitted payments');
    }

    const { data, error } = await supabase
      .from('payments')
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
      throw new BadRequestException('Can only post approved payments');
    }

    try {
      // Create journal entry for the payment
      const journalId = await this.createPaymentJournal(existing, tenantId, userId);

      // Update payment status and link to journal
      const { data, error } = await supabase
        .from('payments')
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
      // If journal creation fails, don't post the payment
      throw new BadRequestException(`Failed to create journal entry: ${error.message}`);
    }
  }

  async cancel(id: string, tenantId: string, userId?: string) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findOne(id, tenantId);
    if (existing.status === 'cancelled') {
      throw new BadRequestException('Payment is already cancelled');
    }

    const { data, error } = await supabase
      .from('payments')
      .update({
        status: 'cancelled',
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

  async remove(id: string, tenantId: string) {
    const supabase = this.supabaseService.getClient();

    const existing = await this.findOne(id, tenantId);
    if (existing.status !== 'draft') {
      throw new BadRequestException('Can only delete draft payments');
    }

    const { error } = await supabase.from('payments').delete().eq('id', id);

    if (error) {
      throw error;
    }

    return { success: true };
  }

  /**
   * Create journal entry for payment posting
   *
   * Accounting Logic:
   * -----------------
   * RECEIPT (Customer Payment):
   * - Debit: Bank/Cash Account (amount received)
   * - Credit: Accounts Receivable (reduce AR)
   *
   * PAYMENT (Vendor Payment):
   * - Debit: Accounts Payable (reduce AP)
   * - Credit: Bank/Cash Account (amount paid)
   *
   * Payment allocations (if any) are already tracked in payment_allocations table
   * The journal entry records the actual cash/bank movement
   */
  private async createPaymentJournal(
    payment: any,
    tenantId: string,
    userId?: string,
  ): Promise<string> {
    const supabase = this.supabaseService.getClient();

    // Determine journal type based on payment type
    const journalTypeMap: Record<string, 'receipt' | 'payment'> = {
      receipt: 'receipt',
      payment: 'payment',
    };

    const journalType = journalTypeMap[payment.payment_type];
    if (!journalType) {
      throw new BadRequestException(`Invalid payment type: ${payment.payment_type}`);
    }

    // Get default accounts for this tenant
    const defaultAccounts = await this.getPaymentAccounts(tenantId, payment);

    // Build journal lines based on payment type
    const journalLines = this.buildPaymentJournalLines(payment, defaultAccounts);

    // Create journal entry
    const journal = await this.journalsService.create(
      {
        journalType,
        referenceNumber: payment.payment_number,
        descriptionAr: this.getPaymentDescriptionAr(payment),
        descriptionEn: this.getPaymentDescriptionEn(payment),
        transactionDate: new Date(payment.payment_date),
        currency: payment.currency,
        exchangeRate: payment.exchange_rate,
        sourceModule: 'payments',
        sourceId: payment.id,
        lines: journalLines,
      },
      tenantId,
      userId || payment.created_by,
      payment.branch_id,
    );

    return journal.id;
  }

  /**
   * Build journal lines based on payment type
   */
  private buildPaymentJournalLines(payment: any, defaultAccounts: any): Array<{
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

    // Build journal lines based on payment type
    switch (payment.payment_type) {
      case 'receipt':
        // RECEIPT: Debit Bank, Credit AR
        // Debit: Bank/Cash Account
        lines.push({
          lineNumber: lineNumber++,
          accountId: defaultAccounts.bank_account_id,
          descriptionAr: `استلام من عميل: ${payment.party_id}`,
          descriptionEn: `Receipt from customer: ${payment.party_id}`,
          debit: payment.amount,
          credit: 0,
        });

        // Credit: Accounts Receivable
        lines.push({
          lineNumber: lineNumber++,
          accountId: defaultAccounts.receivable_account_id,
          descriptionAr: `تحصيل حسابات مدينة`,
          descriptionEn: 'Accounts Receivable Collection',
          debit: 0,
          credit: payment.amount,
        });
        break;

      case 'payment':
        // PAYMENT: Debit AP, Credit Bank
        // Debit: Accounts Payable
        lines.push({
          lineNumber: lineNumber++,
          accountId: defaultAccounts.payable_account_id,
          descriptionAr: `دفع لمورد: ${payment.party_id}`,
          descriptionEn: `Payment to vendor: ${payment.party_id}`,
          debit: payment.amount,
          credit: 0,
        });

        // Credit: Bank/Cash Account
        lines.push({
          lineNumber: lineNumber++,
          accountId: defaultAccounts.bank_account_id,
          descriptionAr: `دفع نقداً/بنك`,
          descriptionEn: 'Cash/Bank Payment',
          debit: 0,
          credit: payment.amount,
        });
        break;

      default:
        throw new BadRequestException(`Unsupported payment type: ${payment.payment_type}`);
    }

    return lines;
  }

  /**
   * Get default accounts for payment posting
   */
  private async getPaymentAccounts(tenantId: string, payment: any) {
    const supabase = this.supabaseService.getClient();

    // Get Accounts Receivable account (asset)
    const { data: arAccount } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('type', 'asset')
      .ilike('name_en', '%receivable%')
      .limit(1)
      .single();

    // Get Accounts Payable account (liability)
    const { data: apAccount } = await supabase
      .from('chart_of_accounts')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('type', 'liability')
      .ilike('name_en', '%payable%')
      .limit(1)
      .single();

    // Determine bank account based on payment method and bank_account_id
    let bankAccountId: string | null = null;

    // If payment has a specific bank_account_id, use it
    if (payment.bank_account_id) {
      bankAccountId = payment.bank_account_id;
    } else {
      // Otherwise, try to find a default bank/cash account based on payment method
      const accountTypeFilter = payment.payment_method === 'cash' ? 'cash' : 'bank';

      const { data: bankAccount } = await supabase
        .from('chart_of_accounts')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('type', 'asset')
        .or(`name_en.ilike.%${accountTypeFilter}%,name_en.ilike.%current%asset%`)
        .limit(1)
        .single();

      bankAccountId = bankAccount?.id || null;
    }

    // If required accounts don't exist, throw an error
    if (payment.payment_type === 'receipt' && !arAccount?.id) {
      throw new BadRequestException('Accounts Receivable account not found. Please create an asset account with "receivable" in the name.');
    }
    if (payment.payment_type === 'payment' && !apAccount?.id) {
      throw new BadRequestException('Accounts Payable account not found. Please create a liability account with "payable" in the name.');
    }
    if (!bankAccountId) {
      throw new BadRequestException('Bank/Cash account not found. Please create an asset account with "bank" or "cash" in the name, or specify a bank account in the payment.');
    }

    return {
      receivable_account_id: arAccount?.id,
      payable_account_id: apAccount?.id,
      bank_account_id: bankAccountId,
    };
  }

  private getPaymentDescriptionAr(payment: any): string {
    const descriptions: Record<string, string> = {
      receipt: `سند قبض رقم ${payment.payment_number}`,
      payment: `سند صرف رقم ${payment.payment_number}`,
    };
    return descriptions[payment.payment_type] || `سند رقم ${payment.payment_number}`;
  }

  private getPaymentDescriptionEn(payment: any): string {
    const descriptions: Record<string, string> = {
      receipt: `Receipt ${payment.payment_number}`,
      payment: `Payment ${payment.payment_number}`,
    };
    return descriptions[payment.payment_type] || `Payment ${payment.payment_number}`;
  }
}

export type { PaymentAllocation };
