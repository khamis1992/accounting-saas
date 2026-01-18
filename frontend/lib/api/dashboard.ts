/**
 * Dashboard API Client
 * Handles all dashboard-related API calls
 */

import { apiClient } from "./client";

// Types
export interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  revenueChange: number;
  expenseChange: number;
  profitChange: number;
  balanceChange: number;
}

export interface RecentInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  status: "draft" | "sent" | "partial" | "paid" | "overdue" | "cancelled";
  due_date: string;
}

export interface RecentPayment {
  id: string;
  payment_number: string;
  customer_name: string;
  amount: number;
  payment_date: string;
  method: "cash" | "bank" | "card" | "cheque";
}

export interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
}

export interface DashboardData {
  stats: DashboardStats;
  chartData: ChartData[];
  recentInvoices: RecentInvoice[];
  recentPayments: RecentPayment[];
}

/**
 * Get dashboard data
 * Returns statistics, chart data, and recent items
 */
export async function getDashboardData(): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>("/dashboard");

  if (response.error) {
    throw new Error(response.error);
  }

  return (
    response.data || {
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
      chartData: [],
      recentInvoices: [],
      recentPayments: [],
    }
  );
}

/**
 * Get dashboard statistics only
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  const response = await apiClient.get<DashboardStats>("/dashboard/stats");

  if (response.error) {
    throw new Error(response.error);
  }

  return (
    response.data || {
      totalRevenue: 0,
      totalExpenses: 0,
      netProfit: 0,
      cashBalance: 0,
      revenueChange: 0,
      expenseChange: 0,
      profitChange: 0,
      balanceChange: 0,
    }
  );
}

/**
 * Get revenue vs expenses chart data
 */
export async function getChartData(): Promise<ChartData[]> {
  const response = await apiClient.get<ChartData[]>("/dashboard/chart");

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data || [];
}

/**
 * Get recent invoices
 */
export async function getRecentInvoices(limit: number = 5): Promise<RecentInvoice[]> {
  const response = await apiClient.get<RecentInvoice[]>(`/dashboard/invoices?limit=${limit}`);

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data || [];
}

/**
 * Get recent payments
 */
export async function getRecentPayments(limit: number = 5): Promise<RecentPayment[]> {
  const response = await apiClient.get<RecentPayment[]>(`/dashboard/payments?limit=${limit}`);

  if (response.error) {
    throw new Error(response.error);
  }

  return response.data || [];
}
