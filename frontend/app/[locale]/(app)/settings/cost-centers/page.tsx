/**
 * Cost Centers Page
 * Manage cost centers for expense tracking and reporting
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Building,
  DollarSign,
  Eye,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";
import { costCentersApi, CostCenter } from "@/lib/api/cost-centers";
import { toast } from "sonner";
import logger from "@/lib/logger";

export default function CostCentersPage() {
  const locale = useLocale();
  const t = useTranslations("settings.costCenters");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCostCenterDialog, setShowCostCenterDialog] = useState(false);
  const [editingCostCenter, setEditingCostCenter] = useState<CostCenter | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [costCenterForm, setCostCenterForm] = useState({
    code: "",
    nameEn: "",
    nameAr: "",
    description: "",
    descriptionAr: "",
    parentId: "",
    isActive: true,
  });

  // Fetch initial data
  useEffect(() => {
    fetchCostCenters();
  }, [statusFilter]);

  const fetchCostCenters = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter && statusFilter !== "all") filters.is_active = statusFilter === "active";

      const data = await costCentersApi.getAll(filters);
      setCostCenters(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load cost centers";
      toast.error(message);
      logger.error("Failed to load cost centers", error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Filter cost centers based on search
  const filteredCostCenters = useMemo(() => {
    return costCenters.filter(
      (cc) =>
        cc.code.toLowerCase().includes(search.toLowerCase()) ||
        cc.name_en.toLowerCase().includes(search.toLowerCase()) ||
        cc.name_ar.includes(search) ||
        cc.description?.toLowerCase().includes(search.toLowerCase()) ||
        cc.description_ar?.includes(search)
    );
  }, [costCenters, search]);

  // Get status badge
  const getStatusBadge = (isActive: boolean) => {
    return (
      <Badge variant={isActive ? "default" : "secondary"}>
        {isActive ? t("statuses.active") : t("statuses.inactive")}
      </Badge>
    );
  };

  // Handle create cost center
  const handleCreate = () => {
    setEditingCostCenter(null);
    setCostCenterForm({
      code: "",
      nameEn: "",
      nameAr: "",
      description: "",
      descriptionAr: "",
      parentId: "",
      isActive: true,
    });
    setShowCostCenterDialog(true);
  };

  // Handle edit cost center
  const handleEdit = (costCenter: CostCenter) => {
    setEditingCostCenter(costCenter);
    setCostCenterForm({
      code: costCenter.code,
      nameEn: costCenter.name_en,
      nameAr: costCenter.name_ar,
      description: costCenter.description || "",
      descriptionAr: costCenter.description_ar || "",
      parentId: costCenter.parent_id || "",
      isActive: costCenter.is_active,
    });
    setShowCostCenterDialog(true);
  };

  // Handle delete cost center
  const handleDelete = async (costCenter: CostCenter) => {
    if (!confirm(`${t("confirmDelete")} ${costCenter.name_en}?`)) {
      return;
    }

    try {
      await costCentersApi.delete(costCenter.id);
      toast.success(t("deleteSuccess"));
      await fetchCostCenters();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete cost center";
      toast.error(message);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        code: costCenterForm.code,
        name_en: costCenterForm.nameEn,
        name_ar: costCenterForm.nameAr,
        description: costCenterForm.description || undefined,
        description_ar: costCenterForm.descriptionAr || undefined,
        parent_id: costCenterForm.parentId || undefined,
        is_active: costCenterForm.isActive,
      };

      if (editingCostCenter) {
        await costCentersApi.update(editingCostCenter.id, data);
        toast.success(t("updateSuccess"));
      } else {
        await costCentersApi.create(data);
        toast.success(t("createSuccess"));
      }

      setShowCostCenterDialog(false);
      await fetchCostCenters();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save cost center";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle export PDF
  const handleExportPDF = async (costCenter: CostCenter) => {
    try {
      const blob = await costCentersApi.exportToPDF(costCenter.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `cost-center-${costCenter.code}.pdf`;
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

  // Handle view cost center
  const handleView = (costCenter: CostCenter) => {
    // Navigate to cost center detail page or open a dialog
    // For now, just log - implement as needed
    console.log("View cost center:", costCenter);
  };

  // Get action buttons for each cost center
  const getActionButtons = (costCenter: CostCenter) => {
    const buttons = [];

    // View button (always available)
    buttons.push({
      icon: <Eye className="h-4 w-4" />,
      label: t("actions.view"),
      onClick: () => handleView(costCenter),
    });

    // Edit button (always available)
    buttons.push({
      icon: <Edit className="h-4 w-4" />,
      label: t("actions.edit"),
      onClick: () => handleEdit(costCenter),
    });

    // Export button (always available)
    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: t("actions.exportPDF"),
      onClick: () => handleExportPDF(costCenter),
    });

    // Delete button (always available)
    buttons.push({
      icon: <Trash2 className="h-4 w-4" />,
      label: t("actions.delete"),
      onClick: () => handleDelete(costCenter),
    });

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
            {t("newCostCenter")}
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
                    <SelectItem value="active">{t("statuses.active")}</SelectItem>
                    <SelectItem value="inactive">{t("statuses.inactive")}</SelectItem>
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
            ) : filteredCostCenters.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Building className="h-12 w-12 text-zinc-400 mb-4" />
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
                    <TableHead>{t("table.code")}</TableHead>
                    <TableHead>{t("table.name")}</TableHead>
                    <TableHead>{t("table.description")}</TableHead>
                    <TableHead>{t("table.parent")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCostCenters.map((costCenter) => (
                    <TableRow key={costCenter.id}>
                      <TableCell className="font-mono">{costCenter.code}</TableCell>
                      <TableCell>
                        <div className="font-medium">{costCenter.name_en}</div>
                        <div className="text-sm text-zinc-500" dir="rtl">
                          {costCenter.name_ar}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{costCenter.description}</div>
                        <div className="text-sm text-zinc-500" dir="rtl">
                          {costCenter.description_ar}
                        </div>
                      </TableCell>
                      <TableCell>
                        {costCenter.parent?.name_en ? (
                          <div>
                            <div>{costCenter.parent.name_en}</div>
                            <div className="text-sm text-zinc-500" dir="rtl">
                              {costCenter.parent.name_ar}
                            </div>
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(costCenter.is_active)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(costCenter).map((btn, idx) => (
                            <Button
                              key={idx}
                              variant="ghost"
                              size="icon"
                              onClick={(e) => {
                                e.stopPropagation();
                                btn.onClick();
                              }}
                              title={btn.label}
                            >
                              {btn.icon}
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

        {/* Create/Edit Cost Center Dialog */}
        <Dialog open={showCostCenterDialog} onOpenChange={setShowCostCenterDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCostCenter ? t("dialogs.editTitle") : t("dialogs.createTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingCostCenter ? t("dialogs.editDescription") : t("dialogs.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("fields.code")} *</Label>
                <Input
                  id="code"
                  value={costCenterForm.code}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, code: e.target.value })}
                  required
                  disabled={!!editingCostCenter}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nameEn">{t("fields.nameEn")} *</Label>
                <Input
                  id="nameEn"
                  value={costCenterForm.nameEn}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, nameEn: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="nameAr">{t("fields.nameAr")} *</Label>
                <Input
                  id="nameAr"
                  value={costCenterForm.nameAr}
                  onChange={(e) => setCostCenterForm({ ...costCenterForm, nameAr: e.target.value })}
                  dir="rtl"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="descriptionEn">{t("fields.descriptionEn")}</Label>
                  <Input
                    id="descriptionEn"
                    value={costCenterForm.description}
                    onChange={(e) => setCostCenterForm({ ...costCenterForm, description: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="descriptionAr">{t("fields.descriptionAr")}</Label>
                  <Input
                    id="descriptionAr"
                    value={costCenterForm.descriptionAr}
                    onChange={(e) => setCostCenterForm({ ...costCenterForm, descriptionAr: e.target.value })}
                    dir="rtl"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="parentId">{t("fields.parent")}</Label>
                <Select
                  value={costCenterForm.parentId}
                  onValueChange={(value) => setCostCenterForm({ ...costCenterForm, parentId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("fields.selectParent")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("fields.noParent")}</SelectItem>
                    {costCenters
                      .filter(cc => cc.id !== editingCostCenter?.id) // Exclude self to prevent circular reference
                      .map((cc) => (
                        <SelectItem key={cc.id} value={cc.id}>
                          {cc.name_en} ({cc.name_ar})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isActive"
                  checked={costCenterForm.isActive}
                  onCheckedChange={(checked) => setCostCenterForm({ ...costCenterForm, isActive: Boolean(checked) })}
                />
                <Label htmlFor="isActive" className="cursor-pointer">
                  {t("fields.isActive")}
                </Label>
              </div>
              
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCostCenterDialog(false)}
                  disabled={submitting}
                >
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {editingCostCenter ? t("actions.updating") : t("actions.creating")}
                    </>
                  ) : editingCostCenter ? (
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