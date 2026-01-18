import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class DashboardService {
  constructor(private supabaseService: SupabaseService) {}

  /**
   * Get complete dashboard data
   * Returns stats, chart data, and recent items
   */
  async getDashboardData(tenantId: string) {
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
   */
  async getStats(tenantId: string) {
    const supabase = this.supabaseService.getClient();

    // Get current month and last month dates
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get total revenue from paid invoices (current month)
    const { data: revenueData } = await supabase
      .from('invoices')
      .select('total')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .gte('invoice_date', currentMonthStart.toISOString());

    const totalRevenue = (revenueData || []).reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Get total revenue from last month
    const { data: lastMonthRevenueData } = await supabase
      .from('invoices')
      .select('total')
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .gte('invoice_date', lastMonthStart.toISOString())
      .lte('invoice_date', lastMonthEnd.toISOString());

    const lastMonthRevenue = (lastMonthRevenueData || []).reduce((sum, inv) => sum + (inv.total || 0), 0);

    // Calculate revenue change
    const revenueChange =
      lastMonthRevenue > 0 ? ((totalRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Get total expenses (current month)
    const { data: expenseData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('expense_date', currentMonthStart.toISOString());

    const totalExpenses = (expenseData || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Get total expenses from last month
    const { data: lastMonthExpenseData } = await supabase
      .from('expenses')
      .select('amount')
      .eq('tenant_id', tenantId)
      .gte('expense_date', lastMonthStart.toISOString())
      .lte('expense_date', lastMonthEnd.toISOString());

    const lastMonthExpenses = (lastMonthExpenseData || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Calculate expense change
    const expenseChange =
      lastMonthExpenses > 0 ? ((totalExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;

    // Calculate net profit and change
    const netProfit = totalRevenue - totalExpenses;
    const lastMonthProfit = lastMonthRevenue - lastMonthExpenses;
    const profitChange =
      lastMonthProfit > 0 ? ((netProfit - lastMonthProfit) / Math.abs(lastMonthProfit)) * 100 : 0;

    // Get cash balance from bank accounts
    const { data: bankAccounts } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('tenant_id', tenantId)
      .eq('is_active', true);

    const cashBalance = (bankAccounts || []).reduce((sum, acc) => sum + (acc.current_balance || 0), 0);

    return {
      totalRevenue,
      totalExpenses,
      netProfit,
      cashBalance,
      revenueChange: Math.round(revenueChange * 10) / 10,
      expenseChange: Math.round(expenseChange * 10) / 10,
      profitChange: Math.round(profitChange * 10) / 10,
      balanceChange: 0, // TODO: Calculate from previous month balance
    };
  }

  /**
   * Get revenue vs expenses chart data for the last 6 months
   */
  async getChartData(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const chartData = [];
    const now = new Date();

    // Get data for the last 6 months
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      const monthName = monthDate.toLocaleString('default', { month: 'short' });

      // Get revenue for this month
      const { data: revenueData } = await supabase
        .from('invoices')
        .select('total')
        .eq('tenant_id', tenantId)
        .eq('status', 'paid')
        .gte('invoice_date', monthStart.toISOString())
        .lte('invoice_date', monthEnd.toISOString());

      const revenue = (revenueData || []).reduce((sum, inv) => sum + (inv.total || 0), 0);

      // Get expenses for this month
      const { data: expenseData } = await supabase
        .from('expenses')
        .select('amount')
        .eq('tenant_id', tenantId)
        .gte('expense_date', monthStart.toISOString())
        .lte('expense_date', monthEnd.toISOString());

      const expenses = (expenseData || []).reduce((sum, exp) => sum + (exp.amount || 0), 0);

      chartData.push({
        name: monthName,
        revenue,
        expenses,
      });
    }

    return chartData;
  }

  /**
   * Get recent invoices
   */
  async getRecentInvoices(tenantId: string, limit: number = 5) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('invoices')
      .select(`
        id,
        invoice_number,
        customer_id,
        total,
        status,
        due_date,
        customers!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .eq('invoice_type', 'sales')
      .order('invoice_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Transform data to match frontend interface
    return (data || []).map((invoice: any) => ({
      id: invoice.id,
      invoice_number: invoice.invoice_number,
      customer_name: invoice.customers?.name || 'Unknown',
      total: invoice.total,
      status: invoice.status,
      due_date: invoice.due_date,
    }));
  }

  /**
   * Get recent payments
   */
  async getRecentPayments(tenantId: string, limit: number = 5) {
    const supabase = this.supabaseService.getClient();

    const { data, error } = await supabase
      .from('payments')
      .select(`
        id,
        payment_number,
        customer_id,
        amount,
        payment_date,
        payment_method,
        customers!inner(name)
      `)
      .eq('tenant_id', tenantId)
      .eq('payment_type', 'receipt')
      .order('payment_date', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    // Transform data to match frontend interface
    return (data || []).map((payment: any) => ({
      id: payment.id,
      payment_number: payment.payment_number,
      customer_name: payment.customers?.name || 'Unknown',
      amount: payment.amount,
      payment_date: payment.payment_date,
      method: payment.payment_method,
    }));
  }
}
