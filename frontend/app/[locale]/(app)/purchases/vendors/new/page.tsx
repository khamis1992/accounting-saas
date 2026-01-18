/**
 * New Vendor Page
 * Form for creating a new vendor
 */

"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Save, X, ArrowLeft } from "lucide-react";
import { vendorsApi, VendorCreateDto } from "@/lib/api/vendors";

export default function NewVendorPage() {
  const t = useTranslations("vendors");
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    code: "",
    nameEn: "",
    nameAr: "",
    vatNumber: "",
    email: "",
    phone: "",
    mobile: "",
    address: "",
    city: "",
    country: "",
    creditLimit: "",
    paymentTermsDays: "",
    bankName: "",
    bankAccountNumber: "",
    iban: "",
    swiftCode: "",
    notes: "",
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const data: VendorCreateDto = {
        code: formData.code,
        name_en: formData.nameEn,
        name_ar: formData.nameAr,
        vat_number: formData.vatNumber || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        mobile: formData.mobile || undefined,
        address: formData.address || undefined,
        city: formData.city || undefined,
        country: formData.country || undefined,
        credit_limit: formData.creditLimit ? parseFloat(formData.creditLimit) : undefined,
        payment_terms_days: formData.paymentTermsDays ? parseInt(formData.paymentTermsDays, 10) : undefined,
        bank_name: formData.bankName || undefined,
        bank_account_number: formData.bankAccountNumber || undefined,
        iban: formData.iban || undefined,
        swift_code: formData.swiftCode || undefined,
        notes: formData.notes || undefined,
        is_active: formData.isActive,
      };

      await vendorsApi.create(data);
      toast.success("Vendor created successfully");
      router.push("/purchases/vendors");
    } catch (error) {
      console.error("Error creating vendor:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save vendor");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={handleCancel}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t("addVendor")}</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create New Vendor</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="code">Code *</Label>
                    <Input
                      id="code"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      required
                      placeholder="Vendor code"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="vatNumber">VAT Number</Label>
                    <Input
                      id="vatNumber"
                      value={formData.vatNumber}
                      onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                      placeholder="VAT number"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameEn">Name (English) *</Label>
                  <Input
                    id="nameEn"
                    value={formData.nameEn}
                    onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                    required
                    placeholder="Vendor name in English"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nameAr">Name (Arabic) *</Label>
                  <Input
                    id="nameAr"
                    value={formData.nameAr}
                    onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                    required
                    placeholder="المورد الاسم (بالعربية)"
                    dir="rtl"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="vendor@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+974 XXXXXXXX"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="mobile">Mobile</Label>
                    <Input
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="+974 XXXXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paymentTermsDays">Payment Terms (Days)</Label>
                    <Input
                      id="paymentTermsDays"
                      type="number"
                      value={formData.paymentTermsDays}
                      onChange={(e) => setFormData({ ...formData, paymentTermsDays: e.target.value })}
                      placeholder="30"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Street address"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="City"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      placeholder="Country"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Credit Limit (QAR)</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      step="0.01"
                      value={formData.creditLimit}
                      onChange={(e) => setFormData({ ...formData, creditLimit: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isActive">Status</Label>
                    <Select
                      value={formData.isActive ? "true" : "false"}
                      onValueChange={(value) => setFormData({ ...formData, isActive: value === "true" })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="true">Active</SelectItem>
                        <SelectItem value="false">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="border-t pt-4">
                  <h3 className="font-medium mb-4">Bank Information</h3>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={formData.bankName}
                        onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                        placeholder="Bank name"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bankAccountNumber">Account Number</Label>
                      <Input
                        id="bankAccountNumber"
                        value={formData.bankAccountNumber}
                        onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                        placeholder="Account number"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="iban">IBAN</Label>
                        <Input
                          id="iban"
                          value={formData.iban}
                          onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
                          placeholder="IBAN"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="swiftCode">SWIFT Code</Label>
                        <Input
                          id="swiftCode"
                          value={formData.swiftCode}
                          onChange={(e) => setFormData({ ...formData, swiftCode: e.target.value })}
                          placeholder="SWIFT code"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes about the vendor"
                    rows={8}
                  />
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
                    Save Vendor
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