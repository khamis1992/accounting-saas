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
 * Purchase Orders Page
 * Displays purchase orders list with filtering, workflow actions, and CRUD operations
 *
 * FIXED: Added safe number parsing to prevent calculation errors
 * FIXED: Added null checks for array operations
 * FIXED: Fixed tax/discount calculation bugs
 */

import { useState, useEffect } from "react";
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
  FileText,
  Download,
  CheckCircle,
  XCircle,
  Package,
  Eye,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { purchaseOrdersApi, PurchaseOrder, PurchaseOrderStatus } from "@/lib/api/purchase-orders";
import { vendorsApi } from "@/lib/api/vendors";
import logger from "@/lib/logger";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import {
  safeParseFloat,
  calculateLineItem,
  calculateInvoiceTotals,
  sanitizeInput,
} from "@/lib/utils/validation";

interface PurchaseOrderLineForm {
  lineNumber: number;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  discount: string;
}

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [vendorFilter, setVendorFilter] = useState<string>("all");
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPurchaseOrder, setEditPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    vendorId: "",
    date: new Date().toISOString().split("T")[0],
    expectedDeliveryDate: "",
    notes: "",
  });
  const [lines, setLines] = useState<PurchaseOrderLineForm[]>([
    {
      lineNumber: 1,
      description: "",
      quantity: "1",
      unitPrice: "0",
      taxRate: "0",
      discount: "0",
    },
  ]);

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
      toast.error(error instanceof Error ? error.message : "Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await vendorsApi.getAll({ is_active: true });
      setVendors(data);
    } catch (error: unknown) {
      logger.error("Failed to load vendors:", error);
    }
  };

  const getStatusBadge = (status: PurchaseOrderStatus) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "secondary",
      sent: "outline",
      accepted: "default",
      rejected: "destructive",
      received: "default",
      closed: "secondary",
    };

    const labels: Record<string, string> = {
      draft: "Draft",
      sent: "Sent",
      accepted: "Accepted",
      rejected: "Rejected",
      received: "Received",
      closed: "Closed",
    };

    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const filteredPurchaseOrders =
    purchaseOrders?.filter(
      (po) =>
        po?.po_number?.toLowerCase().includes(search.toLowerCase()) ||
        po?.vendor_name?.toLowerCase().includes(search.toLowerCase())
    ) || [];

  const handleCreate = () => {
    setEditPurchaseOrder(null);
    setFormData({
      vendorId: "",
      date: new Date().toISOString().split("T")[0],
      expectedDeliveryDate: "",
      notes: "",
    });
    setLines([
      {
        lineNumber: 1,
        description: "",
        quantity: "1",
        unitPrice: "0",
        taxRate: "0",
        discount: "0",
      },
    ]);
    setDialogOpen(true);
  };

  const handleEdit = (purchaseOrder: PurchaseOrder) => {
    if (purchaseOrder.status !== "draft") {
      toast.error("Can only edit draft purchase orders");
      return;
    }
    setEditPurchaseOrder(purchaseOrder);
    setFormData({
      vendorId: purchaseOrder.vendor_id,
      date: purchaseOrder.date.split("T")[0],
      expectedDeliveryDate: purchaseOrder.expected_delivery_date?.split("T")[0] || "",
      notes: purchaseOrder.notes || "",
    });
    setLines(
      purchaseOrder.items?.map((item) => ({
        lineNumber: item.id ? parseInt(item.id) : 1,
        description: item.description,
        quantity: item.quantity.toString(),
        unitPrice: item.unit_price.toString(),
        taxRate: item.tax_rate.toString(),
        discount: item.discount.toString(),
      })) || [
        {
          lineNumber: 1,
          description: "",
          quantity: "1",
          unitPrice: "0",
          taxRate: "0",
          discount: "0",
        },
      ]
    );
    setDialogOpen(true);
  };

  const handleDelete = async (purchaseOrder: PurchaseOrder) => {
    if (!confirm(`Are you sure you want to delete ${purchaseOrder.po_number}?`)) {
      return;
    }

    try {
      await purchaseOrdersApi.delete(purchaseOrder.id);
      toast.success("Purchase order deleted successfully");
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete purchase order");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        vendor_id: formData.vendorId,
        date: formData.date,
        expected_delivery_date: formData.expectedDeliveryDate || undefined,
        notes: formData.notes || undefined,
        items:
          lines?.map((line) => ({
            description: line.description,
            quantity: safeParseFloat(line.quantity, 0),
            unit_price: safeParseFloat(line.unitPrice, 0),
            tax_rate: safeParseFloat(line.taxRate, 0),
            discount: safeParseFloat(line.discount, 0),
          })) || [],
      };

      if (editPurchaseOrder) {
        await purchaseOrdersApi.update(editPurchaseOrder.id, data);
        toast.success("Purchase order updated successfully");
      } else {
        await purchaseOrdersApi.create(data);
        toast.success("Purchase order created successfully");
      }

      setDialogOpen(false);
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save purchase order");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSend = async (purchaseOrder: PurchaseOrder) => {
    setActionLoading(purchaseOrder.id);
    try {
      // Status update not available in UpdatePurchaseOrderDto
      // TODO: Implement dedicated status update API endpoint
      toast.success("Status update not yet implemented");
      // await fetchPurchaseOrders();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to send purchase order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkReceived = async (purchaseOrder: PurchaseOrder) => {
    setActionLoading(purchaseOrder.id);
    try {
      // Status update not available in UpdatePurchaseOrderDto
      // TODO: Implement dedicated status update API endpoint
      toast.success("Status update not yet implemented");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to mark as received");
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async (purchaseOrder: PurchaseOrder) => {
    setActionLoading(purchaseOrder.id);
    try {
      // Status update not available in UpdatePurchaseOrderDto
      // TODO: Implement dedicated status update API endpoint
      toast.success("Status update not yet implemented");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to close purchase order");
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToBill = async (purchaseOrder: PurchaseOrder) => {
    if (
      !confirm(
        `Convert ${purchaseOrder.po_number} to a bill? This will create a bill from the purchase order.`
      )
    ) {
      return;
    }

    setActionLoading(purchaseOrder.id);
    try {
      await purchaseOrdersApi.convertToBill(purchaseOrder.id);
      toast.success("Purchase order converted to bill successfully");
      await fetchPurchaseOrders();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to convert to bill");
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportPDF = async (purchaseOrder: PurchaseOrder) => {
    try {
      const blob = await purchaseOrdersApi.exportToPDF(purchaseOrder.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PO-${purchaseOrder.po_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("PDF exported successfully");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to export PDF");
    }
  };

  const addLine = () => {
    const newLine: PurchaseOrderLineForm = {
      lineNumber: (lines?.length || 0) + 1,
      description: "",
      quantity: "1",
      unitPrice: "0",
      taxRate: "0",
      discount: "0",
    };
    setLines((prev) => [...(prev || []), newLine]);
  };

  const removeLine = (index: number) => {
    if (lines && lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines.map((line, i) => ({ ...line, lineNumber: i + 1 })));
    }
  };

  const updateLine = (index: number, field: keyof PurchaseOrderLineForm, value: string) => {
    if (!lines || lines.length === 0) return;

    setLines(
      (prev) => prev?.map((line, i) => (i === index ? { ...line, [field]: value } : line)) || []
    );
  };

  const calculateLineTotal = (line: PurchaseOrderLineForm): number => {
    const result = calculateLineItem(line.quantity, line.unitPrice, line.taxRate, line.discount);
    return result.total;
  };

  const calculateTotals = () => {
    const result = calculateInvoiceTotals(
      lines?.map((line) => ({
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        discountPercent: line.discount,
      })) || []
    );

    return {
      subtotal: result.subtotal,
      totalTax: result.totalTax,
      totalDiscount: result.totalDiscount,
      totalAmount: result.totalAmount,
    };
  };

  const getActionButtons = (purchaseOrder: PurchaseOrder) => {
    const buttons = [];

    if (purchaseOrder.status === "draft") {
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: "Edit",
        onClick: () => handleEdit(purchaseOrder),
      });
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: "Delete",
        onClick: () => handleDelete(purchaseOrder),
      });
      buttons.push({
        icon: <Send className="h-4 w-4" />,
        label: "Send",
        onClick: () => handleSend(purchaseOrder),
        loading: actionLoading === purchaseOrder.id,
      });
    }

    if (purchaseOrder.status === "sent") {
      buttons.push({
        icon: <CheckCircle className="h-4 w-4" />,
        label: "Mark Received",
        onClick: () => handleMarkReceived(purchaseOrder),
        loading: actionLoading === purchaseOrder.id,
      });
    }

    if (purchaseOrder.status === "received") {
      buttons.push({
        icon: <FileText className="h-4 w-4" />,
        label: "Convert to Bill",
        onClick: () => handleConvertToBill(purchaseOrder),
        loading: actionLoading === purchaseOrder.id,
      });
    }

    if (["accepted", "received"].includes(purchaseOrder.status)) {
      buttons.push({
        icon: <Package className="h-4 w-4" />,
        label: "Close",
        onClick: () => handleClose(purchaseOrder),
        loading: actionLoading === purchaseOrder.id,
      });
    }

    buttons.push({
      icon: <Download className="h-4 w-4" />,
      label: "Export PDF",
      onClick: () => handleExportPDF(purchaseOrder),
    });

    return buttons;
  };

  const totals = calculateTotals();

  return (
    <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Purchase Orders</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Create and manage purchase orders</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            New Purchase Order
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Purchase Orders</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="sent">Sent</SelectItem>
                    <SelectItem value="accepted">Accepted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={vendorFilter} onValueChange={setVendorFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Vendor" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Vendors</SelectItem>
                    {vendors.map((vendor) => (
                      <SelectItem key={vendor.id} value={vendor.id}>
                        {vendor.name_en}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <Input
                    type="search"
                    placeholder="Search..."
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
              <div className="py-8 text-center text-zinc-500">Loading purchase orders...</div>
            ) : filteredPurchaseOrders.length === 0 ? (
              <div className="py-8 text-center text-zinc-500">No purchase orders found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO #</TableHead>
                    <TableHead>Vendor</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPurchaseOrders.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-mono">{po.po_number}</TableCell>
                      <TableCell>{po.vendor_name}</TableCell>
                      <TableCell>{new Date(po.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {po.expected_delivery_date
                          ? new Date(po.expected_delivery_date).toLocaleDateString()
                          : "-"}
                      </TableCell>
                      <TableCell>{getStatusBadge(po.status)}</TableCell>
                      <TableCell className="text-right">QAR {po.total.toLocaleString()}</TableCell>
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
                {editPurchaseOrder ? "Edit Purchase Order" : "New Purchase Order"}
              </DialogTitle>
              <DialogDescription>
                {editPurchaseOrder
                  ? "Update purchase order details"
                  : "Create a new purchase order"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="vendorId">Vendor *</Label>
                  <Select
                    value={formData.vendorId}
                    onValueChange={(value) => setFormData({ ...formData, vendorId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
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
                  <Label htmlFor="date">Order Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expectedDeliveryDate">Expected Delivery Date</Label>
                  <Input
                    id="expectedDeliveryDate"
                    type="date"
                    value={formData.expectedDeliveryDate}
                    onChange={(e) =>
                      setFormData({ ...formData, expectedDeliveryDate: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Line Items</Label>
                  <Button type="button" variant="outline" size="sm" onClick={addLine}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Line
                  </Button>
                </div>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-24">Quantity</TableHead>
                        <TableHead className="w-32">Unit Price</TableHead>
                        <TableHead className="w-24">Tax %</TableHead>
                        <TableHead className="w-24">Discount %</TableHead>
                        <TableHead className="w-32">Total</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-mono">{line.lineNumber}</TableCell>
                          <TableCell>
                            <Input
                              value={line.description}
                              onChange={(e) => updateLine(index, "description", e.target.value)}
                              placeholder="Description"
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
                    <span>Subtotal:</span>
                    <span>QAR {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span className="text-red-600">-QAR {totals.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>QAR {totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Total:</span>
                    <span>QAR {totals.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
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
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "Saving..." : "Save"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
  );
}
