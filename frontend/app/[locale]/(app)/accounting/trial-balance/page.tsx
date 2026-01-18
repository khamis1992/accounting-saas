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
 * Trial Balance Page
 * Displays debit vs credit comparison for all accounts with validation
 */

import React, { useState, useEffect } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Download, FileText, Printer } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { trialBalanceApi, TrialBalanceResponse } from "@/lib/api/trial-balance";
import { toast } from "sonner";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function TrialBalancePage() {
  const t = useTranslations("accounting.trialBalance");
  const common = useTranslations("common");

  const [asOfDate, setAsOfDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [fiscalPeriod, setFiscalPeriod] = useState<string>("all");
  const [showZeroBalances, setShowZeroBalances] = useState<boolean>(false);
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>("all");
  const [data, setData] = useState<TrialBalanceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchTrialBalance();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [asOfDate, fiscalPeriod, showZeroBalances, accountTypeFilter]);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | boolean> = {
        as_of_date: asOfDate,
        show_zero_balances: showZeroBalances,
      };
      if (fiscalPeriod && fiscalPeriod !== "all") filters.fiscal_period_id = fiscalPeriod;
      if (accountTypeFilter && accountTypeFilter !== "all") filters.account_type = accountTypeFilter;

      const response = await trialBalanceApi.get(filters);
      setData(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.fetchFailed");
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const filters: Record<string, string | boolean> = {
        as_of_date: asOfDate,
        show_zero_balances: showZeroBalances,
      };
      if (fiscalPeriod && fiscalPeriod !== "all") filters.fiscal_period_id = fiscalPeriod;
      if (accountTypeFilter && accountTypeFilter !== "all") filters.account_type = accountTypeFilter;

      const blob = await trialBalanceApi.exportToPDF(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trial-balance-${asOfDate}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t("exported"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export PDF";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const filters: Record<string, string | boolean> = {
        as_of_date: asOfDate,
        show_zero_balances: showZeroBalances,
      };
      if (fiscalPeriod && fiscalPeriod !== "all") filters.fiscal_period_id = fiscalPeriod;
      if (accountTypeFilter && accountTypeFilter !== "all") filters.account_type = accountTypeFilter;

      const blob = await trialBalanceApi.exportToExcel(filters);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trial-balance-${asOfDate}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t("exported"));
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export Excel";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-QA", {
      style: "currency",
      currency: "QAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const groupEntriesByType = (entries: TrialBalanceResponse["entries"], type: string) => {
    return entries.filter((entry) => entry.account_type === type);
  };

  const accountTypes = [
    { key: "asset", label: t("accountTypes.assets") },
    { key: "liability", label: t("accountTypes.liabilities") },
    { key: "equity", label: t("accountTypes.equity") },
    { key: "revenue", label: t("accountTypes.revenue") },
    { key: "expense", label: t("accountTypes.expenses") },
  ];

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={fetchTrialBalance}
              disabled={loading}
              title={common("refresh")}
            >
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
              <FileText className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="icon" onClick={handlePrint}>
              <Printer className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t("filters.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="asOfDate">{t("filters.asOfDate")}</Label>
                <Input
                  id="asOfDate"
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fiscalPeriod">{t("filters.fiscalPeriod")}</Label>
                <Select value={fiscalPeriod} onValueChange={setFiscalPeriod}>
                  <SelectTrigger id="fiscalPeriod">
                    <SelectValue placeholder={common("filter")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{common("all")}</SelectItem>
                    {/* TODO: Fetch fiscal periods from API */}
                    <SelectItem value="current">Current Period</SelectItem>
                    <SelectItem value="previous">Previous Period</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="accountType">{t("filters.accountType")}</Label>
                <Select value={accountTypeFilter} onValueChange={setAccountTypeFilter}>
                  <SelectTrigger id="accountType">
                    <SelectValue placeholder={common("filter")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{common("all")}</SelectItem>
                    {accountTypes.map((type) => (
                      <SelectItem key={type.key} value={type.key}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="showZeroBalances"
                    checked={showZeroBalances}
                    onCheckedChange={(checked) => setShowZeroBalances(checked as boolean)}
                  />
                  <Label htmlFor="showZeroBalances" className="cursor-pointer">
                    {t("filters.showZeroBalances")}
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loading State */}
        {loading && !data && (
          <Card>
            <CardContent className="py-8">
              <div className="flex flex-col items-center justify-center text-zinc-500">
                <RefreshCw className="h-8 w-8 animate-spin mb-4" />
                <p>{common("loading")}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Balance Status Card */}
        {data && data.summary && (
          <Card
            className={cn(
              "border-2",
              data.summary.is_balanced
                ? "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
                : "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
            )}
          >
            <CardContent className="py-6">
              <div className="flex items-center gap-4">
                {data.summary.is_balanced ? (
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                ) : (
                  <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                )}
                <div className="flex-1">
                  <h3
                    className={cn(
                      "text-lg font-semibold",
                      data.summary.is_balanced
                        ? "text-green-900 dark:text-green-100"
                        : "text-red-900 dark:text-red-100"
                    )}
                  >
                    {data.summary.is_balanced ? t("balanced") : t("notBalanced")}
                  </h3>
                  {!data.summary.is_balanced && (
                    <p
                      className={cn(
                        "text-sm",
                        data.summary.is_balanced
                          ? "text-green-700 dark:text-green-300"
                          : "text-red-700 dark:text-red-300"
                      )}
                    >
                      {t("difference")}: {formatCurrency(Math.abs(data.summary.difference))}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("table.totalDebit")}: {formatCurrency(data.summary.total_debit)}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    {t("table.totalCredit")}: {formatCurrency(data.summary.total_credit)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trial Balance Table */}
        {data && data.entries && data.entries.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Trial Balance</CardTitle>
                <Badge variant="outline">
                  {data.as_of_date ? new Date(data.as_of_date).toLocaleDateString() : asOfDate}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("table.accountCode")}</TableHead>
                      <TableHead>{t("table.accountName")}</TableHead>
                      <TableHead className="text-right">{t("table.debit")}</TableHead>
                      <TableHead className="text-right">{t("table.credit")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {accountTypes.map((type) => {
                      const typeEntries = groupEntriesByType(data.entries, type.key);
                      if (typeEntries.length === 0) return null;

                      const subtotal = data.subtotals[type.key as keyof typeof data.subtotals];

                      return (
                        <React.Fragment key={type.key}>
                          {/* Subtotal Header */}
                          <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold">
                            <TableCell colSpan={2} className="text-zinc-900 dark:text-zinc-100">
                              {type.label}
                            </TableCell>
                            <TableCell className="text-right text-zinc-900 dark:text-zinc-100">
                              {subtotal ? formatCurrency(subtotal.debit) : formatCurrency(0)}
                            </TableCell>
                            <TableCell className="text-right text-zinc-900 dark:text-zinc-100">
                              {subtotal ? formatCurrency(subtotal.credit) : formatCurrency(0)}
                            </TableCell>
                          </TableRow>

                          {/* Account Entries */}
                          {typeEntries.map((entry) => (
                            <TableRow key={entry.account_id}>
                              <TableCell className="font-mono">{entry.account_code}</TableCell>
                              <TableCell>{entry.account_name}</TableCell>
                              <TableCell className="text-right">
                                {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                  <TableFooter className="bg-zinc-200 dark:bg-zinc-900">
                    <TableRow className="font-bold text-lg">
                      <TableCell colSpan={2} className="text-zinc-900 dark:text-zinc-100">
                        {t("table.total")}
                      </TableCell>
                      <TableCell className="text-right text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(data.summary.total_debit)}
                      </TableCell>
                      <TableCell className="text-right text-zinc-900 dark:text-zinc-100">
                        {formatCurrency(data.summary.total_credit)}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {data && data.entries && data.entries.length === 0 && (
          <Card>
            <CardContent className="py-12">
              <div className="flex flex-col items-center justify-center text-zinc-500">
                <AlertCircle className="h-12 w-12 mb-4 text-zinc-400" />
                <h3 className="text-lg font-semibold mb-2">{t("empty.title")}</h3>
                <p className="text-sm">{t("empty.description")}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
