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

/**
 * Bank Accounts Page
 * Displays all bank accounts with balances and quick actions
 */

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { bankingApi, BankAccount, AccountType } from "@/lib/api/banking";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  RefreshCw,
  Search,
  Plus,
  Eye,
  CheckCircle,
  Wallet,
  TrendingUp,
  TrendingDown,
  Building2,
} from "lucide-react";
import logger from "@/lib/logger";

export default function BankAccountsPage() {
  const t = useTranslations("banking.accounts");
  const common = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();

  // State
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [summary, setSummary] = useState<{
    totalBalance: number;
    activeAccounts: number;
    thisMonthChanges: number;
    currency: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<AccountType | "all">("all");

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accountsData, summaryData] = await Promise.all([
        bankingApi.getAccounts(),
        bankingApi.getSummary(),
      ]);
      setAccounts(accountsData);
      setSummary(summaryData);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load bank accounts");
      logger.error("Failed to fetch bank accounts", error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-QA", {
      style: "currency",
      currency: "QAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Get account type badge
  const getAccountTypeBadge = (type: AccountType) => {
    const variants: Record<AccountType, "default" | "secondary" | "outline"> = {
      checking: "default",
      savings: "secondary",
      "credit-card": "outline",
    };
    return variants[type];
  };

  // Filter accounts
  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      searchQuery === "" ||
      account.account_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.bank_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      account.account_number.includes(searchQuery);

    const matchesType = typeFilter === "all" || account.account_type === typeFilter;

    return matchesSearch && matchesType;
  });

  // Get account type icon
  const getAccountTypeIcon = (type: AccountType) => {
    switch (type) {
      case "checking":
        return <Building2 className="h-4 w-4" />;
      case "savings":
        return <Wallet className="h-4 w-4" />;
      case "credit-card":
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Building2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => router.push(`/${locale}/banking/accounts/new`)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("newAccount")}
            </Button>
            <Button size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {common("refresh")}
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("summary.totalBalance")}</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary ? formatCurrency(summary.totalBalance) : "-"}
              </div>
              <p className="text-xs text-muted-foreground">
                {t("summary.acrossAccounts", { count: summary?.activeAccounts || 0 })}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("summary.thisMonthChanges")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary ? formatCurrency(summary.thisMonthChanges) : "-"}
              </div>
              <p className="text-xs text-muted-foreground">{t("summary.netChange")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("summary.activeAccounts")}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.activeAccounts || 0}</div>
              <p className="text-xs text-muted-foreground">{t("summary.accounts")}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("filters.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {/* Search */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("filters.search")}</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder={t("filters.searchPlaceholder")}
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Account Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("filters.accountType")}</label>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => setTypeFilter(value as AccountType | "all")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("filters.allTypes")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                    <SelectItem value="checking">{t("accountTypes.checking")}</SelectItem>
                    <SelectItem value="savings">{t("accountTypes.savings")}</SelectItem>
                    <SelectItem value="credit-card">{t("accountTypes.creditCard")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Clear Filters */}
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                  }}
                  disabled={searchQuery === "" && typeFilter === "all"}
                >
                  {t("filters.clear")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Accounts Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("table.title")}</CardTitle>
              {!loading && filteredAccounts.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {common("showing")} {filteredAccounts.length} {t("table.accounts")}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">{common("loading")}</p>
                </div>
              </div>
            ) : filteredAccounts.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8">
                <Wallet className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">{t("empty.title")}</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  {t("empty.description")}
                </p>
                <Button variant="outline" size="sm" onClick={() => router.push(`/${locale}/banking/accounts/new`)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {t("newAccount")}
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.accountName")}</TableHead>
                      <TableHead>{t("table.bankName")}</TableHead>
                      <TableHead>{t("table.accountType")}</TableHead>
                      <TableHead>{t("table.accountNumber")}</TableHead>
                      <TableHead className="text-right">{t("table.balance")}</TableHead>
                      <TableHead>{t("table.lastReconciled")}</TableHead>
                      <TableHead>{t("table.status")}</TableHead>
                      <TableHead className="text-right">{common("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAccounts.map((account) => (
                      <TableRow key={account.id}>
                        <TableCell className="font-medium">{account.account_name}</TableCell>
                        <TableCell>{account.bank_name}</TableCell>
                        <TableCell>
                          <Badge
                            variant={getAccountTypeBadge(account.account_type)}
                            className="gap-1"
                          >
                            {getAccountTypeIcon(account.account_type)}
                            {t(`accountTypes.${account.account_type}`)}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {account.account_number}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(account.balance)}
                        </TableCell>
                        <TableCell className="text-sm">
                          {account.last_reconciled_at ? (
                            <div className="flex items-center gap-1">
                              <CheckCircle className="h-3 w-3 text-green-600" />
                              {format(new Date(account.last_reconciled_at), "MMM dd, yyyy")}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant={account.is_active ? "default" : "secondary"}>
                            {account.is_active ? common("active") : common("inactive")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/banking/accounts/${account.id}/transactions`)
                              }
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                router.push(`/banking/reconciliation?accountId=${account.id}`)
                              }
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
