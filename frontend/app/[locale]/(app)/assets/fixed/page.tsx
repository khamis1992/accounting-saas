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
 * Fixed Assets Page
 * Displays asset register with all fixed assets
 */

import { useState, useEffect } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
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
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assetsApi, FixedAsset, AssetCategory, AssetStatus } from "@/lib/api/assets";
import logger from "@/lib/logger";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function FixedAssetsPage() {
  const t = useTranslations("assets");
  const router = useRouter();
  const locale = useLocale();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [summary, setSummary] = useState({
    total_cost: 0,
    total_accumulated_depreciation: 0,
    total_net_book_value: 0,
    asset_count: 0,
  });
  const [loading, setLoading] = useState(true);
  const [disposeDialog, setDisposeDialog] = useState<{
    open: boolean;
    asset: FixedAsset | null;
    type: "dispose" | "sell";
    amount: string;
    date: string;
  }>({
    open: false,
    asset: null,
    type: "dispose",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchAssets();
    fetchSummary();
  }, [categoryFilter, statusFilter]);

  const fetchAssets = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (categoryFilter) filters.category = categoryFilter;
      if (statusFilter) filters.status = statusFilter;

      const data = await assetsApi.getAssets(filters);
      setAssets(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load assets");
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const data = await assetsApi.getAssetSummary();
      setSummary(data);
    } catch (error: unknown) {
      logger.error("Failed to load summary:", error);
    }
  };

  const getStatusBadge = (status: AssetStatus) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      active: "default",
      "fully-depreciated": "secondary",
      disposed: "outline",
      sold: "destructive",
    };
    return (
      <Badge variant={variants[status] || "secondary"}>
        {t(`statuses.${status.replace("-", "")}` as any)}
      </Badge>
    );
  };

  const getCategoryLabel = (category: AssetCategory) => {
    const labels: Record<AssetCategory, string> = {
      furniture: "Furniture",
      equipment: "Equipment",
      vehicles: "Vehicles",
      computers: "Computers",
      buildings: "Buildings",
      land: "Land",
      other: "Other",
    };
    return labels[category];
  };

  const filteredAssets = assets.filter(
    (a) =>
      a.asset_code.toLowerCase().includes(search.toLowerCase()) ||
      a.asset_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    router.push(`/${locale}/assets/fixed/new`);
  };

  const handleView = (asset: FixedAsset) => {
    router.push(`/${locale}/assets/fixed/${asset.id}`);
  };

  const handleEdit = (asset: FixedAsset) => {
    router.push(`/${locale}/assets/fixed/${asset.id}/edit`);
  };

  const handleDispose = (asset: FixedAsset, type: "dispose" | "sell") => {
    setDisposeDialog({
      open: true,
      asset,
      type,
      amount: asset.net_book_value.toString(),
      date: new Date().toISOString().split("T")[0],
    });
  };

  const handleDisposeConfirm = async () => {
    if (!disposeDialog.asset) return;

    const amount = parseFloat(disposeDialog.amount);
    if (isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    try {
      await assetsApi.disposeAsset(
        disposeDialog.asset.id,
        disposeDialog.date,
        amount,
        disposeDialog.type
      );
      toast.success(`Asset ${disposeDialog.type === "sell" ? "sold" : "disposed"} successfully`);
      setDisposeDialog({ ...disposeDialog, open: false });
      await fetchAssets();
      await fetchSummary();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : `Failed to ${disposeDialog.type} asset`);
    }
  };

  const handleDelete = async (asset: FixedAsset) => {
    if (!confirm(`Are you sure you want to delete ${asset.asset_name}?`)) {
      return;
    }

    try {
      await assetsApi.disposeAsset(asset.id, new Date().toISOString().split("T")[0], 0, "dispose");
      toast.success("Asset deleted successfully");
      await fetchAssets();
      await fetchSummary();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete asset");
    }
  };

  const getActionButtons = (asset: FixedAsset) => {
    const buttons = [];

    // View button
    buttons.push({
      icon: <Eye className="h-4 w-4" />,
      label: "View",
      onClick: () => handleView(asset),
    });

    // Edit button (only for active assets)
    if (asset.status === "active") {
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: "Edit",
        onClick: () => handleEdit(asset),
      });
    }

    // Dispose button (only for active assets)
    if (asset.status === "active") {
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: "Dispose",
        onClick: () => handleDispose(asset, "dispose"),
      });
    }

    return buttons;
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Manage your fixed assets register</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Asset
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
              <DollarSign className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.asset_count}</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Registered assets</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
              <TrendingUp className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">QAR {summary.total_cost.toLocaleString()}</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Original purchase cost</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accumulated Depreciation</CardTitle>
              <TrendingDown className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                QAR {summary.total_accumulated_depreciation.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Total depreciation to date</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Book Value</CardTitle>
              <DollarSign className="h-4 w-4 text-zinc-600 dark:text-zinc-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                QAR {summary.total_net_book_value.toLocaleString()}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">Current asset value</p>
            </CardContent>
          </Card>
        </div>

        {/* Assets Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Asset Register</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="furniture">Furniture</SelectItem>
                    <SelectItem value="equipment">Equipment</SelectItem>
                    <SelectItem value="vehicles">Vehicles</SelectItem>
                    <SelectItem value="computers">Computers</SelectItem>
                    <SelectItem value="buildings">Buildings</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="fully-depreciated">Fully Depreciated</SelectItem>
                    <SelectItem value="disposed">Disposed</SelectItem>
                    <SelectItem value="sold">Sold</SelectItem>
                  </SelectContent>
                </Select>

                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder="Search assets..."
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
              <div className="py-8 text-center text-zinc-500">Loading assets...</div>
            ) : filteredAssets.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">No assets found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset Code</TableHead>
                    <TableHead>Asset Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Purchase Date</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Accum. Depreciation</TableHead>
                    <TableHead className="text-right">Net Book Value</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAssets.map((asset) => (
                    <TableRow key={asset.id}>
                      <TableCell className="font-mono text-sm">{asset.asset_code}</TableCell>
                      <TableCell className="font-medium">{asset.asset_name}</TableCell>
                      <TableCell>{getCategoryLabel(asset.category)}</TableCell>
                      <TableCell>{new Date(asset.purchase_date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        QAR {asset.purchase_cost.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        QAR {asset.accumulated_depreciation.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        QAR {asset.net_book_value.toLocaleString()}
                      </TableCell>
                      <TableCell>{getStatusBadge(asset.status)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {getActionButtons(asset).map((btn, idx) => (
                              <DropdownMenuItem
                                key={idx}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  btn.onClick();
                                }}
                              >
                                {btn.icon}
                                <span className="ml-2">{btn.label}</span>
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dispose/Sell Dialog */}
      <Dialog
        open={disposeDialog.open}
        onOpenChange={(open) => setDisposeDialog({ ...disposeDialog, open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {disposeDialog.type === "sell" ? "Sell Asset" : "Dispose Asset"}
            </DialogTitle>
            <DialogDescription>
              {disposeDialog.asset?.asset_name} ({disposeDialog.asset?.asset_code})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dispose-date">
                {disposeDialog.type === "sell" ? "Sale Date" : "Disposal Date"}
              </Label>
              <Input
                id="dispose-date"
                type="date"
                value={disposeDialog.date}
                onChange={(e) => setDisposeDialog({ ...disposeDialog, date: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispose-amount">
                {disposeDialog.type === "sell" ? "Sale Amount" : "Disposal Amount"}
              </Label>
              <Input
                id="dispose-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={disposeDialog.amount}
                onChange={(e) => setDisposeDialog({ ...disposeDialog, amount: e.target.value })}
              />
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                Current Net Book Value: QAR {disposeDialog.asset?.net_book_value.toLocaleString()}
              </p>
            </div>

            {disposeDialog.asset && (
              <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Cost:</span>{" "}
                    <span className="font-medium">
                      QAR {disposeDialog.asset.purchase_cost.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-zinc-600 dark:text-zinc-400">Accum. Depreciation:</span>{" "}
                    <span className="font-medium">
                      QAR {disposeDialog.asset.accumulated_depreciation.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDisposeDialog({ ...disposeDialog, open: false })}
            >
              Cancel
            </Button>
            <Button onClick={handleDisposeConfirm}>
              {disposeDialog.type === "sell" ? "Sell Asset" : "Dispose Asset"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AuthenticatedLayout>
  );
}
