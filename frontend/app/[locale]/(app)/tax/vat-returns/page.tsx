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
 * VAT Returns Page
 * Generate and file VAT returns
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
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Eye,
  FileText,
  Download,
  CheckCircle,
  Calendar,
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import { vatApi, VatReturn, VatReturnStatus, VatReturnBreakdown } from "@/lib/api/vat";
import { toast } from "sonner";
import { format } from "date-fns";

export default function VatReturnsPage() {
  const t = useTranslations("vatReturns");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
  const [returns, setReturns] = useState<VatReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [openCalculate, setOpenCalculate] = useState(false);
  const [openBreakdown, setOpenBreakdown] = useState(false);
  const [openFile, setOpenFile] = useState(false);
  const [openPayment, setOpenPayment] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<VatReturn | null>(null);
  const [breakdown, setBreakdown] = useState<VatReturnBreakdown | null>(null);
  const [calculating, setCalculating] = useState(false);
  const [filing, setFiling] = useState(false);
  const [recordingPayment, setRecordingPayment] = useState(false);
  const [periodData, setPeriodData] = useState({
    periodStart: "",
    periodEnd: "",
  });
  const [paymentData, setPaymentData] = useState({
    paymentDate: format(new Date(), "yyyy-MM-dd"),
    reference: "",
  });

  // Fetch VAT returns
  useEffect(() => {
    fetchReturns();
  }, [yearFilter]);

  const fetchReturns = async () => {
    try {
      setLoading(true);
      const data = await vatApi.getReturns({
        year: parseInt(yearFilter),
      });
      setReturns(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load VAT returns");
    } finally {
      setLoading(false);
    }
  };

  // Filter returns
  const filteredReturns = returns.filter(
    (ret) => ret.period_start.includes(search) || ret.period_end.includes(search)
  );

  // Calculate summary statistics
  const totalOutputVat = returns.reduce((sum, r) => sum + r.output_vat, 0);
  const totalInputVat = returns.reduce((sum, r) => sum + r.input_vat, 0);
  const netVat = returns.reduce((sum, r) => sum + r.net_vat, 0);

  // Handle calculate return
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCalculating(true);

    try {
      const result = await vatApi.calculateReturn(periodData.periodStart, periodData.periodEnd);
      toast.success("VAT return calculated successfully");
      setOpenCalculate(false);
      await fetchReturns();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to calculate VAT return");
    } finally {
      setCalculating(false);
    }
  };

  // Handle view breakdown
  const handleViewBreakdown = async (vatReturn: VatReturn) => {
    try {
      setSelectedReturn(vatReturn);
      const data = await vatApi.getReturnBreakdown(vatReturn.id);
      setBreakdown(data);
      setOpenBreakdown(true);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load breakdown");
    }
  };

  // Handle file return
  const handleFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    setFiling(true);

    try {
      await vatApi.markAsFiled(selectedReturn.id, format(new Date(), "yyyy-MM-dd"));
      toast.success("VAT return filed successfully");
      setOpenFile(false);
      await fetchReturns();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to file VAT return");
    } finally {
      setFiling(false);
    }
  };

  // Handle record payment
  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReturn) return;

    setRecordingPayment(true);

    try {
      await vatApi.recordPayment(selectedReturn.id, paymentData.paymentDate, paymentData.reference);
      toast.success("Payment recorded successfully");
      setOpenPayment(false);
      await fetchReturns();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to record payment");
    } finally {
      setRecordingPayment(false);
    }
  };

  // Handle export to PDF
  const handleExport = async (vatReturn: VatReturn) => {
    try {
      await vatApi.exportToPDF(vatReturn.id);
      toast.success("PDF exported successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to export PDF");
    }
  };

  const getStatusLabel = (status: VatReturnStatus) => {
    const labels: Record<VatReturnStatus, string> = {
      draft: t("statuses.draft"),
      calculated: t("statuses.calculated"),
      filed: t("statuses.filed"),
      paid: t("statuses.paid"),
    };
    return labels[status];
  };

  const getStatusBadgeColor = (status: VatReturnStatus) => {
    const colors: Record<VatReturnStatus, string> = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      calculated: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      filed: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
      paid: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
    };
    return colors[status];
  };

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("summary.totalOutput")}</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{totalOutputVat.toFixed(2)}</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("summary.outputVat")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("summary.totalInput")}</CardTitle>
              <TrendingDown className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalInputVat.toFixed(2)}</div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">{t("summary.inputVat")}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t("summary.netPayable")}</CardTitle>
              <DollarSign className="h-4 w-4 text-zinc-600" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${netVat >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {netVat >= 0 ? "+" : ""}
                {netVat.toFixed(2)}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                {netVat >= 0 ? t("summary.payable") : t("summary.refundable")}
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
          <Button onClick={() => setOpenCalculate(true)} className="gap-2">
            <Calculator className="h-4 w-4" />
            {t("calculateReturn")}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("returnsList")}</CardTitle>
              <div className="flex gap-2">
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - i;
                      return (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
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
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-500">{t("loading")}</div>
            ) : filteredReturns.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">{t("noReturns")}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("period")}</TableHead>
                    <TableHead>{t("startDate")}</TableHead>
                    <TableHead>{t("endDate")}</TableHead>
                    <TableHead>{t("status")}</TableHead>
                    <TableHead className="text-right">{t("outputVat")}</TableHead>
                    <TableHead className="text-right">{t("inputVat")}</TableHead>
                    <TableHead className="text-right">{t("netVat")}</TableHead>
                    <TableHead className="text-right">{t("actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReturns.map((vatReturn) => (
                    <TableRow key={vatReturn.id}>
                      <TableCell className="font-medium">
                        {format(new Date(vatReturn.period_start), "MMM yyyy")}
                      </TableCell>
                      <TableCell>
                        {format(new Date(vatReturn.period_start), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>{format(new Date(vatReturn.period_end), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs font-medium ${getStatusBadgeColor(
                            vatReturn.status
                          )}`}
                        >
                          {getStatusLabel(vatReturn.status)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        {vatReturn.output_vat.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-blue-600">
                        {vatReturn.input_vat.toFixed(2)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-bold ${
                          vatReturn.net_vat >= 0 ? "text-green-600" : "text-red-600"
                        }`}
                      >
                        {vatReturn.net_vat >= 0 ? "+" : ""}
                        {vatReturn.net_vat.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewBreakdown(vatReturn)}
                            title={t("viewBreakdown")}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {vatReturn.status === "calculated" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedReturn(vatReturn);
                                setOpenFile(true);
                              }}
                              title={t("markAsFiled")}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          {(vatReturn.status === "filed" || vatReturn.status === "paid") && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedReturn(vatReturn);
                                setOpenPayment(true);
                              }}
                              title={t("recordPayment")}
                            >
                              <DollarSign className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleExport(vatReturn)}
                            title={t("exportPdf")}
                          >
                            <Download className="h-4 w-4" />
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

        {/* Calculate Dialog */}
        <Dialog open={openCalculate} onOpenChange={setOpenCalculate}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("calculateReturn")}</DialogTitle>
              <DialogDescription>{t("calculateDescription")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCalculate} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="periodStart">{t("startDate")}</Label>
                <Input
                  id="periodStart"
                  type="date"
                  value={periodData.periodStart}
                  onChange={(e) =>
                    setPeriodData({
                      ...periodData,
                      periodStart: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="periodEnd">{t("endDate")}</Label>
                <Input
                  id="periodEnd"
                  type="date"
                  value={periodData.periodEnd}
                  onChange={(e) => setPeriodData({ ...periodData, periodEnd: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenCalculate(false)}
                  disabled={calculating}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={calculating}>
                  {calculating ? t("calculating") : t("calculate")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Breakdown Dialog */}
        <Dialog open={openBreakdown} onOpenChange={setOpenBreakdown}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t("breakdownTitle")}</DialogTitle>
              <DialogDescription>
                {selectedReturn &&
                  `${format(new Date(selectedReturn.period_start), "MMM dd, yyyy")} - ${format(new Date(selectedReturn.period_end), "MMM dd, yyyy")}`}
              </DialogDescription>
            </DialogHeader>
            {breakdown && (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{t("sales")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-600">{t("totalSales")}</span>
                        <span className="font-semibold">
                          {breakdown.sales.total_sales.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-600">{t("vatOnSales")}</span>
                        <span className="font-semibold text-green-600">
                          {breakdown.sales.vat_on_sales.toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-500">{t("byRate")}</span>
                        {breakdown.sales.by_rate.map((item) => (
                          <div key={item.rate} className="flex justify-between text-sm">
                            <span>{item.rate}%</span>
                            <span>{item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm font-medium">{t("purchases")}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-600">{t("totalPurchases")}</span>
                        <span className="font-semibold">
                          {breakdown.purchases.total_purchases.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-zinc-600">{t("vatOnPurchases")}</span>
                        <span className="font-semibold text-blue-600">
                          {breakdown.purchases.vat_on_purchases.toFixed(2)}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-xs text-zinc-500">{t("byRate")}</span>
                        {breakdown.purchases.by_rate.map((item) => (
                          <div key={item.rate} className="flex justify-between text-sm">
                            <span>{item.rate}%</span>
                            <span>{item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* File Dialog */}
        <Dialog open={openFile} onOpenChange={setOpenFile}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("markAsFiled")}</DialogTitle>
              <DialogDescription>{t("fileDescription")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleFile} className="space-y-4">
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenFile(false)}
                  disabled={filing}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={filing}>
                  {filing ? t("filing") : t("confirm")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={openPayment} onOpenChange={setOpenPayment}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("recordPayment")}</DialogTitle>
              <DialogDescription>{t("paymentDescription")}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleRecordPayment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="paymentDate">{t("paymentDate")}</Label>
                <Input
                  id="paymentDate"
                  type="date"
                  value={paymentData.paymentDate}
                  onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reference">{t("paymentReference")}</Label>
                <Input
                  id="reference"
                  value={paymentData.reference}
                  onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                  required
                  placeholder="e.g., Bank transaction #12345"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpenPayment(false)}
                  disabled={recordingPayment}
                >
                  {t("cancel")}
                </Button>
                <Button type="submit" disabled={recordingPayment}>
                  {recordingPayment ? t("recording") : t("confirm")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
