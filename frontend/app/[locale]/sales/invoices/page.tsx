'use client';

import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Eye, Edit, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

interface Invoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  customer_name: string;
  status: 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  subtotal: number;
  vat: number;
  total: number;
  paid: number;
  balance: number;
}

export default function InvoicesPage() {
  const t = useTranslations('invoices');
  const [search, setSearch] = useState('');
  const [invoices] = useState<Invoice[]>([
    {
      id: '1',
      invoice_number: 'INV-001',
      invoice_date: '2026-01-14',
      due_date: '2026-02-14',
      customer_name: 'ABC Trading Co.',
      status: 'sent',
      subtotal: 10000,
      vat: 500,
      total: 10500,
      paid: 0,
      balance: 10500,
    },
    {
      id: '2',
      invoice_number: 'INV-002',
      invoice_date: '2026-01-10',
      due_date: '2026-02-10',
      customer_name: 'XYZ Industries',
      status: 'partial',
      subtotal: 25000,
      vat: 1250,
      total: 26250,
      paid: 10000,
      balance: 16250,
    },
    {
      id: '3',
      invoice_number: 'INV-003',
      invoice_date: '2026-01-01',
      due_date: '2026-01-31',
      customer_name: 'Global Services Ltd',
      status: 'paid',
      subtotal: 15000,
      vat: 750,
      total: 15750,
      paid: 15750,
      balance: 0,
    },
  ]);

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      draft: 'secondary',
      sent: 'outline',
      partial: 'outline',
      paid: 'default',
      overdue: 'destructive',
      cancelled: 'secondary',
    };
    return (
      <Badge variant={variants[status] || 'secondary'}>
        {t(`statuses.${status}` as any)}
      </Badge>
    );
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
      inv.customer_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">
              Manage your customer invoices
            </p>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t('addInvoice')}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Invoices</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="search"
                  placeholder={t('search')}
                  className="w-64 pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('invoiceNumber')}</TableHead>
                  <TableHead>{t('invoiceDate')}</TableHead>
                  <TableHead>{t('dueDate')}</TableHead>
                  <TableHead>{t('customer')}</TableHead>
                  <TableHead>{t('status')}</TableHead>
                  <TableHead className="text-right">{t('subtotal')}</TableHead>
                  <TableHead className="text-right">{t('vat')}</TableHead>
                  <TableHead className="text-right">{t('total')}</TableHead>
                  <TableHead className="text-right">{t('balance')}</TableHead>
                  <TableHead className="text-right">{t('actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">
                      {invoice.invoice_number}
                    </TableCell>
                    <TableCell>{invoice.invoice_date}</TableCell>
                    <TableCell>{invoice.due_date}</TableCell>
                    <TableCell>{invoice.customer_name}</TableCell>
                    <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                    <TableCell className="text-right">
                      QAR {invoice.subtotal.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      QAR {invoice.vat.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      QAR {invoice.total.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      QAR {invoice.balance.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}
