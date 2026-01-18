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
 * General Ledger Page
 * Displays all posted journal entries grouped by account with running balance
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  generalLedgerApi,
  GeneralLedgerEntry,
  GeneralLedgerFilters,
} from "@/lib/api/general-ledger";
import { coaApi } from "@/lib/api/coa";
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
import { FileText, Download, Filter, RefreshCw, Calendar } from "lucide-react";
import { Account } from "@/lib/api/coa";
import logger from "@/lib/logger";

export default function GeneralLedgerPage() {
  const t = useTranslations("accounting.generalLedger");
  const router = useRouter();

  // State
  const [data, setData] = useState<GeneralLedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Filters
  const [filters, setFilters] = useState<GeneralLedgerFilters>({
    limit: 50,
    page: 1,
  });

  // Fetch accounts for dropdown
  useEffect(() => {
    fetchAccounts();
  }, []);

  // Fetch general ledger data
  useEffect(() => {
    if (!accountsLoading) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, accountsLoading]);

  const fetchAccounts = async () => {
    try {
      setAccountsLoading(true);
      const data = await coaApi.getAll(true);
      setAccounts(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load accounts";
      toast.error(message);
      logger.error("Failed to fetch accounts", error as Error);
    } finally {
      setAccountsLoading(false);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await generalLedgerApi.getAll(filters);
      setData(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load general ledger data";
      toast.error(message);
      logger.error("Failed to fetch general ledger", error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Export handlers
  const handleExportPDF = async () => {
    try {
      setExporting(true);
      toast.info(t("exporting"));
      const blob = await generalLedgerApi.exportToPDF(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `general-ledger-${new Date().toISOString().split("T")[0]}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("exported"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.exportFailed");
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      toast.info(t("exporting"));
      const blob = await generalLedgerApi.exportToExcel(filters);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `general-ledger-${new Date().toISOString().split("T")[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(t("exported"));
    } catch (error) {
      const message = error instanceof Error ? error.message : t("errors.exportFailed");
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  // Filter handlers
  const updateFilter = (key: keyof GeneralLedgerFilters, value: string | number | Date | undefined) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters({
      limit: 50,
      page: 1,
    });
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

  // Group data by account
  const groupedData = data.reduce(
    (acc, entry) => {
      const key = entry.account_code;
      if (!acc[key]) {
        acc[key] = {
          accountCode: entry.account_code,
          accountName: entry.account_name_en,
          accountNameAr: entry.account_name_ar,
          accountType: entry.account_type,
          entries: [],
        };
      }
      acc[key].entries.push(entry);
      return acc;
    },
    {} as Record<
      string,
      {
        accountCode: string;
        accountName: string;
        accountNameAr: string;
        accountType: string;
        entries: GeneralLedgerEntry[];
      }
    >
  );

  // Get account type badge color
  const getAccountTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      asset: "default",
      liability: "secondary",
      equity: "outline",
      revenue: "secondary",
      expense: "outline",
    };
    return variants[type] || "secondary";
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
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting || loading || data.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={exporting || loading || data.length === 0}
            >
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button size="sm" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("refresh")}
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter className="h-5 w-5" />
              {t("filters.title")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* Account Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("filters.account")}</label>
                <Select
                  value={filters.accountId || "all"}
                  onValueChange={(value) =>
                    updateFilter("accountId", value === "all" ? undefined : value)
                  }
                  disabled={accountsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("filters.selectAccount")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allAccounts")}</SelectItem>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Account Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("filters.accountType")}</label>
                <Select
                  value={filters.accountType || "all"}
                  onValueChange={(value) =>
                    updateFilter("accountType", value === "all" ? undefined : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("filters.selectAccountType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allTypes")}</SelectItem>
                    <SelectItem value="asset">{t("accountTypes.asset")}</SelectItem>
                    <SelectItem value="liability">{t("accountTypes.liability")}</SelectItem>
                    <SelectItem value="equity">{t("accountTypes.equity")}</SelectItem>
                    <SelectItem value="revenue">{t("accountTypes.revenue")}</SelectItem>
                    <SelectItem value="expense">{t("accountTypes.expense")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("filters.startDate")}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={filters.startDate || ""}
                    onChange={(e) => updateFilter("startDate", e.target.value)}
                  />
                </div>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium">{t("filters.endDate")}</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={filters.endDate || ""}
                    onChange={(e) => updateFilter("endDate", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                {t("filters.reset")}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t("table.title")}</CardTitle>
              {!loading && data.length > 0 && (
                <div className="text-sm text-muted-foreground">
                  {t("pagination.totalEntries", { count: data.length })}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex min-h-[400px] items-center justify-center">
                <div className="text-center">
                  <RefreshCw className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">{t("loading")}</p>
                </div>
              </div>
            ) : data.length === 0 ? (
              <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-dashed p-8">
                <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">{t("empty.title")}</h3>
                <p className="mb-4 text-center text-sm text-muted-foreground">
                  {t("empty.description")}
                </p>
                <Button variant="outline" size="sm" onClick={resetFilters}>
                  {t("filters.reset")}
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.values(groupedData).map((group) => (
                  <div key={group.accountCode} className="space-y-2">
                    {/* Account Header */}
                    <div className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-semibold">{group.accountCode}</span>
                        <span className="font-medium">{group.accountName}</span>
                        <span className="text-sm text-muted-foreground">
                          ({group.accountNameAr})
                        </span>
                        <Badge variant={getAccountTypeBadge(group.accountType)}>
                          {t(`accountTypes.${group.accountType}`)}
                        </Badge>
                      </div>
                      <div className="text-sm font-semibold">
                        {t("table.balance")}:{" "}
                        {formatCurrency(group.entries[group.entries.length - 1]?.balance || 0)}
                      </div>
                    </div>

                    {/* Account Entries Table */}
                    <div className="overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">{t("table.date")}</TableHead>
                            <TableHead className="w-[120px]">{t("table.journal")}</TableHead>
                            <TableHead>{t("table.description")}</TableHead>
                            <TableHead className="text-right w-[140px]">
                              {t("table.debit")}
                            </TableHead>
                            <TableHead className="text-right w-[140px]">
                              {t("table.credit")}
                            </TableHead>
                            <TableHead className="text-right w-[140px]">
                              {t("table.balance")}
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {group.entries.map((entry) => (
                            <TableRow
                              key={entry.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() =>
                                router.push(`/accounting/journals/${entry.journal_id}`)
                              }
                            >
                              <TableCell className="text-sm">
                                {format(new Date(entry.transaction_date), "MMM dd, yyyy")}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {entry.journal_number}
                              </TableCell>
                              <TableCell className="text-sm">
                                {entry.description_en || entry.description_ar || "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {entry.debit > 0 ? formatCurrency(entry.debit) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-medium">
                                {entry.credit > 0 ? formatCurrency(entry.credit) : "-"}
                              </TableCell>
                              <TableCell className="text-right font-semibold">
                                {formatCurrency(entry.balance || 0)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
