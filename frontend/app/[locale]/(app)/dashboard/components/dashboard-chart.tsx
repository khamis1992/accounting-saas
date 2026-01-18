/**
 * DashboardChart Component
 *
 * React component for UI functionality
 *
 * @fileoverview DashboardChart React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

/**
 * Lazy-loaded Chart Component
 *
 * This component is dynamically imported to reduce initial bundle size.
 * All chart-related imports (recharts ~200KB) are isolated here.
 */

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface DashboardChartProps {
  data: Array<{
    name: string;
    revenue: number;
    expenses: number;
  }>;
  formatCurrency: (amount: number) => string;
  totalRevenueLabel: string;
  totalExpensesLabel: string;
  height?: number;
}

export function DashboardChart({
  data,
  formatCurrency,
  totalRevenueLabel,
  totalExpensesLabel,
  height = 300,
}: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <XAxis
          dataKey="name"
          className="text-zinc-600 dark:text-zinc-400"
          tick={{ fill: "currentColor" }}
        />
        <YAxis className="text-zinc-600 dark:text-zinc-400" tick={{ fill: "currentColor" }} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "0.5rem",
          }}
          formatter={(value: number | undefined) => (value != null ? formatCurrency(value) : "")}
        />
        <Legend />
        <Bar
          dataKey="revenue"
          name={totalRevenueLabel}
          fill="hsl(var(--primary))"
          radius={[8, 8, 0, 0]}
        />
        <Bar
          dataKey="expenses"
          name={totalExpensesLabel}
          fill="hsl(var(--destructive))"
          radius={[8, 8, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
