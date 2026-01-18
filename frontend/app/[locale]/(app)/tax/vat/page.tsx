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
 * VAT Management Page
 * Configure VAT rates and codes
 */

import { useState, useEffect } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Edit, Ban, Check, TrendingUp, Calendar, Star } from "lucide-react";
import { vatApi, VatRate, VatRateType } from "@/lib/api/vat";
import { toast } from "sonner";
import { format } from "date-fns";

export default function VatManagementPage() {
  const t = useTranslations("vat");
  const [search, setSearch] = useState("");
  const [rates, setRates] = useState<VatRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editRate, setEditRate] = useState<VatRate | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    rate: "",
    type: "" as VatRateType | "",
    effectiveDate: "",
    isDefault: false,
  });
  const [submitting, setSubmitting] = useState(false);

  // Fetch VAT rates
  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    try {
      setLoading(true);
      const data = await vatApi.getRates();
      setRates(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load VAT rates");
    } finally {
      setLoading(false);
    }
  };

  // Filter rates
  const filteredRates = rates.filter(
    (rate) =>
      rate.name.toLowerCase().includes(search.toLowerCase()) ||
      rate.code.toLowerCase().includes(search.toLowerCase())
  );

  // Calculate summary statistics
  const standardRate = rates.find((r) => r.type === "standard" && r.is_default);
  const reducedRates = rates.filter((r) => r.type === "reduced" && r.is_active);
  const lastUpdated =
    rates.length > 0
      ? format(
          new Date(Math.max(...rates.map((r) => new Date(r.updated_at).getTime()))),
          "MMM dd, yyyy"
        )
      : "-";

  // Open create dialog
  const handleCreate = () => {
    setEditRate(null);
    setFormData({
      code: "",
      name: "",
      rate: "",
      type: "",
      effectiveDate: format(new Date(), "yyyy-MM-dd"),
      isDefault: false,
    });
    setOpen(true);
  };

  // Open edit dialog
  const handleEdit = (rate: VatRate) => {
    setEditRate(rate);
    setFormData({
      code: rate.code,
      name: rate.name,
      rate: String(rate.rate),
      type: rate.type,
      effectiveDate: format(new Date(rate.effective_date), "yyyy-MM-dd"),
      isDefault: rate.is_default,
    });
    setOpen(true);
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        code: formData.code,
        name: formData.name,
        rate: parseFloat(formData.rate),
        type: formData.type as VatRateType,
        effective_date: formData.effectiveDate,
        is_default: formData.isDefault,
      };

      if (editRate) {
        await vatApi.updateRate(editRate.id, {
          name: data.name,
          rate: data.rate,
          is_default: data.is_default,
        });
        toast.success("VAT rate updated successfully");
      } else {
        await vatApi.createRate(data);
        toast.success("VAT rate created successfully");
      }

      setOpen(false);
      await fetchRates();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save VAT rate");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deactivate
  const handleDeactivate = async (rate: VatRate) => {
    if (!confirm(`Are you sure you want to deactivate ${rate.name}?`)) {
      return;
    }

    try {
      await vatApi.deactivateRate(rate.id);
      toast.success("VAT rate deactivated successfully");
      await fetchRates();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to deactivate VAT rate");
    }
  };

  const getVatTypeLabel = (type: VatRateType) => {
    const labels: Record<VatRateType, string> = {
      standard: t("types.standard"),
      reduced: t("types.reduced"),
      zero: t("types.zero"),
      exempt: t("types.exempt"),
    };
    return labels[type];
  };

  const getVatTypeBadgeColor = (type: VatRateType) => {
    const colors: Record<VatRateType, string> = {
      standard: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      reduced: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      zero: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      exempt: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
    };
    return colors[type];
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("summary.standardRate")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {standardRate ? `${standardRate.rate}%` : "-"}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {standardRate?.code || t("summary.notSet")}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("summary.reducedRates")}</CardTitle>
              <Star className="h-4 w-4 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reducedRates.length}</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("summary.activeRates")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("summary.lastUpdated")}</CardTitle>
              <Calendar className="h-4 w-4 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{lastUpdated}</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {t("summary.totalRates", { count: rates.length })}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t("title")}</h2>
            <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addRate")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("ratesList")}</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <Input
                  type="search"
                  placeholder={t("search")}
                  className="w-64 pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-500">{t("loading")}</div>
            ) : filteredRates.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">{t("noRates")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("code")}</TableHead>
                    <TableHead>{t("name")}</TableHead>
                    <TableHead>{t("rate")}</TableHead>
                    <TableHead>{t("type")}</TableHead>
                    <TableHead>{t("effectiveDate")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRates.map((rate) => (
                    <TableRow key={rate.id}>
                      <TableCell className="font-mono font-medium">
                        {rate.code}
                        {rate.is_default && (
                          <Star className="ml-2 inline h-3 w-3 fill-yellow-500 text-yellow-500" />
                        )}
                      </TableCell>
                      <TableCell>{rate.name}</TableCell>
                      <TableCell className="font-semibold">{rate.rate}%</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getVatTypeBadgeColor(
                            rate.type
                          )}`}
                        >
                          {getVatTypeLabel(rate.type)}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(rate.effective_date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>
                        {rate.is_active ? (
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <Check className="h-4 w-4" />
                            {t("active")}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-zinc-600 dark:text-zinc-400">
                            <Ban className="h-4 w-4" />
                            {t("inactive")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(rate)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {rate.is_active && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeactivate(rate)}
                            >
                              <Ban className="h-4 w-4" />
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

        {/* Create/Edit Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editRate ? t("editRate") : t("addRate")}</DialogTitle>
              <DialogDescription>
                {editRate ? t("editRateDescription") : t("addRateDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("code")}</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  required
                  disabled={!!editRate}
                  placeholder="e.g., STD-15, RED-5"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  placeholder="e.g., Standard Rate, Reduced Rate"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rate">{t("rate")}</Label>
                <Input
                  id="rate"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                  placeholder="e.g., 15"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">{t("type")}</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value as VatRateType })
                  }
                  required
                  disabled={!!editRate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectType")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">{t("types.standard")}</SelectItem>
                    <SelectItem value="reduced">{t("types.reduced")}</SelectItem>
                    <SelectItem value="zero">{t("types.zero")}</SelectItem>
                    <SelectItem value="exempt">{t("types.exempt")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="effectiveDate">{t("effectiveDate")}</Label>
                <Input
                  id="effectiveDate"
                  type="date"
                  value={formData.effectiveDate}
                  onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-zinc-300"
                />
                <Label htmlFor="isDefault" className="cursor-pointer">
                  {t("setDefaultRate")}
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={submitting}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t("saving") : t("save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
