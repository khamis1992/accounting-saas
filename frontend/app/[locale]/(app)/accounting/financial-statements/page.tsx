/**
 * Financial Statements Page
 * Displays Balance Sheet, Income Statement, and Cash Flow Statement with period comparison
 */

"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Download, 
  RefreshCw, 
  Calendar, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  FileText
} from "lucide-react";
import { financialStatementsApi, FinancialStatementData, FinancialStatementRow } from "@/lib/api/financial-statements";
import { toast } from "sonner";
import { format } from "date-fns";
import logger from "@/lib/logger";

export default function FinancialStatementsPage() {
  const t = useTranslations("accounting.financialStatements");
  const [activeTab, setActiveTab] = useState<"balance-sheet" | "income-statement" | "cash-flow">("balance-sheet");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [comparePeriod, setComparePeriod] = useState<"none" | "previous-period" | "previous-year">("none");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<FinancialStatementData | null>(null);

  // Set default dates to current month
  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    setStartDate(firstDay.toISOString().split('T')[0]);
    setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // Fetch financial statements when filters change
  useEffect(() => {
    fetchFinancialStatements();
  }, [activeTab, startDate, endDate, comparePeriod]);

  const fetchFinancialStatements = async () => {
    try {
      setLoading(true);
      const response = await financialStatementsApi.get({
        statement_type: activeTab,
        start_date: startDate,
        end_date: endDate,
        compare_period: comparePeriod,
      });
      setData(response);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load financial statements";
      toast.error(message);
      logger.error("Failed to load financial statements", error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Export functions
  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const blob = await financialStatementsApi.exportToPDF({
        statement_type: activeTab,
        start_date: startDate,
        end_date: endDate,
        compare_period: comparePeriod,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.pdf`;
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
      const blob = await financialStatementsApi.exportToExcel({
        statement_type: activeTab,
        start_date: startDate,
        end_date: endDate,
        compare_period: comparePeriod,
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeTab}-${new Date().toISOString().split('T')[0]}.xlsx`;
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
  const formatCurrency = (amount: number | null | undefined) => {
    if (amount == null) return "-";
    return new Intl.NumberFormat("en-QA", {
      style: "currency",
      currency: "QAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Render financial statement rows recursively
  const renderStatementRows = (rows: FinancialStatementRow[], level = 0) => {
    return rows.map((row) => (
      <React.Fragment key={row.id}>
        <TableRow>
          <TableCell className="pl-${level * 4}">
            <div className="flex items-center gap-2">
              <span className="font-medium">{row.label_en}</span>
              {row.label_ar && (
                <span className="text-sm text-zinc-500" dir="rtl">
                  ({row.label_ar})
                </span>
              )}
            </div>
          </TableCell>
          <TableCell className="text-right font-medium">
            {row.amount !== null ? formatCurrency(row.amount) : "-"}
          </TableCell>
          {comparePeriod !== "none" && (
            <>
              <TableCell className="text-right">
                {row.previous_amount !== null ? formatCurrency(row.previous_amount) : "-"}
              </TableCell>
              <TableCell className="text-right">
                {row.variance !== null ? (
                  <span className={row.variance >= 0 ? "text-green-600" : "text-red-600"}>
                    {formatCurrency(row.variance)}
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
              <TableCell className="text-right">
                {row.variance_percentage !== null ? (
                  <span className={row.variance_percentage >= 0 ? "text-green-600" : "text-red-600"}>
                    {row.variance_percentage.toFixed(2)}%
                  </span>
                ) : (
                  "-"
                )}
              </TableCell>
            </>
          )}
        </TableRow>
        {row.children && row.children.length > 0 && renderStatementRows(row.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Get statement title based on active tab
  const getStatementTitle = () => {
    switch (activeTab) {
      case "balance-sheet": return t("balanceSheet.title");
      case "income-statement": return t("incomeStatement.title");
      case "cash-flow": return t("cashFlow.title");
      default: return t("title");
    }
  };

  // Get statement description based on active tab
  const getStatementDescription = () => {
    switch (activeTab) {
      case "balance-sheet": return t("balanceSheet.description");
      case "income-statement": return t("incomeStatement.description");
      case "cash-flow": return t("cashFlow.description");
      default: return t("description");
    }
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
            <Button variant="outline" size="sm" onClick={fetchFinancialStatements} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <CardTitle>{t("filters.title")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <label className="text-sm font-medium">{t("filters.compare")}</label>
                <Select value={comparePeriod} onValueChange={(value: "none" | "previous-period" | "previous-year") => setComparePeriod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("filters.noComparison")}</SelectItem>
                    <SelectItem value="previous-period">{t("filters.previousPeriod")}</SelectItem>
                    <SelectItem value="previous-year">{t("filters.previousYear")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Statements Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as "balance-sheet" | "income-statement" | "cash-flow")}>
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="balance-sheet" className="gap-2">
              <PieChart className="h-4 w-4" />
              {t("tabs.balanceSheet")}
            </TabsTrigger>
            <TabsTrigger value="income-statement" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              {t("tabs.incomeStatement")}
            </TabsTrigger>
            <TabsTrigger value="cash-flow" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              {t("tabs.cashFlow")}
            </TabsTrigger>
          </TabsList>

          {/* Balance Sheet Tab */}
          <TabsContent value="balance-sheet" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("balanceSheet.title")}</CardTitle>
                    <p className="text-zinc-600 dark:text-zinc-400">{t("balanceSheet.description")}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-zinc-500">{t("period")}</div>
                    <div className="font-medium">
                      {startDate} - {endDate}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>{t("loading")}</span>
                    </div>
                  </div>
                ) : data?.balance_sheet ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("account")}</TableHead>
                        <TableHead className="text-right">{t("currentPeriod")}</TableHead>
                        {comparePeriod !== "none" && (
                          <>
                            <TableHead className="text-right">{t("previousPeriod")}</TableHead>
                            <TableHead className="text-right">{t("varianceAmount")}</TableHead>
                            <TableHead className="text-right">{t("variancePercentage")}</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Assets */}
                      <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold">
                        <TableCell colSpan={comparePeriod === "none" ? 2 : 5}>
                          {t("balanceSheet.assets")}
                        </TableCell>
                      </TableRow>
                      {renderStatementRows(data.balance_sheet.assets)}
                      
                      {/* Liabilities */}
                      <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold mt-4">
                        <TableCell colSpan={comparePeriod === "none" ? 2 : 5}>
                          {t("balanceSheet.liabilities")}
                        </TableCell>
                      </TableRow>
                      {renderStatementRows(data.balance_sheet.liabilities)}
                      
                      {/* Equity */}
                      <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold mt-4">
                        <TableCell colSpan={comparePeriod === "none" ? 2 : 5}>
                          {t("balanceSheet.equity")}
                        </TableCell>
                      </TableRow>
                      {renderStatementRows(data.balance_sheet.equity)}
                      
                      {/* Totals */}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>{t("balanceSheet.totalAssets")}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.balance_sheet.total_assets)}
                        </TableCell>
                        {comparePeriod !== "none" && (
                          <>
                            <TableCell className="text-right">
                              {formatCurrency(data.balance_sheet.previous_total_assets || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.balance_sheet.assets_variance !== null 
                                ? formatCurrency(data.balance_sheet.assets_variance) 
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.balance_sheet.assets_variance_percentage != null 
                                ? `${data.balance_sheet.assets_variance_percentage.toFixed(2)}%` 
                                : "-"}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>{t("balanceSheet.totalLiabilitiesAndEquity")}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.balance_sheet.total_liabilities_and_equity)}
                        </TableCell>
                        {comparePeriod !== "none" && (
                          <>
                            <TableCell className="text-right">
                              {formatCurrency(data.balance_sheet.previous_total_liabilities_and_equity || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.balance_sheet.liabilities_equity_variance !== null 
                                ? formatCurrency(data.balance_sheet.liabilities_equity_variance) 
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.balance_sheet.liabilities_equity_variance_percentage != null 
                                ? `${data.balance_sheet.liabilities_equity_variance_percentage.toFixed(2)}%` 
                                : "-"}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                    <p className="text-zinc-500">{t("empty.description")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Income Statement Tab */}
          <TabsContent value="income-statement" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("incomeStatement.title")}</CardTitle>
                    <p className="text-zinc-600 dark:text-zinc-400">{t("incomeStatement.description")}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-zinc-500">{t("period")}</div>
                    <div className="font-medium">
                      {startDate} - {endDate}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>{t("loading")}</span>
                    </div>
                  </div>
                ) : data?.income_statement ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("account")}</TableHead>
                        <TableHead className="text-right">{t("currentPeriod")}</TableHead>
                        {comparePeriod !== "none" && (
                          <>
                            <TableHead className="text-right">{t("previousPeriod")}</TableHead>
                            <TableHead className="text-right">{t("varianceAmount")}</TableHead>
                            <TableHead className="text-right">{t("variancePercentage")}</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Revenue */}
                      <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold">
                        <TableCell colSpan={comparePeriod === "none" ? 2 : 5}>
                          {t("incomeStatement.revenue")}
                        </TableCell>
                      </TableRow>
                      {renderStatementRows(data.income_statement.revenue)}
                      
                      {/* Cost of Goods Sold */}
                      <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold mt-4">
                        <TableCell colSpan={comparePeriod === "none" ? 2 : 5}>
                          {t("incomeStatement.costOfGoodsSold")}
                        </TableCell>
                      </TableRow>
                      {renderStatementRows(data.income_statement.cost_of_goods_sold || [])}
                      
                      {/* Expenses */}
                      <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold mt-4">
                        <TableCell colSpan={comparePeriod === "none" ? 2 : 5}>
                          {t("incomeStatement.expenses")}
                        </TableCell>
                      </TableRow>
                      {renderStatementRows(data.income_statement.expenses)}
                      
                      {/* Totals */}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>{t("incomeStatement.grossProfit")}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.income_statement.gross_profit)}
                        </TableCell>
                        {comparePeriod !== "none" && (
                          <>
                            <TableCell className="text-right">
                              {formatCurrency(data.income_statement.previous_gross_profit || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.income_statement.gross_profit_variance != null 
                                ? formatCurrency(data.income_statement.gross_profit_variance) 
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.income_statement.gross_profit_variance_percentage != null 
                                ? `${data.income_statement.gross_profit_variance_percentage.toFixed(2)}%` 
                                : "-"}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>{t("incomeStatement.netIncome")}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.income_statement.net_income)}
                        </TableCell>
                        {comparePeriod !== "none" && (
                          <>
                            <TableCell className="text-right">
                              {formatCurrency(data.income_statement.previous_net_income || 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.income_statement.net_income_variance !== null 
                                ? formatCurrency(data.income_statement.net_income_variance) 
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.income_statement.net_income_variance_percentage != null 
                                ? `${data.income_statement.net_income_variance_percentage.toFixed(2)}%` 
                                : "-"}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                    <p className="text-zinc-500">{t("empty.description")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Cash Flow Statement Tab */}
          <TabsContent value="cash-flow" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{t("cashFlow.title")}</CardTitle>
                    <p className="text-zinc-600 dark:text-zinc-400">{t("cashFlow.description")}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-zinc-500">{t("period")}</div>
                    <div className="font-medium">
                      {startDate} - {endDate}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="flex items-center gap-2 text-zinc-500">
                      <RefreshCw className="h-5 w-5 animate-spin" />
                      <span>{t("loading")}</span>
                    </div>
                  </div>
                ) : data?.cash_flow ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("account")}</TableHead>
                        <TableHead className="text-right">{t("currentPeriod")}</TableHead>
                        {comparePeriod !== "none" && (
                          <>
                            <TableHead className="text-right">{t("previousPeriod")}</TableHead>
                            <TableHead className="text-right">{t("varianceAmount")}</TableHead>
                            <TableHead className="text-right">{t("variancePercentage")}</TableHead>
                          </>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {/* Operating Activities */}
                      <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold">
                        <TableCell colSpan={comparePeriod === "none" ? 2 : 5}>
                          {t("cashFlow.operatingActivities")}
                        </TableCell>
                      </TableRow>
                      {renderStatementRows(data.cash_flow.operating_activities || data.cash_flow.operating || [])}
                      
                      {/* Investing Activities */}
                      <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold mt-4">
                        <TableCell colSpan={comparePeriod === "none" ? 2 : 5}>
                          {t("cashFlow.investingActivities")}
                        </TableCell>
                      </TableRow>
                      {renderStatementRows(data.cash_flow.investing_activities || data.cash_flow.investing || [])}
                      
                      {/* Financing Activities */}
                      <TableRow className="bg-zinc-100 dark:bg-zinc-800 font-semibold mt-4">
                        <TableCell colSpan={comparePeriod === "none" ? 2 : 5}>
                          {t("cashFlow.financingActivities")}
                        </TableCell>
                      </TableRow>
                      {renderStatementRows(data.cash_flow.financing_activities || data.cash_flow.financing || [])}
                      
                      {/* Totals */}
                      <TableRow className="font-bold border-t-2">
                        <TableCell>{t("cashFlow.netIncreaseDecrease")}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.cash_flow.net_increase_decrease ?? data.cash_flow.net_change_in_cash)}
                        </TableCell>
                        {comparePeriod !== "none" && (
                          <>
                            <TableCell className="text-right">
                              {formatCurrency(data.cash_flow.previous_net_increase_decrease ?? data.cash_flow.previous_net_change_in_cash ?? 0)}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.cash_flow.net_increase_variance != null 
                                ? formatCurrency(data.cash_flow.net_increase_variance) 
                                : "-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {data.cash_flow.net_increase_variance_percentage != null 
                                ? `${data.cash_flow.net_increase_variance_percentage.toFixed(2)}%` 
                                : "-"}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                      <TableRow className="font-bold">
                        <TableCell>{t("cashFlow.cashAtEnd")}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(data.cash_flow.cash_at_end_period ?? data.cash_flow.ending_cash)}
                        </TableCell>
                        {comparePeriod !== "none" && (
                          <>
                            <TableCell className="text-right">
                              {"-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {"-"}
                            </TableCell>
                            <TableCell className="text-right">
                              {"-"}
                            </TableCell>
                          </>
                        )}
                      </TableRow>
                    </TableBody>
                  </Table>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                    <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                    <p className="text-zinc-500">{t("empty.description")}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
  );
}