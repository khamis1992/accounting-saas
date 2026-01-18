/**
 * New Invoice Page
 * Form for creating a new invoice
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
import { Plus, Minus, Save, X, ArrowLeft } from "lucide-react";
import { invoicesApi, InvoiceCreateDto } from "@/lib/api/invoices";
import { customersApi } from "@/lib/api/customers";
import { vendorsApi } from "@/lib/api/vendors";

interface InvoiceLineForm {
  descriptionEn: string;
  descriptionAr: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  discount: string;
}

export default function NewInvoicePage() {
  const t = useTranslations("invoices");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
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
      descriptionEn: "",
      descriptionAr: "",
      quantity: "1",
      unitPrice: "0",
      taxRate: "0",
      discount: "0",
    },
  ]);
  
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

  const addLine = () => {
    setLines([
      ...lines,
      {
        descriptionEn: "",
        descriptionAr: "",
        quantity: "1",
        unitPrice: "0",
        taxRate: "0",
        discount: "0",
      },
    ]);
  };

  const removeLine = (index: number) => {
    if (lines.length > 1) {
      const newLines = [...lines];
      newLines.splice(index, 1);
      setLines(newLines);
    }
  };

  const updateLine = (index: number, field: keyof InvoiceLineForm, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
    setLines(newLines);
  };

  const calculateLineTotal = (line: InvoiceLineForm): number => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: InvoiceCreateDto = {
        invoice_type: formData.invoiceType,
        party_id: formData.partyId,
        party_type: formData.partyType,
        invoice_date: formData.invoiceDate,
        due_date: formData.dueDate || undefined,
        currency: formData.currency,
        exchange_rate: parseFloat(formData.exchangeRate) || 1,
        notes: formData.notes || undefined,
        lines: lines.map((line, index) => ({
          line_number: index + 1,
          description_en: line.descriptionEn || undefined,
          description_ar: line.descriptionAr || undefined,
          quantity: parseFloat(line.quantity) || 0,
          unit_price: parseFloat(line.unitPrice) || 0,
          tax_rate: parseFloat(line.taxRate) || 0,
          discount_percent: parseFloat(line.discount) || 0,
        })),
      };

      await invoicesApi.create(data);
      toast.success("Invoice created successfully");
      router.push("/sales/invoices");
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save invoice");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const handlePartyTypeChange = (value: "customer" | "vendor") => {
    setFormData({ ...formData, partyType: value, partyId: "" });
  };

  const totals = calculateTotals();

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
        <h1 className="text-3xl font-bold">{t("addInvoice")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Invoice</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="invoiceType">Invoice Type *</Label>
                    <Select
                      value={formData.invoiceType}
                      onValueChange={(value: "sales" | "purchase") => setFormData({ ...formData, invoiceType: value })}
                      required
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
                    onValueChange={(value) => setFormData({ ...formData, partyId: value })}
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
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">Line Items</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Line
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {lines.map((line, index) => (
                      <div key={index} className="border rounded-lg p-4 space-y-3">
                        <div className="flex justify-end">
                          {lines.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeLine(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Description (EN)</Label>
                            <Input
                              value={line.descriptionEn}
                              onChange={(e) => updateLine(index, "descriptionEn", e.target.value)}
                              placeholder="Description in English"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description (AR)</Label>
                            <Input
                              value={line.descriptionAr}
                              onChange={(e) => updateLine(index, "descriptionAr", e.target.value)}
                              placeholder="Description in Arabic"
                              dir="rtl"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) => updateLine(index, "quantity", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit Price</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Tax %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={line.taxRate}
                              onChange={(e) => updateLine(index, "taxRate", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Discount %</Label>
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.01"
                              value={line.discount}
                              onChange={(e) => updateLine(index, "discount", e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="text-right font-medium">
                          Total: QAR {calculateLineTotal(line).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-end space-x-4">
                <div className="text-right space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span>QAR {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Discount:</span>
                    <span>- QAR {totals.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Tax:</span>
                    <span>+ QAR {totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>Total:</span>
                    <span>QAR {totals.totalAmount.toFixed(2)}</span>
                  </div>
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
                    Save Invoice
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