/**
 * Fiscal Year Page
 * Manage fiscal years and accounting periods
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calendar,
  Lock,
  Unlock,
  Eye,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";
import { fiscalYearsApi, FiscalYear, AccountingPeriod } from "@/lib/api/fiscal-years";
import { toast } from "sonner";
import { format } from "date-fns";
import logger from "@/lib/logger";

export default function FiscalYearPage() {
  const locale = useLocale();
  const t = useTranslations("settings.fiscalYear");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [fiscalYears, setFiscalYears] = useState<FiscalYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showFiscalYearDialog, setShowFiscalYearDialog] = useState(false);
  const [editingFiscalYear, setEditingFiscalYear] = useState<FiscalYear | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fiscalYearForm, setFiscalYearForm] = useState({
    name: "",
    year: new Date().getFullYear().toString(),
    startDate: "",
    endDate: "",
    isLocked: false,
    description: "",
  });

  // Fetch initial data
  useEffect(() => {
    fetchFiscalYears();
  }, [statusFilter]);

  const fetchFiscalYears = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter && statusFilter !== "all") filters.is_locked = statusFilter === "locked";

      const data = await fiscalYearsApi.getAll(filters);
      setFiscalYears(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load fiscal years";
      toast.error(message);
      logger.error("Failed to load fiscal years", error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Filter fiscal years based on search
  const filteredFiscalYears = useMemo(() => {
    return fiscalYears.filter(
      (fy) =>
        fy.name.toLowerCase().includes(search.toLowerCase()) ||
        fy.year.toString().includes(search) ||
        fy.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [fiscalYears, search]);

  // Get status badge
  const getStatusBadge = (isLocked: boolean) => {
    return (
      <Badge variant={isLocked ? "destructive" : "default"}>
        {isLocked ? t("statuses.locked") : t("statuses.open")}
      </Badge>
    );
  };

  // Handle create fiscal year
  const handleCreate = () => {
    setEditingFiscalYear(null);
    setFiscalYearForm({
      name: "",
      year: new Date().getFullYear().toString(),
      startDate: "",
      endDate: "",
      isLocked: false,
      description: "",
    });
    setShowFiscalYearDialog(true);
  };

  // Handle edit fiscal year
  const handleEdit = (fiscalYear: FiscalYear) => {
    setEditingFiscalYear(fiscalYear);
    setFiscalYearForm({
      name: fiscalYear.name,
      year: fiscalYear.year.toString(),
      startDate: fiscalYear.start_date.split("T")[0],
      endDate: fiscalYear.end_date.split("T")[0],
      isLocked: fiscalYear.is_locked,
      description: fiscalYear.description || "",
    });
    setShowFiscalYearDialog(true);
  };

  // Handle delete fiscal year
  const handleDelete = async (fiscalYear: FiscalYear) => {
    if (!confirm(`${t("confirmDelete")} ${fiscalYear.name}?`)) {
      return;
    }

    try {
      await fiscalYearsApi.delete(fiscalYear.id);
      toast.success(t("deleteSuccess"));
      await fetchFiscalYears();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete fiscal year";
      toast.error(message);
    }
  };

  // Handle lock fiscal year
  const handleLock = async (fiscalYear: FiscalYear) => {
    setActionLoading(fiscalYear.id);
    try {
      await fiscalYearsApi.lock(fiscalYear.id);
      toast.success(t("lockSuccess"));
      await fetchFiscalYears();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to lock fiscal year";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle unlock fiscal year
  const handleUnlock = async (fiscalYear: FiscalYear) => {
    setActionLoading(fiscalYear.id);
    try {
      await fiscalYearsApi.unlock(fiscalYear.id);
      toast.success(t("unlockSuccess"));
      await fetchFiscalYears();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to unlock fiscal year";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        name: fiscalYearForm.name,
        year: parseInt(fiscalYearForm.year, 10),
        start_date: fiscalYearForm.startDate,
        end_date: fiscalYearForm.endDate,
        is_locked: fiscalYearForm.isLocked,
        description: fiscalYearForm.description || undefined,
      };

      if (editingFiscalYear) {
        await fiscalYearsApi.update(editingFiscalYear.id, data);
        toast.success(t("updateSuccess"));
      } else {
        await fiscalYearsApi.create(data);
        toast.success(t("createSuccess"));
      }

      setShowFiscalYearDialog(false);
      await fetchFiscalYears();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save fiscal year";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle export PDF
  const handleExportPDF = async (fiscalYear: FiscalYear) => {
    try {
      const blob = await fiscalYearsApi.exportToPDF(fiscalYear.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `fiscal-year-${fiscalYear.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("exportSuccess"));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export PDF";
      toast.error(message);
    }
  };

  // Handle view fiscal year
  const handleView = (fiscalYear: FiscalYear) => {
    // Navigate to fiscal year detail page or open a dialog
    // For now, just log - implement as needed
    console.log("View fiscal year:", fiscalYear);
  };

  // Get action buttons for each fiscal year
  const getActionButtons = (fiscalYear: FiscalYear) => {
    const buttons = [];

    // View button (always available)
    buttons.push({
      icon: <Eye className="h-4 w-4" />,
      label: t("actions.view"),
      onClick: () => handleView(fiscalYear),
    });

    // Edit button (only for unlocked fiscal years)
    if (!fiscalYear.is_locked) {
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: t("actions.edit"),
        onClick: () => handleEdit(fiscalYear),
      });
    }

    // Lock/Unlock button
    if (fiscalYear.is_locked) {
      buttons.push({
        icon: <Unlock className="h-4 w-4" />,
        label: t("actions.unlock"),
        onClick: () => handleUnlock(fiscalYear),
        loading: actionLoading === fiscalYear.id,
      });
    } else {
      buttons.push({
        icon: <Lock className="h-4 w-4" />,
        label: t("actions.lock"),
        onClick: () => handleLock(fiscalYear),
        loading: actionLoading === fiscalYear.id,
      });
    }

    // Export button (always available)
    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: t("actions.exportPDF"),
      onClick: () => handleExportPDF(fiscalYear),
    });

    // Delete button (only for unlocked fiscal years)
    if (!fiscalYear.is_locked) {
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: t("actions.delete"),
        onClick: () => handleDelete(fiscalYear),
      });
    }

    return buttons;
  };

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("newFiscalYear")}
          </Button>
        </div>

        {/* Filters Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>{t("title")}</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("filters.allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allStatuses")}</SelectItem>
                    <SelectItem value="open">{t("statuses.open")}</SelectItem>
                    <SelectItem value="locked">{t("statuses.locked")}</SelectItem>
                  </SelectContent>
                </Select>
                
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder={t("filters.searchPlaceholder")}
                    className="w-64 pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
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
            ) : filteredFiscalYears.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
                <Button onClick={handleCreate} variant="outline" className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  {t("empty.createFirst")}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead>{t("table.year")}</TableHead>
                    <TableHead>{t("table.period")}</TableHead>
                    <TableHead>{t("table.description")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFiscalYears.map((fiscalYear) => (
                    <TableRow key={fiscalYear.id}>
                      <TableCell className="font-medium">{fiscalYear.name}</TableCell>
                      <TableCell>{fiscalYear.year}</TableCell>
                      <TableCell>
                        {format(new Date(fiscalYear.start_date), "MMM dd, yyyy")} -{" "}
                        {format(new Date(fiscalYear.end_date), "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>{fiscalYear.description || "-"}</TableCell>
                      <TableCell>
                        {getStatusBadge(fiscalYear.is_locked)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(fiscalYear).map((btn, idx) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                btn.onClick();
                              }}
                              disabled={btn.loading}
                              title={btn.label}
                            >
                              {btn.loading ? (
                                <span className="h-4 w-4 animate-spin">⏳</span>
                              ) : (
                                btn.icon
                              )}
                            </Button>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Fiscal Year Dialog */}
        <Dialog open={showFiscalYearDialog} onOpenChange={setShowFiscalYearDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingFiscalYear ? t("dialogs.editTitle") : t("dialogs.createTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingFiscalYear ? t("dialogs.editDescription") : t("dialogs.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("fields.name")} *</Label>
                <Input
                  id="name"
                  value={fiscalYearForm.name}
                  onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year">{t("fields.year")} *</Label>
                  <Input
                    id="year"
                    type="number"
                    min="1900"
                    max="2100"
                    value={fiscalYearForm.year}
                    onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, year: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="isLocked">{t("fields.status")}</Label>
                  <Select
                    value={fiscalYearForm.isLocked ? "locked" : "open"}
                    onValueChange={(value) => setFiscalYearForm({ ...fiscalYearForm, isLocked: value === "locked" })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">{t("statuses.open")}</SelectItem>
                      <SelectItem value="locked">{t("statuses.locked")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">{t("fields.startDate")} *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={fiscalYearForm.startDate}
                    onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, startDate: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="endDate">{t("fields.endDate")} *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={fiscalYearForm.endDate}
                    onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">{t("fields.description")}</Label>
                <Input
                  id="description"
                  value={fiscalYearForm.description}
                  onChange={(e) => setFiscalYearForm({ ...fiscalYearForm, description: e.target.value })}
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowFiscalYearDialog(false)}
                  disabled={submitting}
                >
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {editingFiscalYear ? t("actions.updating") : t("actions.creating")}
                    </>
                  ) : editingFiscalYear ? (
                    t("actions.update")
                  ) : (
                    t("actions.create")
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}