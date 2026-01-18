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
 * Cost Centers Management Page
 * Create, edit, and manage cost centers for expense tracking
 */

import { useState, useEffect } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
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
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Building2 } from "lucide-react";
import { costCentersApi, CostCenter, CreateCostCenterDto } from "@/lib/api/settings";
import { toast } from "sonner";

export default function CostCentersPage() {
  const t = useTranslations("settings.costCenters");
  const tc = useTranslations("common");

  const [costCenters, setCostCenters] = useState<CostCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editCenter, setEditCenter] = useState<CostCenter | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    nameAr: "",
    description: "",
    parentId: "",
    isActive: true,
  });

  // Fetch cost centers
  useEffect(() => {
    fetchCostCenters();
  }, []);

  const fetchCostCenters = async () => {
    try {
      setLoading(true);
      const data = await costCentersApi.getAll();
      setCostCenters(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load cost centers");
    } finally {
      setLoading(false);
    }
  };

  // Open create dialog
  const handleCreate = () => {
    setEditCenter(null);
    setFormData({
      code: "",
      name: "",
      nameAr: "",
      description: "",
      parentId: "none",
      isActive: true,
    });
    setOpen(true);
  };

  // Open edit dialog
  const handleEdit = (center: CostCenter) => {
    setEditCenter(center);
    setFormData({
      code: center.code,
      name: center.name,
      nameAr: center.name_ar,
      description: center.description || "",
      parentId: center.parent_id || "none",
      isActive: center.is_active,
    });
    setOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: CreateCostCenterDto = {
        code: formData.code,
        name: formData.name,
        nameAr: formData.nameAr,
        description: formData.description,
        parentId: formData.parentId === "none" ? undefined : formData.parentId || undefined,
        isActive: formData.isActive,
      };

      if (editCenter) {
        await costCentersApi.update(editCenter.id, data);
        toast.success("Cost center updated successfully");
      } else {
        await costCentersApi.create(data);
        toast.success("Cost center created successfully");
      }

      setOpen(false);
      await fetchCostCenters();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save cost center");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle delete
  const handleDelete = async (center: CostCenter) => {
    if (center.account_count > 0) {
      toast.error("Cannot delete cost center with assigned accounts");
      return;
    }

    if (!confirm(`Are you sure you want to delete cost center ${center.name}?`)) {
      return;
    }

    try {
      await costCentersApi.delete(center.id);
      toast.success("Cost center deleted successfully");
      await fetchCostCenters();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete cost center");
    }
  };

  // Handle toggle active
  const handleToggleActive = async (center: CostCenter) => {
    try {
      await costCentersApi.toggleActive(center.id);
      toast.success("Cost center status updated");
      await fetchCostCenters();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to update cost center");
    }
  };

  // Get parent cost center name
  const getParentName = (parentId: string) => {
    const parent = costCenters.find((c) => c.id === parentId);
    return parent ? parent.name : "-";
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-zinc-500" />
            <div>
              <h1 className="text-3xl font-bold">{t("title")}</h1>
              <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
            </div>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("createCostCenter")}
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-500">
                {t("totalCostCenters")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{costCenters.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-500">
                {t("activeCostCenters")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {costCenters.filter((c) => c.is_active).length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-zinc-500">
                {t("totalAccounts")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {costCenters.reduce((sum, c) => sum + c.account_count, 0)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Centers Table */}
        <Card>
          <CardHeader>
            <CardTitle>{t("allCostCenters")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-500">Loading cost centers...</div>
            ) : costCenters.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                No cost centers found. Create your first cost center.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("code")}</TableHead>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("parent")}</TableHead>
                    <TableHead>{t("accounts")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">{tc("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {costCenters.map((center) => (
                    <TableRow key={center.id}>
                      <TableCell className="font-mono">{center.code}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{center.name}</div>
                          <div className="text-sm text-zinc-500">{center.name_ar}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {center.parent_id ? getParentName(center.parent_id) : "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{center.account_count}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={center.is_active ? "default" : "secondary"}>
                            {center.is_active ? tc("active") : tc("inactive")}
                          </Badge>
                          <Switch
                            checked={center.is_active}
                            onCheckedChange={() => handleToggleActive(center)}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(center)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(center)}
                            disabled={center.account_count > 0}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editCenter ? t("editCostCenter") : t("createCostCenter")}</DialogTitle>
              <DialogDescription>
                {editCenter
                  ? "Update cost center details"
                  : "Create a new cost center for expense tracking"}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("code")}</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="e.g., CC001"
                  required
                  disabled={!!editCenter}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Marketing Department"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nameAr">{t("nameArabic")}</Label>
                <Input
                  id="nameAr"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  dir="rtl"
                  placeholder="مثال: قسم التسويق"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("description")}</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Cost center description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="parentId">{t("parentCostCenter")}</Label>
                <Select
                  value={formData.parentId}
                  onValueChange={(value) => setFormData({ ...formData, parentId: value })}
                >
                  <SelectTrigger id="parentId">
                    <SelectValue placeholder={t("selectParent")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t("noParent")}</SelectItem>
                    {costCenters
                      .filter((c) => c.id !== editCenter?.id)
                      .map((center) => (
                        <SelectItem key={center.id} value={center.id}>
                          {center.code} - {center.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="isActive">{tc("active")}</Label>
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  {tc("cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t("saving") : tc("save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
