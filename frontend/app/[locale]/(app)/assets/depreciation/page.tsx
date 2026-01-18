/**
 * Depreciation Page
 * Fixed asset depreciation management with calculation and posting
 */

"use client";

import { useState, useEffect, useMemo } from "react";
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
  Download,
  Eye,
  Calculator,
  Upload,
  Calendar,
  RefreshCw,
  FileText,
} from "lucide-react";
import { depreciationApi, Depreciation, Asset } from "@/lib/api/depreciation";
import { assetsApi } from "@/lib/api/assets";
import { toast } from "sonner";
import { format } from "date-fns";
import logger from "@/lib/logger";

export default function DepreciationPage() {
  const t = useTranslations("assets.depreciation");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [assetFilter, setAssetFilter] = useState<string>("all");
  const [depreciations, setDepreciations] = useState<Depreciation[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [calculationDate, setCalculationDate] = useState("");
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);

  // Fetch initial data
  useEffect(() => {
    fetchDepreciations();
    fetchAssets();
  }, [statusFilter, assetFilter]);

  const fetchDepreciations = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
      if (assetFilter && assetFilter !== "all") filters.asset_id = assetFilter;

      const data = await depreciationApi.getAll(filters);
      setDepreciations(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load depreciations";
      toast.error(message);
      logger.error("Failed to load depreciations", error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssets = async () => {
    try {
      const data = await assetsApi.getAll({ is_active: true });
      setAssets(data);
    } catch (error: unknown) {
      logger.error("Failed to load assets", error as Error);
    }
  };

  // Filter depreciations based on search
  const filteredDepreciations = useMemo(() => {
    return depreciations.filter(
      (dep) =>
        dep.depreciation_number.toLowerCase().includes(search.toLowerCase()) ||
        dep.asset?.name_en?.toLowerCase().includes(search.toLowerCase()) ||
        dep.asset?.name_ar?.includes(search) ||
        dep.asset?.asset_code.includes(search)
    );
  }, [depreciations, search]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "secondary",
      calculated: "outline",
      posted: "default",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      draft: t("statuses.draft"),
      calculated: t("statuses.calculated"),
      posted: t("statuses.posted"),
      cancelled: t("statuses.cancelled"),
    };
    
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  // Get depreciation method badge
  const getMethodBadge = (method: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      straight_line: "default",
      declining_balance: "secondary",
      units_of_production: "outline",
    };
    
    const labels: Record<string, string> = {
      straight_line: t("methods.straightLine"),
      declining_balance: t("methods.decliningBalance"),
      units_of_production: t("methods.unitsOfProduction"),
    };
    
    return <Badge variant={variants[method] || "outline"}>{labels[method] || method}</Badge>;
  };

  // Action handlers
  const handleCalculate = async () => {
    if (!calculationDate) {
      toast.error(t("errors.selectDate"));
      return;
    }
    
    try {
      const data = {
        calculation_date: calculationDate,
        asset_ids: selectedAssetIds.length > 0 ? selectedAssetIds : undefined,
      };
      
      await depreciationApi.calculate(data);
      toast.success(t("calculateSuccess"));
      setShowCalculateDialog(false);
      await fetchDepreciations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to calculate depreciation";
      toast.error(message);
    }
  };

  const handleView = (depreciation: Depreciation) => {
    router.push(`/${locale}/assets/depreciation/${depreciation.id}`);
  };

  const handleDelete = async (depreciation: Depreciation) => {
    if (!confirm(`${t("confirmDelete")} ${depreciation.depreciation_number}?`)) {
      return;
    }

    try {
      await depreciationApi.delete(depreciation.id);
      toast.success(t("deleteSuccess"));
      await fetchDepreciations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete depreciation";
      toast.error(message);
    }
  };

  const handlePostToJournal = async (depreciation: Depreciation) => {
    setActionLoading(depreciation.id);
    try {
      await depreciationApi.postToJournal(depreciation.id);
      toast.success(t("postSuccess"));
      await fetchDepreciations();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to post to journal";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportPDF = async (depreciation: Depreciation) => {
    try {
      const blob = await depreciationApi.exportToPDF(depreciation.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `depreciation-${depreciation.depreciation_number}.pdf`;
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

  const handleExportExcel = async (depreciation: Depreciation) => {
    try {
      const blob = await depreciationApi.exportToExcel(depreciation.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `depreciation-${depreciation.depreciation_number}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("exportExcelSuccess"));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to export Excel";
      toast.error(message);
    }
  };

  // Get action buttons for each depreciation
  const getActionButtons = (depreciation: Depreciation) => {
    const buttons = [];

    // View button (always available)
    buttons.push({
      icon: <Eye className="h-4 w-4" />,
      label: t("actions.view"),
      onClick: () => handleView(depreciation),
    });

    // Export buttons (always available)
    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: t("actions.exportPDF"),
      onClick: () => handleExportPDF(depreciation),
    });

    buttons.push({
      icon: <FileText className="h-4 w-4" />,
      label: t("actions.exportExcel"),
      onClick: () => handleExportExcel(depreciation),
    });

    // Post to journal button (calculated only)
    if (depreciation.status === "calculated") {
      buttons.push({
        icon: <Upload className="h-4 w-4" />,
        label: t("actions.postToJournal"),
        onClick: () => handlePostToJournal(depreciation),
        loading: actionLoading === depreciation.id,
      });
    }

    // Delete button (draft only)
    if (depreciation.status === "draft") {
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: t("actions.delete"),
        onClick: () => handleDelete(depreciation),
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
          <div className="flex gap-2">
            <Button onClick={() => setShowCalculateDialog(true)} className="gap-2">
              <Calculator className="h-4 w-4" />
              {t("calculateDepreciation")}
            </Button>
          </div>
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
                    <SelectItem value="draft">{t("statuses.draft")}</SelectItem>
                    <SelectItem value="calculated">{t("statuses.calculated")}</SelectItem>
                    <SelectItem value="posted">{t("statuses.posted")}</SelectItem>
                    <SelectItem value="cancelled">{t("statuses.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={assetFilter} onValueChange={setAssetFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("filters.allAssets")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allAssets")}</SelectItem>
                    {assets.map((asset) => (
                      <SelectItem key={asset.id} value={asset.id}>
                        {asset.name_en} ({asset.asset_code})
                      </SelectItem>
                    ))}
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
            ) : filteredDepreciations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/${locale}/assets/depreciation/calculate`}>
                    <Calculator className="mr-2 h-4 w-4" />
                    {t("calculateFirst")}
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.depreciationNumber")}</TableHead>
                    <TableHead>{t("table.asset")}</TableHead>
                    <TableHead>{t("table.calculationDate")}</TableHead>
                    <TableHead>{t("table.method")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.amount")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepreciations.map((depreciation) => (
                    <TableRow key={depreciation.id}>
                      <TableCell className="font-mono">{depreciation.depreciation_number}</TableCell>
                      <TableCell>
                        <div>
                          <div>{depreciation.asset?.name_en}</div>
                          <div className="text-sm text-zinc-500" dir="rtl">
                            {depreciation.asset?.name_ar}
                          </div>
                          <div className="text-xs text-zinc-400">
                            {depreciation.asset?.asset_code}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(depreciation.calculation_date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(depreciation.method)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(depreciation.status)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        QAR {depreciation.total_amount?.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(depreciation).map((btn, idx) => (
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

        {/* Calculate Depreciation Dialog */}
        <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("dialogs.calculateTitle")}</DialogTitle>
              <DialogDescription>{t("dialogs.calculateDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="calculationDate">{t("dialogs.calculationDate")}</Label>
                <Input
                  id="calculationDate"
                  type="date"
                  value={calculationDate}
                  onChange={(e) => setCalculationDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>{t("dialogs.selectAssets")}</Label>
                <div className="max-h-60 overflow-y-auto rounded-md border p-2">
                  {assets.map((asset) => (
                    <div key={asset.id} className="flex items-center gap-2 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                      <input
                        type="checkbox"
                        id={`asset-${asset.id}`}
                        checked={selectedAssetIds.includes(asset.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedAssetIds([...selectedAssetIds, asset.id]);
                          } else {
                            setSelectedAssetIds(selectedAssetIds.filter(id => id !== asset.id));
                          }
                        }}
                      />
                      <label htmlFor={`asset-${asset.id}`} className="flex-1">
                        <div>{asset.name_en}</div>
                        <div className="text-sm text-zinc-500" dir="rtl">
                          {asset.name_ar}
                        </div>
                        <div className="text-xs text-zinc-400">
                          {asset.asset_code} • {asset.category}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCalculateDialog(false)}>
                {t("dialogs.cancel")}
              </Button>
              <Button onClick={handleCalculate}>
                <Calculator className="mr-2 h-4 w-4" />
                {t("dialogs.calculate")}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
  );
}