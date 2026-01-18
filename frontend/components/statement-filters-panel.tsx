/**
 * StatementFiltersPanel Component
 *
 * React component for UI functionality
 *
 * @fileoverview StatementFiltersPanel React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

/**
 * Statement Filters Panel Component
 * Provides filtering options for financial statements
 */

import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface StatementFiltersValue {
  period_start: string;
  period_end: string;
  compare_prior?: boolean;
  show_variance?: boolean;
}

interface StatementFiltersPanelProps {
  filters: StatementFiltersValue;
  onChange: (filters: StatementFiltersValue) => void;
}

export function StatementFiltersPanel({ filters, onChange }: StatementFiltersPanelProps) {
  const t = useTranslations("accounting.financialStatements.filters");

  const handleStartDateChange = (dateString: string) => {
    if (dateString) {
      onChange({
        ...filters,
        period_start: new Date(dateString).toISOString(),
      });
    }
  };

  const handleEndDateChange = (dateString: string) => {
    if (dateString) {
      onChange({
        ...filters,
        period_end: new Date(dateString).toISOString(),
      });
    }
  };

  const handleQuickSelect = (
    period: "thisMonth" | "thisQuarter" | "thisYear" | "lastMonth" | "lastQuarter" | "lastYear"
  ) => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case "thisMonth":
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "thisQuarter":
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1);
        end = new Date(now.getFullYear(), quarter * 3 + 3, 0);
        break;
      case "thisYear":
        start = new Date(now.getFullYear(), 0, 1);
        end = new Date(now.getFullYear(), 11, 31);
        break;
      case "lastMonth":
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "lastQuarter":
        const lastQuarter = Math.floor((now.getMonth() - 3) / 3);
        start = new Date(now.getFullYear(), lastQuarter * 3, 1);
        end = new Date(now.getFullYear(), lastQuarter * 3 + 3, 0);
        break;
      case "lastYear":
        start = new Date(now.getFullYear() - 1, 0, 1);
        end = new Date(now.getFullYear() - 1, 11, 31);
        break;
    }

    onChange({
      ...filters,
      period_start: start.toISOString(),
      period_end: end.toISOString(),
    });
  };

  const startDate = filters.period_start.split("T")[0];
  const endDate = filters.period_end.split("T")[0];

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-6 flex-wrap">
          {/* Quick Select */}
          <div className="space-y-2">
            <Label>{t("period")}</Label>
            <Select
              onValueChange={(value) =>
                handleQuickSelect(
                  value as
                    | "thisMonth"
                    | "thisQuarter"
                    | "thisYear"
                    | "lastMonth"
                    | "lastQuarter"
                    | "lastYear"
                )
              }
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t("selectPeriod")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thisMonth">{t("thisMonth")}</SelectItem>
                <SelectItem value="thisQuarter">{t("thisQuarter")}</SelectItem>
                <SelectItem value="thisYear">{t("thisYear")}</SelectItem>
                <SelectItem value="lastMonth">{t("lastMonth")}</SelectItem>
                <SelectItem value="lastQuarter">{t("lastQuarter")}</SelectItem>
                <SelectItem value="lastYear">{t("lastYear")}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label htmlFor="start-date">{t("startDate")}</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => handleStartDateChange(e.target.value)}
              className="w-40"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <Label htmlFor="end-date">{t("endDate")}</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => handleEndDateChange(e.target.value)}
              className="w-40"
            />
          </div>

          {/* Compare with Prior Period */}
          <div className="space-y-2 flex items-end">
            <div className="flex items-center space-x-2 space-y-0 pt-6">
              <Checkbox
                id="compare-prior"
                checked={filters.compare_prior}
                onCheckedChange={(checked) =>
                  onChange({
                    ...filters,
                    compare_prior: checked as boolean,
                  })
                }
              />
              <Label htmlFor="compare-prior" className="text-sm font-normal cursor-pointer">
                {t("comparePrior")}
              </Label>
            </div>
          </div>

          {/* Show Variance */}
          <div className="space-y-2 flex items-end">
            <div className="flex items-center space-x-2 space-y-0 pt-6">
              <Checkbox
                id="show-variance"
                checked={filters.show_variance}
                onCheckedChange={(checked) =>
                  onChange({
                    ...filters,
                    show_variance: checked as boolean,
                  })
                }
              />
              <Label htmlFor="show-variance" className="text-sm font-normal cursor-pointer">
                {t("showVariance")}
              </Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
