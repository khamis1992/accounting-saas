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
    // TEMPORARY FIX: Return empty data immediately to prevent timeout
    // TODO: Investigate and fix slow queries
    return {
      stats: {
        totalRevenue: 0,
        totalExpenses: 0,
        netProfit: 0,
        cashBalance: 0,
        revenueChange: 0,
        expenseChange: 0,
        profitChange: 0,
        balanceChange: 0,
      },
      chartData: this.getEmptyChartData(),
      recentInvoices: [],
      recentPayments: [],
    };
  }

  /**
   * Get empty chart data for the last 6 months
   */
  private getEmptyChartData() {
    const chartData = [];
    const now = new Date();
    
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

  /**
   * Get dashboard statistics
   */
  async getStats(tenantId: string) {
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

  /**
   * Get revenue vs expenses chart data for the last 6 months
   */
  async getChartData(tenantId: string) {
    return this.getEmptyChartData();
  }

  /**
   * Get recent invoices
   */
  async getRecentInvoices(tenantId: string, limit: number = 5) {
    return [];
  }

  /**
   * Get recent payments
   */
  async getRecentPayments(tenantId: string, limit: number = 5) {
    return [];
  }
}
