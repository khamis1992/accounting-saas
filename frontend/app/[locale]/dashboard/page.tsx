'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  FileText,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

// Types
interface DashboardStats {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  cashBalance: number;
  revenueChange: number;
  expenseChange: number;
  profitChange: number;
  balanceChange: number;
}

interface RecentInvoice {
  id: string;
  invoice_number: string;
  customer_name: string;
  total: number;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  due_date: string;
}

interface RecentPayment {
  id: string;
  payment_number: string;
  customer_name: string;
  amount: number;
  payment_date: string;
  method: 'cash' | 'bank' | 'card' | 'cheque';
}

interface ChartData {
  name: string;
  revenue: number;
  expenses: number;
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const locale = useLocale();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<RecentInvoice[]>([]);
  const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API calls
      // const response = await fetch('/api/dashboard');
      // const data = await response.json();

      // Mock data for now
      setTimeout(() => {
        setStats({
          totalRevenue: 125000,
          totalExpenses: 82000,
          netProfit: 43000,
          cashBalance: 68000,
          revenueChange: 12.5,
          expenseChange: -8.2,
          profitChange: 18.3,
          balanceChange: 5.1,
        });

        setChartData([
          { name: 'Jan', revenue: 45000, expenses: 32000 },
          { name: 'Feb', revenue: 52000, expenses: 38000 },
          { name: 'Mar', revenue: 48000, expenses: 35000 },
          { name: 'Apr', revenue: 61000, expenses: 42000 },
          { name: 'May', revenue: 55000, expenses: 39000 },
          { name: 'Jun', revenue: 67000, expenses: 45000 },
        ]);

        setRecentInvoices([
          {
            id: '1',
            invoice_number: 'INV-001',
            customer_name: 'ABC Company',
            total: 15000,
            status: 'paid',
            due_date: '2024-01-10',
          },
          {
            id: '2',
            invoice_number: 'INV-002',
            customer_name: 'XYZ Ltd',
            total: 8500,
            status: 'sent',
            due_date: '2024-01-15',
          },
          {
            id: '3',
            invoice_number: 'INV-003',
            customer_name: 'Tech Solutions',
            total: 22000,
            status: 'partial',
            due_date: '2024-01-12',
          },
          {
            id: '4',
            invoice_number: 'INV-004',
            customer_name: 'Global Trade',
            total: 12500,
            status: 'overdue',
            due_date: '2024-01-05',
          },
        ]);

        setRecentPayments([
          {
            id: '1',
            payment_number: 'PAY-001',
            customer_name: 'ABC Company',
            amount: 15000,
            payment_date: '2024-01-10',
            method: 'bank',
          },
          {
            id: '2',
            payment_number: 'PAY-002',
            customer_name: 'Tech Solutions',
            amount: 10000,
            payment_date: '2024-01-12',
            method: 'bank',
          },
          {
            id: '3',
            payment_number: 'PAY-003',
            customer_name: 'XYZ Ltd',
            amount: 5000,
            payment_date: '2024-01-14',
            method: 'cash',
          },
        ]);

        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Empty dependency array is intentional - we only want to fetch on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale === 'ar' ? 'ar-QA' : 'en-QA', {
      style: 'currency',
      currency: 'QAR',
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
      sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      overdue: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      cancelled: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
    };
    return colors[status] || colors.draft;
  };

  const StatCard = ({
    title,
    value,
    change,
    icon,
    trend,
  }: {
    title: string;
    value: string;
    change: number;
    icon: React.ReactNode;
    trend: 'up' | 'down';
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p
          className={cn(
            'text-xs flex items-center gap-1 mt-1',
            trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          )}
        >
          {trend === 'up' ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {change > 0 ? '+' : ''}
          {change}% from last month
        </p>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold animate-pulse bg-zinc-200 dark:bg-zinc-800 h-8 w-48 rounded" />
            <p className="text-zinc-600 dark:text-zinc-400 mt-2 animate-pulse bg-zinc-200 dark:bg-zinc-800 h-4 w-64 rounded" />
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
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">
            {t('welcome')}, {user?.user_metadata?.full_name || user?.email}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/${locale}/dashboard`}>
              <Plus className="mr-2 h-4 w-4" />
              {t('common.new')}
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t('totalRevenue')}
          value={formatCurrency(stats?.totalRevenue || 0)}
          change={stats?.revenueChange || 0}
          icon={<TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />}
          trend="up"
        />
        <StatCard
          title={t('totalExpenses')}
          value={formatCurrency(stats?.totalExpenses || 0)}
          change={stats?.expenseChange || 0}
          icon={<TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />}
          trend="down"
        />
        <StatCard
          title={t('netProfit')}
          value={formatCurrency(stats?.netProfit || 0)}
          change={stats?.profitChange || 0}
          icon={<DollarSign className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          trend="up"
        />
        <StatCard
          title={t('cashBalance')}
          value={formatCurrency(stats?.cashBalance || 0)}
          change={stats?.balanceChange || 0}
          icon={<Wallet className="h-4 w-4 text-orange-600 dark:text-orange-400" />}
          trend="up"
        />
      </div>

      {/* Revenue vs Expenses Chart */}
      <Card>
        <CardHeader>
          <CardTitle>{t('overview')}</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
                <XAxis
                  dataKey="name"
                  className="text-zinc-600 dark:text-zinc-400"
                  tick={{ fill: 'currentColor' }}
                />
                <YAxis
                  className="text-zinc-600 dark:text-zinc-400"
                  tick={{ fill: 'currentColor' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number | undefined) => value != null ? formatCurrency(value) : ''}
                />
                <Legend />
                <Bar
                  dataKey="revenue"
                  name={t('totalRevenue')}
                  fill="hsl(var(--primary))"
                  radius={[8, 8, 0, 0]}
                />
                <Bar
                  dataKey="expenses"
                  name={t('totalExpenses')}
                  fill="hsl(var(--destructive))"
                  radius={[8, 8, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-zinc-500">
              No chart data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
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

      {/* Recent Invoices and Payments */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{t('recentInvoices')}</CardTitle>
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
                    <TableRow key={invoice.id}>
                      <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                      <TableCell>{invoice.customer_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(invoice.total)}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
                            getStatusColor(invoice.status)
                          )}
                        >
                          {invoice.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No recent invoices
                </p>
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
            <CardTitle>{t('recentPayments')}</CardTitle>
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
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.payment_number}</TableCell>
                      <TableCell>{payment.customer_name}</TableCell>
                      <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                      <TableCell className="capitalize">{payment.method}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <DollarSign className="h-12 w-12 text-zinc-400 mb-4" />
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  No recent payments
                </p>
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
