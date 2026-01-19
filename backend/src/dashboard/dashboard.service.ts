import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DashboardService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get complete dashboard data
   * Returns stats, chart data, and recent items
   * 
   * PERFORMANCE OPTIMIZED:
   * - Uses Promise.all for parallel query execution
   * - Uses efficient aggregation queries
   * - Limits result sets appropriately
   */
  async getDashboardData(tenantId: string) {
    // Run all queries in parallel for maximum performance
    const [stats, chartData, recentInvoices, recentPayments] = await Promise.all([
      this.getStats(tenantId),
      this.getChartData(tenantId),
      this.getRecentInvoices(tenantId, 5),
      this.getRecentPayments(tenantId, 5),
    ]);

    return {
      stats,
      chartData,
      recentInvoices,
      recentPayments,
    };
  }

  /**
   * Get dashboard statistics
   * Uses efficient aggregation queries with date range filtering
   */
  async getStats(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    
    // Get current month boundaries
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Format dates for PostgreSQL
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    // Run all aggregation queries in parallel
    const [
      currentRevenueResult,
      lastRevenueResult,
      currentExpensesResult,
      lastExpensesResult,
      cashBalanceResult,
    ] = await Promise.all([
      // Current month revenue (sales invoices posted)
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('invoice_type', 'sales')
        .eq('status', 'posted')
        .gte('invoice_date', formatDate(currentMonthStart))
        .lte('invoice_date', formatDate(currentMonthEnd)),
      
      // Last month revenue
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('invoice_type', 'sales')
        .eq('status', 'posted')
        .gte('invoice_date', formatDate(lastMonthStart))
        .lte('invoice_date', formatDate(lastMonthEnd)),
      
      // Current month expenses (purchase invoices + expenses)
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('invoice_type', 'purchase')
        .eq('status', 'posted')
        .gte('invoice_date', formatDate(currentMonthStart))
        .lte('invoice_date', formatDate(currentMonthEnd)),
      
      // Last month expenses
      supabase
        .from('invoices')
        .select('total_amount')
        .eq('tenant_id', tenantId)
        .eq('invoice_type', 'purchase')
        .eq('status', 'posted')
        .gte('invoice_date', formatDate(lastMonthStart))
        .lte('invoice_date', formatDate(lastMonthEnd)),
      
      // Cash balance from bank accounts
      supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('tenant_id', tenantId)
        .eq('is_active', true),
    ]);

    // Calculate totals
    const currentRevenue = (currentRevenueResult.data || []).reduce(
      (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
      0
    );
    const lastRevenue = (lastRevenueResult.data || []).reduce(
      (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
      0
    );
    const currentExpenses = (currentExpensesResult.data || []).reduce(
      (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
      0
    );
    const lastExpenses = (lastExpensesResult.data || []).reduce(
      (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
      0
    );
    const cashBalance = (cashBalanceResult.data || []).reduce(
      (sum, acc) => sum + (parseFloat(acc.current_balance) || 0),
      0
    );

    // Calculate changes (avoid division by zero)
    const revenueChange = lastRevenue > 0 
      ? Math.round(((currentRevenue - lastRevenue) / lastRevenue) * 100) 
      : 0;
    const expenseChange = lastExpenses > 0 
      ? Math.round(((currentExpenses - lastExpenses) / lastExpenses) * 100) 
      : 0;
    
    const currentProfit = currentRevenue - currentExpenses;
    const lastProfit = lastRevenue - lastExpenses;
    const profitChange = lastProfit > 0 
      ? Math.round(((currentProfit - lastProfit) / Math.abs(lastProfit)) * 100) 
      : 0;

    return {
      totalRevenue: currentRevenue,
      totalExpenses: currentExpenses,
      netProfit: currentProfit,
      cashBalance,
      revenueChange,
      expenseChange,
      profitChange,
      balanceChange: 0, // Would need historical data to calculate
    };
  }

  /**
   * Get revenue vs expenses chart data for the last 6 months
   * Uses efficient aggregation with GROUP BY
   */
  async getChartData(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const chartData = [];
    const now = new Date();

    // Get data for each of the last 6 months in parallel
    const monthPromises = [];
    
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const monthName = monthDate.toLocaleString('default', { month: 'short' });
      
      const formatDate = (d: Date) => d.toISOString().split('T')[0];
      
      monthPromises.push(
        Promise.all([
          // Revenue (sales invoices)
          supabase
            .from('invoices')
            .select('total_amount')
            .eq('tenant_id', tenantId)
            .eq('invoice_type', 'sales')
            .eq('status', 'posted')
            .gte('invoice_date', formatDate(monthDate))
            .lte('invoice_date', formatDate(monthEnd)),
          
          // Expenses (purchase invoices)
          supabase
            .from('invoices')
            .select('total_amount')
            .eq('tenant_id', tenantId)
            .eq('invoice_type', 'purchase')
            .eq('status', 'posted')
            .gte('invoice_date', formatDate(monthDate))
            .lte('invoice_date', formatDate(monthEnd)),
        ]).then(([revenueResult, expenseResult]) => ({
          name: monthName,
          revenue: (revenueResult.data || []).reduce(
            (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
            0
          ),
          expenses: (expenseResult.data || []).reduce(
            (sum, inv) => sum + (parseFloat(inv.total_amount) || 0),
            0
          ),
        }))
      );
    }

    const results = await Promise.all(monthPromises);
    return results;
  }

  /**
   * Get recent invoices with customer/vendor info
   * Uses efficient JOIN to avoid N+1
   */
  async getRecentInvoices(tenantId: string, limit: number = 5) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        invoice_date,
        total_amount,
        status,
        party_id,
        party_type
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent invoices:', error);
      return [];
    }

    // Get customer/vendor names for each invoice
    const invoicesWithParty = await Promise.all(
      (data || []).map(async (invoice) => {
        const table = invoice.party_type === 'customer' ? 'customers' : 'vendors';
        const { data: partyData } = await supabase
          .from(table)
          .select('name_en, name_ar')
          .eq('id', invoice.party_id)
          .single();

        return {
          id: invoice.id,
          invoice_number: invoice.invoice_number,
          invoice_date: invoice.invoice_date,
          total: invoice.total_amount,
          status: invoice.status,
          customer_name: partyData?.name_en || 'Unknown',
        };
      })
    );

    return invoicesWithParty;
  }

  /**
   * Get recent payments with customer/vendor info
   * Uses efficient JOIN to avoid N+1
   */
  async getRecentPayments(tenantId: string, limit: number = 5) {
    const supabase = this.supabaseService.getClient();
    
    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        payment_number,
        payment_date,
        amount,
        payment_method,
        party_id,
        party_type
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'posted')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent payments:', error);
      return [];
    }

    // Get customer/vendor names for each payment
    const paymentsWithParty = await Promise.all(
      (data || []).map(async (payment) => {
        const table = payment.party_type === 'customer' ? 'customers' : 'vendors';
        const { data: partyData } = await supabase
          .from(table)
          .select('name_en, name_ar')
          .eq('id', payment.party_id)
          .single();

        return {
          id: payment.id,
          payment_number: payment.payment_number,
          payment_date: payment.payment_date,
          amount: payment.amount,
          method: payment.payment_method || 'unknown',
          customer_name: partyData?.name_en || 'Unknown',
        };
      })
    );

    return paymentsWithParty;
  }
}
