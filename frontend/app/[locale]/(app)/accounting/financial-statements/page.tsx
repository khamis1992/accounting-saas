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
 * Financial Statements Page
 * Displays Balance Sheet, Income Statement, and Cash Flow Statement with period comparison
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FinancialStatementViewer } from "@/components/financial-statement-viewer";
import { StatementFiltersPanel, StatementFiltersValue } from "@/components/statement-filters-panel";

export default function FinancialStatementsPage() {
  const t = useTranslations("accounting.financialStatements");
  const [activeTab, setActiveTab] = useState("balance-sheet");

  // Initialize with current month dates
  const getDefaultDates = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      period_start: startOfMonth.toISOString(),
      period_end: endOfMonth.toISOString(),
    };
  };

  const [filters, setFilters] = useState<StatementFiltersValue>({
    ...getDefaultDates(),
    compare_prior: true,
    show_variance: true,
  });

  // Load saved tab from localStorage
  useEffect(() => {
    const savedTab = localStorage.getItem("financial-statements-tab");
    if (savedTab && ["balance-sheet", "income-statement", "cash-flow"].includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  // Save tab to localStorage when it changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    localStorage.setItem("financial-statements-tab", value);
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-1">{t("description")}</p>
        </div>

        {/* Filters */}
        <StatementFiltersPanel filters={filters} onChange={setFilters} />

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full max-w-2xl grid-cols-3">
            <TabsTrigger value="balance-sheet">{t("tabs.balanceSheet")}</TabsTrigger>
            <TabsTrigger value="income-statement">{t("tabs.incomeStatement")}</TabsTrigger>
            <TabsTrigger value="cash-flow">{t("tabs.cashFlow")}</TabsTrigger>
          </TabsList>

          <TabsContent value="balance-sheet" className="mt-6">
            <FinancialStatementViewer type="balance-sheet" filters={filters} />
          </TabsContent>

          <TabsContent value="income-statement" className="mt-6">
            <FinancialStatementViewer type="income-statement" filters={filters} />
          </TabsContent>

          <TabsContent value="cash-flow" className="mt-6">
            <FinancialStatementViewer type="cash-flow" filters={filters} />
          </TabsContent>
        </Tabs>
      </div>
    </AuthenticatedLayout>
  );
}
