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
 * Fiscal Year Management Page
 * Create, close, and manage fiscal years and periods
 */

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Calendar, Plus, Edit, Lock, Unlock, AlertCircle } from "lucide-react";
import {
  fiscalYearApi,
  FiscalYear,
  CreateFiscalYearDto,
  FiscalYearPeriod,
} from "@/lib/api/settings";
import { toast } from "sonner";
import { format } from "date-fns";

export default function FiscalYearPage() {
  const t = useTranslations("settings.fiscal");
  const tc = useTranslations("common");

  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<FiscalYear | null>(null);
  const [periods, setPeriods] = useState<FiscalYearPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editYear, setEditYear] = useState<FiscalYear | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [closingYear, setClosingYear] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    year: new Date().getFullYear(),
    startDate: "",
    endDate: "",
  });

  // Fetch fiscal years
  useEffect(() => {
    fetchFiscalYears();
  }, []);

  const fetchFiscalYears = async () => {
    try {
      setLoading(true);
      const data = await fiscalYearApi.getAll();
      setFiscalYears(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load fiscal years");
    } finally {
      setLoading(false);
    }
  };

  // Fetch periods when year is selected
  useEffect(() => {
    if (selectedYear) {
      fetchPeriods(selectedYear.id);
    }
  }, [selectedYear]);

  const fetchPeriods = async (fiscalYearId: string) => {
    try {
      const data = await fiscalYearApi.getPeriods(fiscalYearId);
      setPeriods(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load periods");
    }
  };

  // Open create dialog
  const handleCreate = () => {
    setEditYear(null);
    const currentYear = new Date().getFullYear();
    setFormData({
      year: currentYear,
      startDate: `${currentYear}-01-01`,
      endDate: `${currentYear}-12-31`,
    });
    setOpen(true);
  };

  // Open edit dialog
  const handleEdit = (year: FiscalYear) => {
    setEditYear(year);
    setFormData({
      year: year.year,
      startDate: year.start_date.split("T")[0],
      endDate: year.end_date.split("T")[0],
    });
    setOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: CreateFiscalYearDto = {
        year: formData.year,
        startDate: formData.startDate,
        endDate: formData.endDate,
      };

      if (editYear) {
        await fiscalYearApi.update(editYear.id, data);
        toast.success("Fiscal year updated successfully");
      } else {
        await fiscalYearApi.create(data);
        toast.success("Fiscal year created successfully");
      }

      setOpen(false);
      await fetchFiscalYears();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save fiscal year");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close fiscal year
  const handleCloseYear = async (year: FiscalYear) => {
    if (
      !confirm(
        `Are you sure you want to close fiscal year ${year.year}? This action cannot be undone.`
      )
    ) {
      return;
    }

    setClosingYear(year.id);
    try {
      await fiscalYearApi.close(year.id);
      toast.success("Fiscal year closed successfully");
      await fetchFiscalYears();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to close fiscal year");
    } finally {
      setClosingYear(null);
    }
  };

  // Handle reopen fiscal year
  const handleReopenYear = async (year: FiscalYear) => {
    if (!confirm(`Are you sure you want to reopen fiscal year ${year.year}?`)) {
      return;
    }

    try {
      await fiscalYearApi.reopen(year.id);
      toast.success("Fiscal year reopened successfully");
      await fetchFiscalYears();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to reopen fiscal year");
    }
  };

  // Handle close period
  const handleClosePeriod = async (period: FiscalYearPeriod) => {
    if (!confirm(`Are you sure you want to close period ${period.period_number}?`)) {
      return;
    }

    try {
      await fiscalYearApi.closePeriod(selectedYear!.id, period.id);
      toast.success("Period closed successfully");
      await fetchPeriods(selectedYear!.id);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to close period");
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      open: "default",
      closed: "secondary",
      adjusting: "destructive",
    };

    return <Badge variant={variants[status] || "default"}>{t(`statuses.${status}`)}</Badge>;
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="h-8 w-8 text-zinc-500" />
            <div>
              <h1 className="text-3xl font-bold">{t("title")}</h1>
              <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
            </div>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createFiscalYear")}
          </Button>
        </div>

        {/* Fiscal Years Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("fiscalYears")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-500">Loading fiscal years...</div>
            ) : fiscalYears.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                No fiscal years found. Create your first fiscal year.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("year")}</TableHead>
                    <TableHead>{t("startDate")}</TableHead>
                    <TableHead>{t("endDate")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead>{t("closingDate")}</TableHead>
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fiscalYears.map((year) => (
                    <TableRow
                      key={year.id}
                      className={selectedYear?.id === year.id ? "bg-zinc-50 dark:bg-zinc-800" : ""}
                    >
                      <TableCell className="font-medium">{year.year}</TableCell>
                      <TableCell>{format(new Date(year.start_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{format(new Date(year.end_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(year.status)}</TableCell>
                      <TableCell>
                        {year.closing_date
                          ? format(new Date(year.closing_date), "MMM dd, yyyy")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedYear(year)}>
                            {t("periods")}
                          </Button>
                          {year.status === "open" && (
                            <>
                              <Button variant="ghost" size="icon" onClick={() => handleEdit(year)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleCloseYear(year)}
                                disabled={closingYear === year.id}
                              >
                                <Lock className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {year.status === "closed" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleReopenYear(year)}
                            >
                              <Unlock className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Periods Table */}
        {selectedYear && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    {t("periods")} - {selectedYear.year}
                  </CardTitle>
                  <p className="text-sm text-zinc-500">
                    {format(new Date(selectedYear.start_date), "MMM dd")} -{" "}
                    {format(new Date(selectedYear.end_date), "MMM dd, yyyy")}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedYear(null)}>
                  {tc("close")}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {periods.length === 0 ? (
                <div className="py-8 text-center text-zinc-500">
                  No periods found for this fiscal year.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("period")}</TableHead>
                      <TableHead>{t("startDate")}</TableHead>
                      <TableHead>{t("endDate")}</TableHead>
                      <TableHead>{t("status")}</TableHead>
                      <TableHead className="text-right">{t("transactions")}</TableHead>
                      <TableHead className="text-right">{tc("actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map((period) => (
                      <TableRow key={period.id}>
                        <TableCell className="font-medium">
                          {t("periodNumber", { number: period.period_number })}
                        </TableCell>
                        <TableCell>{format(new Date(period.start_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>{format(new Date(period.end_date), "MMM dd, yyyy")}</TableCell>
                        <TableCell>
                          <Badge variant={period.is_closed ? "secondary" : "default"}>
                            {period.is_closed ? t("closed") : t("open")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{period.transaction_count}</TableCell>
                        <TableCell className="text-right">
                          {!period.is_closed && period.transaction_count > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleClosePeriod(period)}
                            >
                              {t("close")}
                            </Button>
                          )}
                          {period.is_closed && (
                            <Badge variant="outline" className="gap-1">
                              <Lock className="h-3 w-3" />
                              {t("closed")}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editYear ? t("editFiscalYear") : t("createFiscalYear")}</DialogTitle>
              <DialogDescription>
                {editYear
                  ? "Update fiscal year dates"
                  : "Create a new fiscal year for your company"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="year">{t("year")}</Label>
                <Input
                  id="year"
                  type="number"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                  required
                  disabled={!!editYear}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startDate">{t("startDate")}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">{t("endDate")}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  required
                />
              </div>

              {editYear && editYear.status !== "open" && (
                <div className="flex items-start gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-900/20">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    {t("cannotModifyClosedYear")}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  {tc("cancel")}
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || (editYear?.status !== "open")}
                >
                  {submitting ? t("saving") : tc("save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}
