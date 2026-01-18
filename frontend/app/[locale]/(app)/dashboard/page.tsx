/**
 * page Page
 *
 * Route page component for /
 *
 * @fileoverview page page component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { useEffect, useState, Suspense, lazy, memo, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import { usePageTitle } from "@/hooks/use-page-title";
import {
  getDashboardData,
  type DashboardStats,
  type RecentInvoice,
  type RecentPayment,
  type ChartData,
} from "@/lib/api/dashboard";
import { toast } from "sonner";
import { CHART } from "@/lib/constants";
import logger from "@/lib/logger";

// Lazy load chart components to reduce initial bundle size
// Recharts is ~200KB - this saves significant initial load time
const DashboardChart = lazy(() =>
  import("./components/dashboard-chart").then((m) => ({ default: m.DashboardChart }))
);

// Memoized StatCard for performance
const StatCard = memo(
  ({
    title,
    value,
    change,
    icon,
    trend,
    locale,
  }: {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
    trend: "up" | "down";
    locale: string;
  }) => {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {icon}
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{value}</div>
          <p
            className={cn(
              "text-xs flex items-center gap-1 mt-1",
              trend === "up"
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            )}
          >
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            {change > 0 ? "+" : ""}
            {change}% from last month
          </p>
        </CardContent>
      </Card>
    );
  }
);
StatCard.displayName = "StatCard";

// Memoized Invoice Row for performance
const InvoiceRow = memo(
  ({
    invoice,
    formatCurrency,
    getStatusColor,
  }: {
    invoice: RecentInvoice;
    formatCurrency: (amount: number) => string;
    getStatusColor: (status: string) => string;
  }) => (
    <TableRow>
      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
      <TableCell>{invoice.customer_name}</TableCell>
      <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
      <TableCell>
        <span
          className={cn(
            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
            getStatusColor(invoice.status)
          )}
        >
          {invoice.status}
        </span>
      </TableCell>
    </TableRow>
  )
);
InvoiceRow.displayName = "InvoiceRow";

// Memoized Payment Row for performance
const PaymentRow = memo(
  ({
    payment,
    formatCurrency,
  }: {
    payment: RecentPayment;
    formatCurrency: (amount: number) => string;
  }) => (
    <TableRow>
      <TableCell className="font-medium">{payment.payment_number}</TableCell>
      <TableCell>{payment.customer_name}</TableCell>
      <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
      <TableCell className="capitalize">{payment.method}</TableCell>
    </TableRow>
  )
);
PaymentRow.displayName = "PaymentRow";

// Skeleton loader for initial load
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-8 w-48 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded" />
        <div className="h-4 w-64 animate-pulse bg-zinc-200 dark:bg-zinc-800 rounded mt-2" />
      </div>
    </div>
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[1, 2, 3, 4].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-32 mb-2" />
            <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  </div>
);

// Chart loading fallback
const ChartLoader = () => (
  <div
    className="flex items-center justify-center text-zinc-500"
    style={{ height: `${CHART.DEFAULT_HEIGHT}px` }}
  >
    <div className="flex flex-col items-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="text-sm">Loading chart...</span>
    </div>
  </div>
);

function DashboardPageContent() {
  const t = useTranslations("dashboard");
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const { user } = useAuth();

  // Set page title for WCAG 2.1 AA compliance
  usePageTitle("dashboard.title", "Accounting SaaS");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);

  // Memoize formatCurrency to prevent recreation on every render
  const formatCurrency = useCallback(
    (amount: number) => {
      return new Intl.NumberFormat(locale === "ar" ? "ar-QA" : "en-QA", {
        style: "currency",
        currency: "QAR",
      }).format(amount);
    },
    [locale]
  );

  // Memoize getStatusColor to prevent recreation
  const getStatusColor = useCallback((status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
      sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      cancelled: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200",
    };
    return colors[status] || colors.draft;
  }, []);

  // Fetch data with useCallback for stability
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch dashboard data from API
      const data = await getDashboardData();

      setStats(data.stats);
      setChartData(data.chartData);
      setRecentInvoices(data.recentInvoices);
      setRecentPayments(data.recentPayments);

      setLoading(false);
    } catch (error) {
      logger.error("Error fetching dashboard data", error as Error);
      toast.error(error instanceof Error ? error.message : "Failed to load dashboard data");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {t("welcome")}, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>
      </div>

      {/* Quick Actions - MOVED TO TOP */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href={`/${locale}/sales/invoices/new`}>
                <FileText className="mr-2 h-4 w-4" />
                New Invoice
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/sales/payments/new`}>
                <DollarSign className="mr-2 h-4 w-4" />
                New Payment
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/${locale}/accounting/journals/new`}>
                <Plus className="mr-2 h-4 w-4" />
                New Journal
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalRevenue")}
          value={formatCurrency(stats?.totalRevenue || 0)}
          change={stats?.revenueChange || 0}
          icon={<TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
          trend="up"
          locale={locale}
        />
        <StatCard
          title={t("totalExpenses")}
          value={formatCurrency(stats?.totalExpenses || 0)}
          change={stats?.expenseChange || 0}
          icon={<TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
          trend="down"
          locale={locale}
        />
        <StatCard
          title={t("netProfit")}
          value={formatCurrency(stats?.netProfit || 0)}
          change={stats?.profitChange || 0}
          icon={<DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          trend="up"
          locale={locale}
        />
        <StatCard
          title={t("cashBalance")}
          value={formatCurrency(stats?.cashBalance || 0)}
          change={stats?.balanceChange || 0}
          icon={<Wallet className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
          trend="up"
          locale={locale}
        />
      </div>

      {/* Revenue vs Expenses Chart - Lazy Loaded */}
      <Card>
        <CardHeader>
          <CardTitle>{t("overview")}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <Suspense fallback={<ChartLoader />}>
              <DashboardChart
                data={chartData}
                formatCurrency={formatCurrency}
                totalRevenueLabel={t("totalRevenue")}
                totalExpensesLabel={t("totalExpenses")}
              />
            </Suspense>
          ) : (
            <div
              className="flex items-center justify-center text-zinc-500"
              style={{ height: `${CHART.DEFAULT_HEIGHT}px` }}
            >
              No chart data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Invoices and Payments */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("recentInvoices")}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/sales/invoices`}>View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentInvoices.map((invoice) => (
                    <InvoiceRow
                      key={invoice.id}
                      invoice={invoice}
                      formatCurrency={formatCurrency}
                      getStatusColor={getStatusColor}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No recent invoices</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href={`/${locale}/sales/invoices/new`}>Create your first invoice</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Payments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t("recentPayments")}</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href={`/${locale}/sales/payments`}>View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentPayments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPayments.map((payment) => (
                    <PaymentRow
                      key={payment.id}
                      payment={payment}
                      formatCurrency={formatCurrency}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <DollarSign className="h-12 w-12 text-zinc-400 mb-4" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">No recent payments</p>
                <Button asChild variant="link" className="mt-2">
                  <Link href={`/${locale}/sales/payments/new`}>Record your first payment</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardPageContent />
    </Suspense>
  );
}