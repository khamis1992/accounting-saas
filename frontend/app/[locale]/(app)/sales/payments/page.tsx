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
 * Payments Page
 * Displays payments list with filtering, workflow actions, and CRUD operations
 *
 * FIXED: Added proper allocation validation to prevent over-allocation
 * FIXED: Added safe number parsing to prevent calculation errors
 * FIXED: Added null checks for array operations
 */

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { Plus, Search, Edit, Trash2, Send, Check, Upload, X, Ban, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentsApi, Payment } from "@/lib/api/payments";
import { customersApi } from "@/lib/api/customers";
import { vendorsApi } from "@/lib/api/vendors";
import { invoicesApi, Invoice } from "@/lib/api/invoices";
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
  validatePaymentAllocations,
  sanitizeInput,
  formatCurrency,
} from "@/lib/utils/validation";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { SUCCESS_MESSAGES, FORM } from "@/lib/constants";
import logger from "@/lib/logger";
import { DollarSign } from "lucide-react";

interface PaymentAllocationForm {
  invoiceId: string;
  amount: string;
}

export default function PaymentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [partyTypeFilter, setPartyTypeFilter] = useState<string>("");
  const [payments, setPayments] = useState<Payment[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [availableInvoices, setAvailableInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPayment, setEditPayment] = useState<Payment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    paymentType: "receipt" as "receipt" | "payment",
    partyType: "customer" as "customer" | "vendor",
    partyId: "",
    paymentDate: new Date().toISOString().split("T")[0],
    currency: "QAR",
    exchangeRate: "1",
    paymentMethod: "bank_transfer" as "cash" | "bank_transfer" | "check",
    amount: "",
    bankAccountId: "",
    referenceNumber: "",
    checkNumber: "",
    checkDate: "",
    bankName: "",
    notes: "",
  });
  const [allocations, setAllocations] = useState<PaymentAllocationForm[]>([]);

  useEffect(() => {
    fetchPayments();
    fetchCustomers();
    fetchVendors();
  }, [typeFilter, statusFilter, partyTypeFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const filters: Record<string, string | number | boolean | undefined> = {};
      if (typeFilter) filters.paymentType = typeFilter;
      if (statusFilter) filters.status = statusFilter;
      if (partyTypeFilter) filters.partyType = partyTypeFilter;

      const data = await paymentsApi.getAll(filters);
      setPayments(data);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getAll({ is_active: true });
      setCustomers(data);
    } catch (error: unknown) {
      logger.error("Failed to load customers", error as Error);
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

  const fetchAvailableInvoices = async (partyType: string, partyId: string) => {
    try {
      const filters: Record<string, string | number | boolean | undefined> = {
        partyType,
        status: "posted",
      };

      if (partyType === "customer") {
        filters.invoiceType = "sales";
      } else {
        filters.invoiceType = "purchase";
      }

      const data = await invoicesApi.getAll(filters);
      const unpaidInvoices = data.filter(
        (inv) => inv.party_id === partyId && inv.outstanding_amount > 0
      );
      setAvailableInvoices(unpaidInvoices);
    } catch (error: unknown) {
      logger.error("Failed to load invoices", error as Error);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      draft: "secondary",
      submitted: "outline",
      approved: "outline",
      posted: "default",
      cancelled: "destructive",
    };
    const labels: Record<string, string> = {
      draft: "Draft",
      submitted: "Submitted",
      approved: "Approved",
      posted: "Posted",
      cancelled: "Cancelled",
    };
    return <Badge variant={variants[status] || "secondary"}>{labels[status] || status}</Badge>;
  };

  const filteredPayments = payments.filter(
    (pay) =>
      pay.payment_number.toLowerCase().includes(search.toLowerCase()) ||
      pay.party?.name_en?.toLowerCase().includes(search.toLowerCase()) ||
      pay.party?.name_ar?.includes(search) ||
      pay.reference_number?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = () => {
    setEditPayment(null);
    setFormData({
      paymentType: "receipt",
      partyType: "customer",
      partyId: "",
      paymentDate: new Date().toISOString().split("T")[0],
      currency: "QAR",
      exchangeRate: "1",
      paymentMethod: "bank_transfer",
      amount: "",
      bankAccountId: "",
      referenceNumber: "",
      checkNumber: "",
      checkDate: "",
      bankName: "",
      notes: "",
    });
    setAllocations([]);
    setDialogOpen(true);
  };

  const handleEdit = (payment: Payment) => {
    if (payment.status !== "draft") {
      toast.error("Can only edit draft payments");
      return;
    }
    setEditPayment(payment);
    setFormData({
      paymentType: payment.payment_type,
      partyType: payment.party_type,
      partyId: payment.party_id,
      paymentDate: payment.payment_date.split("T")[0],
      currency: payment.currency,
      exchangeRate: payment.exchange_rate.toString(),
      paymentMethod: payment.payment_method,
      amount: payment.amount.toString(),
      bankAccountId: payment.bank_account_id || "",
      referenceNumber: payment.reference_number || "",
      checkNumber: payment.check_number || "",
      checkDate: payment.check_date?.split("T")[0] || "",
      bankName: payment.bank_name || "",
      notes: payment.notes || "",
    });
    setAllocations(
      payment.allocations?.map((alloc) => ({
        invoiceId: alloc.invoice_id,
        amount: alloc.amount.toString(),
      })) || []
    );
    setDialogOpen(true);
    fetchAvailableInvoices(payment.party_type, payment.party_id);
  };

  const handleDelete = async (payment: Payment) => {
    if (!confirm(`Are you sure you want to delete ${payment.payment_number}?`)) {
      return;
    }

    try {
      await paymentsApi.delete(payment.id);
      toast.success("Payment deleted successfully");
      await fetchPayments();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to delete payment");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate allocations before submission
    const invoiceMap = new Map<string, number>();
    availableInvoices.forEach((inv) => {
      invoiceMap.set(inv.id, inv.outstanding_amount);
    });

    const validation = validatePaymentAllocations(
      allocations,
      safeParseFloat(formData.amount, 0),
      invoiceMap
    );

    if (!validation.isValid) {
      toast.error("Allocation validation failed:", {
        description: validation.errors.join(", "),
      });
      return;
    }

    setSubmitting(true);

    try {
      const data = {
        payment_type: formData.paymentType,
        party_id: formData.partyId,
        party_type: formData.partyType,
        payment_date: formData.paymentDate,
        currency: formData.currency,
        exchange_rate: safeParseFloat(formData.exchangeRate, 1),
        payment_method: formData.paymentMethod,
        amount: safeParseFloat(formData.amount, 0),
        bank_account_id: formData.bankAccountId || undefined,
        reference_number: formData.referenceNumber || undefined,
        check_number: formData.checkNumber || undefined,
        check_date: formData.checkDate || undefined,
        bank_name: formData.bankName || undefined,
        notes: formData.notes || undefined,
        allocations: allocations
          .filter((alloc) => alloc.invoiceId && alloc.amount)
          .map((alloc) => ({
            invoice_id: alloc.invoiceId,
            amount: safeParseFloat(alloc.amount, 0),
          })),
      };

      if (editPayment) {
        await paymentsApi.update(editPayment.id, data);
        toast.success("Payment updated successfully");
      } else {
        await paymentsApi.create(data);
        toast.success("Payment created successfully");
      }

      setDialogOpen(false);
      await fetchPayments();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (payment: Payment) => {
    setActionLoading(payment.id);
    try {
      await paymentsApi.submit(payment.id);
      toast.success("Payment submitted successfully");
      await fetchPayments();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to submit payment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (payment: Payment) => {
    setActionLoading(payment.id);
    try {
      await paymentsApi.approve(payment.id);
      toast.success("Payment approved successfully");
      await fetchPayments();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to approve payment");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePost = async (payment: Payment) => {
    setActionLoading(payment.id);
    try {
      await paymentsApi.post(payment.id);
      toast.success("Payment posted successfully");
      await fetchPayments();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to post payment");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async (payment: Payment) => {
    const reason = prompt("Please enter cancellation reason:");
    if (!reason) return;

    setActionLoading(payment.id);
    try {
      await paymentsApi.cancel(payment.id, reason);
      toast.success("Payment cancelled successfully");
      await fetchPayments();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to cancel payment");
    } finally {
      setActionLoading(null);
    }
  };

  const handlePartyChange = (partyId: string) => {
    setFormData({ ...formData, partyId });
    setAllocations([]);
    if (partyId) {
      fetchAvailableInvoices(formData.partyType, partyId);
    } else {
      setAvailableInvoices([]);
    }
  };

  const handlePartyTypeChange = (partyType: "customer" | "vendor") => {
    setFormData({ ...formData, partyType, partyId: "" });
    setAllocations([]);
    setAvailableInvoices([]);
  };

  const addAllocation = (invoiceId: string, outstandingAmount: number) => {
    const existingAlloc = allocations.find((a) => a.invoiceId === invoiceId);
    if (existingAlloc) return;

    const paymentAmount = safeParseFloat(formData.amount, 0);
    const remainingToAllocate = paymentAmount - getTotalAllocated();

    // Allocate the minimum of outstanding amount, remaining to allocate, or 0
    const allocAmount = Math.min(outstandingAmount, remainingToAllocate);

    setAllocations([
      ...allocations,
      {
        invoiceId,
        amount: allocAmount.toString(),
      },
    ]);
  };

  const removeAllocation = (invoiceId: string) => {
    setAllocations((prev) => prev.filter((a) => a.invoiceId !== invoiceId));
  };

  const updateAllocationAmount = (invoiceId: string, amount: string) => {
    // Sanitize and validate the amount
    const sanitized = sanitizeInput(amount, {
      allowNegative: false,
      maxDecimals: 2,
      min: 0,
      default: 0,
    });

    // Find the invoice to get outstanding amount
    const invoice = availableInvoices.find((inv) => inv.id === invoiceId);
    if (!invoice) return;

    // Cap at outstanding amount
    const maxAmount = invoice.outstanding_amount;
    const finalAmount = Math.min(sanitized, maxAmount);

    setAllocations((prev) =>
      prev.map((a) => (a.invoiceId === invoiceId ? { ...a, amount: finalAmount.toString() } : a))
    );
  };

  const getTotalAllocated = (): number => {
    if (!allocations || allocations.length === 0) return 0;
    return allocations.reduce((sum, alloc) => sum + safeParseFloat(alloc.amount, 0), 0);
  };

  const getActionButtons = (payment: Payment) => {
    const buttons = [];

    if (payment.status === "draft") {
      buttons.push({
        icon: <Edit className="h-4 w-4" />,
        label: "Edit",
        onClick: () => handleEdit(payment),
      });
      buttons.push({
        icon: <Trash2 className="h-4 w-4" />,
        label: "Delete",
        onClick: () => handleDelete(payment),
      });
      buttons.push({
        icon: <Send className="h-4 w-4" />,
        label: "Submit",
        onClick: () => handleSubmitForApproval(payment),
        loading: actionLoading === payment.id,
      });
    }

    if (payment.status === "submitted") {
      buttons.push({
        icon: <Check className="h-4 w-4" />,
        label: "Approve",
        onClick: () => handleApprove(payment),
        loading: actionLoading === payment.id,
      });
    }

    if (payment.status === "approved") {
      buttons.push({
        icon: <Upload className="h-4 w-4" />,
        label: "Post",
        onClick: () => handlePost(payment),
        loading: actionLoading === payment.id,
      });
    }

    if (payment.status === "posted") {
      buttons.push({
        icon: <Ban className="h-4 w-4" />,
        label: "Cancel",
        onClick: () => handleCancel(payment),
        loading: actionLoading === payment.id,
      });
    }

    return buttons;
  };

  // Use useMemo for expensive calculations to avoid recalculation on every render
  const allocationValidation = useMemo(() => {
    const invoiceMap = new Map<string, number>();
    availableInvoices.forEach((inv) => {
      invoiceMap.set(inv.id, inv.outstanding_amount);
    });

    return validatePaymentAllocations(allocations, safeParseFloat(formData.amount, 0), invoiceMap);
  }, [allocations, formData.amount, availableInvoices]);

  const totalAllocated = allocationValidation.totalAllocated;
  const paymentAmount = safeParseFloat(formData.amount, 0);
  const remainingToAllocate = allocationValidation.remainingAmount;

  return (
    <AuthenticatedLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Payments</h1>
            <p className="text-zinc-600 dark:text-zinc-400">Manage receipts and payments</p>
          </div>
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Payment
          </Button>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle>Payments</CardTitle>
              <div className="flex items-center gap-4">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                    <SelectItem value="payment">Payment</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={partyTypeFilter} onValueChange={setPartyTypeFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Party Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Parties</SelectItem>
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
            ) : filteredPayments.length === 0 ? (
              <EmptyState
                icon={DollarSign}
                title={
                  search || typeFilter || statusFilter ? "No payments found" : "No payments yet"
                }
                description={
                  search || typeFilter || statusFilter
                    ? "Try adjusting your search or filter criteria"
                    : "Get started by recording your first payment"
                }
                actionLabel="Add Payment"
                onAction={handleCreate}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Payment #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Party</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-mono">{payment.payment_number}</TableCell>
                      <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                      <TableCell className="capitalize">
                        <Badge variant="outline">{payment.payment_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {payment.party?.name_en}
                        <span className="mr-2 text-sm text-zinc-500" dir="rtl">
                          ({payment.party?.name_ar})
                        </span>
                      </TableCell>
                      <TableCell className="capitalize">
                        {payment.payment_method.replace("_", " ")}
                      </TableCell>
                      <TableCell>{payment.reference_number || "-"}</TableCell>
                      <TableCell>{getStatusBadge(payment.status)}</TableCell>
                      <TableCell className="text-right">
                        {payment.currency} {payment.amount.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {getActionButtons(payment).map((btn, idx) => (
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
              <DialogTitle>{editPayment ? "Edit Payment" : "Add Payment"}</DialogTitle>
              <DialogDescription>
                {editPayment ? "Update payment details" : "Create a new payment or receipt"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentType">Type *</Label>
                  <Select
                    value={formData.paymentType}
                    onValueChange={(value: "receipt" | "payment") =>
                      setFormData({ ...formData, paymentType: value })
                    }
                    disabled={!!editPayment}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="receipt">Receipt</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="partyType">Party Type *</Label>
                  <Select
                    value={formData.partyType}
                    onValueChange={(value: "customer" | "vendor") => handlePartyTypeChange(value)}
                    disabled={!!editPayment}
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
                  <Select value={formData.partyId} onValueChange={handlePartyChange} required>
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
                  <Label htmlFor="paymentDate">Payment Date *</Label>
                  <Input
                    id="paymentDate"
                    type="date"
                    value={formData.paymentDate}
                    onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                    required
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
                  <Label htmlFor="amount">Amount *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                  />
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

              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: "cash" | "bank_transfer" | "check") =>
                      setFormData({ ...formData, paymentMethod: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      <SelectItem value="check">Check</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="referenceNumber">Reference</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                  />
                </div>
                {formData.paymentMethod === "check" && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="checkNumber">Check Number</Label>
                      <Input
                        id="checkNumber"
                        value={formData.checkNumber}
                        onChange={(e) => setFormData({ ...formData, checkNumber: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="checkDate">Check Date</Label>
                      <Input
                        id="checkDate"
                        type="date"
                        value={formData.checkDate}
                        onChange={(e) => setFormData({ ...formData, checkDate: e.target.value })}
                      />
                    </div>
                  </>
                )}
                {formData.paymentMethod === "check" && (
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input
                      id="bankName"
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    />
                  </div>
                )}
              </div>

              {formData.partyId && (
                <div>
                  <Label>Invoice Allocations</Label>
                  <div className="mt-2 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice #</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Total</TableHead>
                          <TableHead>Outstanding</TableHead>
                          <TableHead className="w-40">Allocation</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {allocations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-zinc-500">
                              No allocations. Select invoices to allocate payment.
                            </TableCell>
                          </TableRow>
                        ) : (
                          allocations.map((alloc) => {
                            const invoice = availableInvoices.find(
                              (inv) => inv.id === alloc.invoiceId
                            );
                            if (!invoice) return null;
                            return (
                              <TableRow key={alloc.invoiceId}>
                                <TableCell className="font-mono">
                                  {invoice.invoice_number}
                                </TableCell>
                                <TableCell>
                                  {new Date(invoice.invoice_date).toLocaleDateString()}
                                </TableCell>
                                <TableCell>
                                  {invoice.currency} {invoice.total_amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  {invoice.currency} {invoice.outstanding_amount.toLocaleString()}
                                </TableCell>
                                <TableCell>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={alloc.amount}
                                    onChange={(e) =>
                                      updateAllocationAmount(alloc.invoiceId, e.target.value)
                                    }
                                    max={invoice.outstanding_amount}
                                    min={0}
                                    className={
                                      safeParseFloat(alloc.amount, 0) > invoice.outstanding_amount
                                        ? "border-red-500"
                                        : ""
                                    }
                                  />
                                  {safeParseFloat(alloc.amount, 0) > invoice.outstanding_amount && (
                                    <p className="mt-1 text-xs text-red-600">
                                      Exceeds outstanding ({invoice.outstanding_amount.toFixed(2)})
                                    </p>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeAllocation(alloc.invoiceId)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {availableInvoices.length > allocations.length && (
                    <div className="mt-2">
                      <Label>Add Invoice Allocation</Label>
                      <Select
                        value=""
                        onValueChange={(value) => {
                          const invoice = availableInvoices.find((inv) => inv.id === value);
                          if (invoice) {
                            addAllocation(invoice.id, invoice.outstanding_amount);
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select invoice to allocate" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableInvoices
                            .filter((inv) => !allocations.find((a) => a.invoiceId === inv.id))
                            .map((invoice) => (
                              <SelectItem key={invoice.id} value={invoice.id}>
                                {invoice.invoice_number} - {invoice.currency}{" "}
                                {invoice.outstanding_amount.toLocaleString()}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="mt-4 rounded-lg border p-4">
                    <div className="flex justify-between">
                      <span>Total Payment:</span>
                      <span className="font-bold">
                        {formData.currency} {paymentAmount.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Allocated:</span>
                      <span>
                        {formData.currency} {totalAllocated.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Unallocated:</span>
                      <span className={remainingToAllocate < 0 ? "text-red-600" : ""}>
                        {formData.currency} {remainingToAllocate.toFixed(2)}
                      </span>
                    </div>

                    {/* Validation warnings */}
                    {allocationValidation.overAllocations.length > 0 && (
                      <div className="mt-3 rounded-md bg-red-50 p-2 text-sm">
                        <div className="flex items-center gap-2 text-red-800">
                          <AlertCircle className="h-4 w-4" />
                          <span className="font-semibold">Over-allocation detected:</span>
                        </div>
                        <ul className="ml-6 mt-1 list-disc text-red-700">
                          {allocationValidation.overAllocations.map((over) => (
                            <li key={over.invoiceId}>
                              Invoice {over.invoiceId}: {over.overAmount.toFixed(2)} over limit
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                <Button
                  type="submit"
                  disabled={
                    submitting ||
                    !allocationValidation.isValid ||
                    allocationValidation.overAllocations.length > 0
                  }
                >
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
