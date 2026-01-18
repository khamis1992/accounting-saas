/**
 * FinancialStatementViewer Component
 *
 * React component for UI functionality
 *
 * @fileoverview FinancialStatementViewer React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

/**
 * Financial Statement Viewer Component
 * Displays a financial statement with hierarchical sections and line items
 */

import React, { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import {
  financialStatementsApi,
  FinancialStatement,
  StatementType,
} from "@/lib/api/financial-statements";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download, Printer, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface FinancialStatementViewerProps {
  type: StatementType;
  filters: {
    period_start: string;
    period_end: string;
    compare_prior?: boolean;
    show_variance?: boolean;
  };
}

export function FinancialStatementViewer({ type, filters }: FinancialStatementViewerProps) {
  const t = useTranslations("accounting.financialStatements");
  const locale = useLocale();
  const [statement, setStatement] = useState<FinancialStatement | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadStatement();
  }, [type, filters]);

  const loadStatement = async () => {
    try {
      setLoading(true);
      const data = await financialStatementsApi.get({
        type,
        ...filters,
      });
      setStatement(data);
    } catch (error: any) {
      toast.error(error.message || t("errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    try {
      setExporting(true);
      const blob = await financialStatementsApi.exportToPDF({
        type,
        ...filters,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${filters.period_start}-${filters.period_end}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(t("exported"));
    } catch (error: any) {
      toast.error(error.message || "Failed to export PDF");
    } finally {
      setExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const blob = await financialStatementsApi.exportToExcel({
        type,
        ...filters,
      });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-${filters.period_start}-${filters.period_end}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success(t("exported"));
    } catch (error: any) {
      toast.error(error.message || "Failed to export Excel");
    } finally {
      setExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    const currency = statement?.currency || "QAR";
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getVarianceColor = (value: number) => {
    if (value > 0) return "text-green-600 dark:text-green-400";
    if (value < 0) return "text-red-600 dark:text-red-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  if (loading) {
    return <StatementSkeleton />;
  }

  if (!statement) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-zinc-500 dark:text-zinc-400">
            <p className="text-lg font-medium mb-2">No data available</p>
            <p className="text-sm">Try adjusting your filters or refresh the data</p>
            <Button onClick={loadStatement} variant="outline" className="mt-4 gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const title = locale === "ar" && statement.title_ar ? statement.title_ar : statement.title;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
              {formatDate(statement.period_end)}
            </p>
            {statement.prior_period_end && (
              <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                vs {formatDate(statement.prior_period_end)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              PDF
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              disabled={exporting}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={loadStatement}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[40%]">{t("table.lineItem")}</TableHead>
              <TableHead className="text-right w-[15%]">{t("table.amount")}</TableHead>
              {filters.compare_prior && (
                <TableHead className="text-right w-[15%]">{t("table.priorPeriod")}</TableHead>
              )}
              {filters.show_variance && (
                <>
                  <TableHead className="text-right w-[15%]">{t("table.variance")}</TableHead>
                  <TableHead className="text-right w-[15%]">{t("table.variancePercent")}</TableHead>
                </>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {statement.sections.map((section, sectionIdx) => (
              <React.Fragment key={sectionIdx}>
                {/* Section Header */}
                <TableRow className="bg-zinc-50 dark:bg-zinc-800/50">
                  <TableCell
                    colSpan={filters.show_variance ? 5 : filters.compare_prior ? 3 : 2}
                    className="font-semibold py-3"
                  >
                    {locale === "ar" && section.title_ar ? section.title_ar : section.title}
                  </TableCell>
                </TableRow>

                {/* Section Items */}
                {section.items.map((item) => (
                  <TableRow key={item.id} className={item.is_bold ? "font-semibold" : ""}>
                    <TableCell
                      style={{
                        paddingLeft: `${(item.indent_level || 0) * 20 + 8}px`,
                      }}
                    >
                      {item.account_code && (
                        <span className="text-zinc-500 dark:text-zinc-400 mr-2 font-mono text-xs">
                          {item.account_code}
                        </span>
                      )}
                      {locale === "ar" && item.account_name_ar
                        ? item.account_name_ar
                        : item.account_name}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    {filters.compare_prior && (
                      <TableCell className="text-right text-zinc-600 dark:text-zinc-400">
                        {formatCurrency(item.prior_amount || 0)}
                      </TableCell>
                    )}
                    {filters.show_variance && (
                      <>
                        <TableCell className="text-right">
                          <span className={getVarianceColor(item.variance?.amount || 0)}>
                            {item.variance?.amount !== undefined
                              ? formatCurrency(item.variance.amount)
                              : "-"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={getVarianceColor(item.variance?.percentage || 0)}>
                            {item.variance?.percentage !== undefined
                              ? `${item.variance.percentage.toFixed(1)}%`
                              : "-"}
                          </span>
                        </TableCell>
                      </>
                    )}
                  </TableRow>
                ))}

                {/* Section Total */}
                <TableRow className="border-t-2 font-semibold bg-zinc-50 dark:bg-zinc-800/50">
                  <TableCell>
                    {locale === "ar" && section.title_ar ? section.title_ar : section.title}{" "}
                    {t("table.total")}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(section.total)}</TableCell>
                  {filters.compare_prior && (
                    <TableCell className="text-right">
                      {formatCurrency(section.prior_total || 0)}
                    </TableCell>
                  )}
                  {filters.show_variance && (
                    <>
                      <TableCell className="text-right">
                        <span className={getVarianceColor(section.variance?.amount || 0)}>
                          {section.variance?.amount !== undefined
                            ? formatCurrency(section.variance.amount)
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={getVarianceColor(section.variance?.percentage || 0)}>
                          {section.variance?.percentage !== undefined
                            ? `${section.variance.percentage.toFixed(1)}%`
                            : "-"}
                        </span>
                      </TableCell>
                    </>
                  )}
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

/**
 * Skeleton loader for statement
 */
function StatementSkeleton() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-8 w-20 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className="h-10 w-full bg-zinc-100 dark:bg-zinc-800 rounded animate-pulse" />
              {[...Array(3)].map((_, j) => (
                <div
                  key={j}
                  className="h-8 w-full bg-zinc-50 dark:bg-zinc-900/50 rounded animate-pulse"
                />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
