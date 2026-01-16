'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  Building2,
  Wallet,
  FilePieChart,
  Settings,
  ChevronRight,
  LogOut,
  Menu,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href?: string;
  icon?: React.ReactNode;
  items?: NavItem[];
}

export function Sidebar() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Get tenant/company name from user metadata or use default
  const tenantName = user?.user_metadata?.company_name ||
                    user?.user_metadata?.full_name ||
                    'المحاسب';

  const navItems: NavItem[] = [
    {
      title: t('dashboard'),
      href: `/${locale}/dashboard`,
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      title: t('accounting'),
      icon: <FileText className="h-4 w-4" />,
      items: [
        { title: t('chartOfAccounts'), href: `/${locale}/accounting/coa`, icon: null },
        { title: t('journals'), href: `/${locale}/accounting/journals`, icon: null },
        { title: t('generalLedger'), href: `/${locale}/accounting/general-ledger`, icon: null },
        { title: t('trialBalance'), href: `/${locale}/accounting/trial-balance`, icon: null },
        {
          title: t('financialStatements'),
          href: `/${locale}/accounting/statements`,
          icon: null,
        },
      ],
    },
    {
      title: t('sales'),
      icon: <Users className="h-4 w-4" />,
      items: [
        { title: t('customers'), href: `/${locale}/sales/customers`, icon: null },
        { title: t('invoices'), href: `/${locale}/sales/invoices`, icon: null },
        { title: t('quotations'), href: `/${locale}/sales/quotations`, icon: null },
        { title: t('payments'), href: `/${locale}/sales/payments`, icon: null },
      ],
    },
    {
      title: t('purchases'),
      icon: <Package className="h-4 w-4" />,
      items: [
        { title: t('vendors'), href: `/${locale}/purchases/vendors`, icon: null },
        { title: t('purchaseOrders'), href: `/${locale}/purchases/orders`, icon: null },
        { title: t('expenses'), href: `/${locale}/purchases/expenses`, icon: null },
      ],
    },
    {
      title: t('banking'),
      icon: <Building2 className="h-4 w-4" />,
      items: [
        { title: t('bankAccounts'), href: `/${locale}/banking/accounts`, icon: null },
        { title: t('reconciliation'), href: `/${locale}/banking/reconciliation`, icon: null },
      ],
    },
    {
      title: t('assets'),
      icon: <Wallet className="h-4 w-4" />,
      items: [
        { title: t('fixedAssets'), href: `/${locale}/assets/fixed`, icon: null },
        { title: t('depreciation'), href: `/${locale}/assets/depreciation`, icon: null },
      ],
    },
    {
      title: t('tax'),
      icon: <FilePieChart className="h-4 w-4" />,
      items: [
        { title: t('vat'), href: `/${locale}/tax/vat`, icon: null },
        { title: t('vatReturns'), href: `/${locale}/tax/vat-returns`, icon: null },
      ],
    },
    {
      title: t('reports'),
      href: `/${locale}/reports`,
      icon: <FileText className="h-4 w-4" />,
    },
    {
      title: t('settings'),
      icon: <Settings className="h-4 w-4" />,
      items: [
        { title: t('company'), href: `/${locale}/settings/company`, icon: null },
        { title: t('users'), href: `/${locale}/settings/users`, icon: null },
        { title: t('roles'), href: `/${locale}/settings/roles`, icon: null },
        { title: t('fiscalYear'), href: `/${locale}/settings/fiscal`, icon: null },
        { title: t('costCenters'), href: `/${locale}/settings/cost-centers`, icon: null },
      ],
    },
  ];

  const isActive = (href: string) => {
    if (href === pathname) return true;
    if (href !== '/' && pathname.startsWith(href)) return true;
    return false;
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-50 border-b bg-white dark:bg-zinc-950 p-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="rounded-lg"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Sidebar - Desktop always visible, Mobile collapsible */}
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 w-64 flex-col border-r bg-zinc-50 dark:bg-zinc-900 transition-transform duration-300 ease-in-out lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:static lg:flex',
        )}
      >
        <div className="flex h-16 items-center justify-between border-b px-6">
          <Link href={`/${locale}/dashboard`} className="flex items-center gap-2">
            <span className="text-xl font-bold">{tenantName}</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileMenuOpen(false)}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navItems.map((item) =>
            item.items ? (
              <NavItemGroup key={item.title} item={item} isActive={isActive} />
            ) : item.href ? (
              <NavItem
                key={item.href}
                item={item}
                isActive={isActive(item.href)}
              />
            ) : null,
          )}
        </nav>

        <div className="border-t p-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="w-full justify-start gap-2 px-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.user_metadata.avatar_url} />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-1 flex-col items-start overflow-hidden">
                  <span className="text-sm font-medium truncate">
                    {user?.user_metadata.full_name || user?.email}
                  </span>
                  <span className="text-xs text-zinc-500 truncate">{user?.email}</span>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                {user?.user_metadata.full_name || user?.email}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href={`/${locale}/settings/profile`}>
                  {t('common.edit')} Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  signOut();
                  setIsMobileMenuOpen(false);
                }}
                className="text-red-600 dark:text-red-400"
              >
                <LogOut className="mr-2 h-4 w-4" />
                {t('auth.signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
    </>
  );
}

function NavItem({ item, isActive }: { item: NavItem; isActive: boolean }) {
  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
        isActive
          ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
          : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
      )}
    >
      {item.icon}
      {item.title}
    </Link>
  );
}

function NavItemGroup({
  item,
  isActive,
}: {
  item: NavItem;
  isActive: (href: string) => boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const hasActiveChild = item.items?.some((child) => child.href && isActive(child.href));

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors',
          hasActiveChild || isOpen
            ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
            : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
        )}
      >
        <div className="flex items-center gap-3">
          {item.icon}
          {item.title}
        </div>
        <ChevronRight
          className={cn(
            'h-4 w-4 transition-transform',
            isOpen && 'rotate-90',
          )}
        />
      </button>

      {isOpen && item.items && (
        <div className="mt-1 space-y-1 border-l-2 border-zinc-200 pl-4 dark:border-zinc-700">
          {item.items.filter((child) => child.href).map((child) => (
            <NavItem
              key={child.href}
              item={child}
              isActive={isActive(child.href!)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
