/**
 * VAT Returns Page
 * VAT return preparation and filing functionality
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
  FileText,
  Upload,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { vatReturnsApi, VatReturn, VatRate } from "@/lib/api/vat-returns";
import { vatApi } from "@/lib/api/vat";
import { toast } from "sonner";
import { format } from "date-fns";
import logger from "@/lib/logger";

export default function VatReturnsPage() {
  const t = useTranslations("tax.vatReturns");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [vatReturns, setVatReturns] = useState<VatReturn[]>([]);
  const [vatRates, setVatRates] = useState<VatRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showCalculateDialog, setShowCalculateDialog] = useState(false);
  const [calculationStartDate, setCalculationStartDate] = useState("");
  const [calculationEndDate, setCalculationEndDate] = useState("");

  // Fetch initial data
  useEffect(() => {
    fetchVatReturns();
    fetchVatRates();
  }, [statusFilter, periodFilter]);

  const fetchVatReturns = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
      if (periodFilter && periodFilter !== "all") filters.period = periodFilter;

      const data = await vatReturnsApi.getAll(filters);
      setVatReturns(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load VAT returns";
      toast.error(message);
      logger.error("Failed to load VAT returns", error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVatRates = async () => {
    try {
      const data = await vatApi.getAll();
      setVatRates(data);
    } catch (error: unknown) {
      logger.error("Failed to load VAT rates", error as Error);
    }
  };

  // Filter VAT returns based on search
  const filteredVatReturns = useMemo(() => {
    return vatReturns.filter(
      (vr) =>
        vr.return_number.toLowerCase().includes(search.toLowerCase()) ||
        vr.period.toLowerCase().includes(search.toLowerCase()) ||
        vr.status.toLowerCase().includes(search.toLowerCase())
    );
  }, [vatReturns, search]);

  // Get status badge
  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "secondary",
      calculated: "outline",
      filed: "default",
      paid: "default",
      cancelled: "destructive",
    };
    
    const labels: Record<string, string> = {
      draft: t("statuses.draft"),
      calculated: t("statuses.calculated"),
      filed: t("statuses.filed"),
      paid: t("statuses.paid"),
      cancelled: t("statuses.cancelled"),
    };
    
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  // Action handlers
  const handleCalculate = async () => {
    if (!calculationStartDate || !calculationEndDate) {
      toast.error(t("errors.selectBothDates"));
      return;
    }
    
    try {
      const data = {
        start_date: calculationStartDate,
        end_date: calculationEndDate,
      };
      
      await vatReturnsApi.calculate(data);
      toast.success(t("calculateSuccess"));
      setShowCalculateDialog(false);
      await fetchVatReturns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to calculate VAT return";
      toast.error(message);
    }
  };

  const handleView = (vatReturn: VatReturn) => {
    router.push(`/${locale}/tax/vat-returns/${vatReturn.id}`);
  };

  const handleDelete = async (vatReturn: VatReturn) => {
    if (!confirm(`${t("confirmDelete")} ${vatReturn.return_number}?`)) {
      return;
    }

    try {
      await vatReturnsApi.delete(vatReturn.id);
      toast.success(t("deleteSuccess"));
      await fetchVatReturns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete VAT return";
      toast.error(message);
    }
  };

  const handleFileReturn = async (vatReturn: VatReturn) => {
    setActionLoading(vatReturn.id);
    try {
      await vatReturnsApi.file(vatReturn.id);
      toast.success(t("fileSuccess"));
      await fetchVatReturns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to file VAT return";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkAsPaid = async (vatReturn: VatReturn) => {
    setActionLoading(vatReturn.id);
    try {
      await vatReturnsApi.markAsPaid(vatReturn.id);
      toast.success(t("markPaidSuccess"));
      await fetchVatReturns();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to mark as paid";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportPDF = async (vatReturn: VatReturn) => {
    try {
      const blob = await vatReturnsApi.exportToPDF(vatReturn.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vat-return-${vatReturn.return_number}.pdf`;
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

  const handleExportExcel = async (vatReturn: VatReturn) => {
    try {
      const blob = await vatReturnsApi.exportToExcel(vatReturn.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vat-return-${vatReturn.return_number}.xlsx`;
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

  // Get action buttons for each VAT return
  const getActionButtons = (vatReturn: VatReturn) => {
    const buttons = [];

    // View button (always available)
    buttons.push({
      icon: <Eye className="h-4 w-4" />,
      label: t("actions.view"),
      onClick: () => handleView(vatReturn),
    });

    // Export buttons (always available)
    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: t("actions.exportPDF"),
      onClick: () => handleExportPDF(vatReturn),
    });

    buttons.push({
      icon: <FileText className="h-4 w-4" />,
      label: t("actions.exportExcel"),
      onClick: () => handleExportExcel(vatReturn),
    });

    // File return button (calculated only)
    if (vatReturn.status === "calculated") {
      buttons.push({
        icon: <Upload className="h-4 w-4" />,
        label: t("actions.fileReturn"),
        onClick: () => handleFileReturn(vatReturn),
        loading: actionLoading === vatReturn.id,
      });
    }

    // Mark as paid button (filed only)
    if (vatReturn.status === "filed") {
      buttons.push({
        icon: <Check className="h-4 w-4" />,
        label: t("actions.markAsPaid"),
        onClick: () => handleMarkAsPaid(vatReturn),
        loading: actionLoading === vatReturn.id,
      });
    }

    // Delete button (draft only)
    if (vatReturn.status === "draft") {
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: t("actions.delete"),
        onClick: () => handleDelete(vatReturn),
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
              {t("calculateReturn")}
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
                    <SelectItem value="filed">{t("statuses.filed")}</SelectItem>
                    <SelectItem value="paid">{t("statuses.paid")}</SelectItem>
                    <SelectItem value="cancelled">{t("statuses.cancelled")}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder={t("filters.allPeriods")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allPeriods")}</SelectItem>
                    <SelectItem value="january">{t("periods.january")}</SelectItem>
                    <SelectItem value="february">{t("periods.february")}</SelectItem>
                    <SelectItem value="march">{t("periods.march")}</SelectItem>
                    <SelectItem value="april">{t("periods.april")}</SelectItem>
                    <SelectItem value="may">{t("periods.may")}</SelectItem>
                    <SelectItem value="june">{t("periods.june")}</SelectItem>
                    <SelectItem value="july">{t("periods.july")}</SelectItem>
                    <SelectItem value="august">{t("periods.august")}</SelectItem>
                    <SelectItem value="september">{t("periods.september")}</SelectItem>
                    <SelectItem value="october">{t("periods.october")}</SelectItem>
                    <SelectItem value="november">{t("periods.november")}</SelectItem>
                    <SelectItem value="december">{t("periods.december")}</SelectItem>
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
            ) : filteredVatReturns.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/${locale}/tax/vat-returns/calculate`}>
                    <Calculator className="mr-2 h-4 w-4" />
                    {t("calculateFirst")}
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.returnNumber")}</TableHead>
                    <TableHead>{t("table.period")}</TableHead>
                    <TableHead>{t("table.dueDate")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.netVat")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVatReturns.map((vatReturn) => (
                    <TableRow key={vatReturn.id}>
                      <TableCell className="font-mono">{vatReturn.return_number}</TableCell>
                      <TableCell>{vatReturn.period}</TableCell>
                      <TableCell>
                        {vatReturn.due_date ? format(new Date(vatReturn.due_date), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(vatReturn.status)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {vatReturn.net_vat > 0 ? "QAR " : "-QAR "}
                        {Math.abs(vatReturn.net_vat)?.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(vatReturn).map((btn, idx) => (
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

        {/* Calculate VAT Return Dialog */}
        <Dialog open={showCalculateDialog} onOpenChange={setShowCalculateDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("dialogs.calculateTitle")}</DialogTitle>
              <DialogDescription>{t("dialogs.calculateDescription")}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">{t("dialogs.startDate")}</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={calculationStartDate}
                  onChange={(e) => setCalculationStartDate(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">{t("dialogs.endDate")}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={calculationEndDate}
                  onChange={(e) => setCalculationEndDate(e.target.value)}
                />
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