/**
 * New Payment Page
 * Form for creating a new payment
 */

"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save, X, ArrowLeft, Plus, Minus } from "lucide-react";
import { paymentsApi, PaymentCreateDto } from "@/lib/api/payments";
import { customersApi } from "@/lib/api/customers";
import { vendorsApi } from "@/lib/api/vendors";
import { invoicesApi, Invoice } from "@/lib/api/invoices";

interface PaymentAllocationForm {
  invoiceId: string;
  amount: string;
}

export default function NewPaymentPage() {
  const t = useTranslations("payments");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
  const [availableInvoices, setAvailableInvoices] = useState<Invoice[]>([]);
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);

  useEffect(() => {
    fetchParties();
  }, []);

  const fetchParties = async () => {
    try {
      const [customerData, vendorData] = await Promise.all([
        customersApi.getAll({ is_active: true }),
        vendorsApi.getAll({ is_active: true })
      ]);
      
      setCustomers(customerData);
      setVendors(vendorData);
    } catch (error) {
      toast.error("Failed to load parties");
      console.error("Error fetching parties:", error);
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error("Failed to load invoices:", error);
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

    const paymentAmount = parseFloat(formData.amount) || 0;
    const remainingToAllocate = paymentAmount - getTotalAllocated();

    // Allocate the minimum of outstanding amount, remaining to allocate, or 0
    const allocAmount = Math.min(outstandingAmount, remainingToAllocate, outstandingAmount);

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
    const sanitized = parseFloat(amount) || 0;

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
    return allocations.reduce((sum, alloc) => sum + (parseFloat(alloc.amount) || 0), 0);
  };

  const calculateRemainingToAllocate = (): number => {
    const paymentAmount = parseFloat(formData.amount) || 0;
    return paymentAmount - getTotalAllocated();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: PaymentCreateDto = {
        payment_type: formData.paymentType,
        party_id: formData.partyId,
        party_type: formData.partyType,
        payment_date: formData.paymentDate,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchangeRate) || 1,
        payment_method: formData.paymentMethod,
        amount: parseFloat(formData.amount) || 0,
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
            amount: parseFloat(alloc.amount) || 0,
          })),
      };

      await paymentsApi.create(data);
      toast.success("Payment created successfully");
      router.push("/sales/payments");
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save payment");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t("addPayment")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Payment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentType">Payment Type *</Label>
                    <Select
                      value={formData.paymentType}
                      onValueChange={(value: "receipt" | "payment") => setFormData({ ...formData, paymentType: value })}
                      required
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
                      onValueChange={handlePartyTypeChange}
                      required
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
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partyId">
                    {formData.partyType === "customer" ? "Customer *" : "Vendor *"}
                  </Label>
                  <Select
                    value={formData.partyId}
                    onValueChange={handlePartyChange}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={`Select ${formData.partyType}`} />
                    </SelectTrigger>
                    <SelectContent>
                      {formData.partyType === "customer"
                        ? customers.map((customer) => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.name_en} ({customer.name_ar})
                            </SelectItem>
                          ))
                        : vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.id}>
                              {vendor.name_en} ({vendor.name_ar})
                            </SelectItem>
                          ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
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
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currency">Currency</Label>
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
                      min="0"
                      value={formData.exchangeRate}
                      onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentMethod">Payment Method</Label>
                  <Select
                    value={formData.paymentMethod}
                    onValueChange={(value: "cash" | "bank_transfer" | "check") => setFormData({ ...formData, paymentMethod: value })}
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
                  <Label htmlFor="referenceNumber">Reference Number</Label>
                  <Input
                    id="referenceNumber"
                    value={formData.referenceNumber}
                    onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
                    placeholder="Reference number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium mb-4">Invoice Allocations</h3>
                  
                  <div className="mb-4 p-3 bg-gray-50 rounded-md">
                    <div className="flex justify-between text-sm">
                      <span>Amount to Allocate:</span>
                      <span className="font-medium">QAR {(parseFloat(formData.amount) || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Allocated:</span>
                      <span className="font-medium">QAR {getTotalAllocated().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium">
                      <span>Remaining:</span>
                      <span className={calculateRemainingToAllocate() < 0 ? "text-red-600" : "text-green-600"}>
                        QAR {calculateRemainingToAllocate().toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {availableInvoices.length > 0 ? (
                    <div className="space-y-3">
                      {availableInvoices.map((invoice) => {
                        const existingAlloc = allocations.find(a => a.invoiceId === invoice.id);
                        return (
                          <div key={invoice.id} className="flex items-center gap-2 p-3 border rounded-md">
                            <div className="flex-1">
                              <div className="text-sm font-medium">{invoice.invoice_number}</div>
                              <div className="text-xs text-gray-500">
                                Outstanding: QAR {invoice.outstanding_amount.toFixed(2)}
                              </div>
                            </div>
                            
                            {existingAlloc ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  max={invoice.outstanding_amount}
                                  value={existingAlloc.amount}
                                  onChange={(e) => updateAllocationAmount(invoice.id, e.target.value)}
                                  className="w-24"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => removeAllocation(invoice.id)}
                                  className="text-red-600"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addAllocation(invoice.id, invoice.outstanding_amount)}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      {formData.partyId ? "No unpaid invoices available for allocation" : "Select a customer/vendor to see available invoices"}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <X className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Payment
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}