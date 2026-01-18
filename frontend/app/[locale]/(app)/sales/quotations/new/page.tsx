/**
 * New Quotation Page
 * Form for creating a new quotation
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
import { quotationsApi, QuotationCreateDto } from "@/lib/api/quotations";
import { customersApi } from "@/lib/api/customers";

interface QuotationLineForm {
  descriptionEn: string;
  descriptionAr: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  discount: string;
}

export default function NewQuotationPage() {
  const t = useTranslations("sales.quotations");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    customerId: "",
    date: new Date().toISOString().split("T")[0],
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: "",
  });
  
  const [lines, setLines] = useState<QuotationLineForm[]>([
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

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await customersApi.getAll({ is_active: true });
      setCustomers(data);
    } catch (error) {
      toast.error("Failed to load customers");
      console.error("Error fetching customers:", error);
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

  const updateLine = (index: number, field: keyof QuotationLineForm, value: string) => {
    const newLines = [...lines];
    newLines[index] = { ...newLines[index], [field]: value };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: QuotationCreateDto = {
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

      await quotationsApi.create(data);
      toast.success(t("createSuccess"));
      router.push("/sales/quotations");
    } catch (error) {
      console.error("Error creating quotation:", error);
      toast.error(error instanceof Error ? error.message : t("errors.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
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
        <h1 className="text-3xl font-bold">{t("dialog.createTitle")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("dialog.createDescription")}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="customer">
                    {t("form.customer")} *
                  </Label>
                  <Select
                    value={formData.customerId}
                    onValueChange={(value) => setFormData({ ...formData, customerId: value })}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t("form.selectCustomer")} />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name_en} ({customer.name_ar})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="notes">{t("form.notes")}</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder={t("form.notes")}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium">{t("form.lineItems")}</h3>
                    <Button type="button" variant="outline" size="sm" onClick={addLine}>
                      <Plus className="h-4 w-4 mr-2" />
                      {t("form.addLine")}
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
                            <Label className="text-xs">{t("form.descriptionEn")}</Label>
                            <Input
                              value={line.descriptionEn}
                              onChange={(e) => updateLine(index, "descriptionEn", e.target.value)}
                              placeholder={t("form.descriptionEn")}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t("form.descriptionAr")}</Label>
                            <Input
                              value={line.descriptionAr}
                              onChange={(e) => updateLine(index, "descriptionAr", e.target.value)}
                              placeholder={t("form.descriptionAr")}
                              dir="rtl"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">{t("form.quantity")}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.quantity}
                              onChange={(e) => updateLine(index, "quantity", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t("form.unitPrice")}</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={line.unitPrice}
                              onChange={(e) => updateLine(index, "unitPrice", e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">{t("form.tax")}</Label>
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
                            <Label className="text-xs">{t("form.discount")}</Label>
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
                          {t("form.total")}: QAR {calculateLineTotal(line).toFixed(2)}
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
                    <span className="text-gray-600">{t("form.subtotal")}:</span>
                    <span>QAR {totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("form.total")} {t("form.discount")}:</span>
                    <span>- QAR {totals.totalDiscount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t("form.total")} {t("form.tax")}:</span>
                    <span>+ QAR {totals.totalTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t">
                    <span>{t("form.total")}:</span>
                    <span>QAR {totals.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button type="button" variant="outline" onClick={handleCancel}>
                {t("form.cancel")}
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <X className="mr-2 h-4 w-4 animate-spin" />
                    {t("form.saving")}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t("form.save")}
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