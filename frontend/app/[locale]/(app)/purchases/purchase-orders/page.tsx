/**
 * Purchase Orders Page
 * Manage purchase orders with workflow and approval process
 */

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  Send,
  Check,
  X,
  Download,
  Eye,
  FileText,
  Package,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { purchaseOrdersApi, PurchaseOrder, PurchaseOrderStatus } from "@/lib/api/purchase-orders";
import { vendorsApi } from "@/lib/api/vendors";
import { toast } from "sonner";
import { format } from "date-fns";
import logger from "@/lib/logger";

export default function PurchaseOrdersPage() {
  const t = useTranslations("purchases.purchaseOrders");
  const locale = useLocale();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showPurchaseOrderDialog, setShowPurchaseOrderDialog] = useState(false);
  const [editingPurchaseOrder, setEditingPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [purchaseOrderForm, setPurchaseOrderForm] = useState({
    vendorId: "",
    date: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    referenceNumber: "",
    notes: "",
    status: "draft" as PurchaseOrderStatus,
  });
  const [lines, setLines] = useState([
    {
      id: 1,
      description: "",
      descriptionAr: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      discount: 0,
    }
  ]);

  // Fetch initial data
  useEffect(() => {
    fetchPurchaseOrders();
    fetchVendors();
  }, [statusFilter, vendorFilter]);

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
      if (vendorFilter && vendorFilter !== "all") filters.vendor_id = vendorFilter;

      const data = await purchaseOrdersApi.getAll(filters);
      setPurchaseOrders(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load purchase orders";
      toast.error(message);
      logger.error("Failed to load purchase orders", error as Error);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await vendorsApi.getAll({ is_active: true });
      setVendors(data);
    } catch (error: unknown) {
      logger.error("Failed to load vendors", error as Error);
    }
  };

  // Filter purchase orders based on search
  const filteredPurchaseOrders = useMemo(() => {
    return purchaseOrders.filter(
      (po) =>
        po.po_number.toLowerCase().includes(search.toLowerCase()) ||
        po.vendor_name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [purchaseOrders, search]);

  // Get status badge
  const getStatusBadge = (status: PurchaseOrderStatus) => {
    const variants: Record<PurchaseOrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "secondary",
      sent: "outline",
      accepted: "default",
      rejected: "destructive",
      received: "default",
      closed: "secondary",
    };

    const labels: Record<PurchaseOrderStatus, string> = {
      draft: t("statuses.draft"),
      sent: t("statuses.sent"),
      accepted: t("statuses.accepted"),
      rejected: t("statuses.rejected"),
      received: t("statuses.received"),
      closed: t("statuses.closed"),
    };

    return <Badge variant={variants[status]}>{labels[status]}</Badge>;
  };

  // Handle create purchase order
  const handleCreate = () => {
    setEditingPurchaseOrder(null);
    setPurchaseOrderForm({
      vendorId: "",
      date: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: "",
      referenceNumber: "",
      notes: "",
      status: "draft",
    });
    setLines([
      {
        id: 1,
        description: "",
        descriptionAr: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        discount: 0,
      }
    ]);
    setShowPurchaseOrderDialog(true);
  };

  // Handle edit purchase order
  const handleEdit = (purchaseOrder: PurchaseOrder) => {
    if (purchaseOrder.status !== "draft" && purchaseOrder.status !== "rejected") {
      toast.error(t("errors.editOnlyDraftOrRejected"));
      return;
    }
    
    setEditingPurchaseOrder(purchaseOrder);
    setPurchaseOrderForm({
      vendorId: purchaseOrder.vendor_id,
      date: purchaseOrder.date.split("T")[0],
      expectedDeliveryDate: purchaseOrder.expected_delivery_date?.split("T")[0] || "",
      referenceNumber: "",
      notes: purchaseOrder.notes || "",
      status: purchaseOrder.status,
    });

    setLines(
      purchaseOrder.items?.map((item, idx) => ({
        id: idx + 1,
        description: item.description || "",
        descriptionAr: item.description_ar || "",
        quantity: item.quantity,
        unitPrice: item.unit_price,
        taxRate: item.tax_rate,
        discount: item.discount,
      })) || [
        {
          id: 1,
          description: "",
          descriptionAr: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          discount: 0,
        }
      ]
    );
    
    setShowPurchaseOrderDialog(true);
  };

  // Handle delete purchase order
  const handleDelete = async (purchaseOrder: PurchaseOrder) => {
    if (!confirm(`${t("confirmDelete")} ${purchaseOrder.po_number}?`)) {
      return;
    }

    try {
      await purchaseOrdersApi.delete(purchaseOrder.id);
      toast.success(t("deleteSuccess"));
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete purchase order";
      toast.error(message);
    }
  };

  // Handle send purchase order
  const handleSend = async (purchaseOrder: PurchaseOrder) => {
    setActionLoading(purchaseOrder.id);
    try {
      await purchaseOrdersApi.update(purchaseOrder.id, { status: "sent" });
      toast.success(t("sendSuccess"));
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to send purchase order";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle accept purchase order
  const handleAccept = async (purchaseOrder: PurchaseOrder) => {
    setActionLoading(purchaseOrder.id);
    try {
      await purchaseOrdersApi.update(purchaseOrder.id, { status: "accepted" });
      toast.success(t("acceptSuccess"));
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to accept purchase order";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle reject purchase order
  const handleReject = async (purchaseOrder: PurchaseOrder) => {
    if (!confirm(t("confirmReject"))) {
      return;
    }

    setActionLoading(purchaseOrder.id);
    try {
      await purchaseOrdersApi.update(purchaseOrder.id, { status: "rejected" });
      toast.success(t("rejectSuccess"));
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to reject purchase order";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle mark as received
  const handleMarkAsReceived = async (purchaseOrder: PurchaseOrder) => {
    setActionLoading(purchaseOrder.id);
    try {
      await purchaseOrdersApi.update(purchaseOrder.id, { status: "received" });
      toast.success(t("receiveSuccess"));
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to mark as received";
      toast.error(message);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle close purchase order
  const handleClose = async (purchaseOrder: PurchaseOrder) => {
    if (!confirm(t("confirmClose"))) {
      return;
    }

    setActionLoading(purchaseOrder.id);
    try {
      await purchaseOrdersApi.update(purchaseOrder.id, { status: "closed" });
      toast.success(t("closeSuccess"));
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to close purchase order";
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
        vendor_id: purchaseOrderForm.vendorId,
        date: purchaseOrderForm.date,
        expected_delivery_date: purchaseOrderForm.expectedDeliveryDate || undefined,
        reference_number: purchaseOrderForm.referenceNumber || undefined,
        notes: purchaseOrderForm.notes || undefined,
        items: lines.map((line) => ({
          description: line.description,
          description_ar: line.descriptionAr || undefined,
          quantity: line.quantity,
          unit_price: line.unitPrice,
          tax_rate: line.taxRate,
          discount: line.discount,
        })),
      };

      if (editingPurchaseOrder) {
        await purchaseOrdersApi.update(editingPurchaseOrder.id, data);
        toast.success(t("updateSuccess"));
      } else {
        await purchaseOrdersApi.create(data);
        toast.success(t("createSuccess"));
      }

      setShowPurchaseOrderDialog(false);
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save purchase order";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle export PDF
  const handleExportPDF = async (purchaseOrder: PurchaseOrder) => {
    try {
      const blob = await purchaseOrdersApi.exportToPDF(purchaseOrder.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `purchase-order-${purchaseOrder.po_number}.pdf`;
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

  // Handle export Excel
  const handleExportExcel = async (purchaseOrder: PurchaseOrder) => {
    toast.error("Excel export not implemented yet");
  };

  // Add a new line item
  const addLine = () => {
    setLines([
      ...lines,
      {
        id: lines.length + 1,
        description: "",
        descriptionAr: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
        discount: 0,
      }
    ]);
  };

  // Remove a line item
  const removeLine = (id: number) => {
    if (lines.length > 1) {
      setLines(lines.filter(line => line.id !== id));
    }
  };

  // Update a line item
  const updateLine = (id: number, field: string, value: string | number) => {
    setLines(
      lines.map(line => 
        line.id === id ? { ...line, [field]: value } : line
      )
    );
  };

  // Calculate line total
  const calculateLineTotal = (line: any) => {
    const subtotal = line.quantity * line.unitPrice;
    const discountAmount = subtotal * (line.discount / 100);
    const taxableAmount = subtotal - discountAmount;
    const taxAmount = taxableAmount * (line.taxRate / 100);
    return taxableAmount + taxAmount;
  };

  // Calculate totals
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;
    let totalDiscount = 0;

    lines.forEach(line => {
      const lineSubtotal = line.quantity * line.unitPrice;
      const lineDiscount = lineSubtotal * (line.discount / 100);
      const taxableAmount = lineSubtotal - lineDiscount;
      const lineTax = taxableAmount * (line.taxRate / 100);

      subtotal += lineSubtotal;
      totalDiscount += lineDiscount;
      totalTax += lineTax;
    });

    return {
      subtotal,
      totalTax,
      totalDiscount,
      total: subtotal - totalDiscount + totalTax,
    };
  };

  const totals = calculateTotals();

  // Handle view purchase order
  const handleView = (purchaseOrder: PurchaseOrder) => {
    router.push(`/${locale}/purchases/purchase-orders/${purchaseOrder.id}`);
  };

  // Get action buttons for each purchase order
  const getActionButtons = (purchaseOrder: PurchaseOrder) => {
    const buttons = [];

    // View button (always available)
    buttons.push({
      icon: <Eye className="h-4 w-4" />,
      label: t("actions.view"),
      onClick: () => handleView(purchaseOrder),
    });

    // Edit button (draft/rejected only)
    if (purchaseOrder.status === "draft" || purchaseOrder.status === "rejected") {
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: t("actions.edit"),
        onClick: () => handleEdit(purchaseOrder),
      });
    }

    // Send button (draft only)
    if (purchaseOrder.status === "draft") {
      buttons.push({
        icon: <Send className="h-4 w-4" />,
        label: t("actions.send"),
        onClick: () => handleSend(purchaseOrder),
        loading: actionLoading === purchaseOrder.id,
      });
    }

    // Accept button (sent only)
    if (purchaseOrder.status === "sent") {
      buttons.push({
        icon: <Check className="h-4 w-4" />,
        label: t("actions.accept"),
        onClick: () => handleAccept(purchaseOrder),
        loading: actionLoading === purchaseOrder.id,
      });
    }

    // Reject button (sent only)
    if (purchaseOrder.status === "sent") {
      buttons.push({
        icon: <X className="h-4 w-4" />,
        label: t("actions.reject"),
        onClick: () => handleReject(purchaseOrder),
        loading: actionLoading === purchaseOrder.id,
      });
    }

    // Mark as received (accepted only)
    if (purchaseOrder.status === "accepted") {
      buttons.push({
        icon: <Package className="h-4 w-4" />,
        label: t("actions.markReceived"),
        onClick: () => handleMarkAsReceived(purchaseOrder),
        loading: actionLoading === purchaseOrder.id,
      });
    }

    // Close button (received only)
    if (purchaseOrder.status === "received") {
      buttons.push({
        icon: <X className="h-4 w-4" />,
        label: t("actions.close"),
        onClick: () => handleClose(purchaseOrder),
        loading: actionLoading === purchaseOrder.id,
      });
    }

    // Export buttons (always available)
    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: t("actions.exportPDF"),
      onClick: () => handleExportPDF(purchaseOrder),
    });

    buttons.push({
      icon: <FileText className="h-4 w-4" />,
      label: t("actions.exportExcel"),
      onClick: () => handleExportExcel(purchaseOrder),
    });

    // Delete button (draft/rejected only)
    if (purchaseOrder.status === "draft" || purchaseOrder.status === "rejected") {
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: t("actions.delete"),
        onClick: () => handleDelete(purchaseOrder),
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
            {t("newPurchaseOrder")}
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
                    <SelectItem value="draft">{t("statuses.draft")}</SelectItem>
                    <SelectItem value="sent">{t("statuses.sent")}</SelectItem>
                    <SelectItem value="accepted">{t("statuses.accepted")}</SelectItem>
                    <SelectItem value="rejected">{t("statuses.rejected")}</SelectItem>
                    <SelectItem value="received">{t("statuses.received")}</SelectItem>
                    <SelectItem value="closed">{t("statuses.closed")}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder={t("filters.allVendors")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("filters.allVendors")}</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name_en} ({vendor.name_ar})
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
            ) : filteredPurchaseOrders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Package className="h-12 w-12 text-zinc-400 mb-4" />
                <h3 className="text-lg font-medium">{t("empty.title")}</h3>
                <p className="text-zinc-500">{t("empty.description")}</p>
                <Button asChild variant="outline" className="mt-4">
                  <Link href={`/${locale}/purchases/purchase-orders/new`}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("createFirst")}
                  </Link>
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("table.poNumber")}</TableHead>
                    <TableHead>{t("table.vendor")}</TableHead>
                    <TableHead>{t("table.date")}</TableHead>
                    <TableHead>{t("table.deliveryDate")}</TableHead>
                    <TableHead>{t("table.status")}</TableHead>
                    <TableHead className="text-right">{t("table.total")}</TableHead>
                    <TableHead className="text-right">{t("table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono">{po.po_number}</TableCell>
                      <TableCell>
                        <div>{po.vendor_name}</div>
                      </TableCell>
                      <TableCell>
                        {format(new Date(po.date), "dd/MM/yyyy")}
                      </TableCell>
                      <TableCell>
                        {po.expected_delivery_date ? format(new Date(po.expected_delivery_date), "dd/MM/yyyy") : "-"}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(po.status)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        QAR {po.total?.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || "0.00"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(po).map((btn, idx) => (
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

        {/* Create/Edit Purchase Order Dialog */}
        <Dialog open={showPurchaseOrderDialog} onOpenChange={setShowPurchaseOrderDialog}>
          <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPurchaseOrder ? t("dialogs.editTitle") : t("dialogs.createTitle")}
              </DialogTitle>
              <DialogDescription>
                {editingPurchaseOrder ? t("dialogs.editDescription") : t("dialogs.createDescription")}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendor">{t("fields.vendor")} *</Label>
                  <Select
                    value={purchaseOrderForm.vendorId}
                    onValueChange={(value) => setPurchaseOrderForm({ ...purchaseOrderForm, vendorId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("fields.selectVendor")} />
                    </SelectTrigger>
                    <SelectContent>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.id}>
                          {vendor.name_en} ({vendor.name_ar})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">{t("fields.referenceNumber")}</Label>
                  <Input
                    id="referenceNumber"
                    value={purchaseOrderForm.referenceNumber}
                    onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, referenceNumber: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="date">{t("fields.date")} *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={purchaseOrderForm.date}
                    onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, date: e.target.value })}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="deliveryDate">{t("fields.deliveryDate")}</Label>
                  <Input
                    id="deliveryDate"
                    type="date"
                    value={purchaseOrderForm.expectedDeliveryDate}
                    onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, expectedDeliveryDate: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">{t("fields.notes")}</Label>
                <Textarea
                  id="notes"
                  value={purchaseOrderForm.notes}
                  onChange={(e) => setPurchaseOrderForm({ ...purchaseOrderForm, notes: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">{t("fields.lineItems")}</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="mr-2 h-4 w-4" />
                    {t("fields.addLine")}
                  </Button>
                </div>
                
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>{t("fields.descriptionEn")}</TableHead>
                        <TableHead>{t("fields.descriptionAr")}</TableHead>
                        <TableHead className="w-24">{t("fields.quantity")}</TableHead>
                        <TableHead className="w-32">{t("fields.unitPrice")}</TableHead>
                        <TableHead className="w-24">{t("fields.tax")}</TableHead>
                        <TableHead className="w-24">{t("fields.discount")}</TableHead>
                        <TableHead className="w-32 text-right">{t("fields.total")}</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, index) => (
                        <TableRow key={line.id}>
                          <TableCell className="font-mono">{line.id}</TableCell>
                          <TableCell>
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(line.id, "description", e.target.value)}
                              placeholder={t("fields.descriptionEn")}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.descriptionAr}
                              onChange={(e) => updateLine(line.id, "descriptionAr", e.target.value)}
                              placeholder={t("fields.descriptionAr")}
                              dir="rtl"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) => updateLine(line.id, "quantity", parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(line.id, "unitPrice", parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={line.taxRate}
                              onChange={(e) => updateLine(line.id, "taxRate", parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={line.discount}
                              onChange={(e) => updateLine(line.id, "discount", parseFloat(e.target.value) || 0)}
                            />
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            QAR {calculateLineTotal(line).toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>
                            {lines.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeLine(line.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="flex justify-end">
                  <div className="w-64 space-y-1">
                    <div className="flex justify-between">
                      <span>{t("fields.subtotal")}:</span>
                      <span>QAR {totals.subtotal.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("fields.totalDiscount")}:</span>
                      <span>- QAR {totals.totalDiscount.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>{t("fields.totalTax")}:</span>
                      <span>+ QAR {totals.totalTax.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold pt-2 border-t">
                      <span>{t("fields.totalAmount")}:</span>
                      <span>QAR {totals.total.toLocaleString("en-QA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowPurchaseOrderDialog(false)}
                  disabled={submitting}
                >
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {editingPurchaseOrder ? t("actions.updating") : t("actions.creating")}
                    </>
                  ) : editingPurchaseOrder ? (
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