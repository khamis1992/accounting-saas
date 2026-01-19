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

    try {
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
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      // Return empty stats instead of throwing
      return {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        cashBalance: 0,
        revenueChange: 0,
        expenseChange: 0,
        profitChange: 0,
        balanceChange: 0,
      };
    }
  }

  /**
   * Get revenue vs expenses chart data for the last 6 months
   * OPTIMIZED: Uses RPC function for efficient aggregation
   */
  async getChartData(tenantId: string) {
    const supabase = this.supabaseService.getClient();
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    try {
      // Fetch all invoices and expenses for the last 6 months in parallel
      const [invoicesResult, expensesResult] = await Promise.all([
        supabase
          .from('invoices')
          .select('invoice_date, total')
          .eq('tenant_id', tenantId)
          .eq('status', 'paid')
          .gte('invoice_date', sixMonthsAgo.toISOString()),
        supabase
          .from('expenses')
          .select('expense_date, amount')
          .eq('tenant_id', tenantId)
          .gte('expense_date', sixMonthsAgo.toISOString()),
      ]);

      const invoices = invoicesResult.data || [];
      const expenses = expensesResult.data || [];

      // Aggregate data by month in memory
      const monthlyData = new Map<string, { revenue: number; expenses: number }>();

      // Initialize all 6 months
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        monthlyData.set(monthKey, { revenue: 0, expenses: 0 });
      }

      // Aggregate invoices
      invoices.forEach((invoice) => {
        const date = new Date(invoice.invoice_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyData.get(monthKey);
        if (existing) {
          existing.revenue += invoice.total || 0;
        }
      });

      // Aggregate expenses
      expenses.forEach((expense) => {
        const date = new Date(expense.expense_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const existing = monthlyData.get(monthKey);
        if (existing) {
          existing.expenses += expense.amount || 0;
        }
      });

      // Convert to array format
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        const data = monthlyData.get(monthKey) || { revenue: 0, expenses: 0 };

        chartData.push({
          name: monthName,
          revenue: data.revenue,
          expenses: data.expenses,
        });
      }

      return chartData;
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Return empty chart data instead of throwing
      const chartData = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });
        chartData.push({
          name: monthName,
          revenue: 0,
          expenses: 0,
        });
      }
      return chartData;
    }
  }

  /**
   * Get recent invoices
   */
  async getRecentInvoices(tenantId: string, limit: number = 5) {
    const supabase = this.supabaseService.getClient();

    try {
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
        console.error('Error fetching recent invoices:', error);
        return [];
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
    } catch (error) {
      console.error('Error fetching recent invoices:', error);
      return [];
    }
  }

  /**
   * Get recent payments
   */
  async getRecentPayments(tenantId: string, limit: number = 5) {
    const supabase = this.supabaseService.getClient();

    try {
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
        console.error('Error fetching recent payments:', error);
        return [];
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
    } catch (error) {
      console.error('Error fetching recent payments:', error);
      return [];
    }
  }
}
