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
 * Invoices Page
 * Displays invoices list with filtering, workflow actions, and CRUD operations
 *
 * FIXED: Added safe number parsing to prevent calculation errors
 * FIXED: Added null checks for array operations
 * FIXED: Fixed tax/discount calculation bugs
 */

import { useState, useEffect, useCallback, useRef } from "react";
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
import { Plus, Search, Edit, Trash2, Send, Check, Upload, FileText } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { invoicesApi, Invoice } from "@/lib/api/invoices";
import { customersApi } from "@/lib/api/customers";
import { vendorsApi } from "@/lib/api/vendors";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  safeParseFloat,
  calculateLineItem,
  calculateInvoiceTotals,
  sanitizeInput,
} from "@/lib/utils/validation";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { SUCCESS_MESSAGES, THRESHOLDS, FORM } from "@/lib/constants";
import logger from "@/lib/logger";

interface InvoiceLineForm {
  lineNumber: number;
  descriptionAr: string;
  descriptionEn: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  discountPercent: string;
}

export default function InvoicesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [partyTypeFilter, setPartyTypeFilter] = useState<string>("all");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<
    Array<{ id: string; name_en: string; name_ar: string }>
  >([]);
  const [vendors, setVendors] = useState<Array<{ id: string; name_en: string; name_ar: string }>>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    invoiceType: "sales" as "sales" | "purchase",
    partyType: "customer" as "customer" | "vendor",
    partyId: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    currency: "QAR",
    exchangeRate: "1",
    notes: "",
  });
  const [lines, setLines] = useState<InvoiceLineForm[]>([
    {
      lineNumber: 1,
      descriptionAr: "",
      descriptionEn: "",
      quantity: "1",
      unitPrice: "0",
      taxRate: "0",
      discountPercent: "0",
    },
  ]);

  useEffect(() => {
    fetchInvoices();
    fetchCustomers();
    fetchVendors();
  }, [typeFilter, statusFilter, partyTypeFilter]);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string> = {};
      if (typeFilter && typeFilter !== "all") filters.invoiceType = typeFilter;
      if (statusFilter && statusFilter !== "all") filters.status = statusFilter;
      if (partyTypeFilter && partyTypeFilter !== "all") filters.partyType = partyTypeFilter;

      const data = await invoicesApi.getAll(filters);
      setInvoices(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to load invoices";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getAll({ is_active: true });
      setCustomers(data);
    } catch (error) {
      logger.error("Failed to load customers", error as Error);
    }
  };

  const fetchVendors = async () => {
    try {
      const data = await vendorsApi.getAll({ is_active: true });
      setVendors(data);
    } catch (error) {
      logger.error("Failed to load vendors", error as Error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      draft: "secondary",
      submitted: "outline",
      approved: "outline",
      posted: "default",
      paid: "default",
      partial: "outline",
    };
    const labels: Record<string, string> = {
      draft: "Draft",
      submitted: "Submitted",
      approved: "Approved",
      posted: "Posted",
      paid: "Paid",
      partial: "Partial",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const filteredInvoices =
    invoices?.filter(
      (inv) =>
        inv?.invoice_number?.toLowerCase().includes(search.toLowerCase()) ||
        inv?.party?.name_en?.toLowerCase().includes(search.toLowerCase()) ||
        inv?.party?.name_ar?.includes(search)
    ) || [];

  const handleCreate = () => {
    setEditInvoice(null);
    setFormData({
      invoiceType: "sales",
      partyType: "customer",
      partyId: "",
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: "",
      currency: "QAR",
      exchangeRate: "1",
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
        discountPercent: "0",
      },
    ]);
    setDialogOpen(true);
  };

  const handleEdit = (invoice: Invoice) => {
    if (invoice.status !== "draft") {
      toast.error("Can only edit draft invoices");
      return;
    }
    setEditInvoice(invoice);
    setFormData({
      invoiceType: invoice.invoice_type,
      partyType: invoice.party_type,
      partyId: invoice.party_id,
      invoiceDate: invoice.invoice_date.split("T")[0],
      dueDate: invoice.due_date?.split("T")[0] || "",
      currency: invoice.currency,
      exchangeRate: invoice.exchange_rate.toString(),
      notes: invoice.notes || "",
    });
    setLines(
      invoice.invoice_lines?.map((line) => ({
        lineNumber: line.line_number,
        descriptionAr: line.description_ar || "",
        descriptionEn: line.description_en || "",
        quantity: line.quantity.toString(),
        unitPrice: line.unit_price.toString(),
        taxRate: line.tax_rate.toString(),
        discountPercent: line.discount_percent.toString(),
      })) || [
        {
          lineNumber: 1,
          descriptionAr: "",
          descriptionEn: "",
          quantity: "1",
          unitPrice: "0",
          taxRate: "0",
          discountPercent: "0",
        },
      ]
    );
    setDialogOpen(true);
  };

  const handleDelete = async (invoice: Invoice) => {
    if (!confirm(`Are you sure you want to delete ${invoice.invoice_number}?`)) {
      return;
    }

    try {
      await invoicesApi.delete(invoice.id);
      toast.success("Invoice deleted successfully");
      await fetchInvoices();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete invoice");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data = {
        invoice_type: formData.invoiceType,
        party_id: formData.partyId,
        party_type: formData.partyType,
        invoice_date: formData.invoiceDate,
        due_date: formData.dueDate || undefined,
        currency: formData.currency,
        exchange_rate: safeParseFloat(formData.exchangeRate, 1),
        notes: formData.notes || undefined,
        lines: lines.map((line) => ({
          line_number: line.lineNumber,
          description_ar: line.descriptionAr || undefined,
          description_en: line.descriptionEn || undefined,
          quantity: safeParseFloat(line.quantity, 0),
          unit_price: safeParseFloat(line.unitPrice, 0),
          tax_rate: safeParseFloat(line.taxRate, 0),
          discount_percent: safeParseFloat(line.discountPercent, 0),
        })),
      };

      if (editInvoice) {
        await invoicesApi.update(editInvoice.id, data);
        toast.success("Invoice updated successfully");
      } else {
        await invoicesApi.create(data);
        toast.success("Invoice created successfully");
      }

      setDialogOpen(false);
      await fetchInvoices();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      await invoicesApi.submit(invoice.id);
      toast.success("Invoice submitted successfully");
      await fetchInvoices();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to submit invoice");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      await invoicesApi.approve(invoice.id);
      toast.success("Invoice approved successfully");
      await fetchInvoices();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to approve invoice");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePost = async (invoice: Invoice) => {
    setActionLoading(invoice.id);
    try {
      await invoicesApi.post(invoice.id);
      toast.success("Invoice posted successfully");
      await fetchInvoices();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to post invoice");
    } finally {
      setActionLoading(null);
    }
  };

  const addLine = () => {
    const newLine: InvoiceLineForm = {
      lineNumber: (lines?.length || 0) + 1,
      descriptionAr: "",
      descriptionEn: "",
      quantity: "1",
      unitPrice: "0",
      taxRate: "0",
      discountPercent: "0",
    };
    setLines((prev) => [...(prev || []), newLine]);
  };

  const removeLine = (index: number) => {
    if (lines && lines.length > 1) {
      const newLines = lines.filter((_, i) => i !== index);
      setLines(newLines.map((line, i) => ({ ...line, lineNumber: i + 1 })));
    }
  };

  const updateLine = (index: number, field: keyof InvoiceLineForm, value: string) => {
    if (!lines || lines.length === 0) return;

    setLines(
      (prev) => prev?.map((line, i) => (i === index ? { ...line, [field]: value } : line)) || []
    );
  };

  const calculateLineTotal = (line: InvoiceLineForm): number => {
    const result = calculateLineItem(
      line.quantity,
      line.unitPrice,
      line.taxRate,
      line.discountPercent
    );
    return result.total;
  };

  const calculateTotals = () => {
    const result = calculateInvoiceTotals(
      lines?.map((line) => ({
        quantity: line.quantity,
        unitPrice: line.unitPrice,
        taxRate: line.taxRate,
        discountPercent: line.discountPercent,
      })) || []
    );

    return {
      subtotal: result.subtotal,
      totalTax: result.totalTax,
      totalDiscount: result.totalDiscount,
      totalAmount: result.totalAmount,
    };
  };

  const getActionButtons = (invoice: Invoice) => {
    const buttons = [];

    if (invoice.status === "draft") {
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: "Edit",
        onClick: () => handleEdit(invoice),
      });
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: "Delete",
        onClick: () => handleDelete(invoice),
      });
      buttons.push({
        icon: <Send className="h-4 w-4" />,
        label: "Submit",
        onClick: () => handleSubmitForApproval(invoice),
        loading: actionLoading === invoice.id,
      });
    }

    if (invoice.status === "submitted") {
      buttons.push({
        icon: <Check className="h-4 w-4" />,
        label: "Approve",
        onClick: () => handleApprove(invoice),
        loading: actionLoading === invoice.id,
      });
    }

    if (invoice.status === "approved") {
      buttons.push({
        icon: <Upload className="h-4 w-4" />,
        label: "Post",
        onClick: () => handlePost(invoice),
        loading: actionLoading === invoice.id,
      });
    }

    return buttons;
  };

  const totals = calculateTotals();

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Invoices</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Manage sales and purchase invoices</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Invoice
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Invoices</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="purchase">Purchase</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={partyTypeFilter} onValueChange={setPartyTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Party Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Parties</SelectItem>
                    <SelectItem value="customer">Customers</SelectItem>
                    <SelectItem value="vendor">Vendors</SelectItem>
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
              <TableSkeleton  columns={9} rows={5} />
            ) : filteredInvoices.length === 0 ? (
              <EmptyState
                icon={FileText}
                title={
                  search || typeFilter || statusFilter ? "No invoices found" : "No invoices yet"
                }
                description={
                  search || typeFilter || statusFilter
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by creating your first invoice"
                }
                actionLabel="Add Invoice"
                onAction={handleCreate}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Outstanding</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono">{invoice.invoice_number}</TableCell>
                      <TableCell>{new Date(invoice.invoice_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="outline">{invoice.invoice_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {invoice.party?.name_en}
                        <span className="mr-2 text-sm text-zinc-500" dir="rtl">
                          ({invoice.party?.name_ar})
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(invoice.status)}</TableCell>
                      <TableCell className="text-right">
                        {invoice.currency} {invoice.total_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.currency} {invoice.paid_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        {invoice.currency} {invoice.outstanding_amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(invoice).map((btn, idx) => (
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
              <DialogTitle>{editInvoice ? "Edit Invoice" : "Add Invoice"}</DialogTitle>
              <DialogDescription>
                {editInvoice ? "Update invoice details" : "Create a new invoice"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceType">Type *</Label>
                  <Select
                    value={formData.invoiceType}
                    onValueChange={(value: "sales" | "purchase") =>
                      setFormData({ ...formData, invoiceType: value })
                    }
                    disabled={!!editInvoice}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sales">Sales</SelectItem>
                      <SelectItem value="purchase">Purchase</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partyType">Party Type *</Label>
                  <Select
                    value={formData.partyType}
                    onValueChange={(value: "customer" | "vendor") =>
                      setFormData({ ...formData, partyType: value })
                    }
                    disabled={!!editInvoice}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="customer">Customer</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label htmlFor="partyId">Party *</Label>
                  <Select
                    value={formData.partyId}
                    onValueChange={(value) => setFormData({ ...formData, partyId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select party" />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.partyType === "customer" &&
                        customers.map((cust) => (
                          <SelectItem key={cust.id} value={cust.id}>
                            {cust.name_en} ({cust.name_ar})
                          </SelectItem>
                        ))}
                      {formData.partyType === "vendor" &&
                        vendors.map((vend) => (
                          <SelectItem key={vend.id} value={vend.id}>
                            {vend.name_en} ({vend.name_ar})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="invoiceDate">Invoice Date *</Label>
                  <Input
                    id="invoiceDate"
                    type="date"
                    value={formData.invoiceDate}
                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency *</Label>
                  <Select
                    value={formData.currency}
                    onValueChange={(value) => setFormData({ ...formData, currency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="QAR">QAR</SelectItem>
                      <SelectItem value="USD">USD</SelectItem>
                      <SelectItem value="EUR">EUR</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="exchangeRate">Exchange Rate</Label>
                  <Input
                    id="exchangeRate"
                    type="number"
                    step="0.01"
                    value={formData.exchangeRate}
                    onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
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
                        <TableHead>Description (EN)</TableHead>
                        <TableHead>Description (AR)</TableHead>
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
                              value={line.descriptionEn}
                              onChange={(e) => updateLine(index, "descriptionEn", e.target.value)}
                              placeholder="Description"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={line.descriptionAr}
                              onChange={(e) => updateLine(index, "descriptionAr", e.target.value)}
                              placeholder="الوصف"
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
                              value={line.discountPercent}
                              onChange={(e) => updateLine(index, "discountPercent", e.target.value)}
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
                    <span>
                      {formData.currency} {totals.subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Discount:</span>
                    <span className="text-red-600">
                      -{formData.currency} {totals.totalDiscount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Tax:</span>
                    <span>
                      {formData.currency} {totals.totalTax.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between border-t pt-2 font-bold">
                    <span>Total:</span>
                    <span>
                      {formData.currency} {totals.totalAmount.toFixed(2)}
                    </span>
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
    </AuthenticatedLayout>
  );
}
