/**
 * General Ledger Page
 * Displays all posted journal entries grouped by account with running balance
 */

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Download, 
  Calendar, 
  Filter, 
  RefreshCw, 
  ChevronDown,
  ChevronUp,
  Eye,
  Edit,
  Trash2
} from "lucide-react";
import { generalLedgerApi, GeneralLedgerEntry } from "@/lib/api/general-ledger";
import { coaApi, Account } from "@/lib/api/coa";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import logger from "@/lib/logger";

export default function GeneralLedgerPage() {
  const t = useTranslations("accounting.generalLedger");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [accountType, setAccountType] = useState("");
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  
  const [entries, setEntries] = useState<GeneralLedgerEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  // Fetch initial data
  useEffect(() => {
    fetchGeneralLedger();
    fetchAccounts();
  }, [startDate, endDate, accountId, accountType]);

  const fetchGeneralLedger = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (startDate) filters.start_date = startDate;
      if (endDate) filters.end_date = endDate;
      if (accountId) filters.account_id = accountId;
      if (accountType) filters.account_type = accountType;

      const data = await generalLedgerApi.getAll(filters);
      setEntries(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load general ledger";
      toast.error(message);
      logger.error("Failed to load general ledger", error as Error);
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

  // Group entries by account
  const groupedEntries = useMemo(() => {
    const groups: Record<string, GeneralLedgerEntry[]> = {};
    
    entries.forEach(entry => {
      if (!groups[entry.account_id]) {
        groups[entry.account_id] = [];
      }
      groups[entry.account_id].push(entry);
    });
    
    return groups;
  }, [entries]);

  // Calculate account totals
  const accountTotals = useMemo(() => {
    const totals: Record<string, { debit: number; credit: number; balance: number }> = {};
    
    Object.entries(groupedEntries).forEach(([accountId, accountEntries]) => {
      let debitSum = 0;
      let creditSum = 0;
      let runningBalance = 0;
      
      accountEntries.forEach(entry => {
        debitSum += entry.debit || 0;
        creditSum += entry.credit || 0;
        runningBalance += (entry.debit || 0) - (entry.credit || 0);
      });
      
      totals[accountId] = {
        debit: debitSum,
        credit: creditSum,
        balance: runningBalance
      };
    });
    
    return totals;
  }, [groupedEntries]);

  // Filter entries based on search
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => 
      entry.account_code.toLowerCase().includes(search.toLowerCase()) ||
      entry.account_name_en.toLowerCase().includes(search.toLowerCase()) ||
      entry.account_name_ar.includes(search) ||
      entry.journal_number.toLowerCase().includes(search.toLowerCase()) ||
      entry.description_en?.toLowerCase().includes(search.toLowerCase()) ||
      entry.description_ar?.includes(search) ||
      entry.reference_number?.toLowerCase().includes(search.toLowerCase())
    );
  }, [entries, search]);

  // Toggle account expansion
  const toggleAccount = (accountId: string) => {
    setExpandedAccounts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(accountId)) {
        newSet.delete(accountId);
      } else {
        newSet.add(accountId);
      }
      return newSet;
    });
  };

  // Export functions
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await generalLedgerApi.exportToPDF({
        start_date: startDate,
        end_date: endDate,
        account_id: accountId,
        account_type: accountType,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `general-ledger-${new Date().toISOString().split('T')[0]}.pdf`;
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
      const blob = await generalLedgerApi.exportToExcel({
        start_date: startDate,
        end_date: endDate,
        account_id: accountId,
        account_type: accountType,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `general-ledger-${new Date().toISOString().split('T')[0]}.xlsx`;
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
      asset: "Asset",
      liability: "Liability",
      equity: "Equity",
      revenue: "Revenue",
      expense: "Expense",
    };
    
    return (
      <Badge variant={variants[type] || "outline"}>
        {labels[type] || type}
      </Badge>
    );
  };

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
            <Button variant="outline" size="sm" onClick={fetchGeneralLedger} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

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
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("filters.startDate")}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("filters.endDate")}</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("filters.account")}</label>
                  <Select value={accountId} onValueChange={setAccountId}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("filters.allAccounts")} />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.code} - {account.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("filters.accountType")}</label>
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("filters.allTypes")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asset">{t("accountTypes.asset")}</SelectItem>
                      <SelectItem value="liability">{t("accountTypes.liability")}</SelectItem>
                      <SelectItem value="equity">{t("accountTypes.equity")}</SelectItem>
                      <SelectItem value="revenue">{t("accountTypes.revenue")}</SelectItem>
                      <SelectItem value="expense">{t("accountTypes.expense")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="mt-4 flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder={t("filters.searchPlaceholder")}
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearch("");
                    setStartDate("");
                    setEndDate("");
                    setAccountId("");
                    setAccountType("");
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          )}
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("summary.totalDebit")}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(filteredEntries.reduce((sum, entry) => sum + (entry.debit || 0), 0))}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("summary.totalCredit")}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(filteredEntries.reduce((sum, entry) => sum + (entry.credit || 0), 0))}
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{t("summary.netBalance")}</p>
              <p className="text-2xl font-bold">
                {formatCurrency(
                  filteredEntries.reduce((sum, entry) => sum + (entry.debit || 0) - (entry.credit || 0), 0)
                )}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* General Ledger Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("table.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-2 text-zinc-500">
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Loading general ledger...</span>
                </div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedEntries).map(([accountId, accountEntries]) => {
                  const account = accounts.find(acc => acc.id === accountId);
                  const isExpanded = expandedAccounts.has(accountId);
                  
                  return (
                    <div key={accountId} className="border rounded-lg overflow-hidden">
                      <div 
                        className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-700"
                        onClick={() => toggleAccount(accountId)}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm">{account?.code}</span>
                          <span className="font-medium">{account?.name_en}</span>
                          <span className="text-sm text-zinc-500" dir="rtl">
                            ({account?.name_ar})
                          </span>
                          {account && getAccountTypeBadge(account.type)}
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-zinc-500">{t("summary.balance")}</div>
                            <div className="font-medium">
                              {formatCurrency(accountTotals[accountId]?.balance || 0)}
                            </div>
                          </div>
                          {isExpanded ? <ChevronUp /> : <ChevronDown />}
                        </div>
                      </div>
                      
                      {isExpanded && (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>{t("table.date")}</TableHead>
                                <TableHead>{t("table.journalNumber")}</TableHead>
                                <TableHead>{t("table.reference")}</TableHead>
                                <TableHead>{t("table.description")}</TableHead>
                                <TableHead className="text-right">{t("table.debit")}</TableHead>
                                <TableHead className="text-right">{t("table.credit")}</TableHead>
                                <TableHead className="text-right">{t("table.balance")}</TableHead>
                                <TableHead>{t("table.actions")}</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {accountEntries.map((entry) => (
                                <TableRow key={entry.id}>
                                  <TableCell>
                                    {format(new Date(entry.transaction_date), "dd/MM/yyyy")}
                                  </TableCell>
                                  <TableCell className="font-mono">{entry.journal_number}</TableCell>
                                  <TableCell>{entry.reference_number || "-"}</TableCell>
                                  <TableCell>
                                    {entry.description_en || entry.description_ar || "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {entry.debit ? formatCurrency(entry.debit) : "-"}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    {entry.credit ? formatCurrency(entry.credit) : "-"}
                                  </TableCell>
                                  <TableCell className="text-right font-medium">
                                    {formatCurrency(entry.running_balance || 0)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="icon">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon">
                                        <Edit className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon">
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}