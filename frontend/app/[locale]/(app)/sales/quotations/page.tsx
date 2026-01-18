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
 * Quotations Page
 * Displays quotations list with filtering, workflow actions, and CRUD operations
 */

import { useState, useEffect } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
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
  Plus,
  Search,
  Edit,
  Trash2,
  Send,
  Check,
  X,
  FileText,
  Download,
  RefreshCw,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { quotationsApi, Quotation, QuotationStatus } from "@/lib/api/quotations";
import { customersApi } from "@/lib/api/customers";
import logger from "@/lib/logger";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useTranslations } from "next-intl";
import { format } from "date-fns";

interface QuotationLineForm {
  lineNumber: number;
  descriptionAr: string;
  descriptionEn: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  discount: string;
}

export default function QuotationsPage() {
  const t = useTranslations("sales.quotations");
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [customerFilter, setCustomerFilter] = useState<string>("");
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customerId: "",
    date: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  });
  const [lines, setLines] = useState<QuotationLineForm[]>([
    {
      lineNumber: 1,
      descriptionAr: "",
      descriptionEn: "",
      quantity: "1",
      unitPrice: "0",
      taxRate: "0",
      discount: "0",
    },
  ]);

  useEffect(() => {
    fetchQuotations();
    fetchCustomers();
  }, [statusFilter, customerFilter]);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter) filters.status = statusFilter;
      if (customerFilter) filters.customer_id = customerFilter;

      const data = await quotationsApi.getAll(filters);
      setQuotations(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("errors.fetchFailed"));
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getAll({ is_active: true });
      setCustomers(data);
    } catch (error: unknown) {
      logger.error("Failed to load customers:", error);
    }
  };

  const getStatusBadge = (status: QuotationStatus) => {
    const colors: Record<QuotationStatus, string> = {
      draft: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      sent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      accepted: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      rejected: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      expired: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    };

    const labels: Record<QuotationStatus, string> = {
      draft: t("statuses.draft"),
      sent: t("statuses.sent"),
      accepted: t("statuses.accepted"),
      rejected: t("statuses.rejected"),
      expired: t("statuses.expired"),
    };

    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  const filteredQuotations = quotations.filter(
    (quo) =>
      quo.quotation_number.toLowerCase().includes(search.toLowerCase()) ||
      quo.customer?.name_en?.toLowerCase().includes(search.toLowerCase()) ||
      quo.customer?.name_ar?.includes(search)
  );

  const handleCreate = () => {
    setEditQuotation(null);
    setFormData({
      customerId: "",
      date: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: "",
    });
    setLines([
      {
        lineNumber: 1,
        descriptionAr: "",
        descriptionEn: "",
        quantity: "1",
        unitPrice: "0",
        taxRate: "0",
        discount: "0",
      },
    ]);
    setDialogOpen(true);
  };

  const handleEdit = (quotation: Quotation) => {
    if (quotation.status !== "draft") {
      toast.error(t("errors.editOnlyDraft"));
      return;
    }
    setEditQuotation(quotation);
    setFormData({
      customerId: quotation.customer_id,
      date: quotation.date.split("T")[0],
      validUntil: quotation.valid_until.split("T")[0],
      notes: quotation.notes || "",
    });
    setLines(
      quotation.items?.map((item, idx) => ({
        lineNumber: idx + 1,
        descriptionAr: item.description_ar || "",
        descriptionEn: item.description_en || "",
        quantity: item.quantity.toString(),
        unitPrice: item.unit_price.toString(),
        taxRate: item.tax_rate.toString(),
        discount: item.discount.toString(),
      })) || [
        {
          lineNumber: 1,
          descriptionAr: "",
          descriptionEn: "",
          quantity: "1",
          unitPrice: "0",
          taxRate: "0",
          discount: "0",
        },
      ]
    );
    setDialogOpen(true);
  };

  const handleDelete = async (quotation: Quotation) => {
    if (!confirm(`${t("confirmDelete")} ${quotation.quotation_number}?`)) {
      return;
    }

    try {
      await quotationsApi.delete(quotation.id);
      toast.success(t("deleteSuccess"));
      await fetchQuotations();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("errors.deleteFailed"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        customer_id: formData.customerId,
        date: formData.date,
        valid_until: formData.validUntil,
        notes: formData.notes || undefined,
        items: lines.map((line) => ({
          description: line.descriptionEn || line.descriptionAr || "",
          description_ar: line.descriptionAr || undefined,
          description_en: line.descriptionEn || undefined,
          quantity: parseFloat(line.quantity) || 0,
          unit_price: parseFloat(line.unitPrice) || 0,
          tax_rate: parseFloat(line.taxRate) || 0,
          discount: parseFloat(line.discount) || 0,
        })),
      };

      if (editQuotation) {
        await quotationsApi.update(editQuotation.id, data);
        toast.success(t("updateSuccess"));
      } else {
        await quotationsApi.create(data);
        toast.success(t("createSuccess"));
      }

      setDialogOpen(false);
      await fetchQuotations();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (quotation: Quotation) => {
    setActionLoading(quotation.id);
    try {
      await quotationsApi.send(quotation.id);
      toast.success(t("sendSuccess"));
      await fetchQuotations();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("errors.sendFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (quotation: Quotation) => {
    setActionLoading(quotation.id);
    try {
      await quotationsApi.accept(quotation.id);
      toast.success(t("acceptSuccess"));
      await fetchQuotations();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("errors.acceptFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (quotation: Quotation) => {
    if (!confirm(t("confirmReject"))) {
      return;
    }
    setActionLoading(quotation.id);
    try {
      await quotationsApi.reject(quotation.id);
      toast.success(t("rejectSuccess"));
      await fetchQuotations();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("errors.rejectFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToInvoice = async (quotation: Quotation) => {
    setActionLoading(quotation.id);
    try {
      toast.info(t("converting"));
      const result = await quotationsApi.convertToInvoice(quotation.id);
      toast.success(t("converted"));
      // Navigate to the new invoice
      router.push(`/sales/invoices`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("errors.convertFailed"));
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportPDF = async (quotation: Quotation) => {
    try {
      toast.info(t("exporting"));
      const blob = await quotationsApi.exportToPDF(quotation.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `quotation-${quotation.quotation_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(t("exported"));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : t("errors.exportFailed"));
    }
  };

  const addLine = () => {
    const newLine: QuotationLineForm = {
      lineNumber: lines.length + 1,
      descriptionAr: "",
      descriptionEn: "",
      quantity: "1",
      unitPrice: "0",
      taxRate: "0",
      discount: "0",
    };
    setLines([...lines, newLine]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines.map((line, i) => ({ ...line, lineNumber: i + 1 })));
    }
  };

  const updateLine = (index: number, field: keyof QuotationLineForm, value: string) => {
    const newLines = lines.map((line, i) => (i === index ? { ...line, [field]: value } : line));
    setLines(newLines);
  };

  const calculateLineTotal = (line: QuotationLineForm): number => {
    const quantity = parseFloat(line.quantity) || 0;
    const unitPrice = parseFloat(line.unitPrice) || 0;
    const taxRate = parseFloat(line.taxRate) || 0;
    const discount = parseFloat(line.discount) || 0;

    const subtotal = quantity * unitPrice;
    const discountAmount = subtotal * (discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (taxRate / 100);
    return taxableAmount + taxAmount;
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    lines.forEach((line) => {
      const quantity = parseFloat(line.quantity) || 0;
      const unitPrice = parseFloat(line.unitPrice) || 0;
      const taxRate = parseFloat(line.taxRate) || 0;
      const discount = parseFloat(line.discount) || 0;

      const lineSubtotal = quantity * unitPrice;
      const discountAmount = lineSubtotal * (discount / 100);
      const taxableAmount = lineSubtotal - discountAmount;
      const taxAmount = taxableAmount * (taxRate / 100);

      subtotal += lineSubtotal;
      totalDiscount += discountAmount;
      totalTax += taxAmount;
    });

    return {
      subtotal,
      totalTax,
      totalDiscount,
      totalAmount: subtotal - totalDiscount + totalTax,
    };
  };

  const getActionButtons = (quotation: Quotation) => {
    const buttons = [];

    if (quotation.status === "draft") {
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: t("actions.edit"),
        onClick: () => handleEdit(quotation),
      });
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: t("actions.delete"),
        onClick: () => handleDelete(quotation),
      });
      buttons.push({
        icon: <Send className="h-4 w-4" />,
        label: t("actions.send"),
        onClick: () => handleSend(quotation),
        loading: actionLoading === quotation.id,
      });
    }

    if (quotation.status === "sent") {
      buttons.push({
        icon: <Check className="h-4 w-4" />,
        label: t("actions.accept"),
        onClick: () => handleAccept(quotation),
        loading: actionLoading === quotation.id,
      });
      buttons.push({
        icon: <X className="h-4 w-4" />,
        label: t("actions.reject"),
        onClick: () => handleReject(quotation),
        loading: actionLoading === quotation.id,
      });
    }

    if (quotation.status === "accepted" && !quotation.converted_to_invoice) {
      buttons.push({
        icon: <FileText className="h-4 w-4" />,
        label: t("actions.convertToInvoice"),
        onClick: () => handleConvertToInvoice(quotation),
        loading: actionLoading === quotation.id,
      });
    }

    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: t("actions.export"),
      onClick: () => handleExportPDF(quotation),
    });

    return buttons;
  };

  const totals = calculateTotals();

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{t("title")}</h1>
            <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t("newQuotation")}
          </Button>
        </div>

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
                    <SelectItem value="">{t("filters.allStatuses")}</SelectItem>
                    <SelectItem value="draft">{t("statuses.draft")}</SelectItem>
                    <SelectItem value="sent">{t("statuses.sent")}</SelectItem>
                    <SelectItem value="accepted">{t("statuses.accepted")}</SelectItem>
                    <SelectItem value="rejected">{t("statuses.rejected")}</SelectItem>
                    <SelectItem value="expired">{t("statuses.expired")}</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={customerFilter} onValueChange={setCustomerFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("filters.allCustomers")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t("filters.allCustomers")}</SelectItem>
                    {customers.map((cust) => (
                      <SelectItem key={cust.id} value={cust.id}>
                        {cust.name_en}
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
                <Button
                  variant="outline"
                  size="icon"
                  onClick={fetchQuotations}
                  title={t("actions.refresh")}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center text-zinc-500">{t("loading")}</div>
            ) : filteredQuotations.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">
                <FileText className="mx-auto h-12 w-12 text-zinc-300 mb-4" />
                <p className="font-medium">{t("empty.title")}</p>
                <p className="text-sm mt-1">{t("empty.description")}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.quoteNumber")}</TableHead>
                    <TableHead>{t("table.customer")}</TableHead>
                    <TableHead>{t("table.date")}</TableHead>
                    <TableHead>{t("table.validUntil")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.total")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredQuotations.map((quotation) => (
                    <TableRow key={quotation.id}>
                      <TableCell className="font-mono">{quotation.quotation_number}</TableCell>
                      <TableCell>
                        {quotation.customer?.name_en}
                        <span className="mr-2 text-sm text-zinc-500" dir="rtl">
                          ({quotation.customer?.name_ar})
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(quotation.date), "PPP")}</TableCell>
                      <TableCell>{format(new Date(quotation.valid_until), "PPP")}</TableCell>
                      <TableCell>{getStatusBadge(quotation.status)}</TableCell>
                      <TableCell className="text-right font-medium">
                        QAR {quotation.total.toLocaleString("en-QA", { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(quotation).map((btn, idx) => (
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
                                <span className="h-4 w-4 animate-spin">⌛</span>
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

        {/* Create/Edit Dialog */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-4xl">
            <DialogHeader>
              <DialogTitle>
                {editQuotation ? t("dialog.editTitle") : t("dialog.createTitle")}
              </DialogTitle>
              <DialogDescription>
                {editQuotation ? t("dialog.editDescription") : t("dialog.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">{t("form.customer")} *</Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.selectCustomer")} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((cust) => (
                        <SelectItem key={cust.id} value={cust.id}>
                          {cust.name_en} ({cust.name_ar})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div></div>
                <div className="space-y-2">
                  <Label htmlFor="date">{t("form.date")} *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="validUntil">{t("form.validUntil")} *</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>{t("form.lineItems")}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("form.addLine")}
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>{t("form.descriptionEn")}</TableHead>
                        <TableHead>{t("form.descriptionAr")}</TableHead>
                        <TableHead className="w-24">{t("form.quantity")}</TableHead>
                        <TableHead className="w-32">{t("form.unitPrice")}</TableHead>
                        <TableHead className="w-24">{t("form.tax")}</TableHead>
                        <TableHead className="w-24">{t("form.discount")}</TableHead>
                        <TableHead className="w-32">{t("form.total")}</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{line.lineNumber}</TableCell>
                          <TableCell>
                            <Input
                              value={line.descriptionEn}
                              onChange={(e) => updateLine(index, "descriptionEn", e.target.value)}
                              placeholder={t("form.descriptionEn")}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.descriptionAr}
                              onChange={(e) => updateLine(index, "descriptionAr", e.target.value)}
                              placeholder={t("form.descriptionAr")}
                              dir="rtl"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) => updateLine(index, "quantity", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={line.taxRate}
                              onChange={(e) => updateLine(index, "taxRate", e.target.value)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              step="0.01"
                              value={line.discount}
                              onChange={(e) => updateLine(index, "discount", e.target.value)}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            {calculateLineTotal(line).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeLine(index)}
                              disabled={lines.length === 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <div className="flex justify-end">
                <div className="w-64 space-y-2 rounded-lg border p-4">
                  <div className="flex justify-between text-sm">
                    <span>{t("form.subtotal")}:</span>
                    <span>QAR {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("form.discount")}:</span>
                    <span className="text-red-600">-QAR {totals.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{t("form.tax")}:</span>
                    <span>QAR {totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>{t("form.total")}:</span>
                    <span>QAR {totals.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">{t("form.notes")}</Label>
                <textarea
                  id="notes"
                  className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:focus:ring-zinc-300"
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  {t("form.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? t("form.saving") : t("form.save")}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AuthenticatedLayout>
  );
}
