/**
 * Trial Balance Page
 * Displays debit vs credit comparison for all accounts with validation
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  RefreshCw, 
  Calendar, 
  Filter, 
  ChevronDown, 
  ChevronUp,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { trialBalanceApi, TrialBalanceEntry } from "@/lib/api/trial-balance";
import { coaApi, Account } from "@/lib/api/coa";
import { toast } from "sonner";
import { format } from "date-fns";
import logger from "@/lib/logger";

export default function TrialBalancePage() {
  const t = useTranslations("accounting.trialBalance");
  const [search, setSearch] = useState("");
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split('T')[0]);
  const [showZeroBalances, setShowZeroBalances] = useState(false);
  const [accountType, setAccountType] = useState("all");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showFilters, setShowFilters] = useState(true);
  const [data, setData] = useState<TrialBalanceData | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);

  // Fetch initial data
  useEffect(() => {
    fetchTrialBalance();
    fetchAccounts();
  }, [asOfDate, showZeroBalances, accountType]);

  const fetchTrialBalance = async () => {
    try {
      setLoading(true);
      const response = await trialBalanceApi.get({
        as_of_date: asOfDate,
        show_zero_balances: showZeroBalances,
        account_type: accountType !== "all" ? accountType : undefined,
      });
      setData(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load trial balance";
      toast.error(message);
      logger.error("Failed to load trial balance", error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccounts = async () => {
    try {
      const data = await coaApi.getAll({ is_active: true });
      setAccounts(data);
    } catch (error) {
      logger.error("Failed to load accounts", error as Error);
    }
  };

  // Filter entries based on search
  const filteredEntries = useMemo(() => {
    if (!data?.entries) return [];
    
    return data.entries.filter(entry => 
      entry.account_code.toLowerCase().includes(search.toLowerCase()) ||
      entry.account_name_en.toLowerCase().includes(search.toLowerCase()) ||
      entry.account_name_ar.includes(search)
    );
  }, [data?.entries, search]);

  // Group entries by account type
  const groupedEntries = useMemo(() => {
    if (!filteredEntries) return {};
    
    const groups: Record<string, TrialBalanceEntry[]> = {
      asset: [],
      liability: [],
      equity: [],
      revenue: [],
      expense: [],
    };
    
    filteredEntries.forEach(entry => {
      if (groups.hasOwnProperty(entry.account_type)) {
        groups[entry.account_type as keyof typeof groups].push(entry);
      }
    });
    
    return groups;
  }, [filteredEntries]);

  // Export functions
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await trialBalanceApi.exportToPDF({
        as_of_date: asOfDate,
        show_zero_balances: showZeroBalances,
        account_type: accountType !== "all" ? accountType : undefined,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trial-balance-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("PDF exported successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export PDF";
      toast.error(message);
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const blob = await trialBalanceApi.exportToExcel({
        as_of_date: asOfDate,
        show_zero_balances: showZeroBalances,
        account_type: accountType !== "all" ? accountType : undefined,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trial-balance-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Excel exported successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to export Excel";
      toast.error(message);
    } finally {
      setExporting(false);
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
  const getAccountTypeBadge = (type: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      asset: "default",
      liability: "secondary",
      equity: "outline",
      revenue: "secondary",
      expense: "outline",
    };
    
    const labels: Record<string, string> = {
      asset: t("accountTypes.asset"),
      liability: t("accountTypes.liability"),
      equity: t("accountTypes.equity"),
      revenue: t("accountTypes.revenue"),
      expense: t("accountTypes.expense"),
    };
    
    return (
      <Badge variant={variants[type] || "outline"}>
        {labels[type] || type}
      </Badge>
    );
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!data?.entries) return { totalDebit: 0, totalCredit: 0, difference: 0 };
    
    const totalDebit = data.entries.reduce((sum, entry) => sum + (entry.debit || 0), 0);
    const totalCredit = data.entries.reduce((sum, entry) => sum + (entry.credit || 0), 0);
    const difference = totalDebit - totalCredit;
    
    return { totalDebit, totalCredit, difference };
  }, [data?.entries]);

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportPDF} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              PDF
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={fetchTrialBalance} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Balance Summary Card */}
        <Card className={`
          border-2
          ${Math.abs(totals.difference) < 0.01 
            ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" 
            : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
          }
        `}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              {Math.abs(totals.difference) < 0.01 ? (
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold">
                  {Math.abs(totals.difference) < 0.01 ? t("balanced") : t("notBalanced")}
                </h3>
                {Math.abs(totals.difference) >= 0.01 && (
                  <p className="text-sm mt-1">
                    {t("difference")}: {formatCurrency(Math.abs(totals.difference))}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{t("totalDebit")}</div>
                <div className="font-medium">{formatCurrency(totals.totalDebit)}</div>
              </div>
              <div className="text-right">
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{t("totalCredit")}</div>
                <div className="font-medium">{formatCurrency(totals.totalCredit)}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Filters Card */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">{t("filters.title")}</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              {showFilters ? t("filters.hide") : t("filters.show")}
            </Button>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="asOfDate">{t("filters.asOfDate")}</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="asOfDate"
                      type="date"
                      className="pl-9"
                      value={asOfDate}
                      onChange={(e) => setAsOfDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="accountType">{t("filters.accountType")}</Label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger id="accountType">
                      <SelectValue />
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
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="showZeroBalances"
                      checked={showZeroBalances}
                      onCheckedChange={(checked) => setShowZeroBalances(!!checked)}
                    />
                    <Label htmlFor="showZeroBalances" className="cursor-pointer">
                      {t("filters.showZeroBalances")}
                    </Label>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="search">{t("filters.search")}</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      id="search"
                      type="search"
                      className="pl-9"
                      placeholder={t("filters.searchPlaceholder")}
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Trial Balance Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("table.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-zinc-500">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>{t("loading")}</span>
                </div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(groupedEntries).map(([type, entries]) => {
                  if (entries.length === 0) return null;
                  
                  // Calculate subtotal for this account type
                  const typeSubtotal = entries.reduce(
                    (sum, entry) => ({
                      debit: sum.debit + (entry.debit || 0),
                      credit: sum.credit + (entry.credit || 0),
                    }),
                    { debit: 0, credit: 0 }
                  );
                  
                  return (
                    <div key={type} className="space-y-2">
                      <div className="flex items-center justify-between bg-zinc-100 dark:bg-zinc-800 p-3 rounded-lg font-semibold">
                        <div className="flex items-center gap-2">
                          {getAccountTypeBadge(type)}
                        </div>
                        <div className="flex gap-8">
                          <span>{t("table.subtotalDebit")}: {formatCurrency(typeSubtotal.debit)}</span>
                          <span>{t("table.subtotalCredit")}: {formatCurrency(typeSubtotal.credit)}</span>
                        </div>
                      </div>
                      
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-24">{t("table.accountCode")}</TableHead>
                            <TableHead>{t("table.accountName")}</TableHead>
                            <TableHead className="text-right w-32">{t("table.debit")}</TableHead>
                            <TableHead className="text-right w-32">{t("table.credit")}</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {entries.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="font-mono">{entry.account_code}</TableCell>
                              <TableCell>
                                <div>
                                  <div>{entry.account_name_en}</div>
                                  <div className="text-sm text-zinc-500" dir="rtl">
                                    {entry.account_name_ar}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.debit && entry.debit !== 0 ? formatCurrency(entry.debit) : "-"}
                              </TableCell>
                              <TableCell className="text-right">
                                {entry.credit && entry.credit !== 0 ? formatCurrency(entry.credit) : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  );
                })}
                
                {/* Grand Total */}
                <div className="border-t pt-4 mt-6">
                  <div className="flex items-center justify-between font-bold text-lg">
                    <div>{t("table.total")}</div>
                    <div className="flex gap-8">
                      <span>{t("table.totalDebit")}: {formatCurrency(totals.totalDebit)}</span>
                      <span>{t("table.totalCredit")}: {formatCurrency(totals.totalCredit)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}