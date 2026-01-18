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
 * Company Settings Page
 * Manage company information, logo, currency, and financial settings
 */

import { useState, useEffect } from "react";
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Building2, Upload, Save, CheckCircle } from "lucide-react";
import { companySettingsApi, CompanySettings } from "@/lib/api/settings";
import { toast } from "sonner";

export default function CompanySettingsPage() {
  const t = useTranslations("settings.company");
  const tc = useTranslations("common");

  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [formData, setFormData] = useState({
    name: "",
    legalName: "",
    taxRegistrationNumber: "",
    vatNumber: "",
    address: "",
    city: "",
    country: "",
    phone: "",
    email: "",
    website: "",
    currencyCode: "USD",
    taxYearStart: "01-01",
    taxYearEnd: "12-31",
    decimalPlaces: 2,
    rounding: "nearest" as "nearest" | "up" | "down",
  });

  // Fetch settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await companySettingsApi.get();
      setSettings(data);
      setLogoPreview(data.logo_url || "");

      setFormData({
        name: data.name || "",
        legalName: data.legal_name || "",
        taxRegistrationNumber: data.tax_registration_number || "",
        vatNumber: data.vat_number || "",
        address: data.address || "",
        city: data.city || "",
        country: data.country || "",
        phone: data.phone || "",
        email: data.email || "",
        website: data.website || "",
        currencyCode: data.currency_code || "USD",
        taxYearStart: data.tax_year_start || "01-01",
        taxYearEnd: data.tax_year_end || "12-31",
        decimalPlaces: data.decimal_places || 2,
        rounding: data.rounding || "nearest",
      });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to load company settings");
    } finally {
      setLoading(false);
    }
  };

  // Handle logo file change
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Logo file must be less than 2MB");
        return;
      }

      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      // First upload logo if changed
      if (logoFile) {
        const { logoUrl } = await companySettingsApi.uploadLogo(logoFile);
        setLogoPreview(logoUrl);
      }

      // Then update settings
      await companySettingsApi.update(formData);

      toast.success("Company settings saved successfully");
      await fetchSettings();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Failed to save company settings");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthenticatedLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-zinc-500">Loading settings...</div>
        </div>
      </AuthenticatedLayout>
    );
  }

  return (
    <AuthenticatedLayout>
      <div className="max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-zinc-500" />
            <div>
              <h1 className="text-3xl font-bold">{t("title")}</h1>
              <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle>{t("companyInformation")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Logo Upload */}
              <div className="flex items-start gap-6">
                <div className="flex-shrink-0">
                  <div className="flex h-24 w-24 items-center justify-center rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Company logo"
                        className="h-full w-full rounded-lg object-cover"
                      />
                    ) : (
                      <Building2 className="h-8 w-8 text-zinc-400" />
                    )}
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <Label htmlFor="logo">{t("companyLogo")}</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="logo"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="max-w-xs"
                    />
                    <span className="text-sm text-zinc-500">{t("logoRequirements")}</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("companyName")}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="legalName">{t("legalName")}</Label>
                  <Input
                    id="legalName"
                    value={formData.legalName}
                    onChange={(e) => setFormData({ ...formData, legalName: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxRegistrationNumber">{t("taxRegistrationNumber")}</Label>
                  <Input
                    id="taxRegistrationNumber"
                    value={formData.taxRegistrationNumber}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        taxRegistrationNumber: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vatNumber">{t("vatNumber")}</Label>
                  <Input
                    id="vatNumber"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{tc("email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{tc("phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">{t("website")}</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("address")}</Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="city">{t("city")}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="country">{t("country")}</Label>
                  <Input
                    id="country"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Currency & Tax Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t("currencyAndTax")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="currencyCode">{t("baseCurrency")}</Label>
                  <Select
                    value={formData.currencyCode}
                    onValueChange={(value) => setFormData({ ...formData, currencyCode: value })}
                  >
                    <SelectTrigger id="currencyCode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                      <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                      <SelectItem value="EGP">EGP - Egyptian Pound</SelectItem>
                      <SelectItem value="KWD">KWD - Kuwaiti Dinar</SelectItem>
                      <SelectItem value="BHD">BHD - Bahraini Dinar</SelectItem>
                      <SelectItem value="OMR">OMR - Omani Rial</SelectItem>
                      <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="taxYearStart">{t("taxYearStart")}</Label>
                  <Input
                    id="taxYearStart"
                    type="month"
                    value={formData.taxYearStart}
                    onChange={(e) => setFormData({ ...formData, taxYearStart: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxYearEnd">{t("taxYearEnd")}</Label>
                  <Input
                    id="taxYearEnd"
                    type="month"
                    value={formData.taxYearEnd}
                    onChange={(e) => setFormData({ ...formData, taxYearEnd: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Settings */}
          <Card>
            <CardHeader>
              <CardTitle>{t("financialSettings")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="decimalPlaces">{t("decimalPlaces")}</Label>
                  <Select
                    value={String(formData.decimalPlaces)}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        decimalPlaces: parseInt(value),
                      })
                    }
                  >
                    <SelectTrigger id="decimalPlaces">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">0 (No decimals)</SelectItem>
                      <SelectItem value="2">2 (Standard: 1.00)</SelectItem>
                      <SelectItem value="3">3 (Precision: 1.000)</SelectItem>
                      <SelectItem value="4">4 (High precision: 1.0000)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rounding">{t("rounding")}</Label>
                  <Select
                    value={formData.rounding}
                    onValueChange={(value: string) => setFormData({ ...formData, rounding: value as "up" | "down" | "nearest" })}
                  >
                    <SelectTrigger id="rounding">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nearest">{t("roundingNearest")}</SelectItem>
                      <SelectItem value="up">{t("roundingUp")}</SelectItem>
                      <SelectItem value="down">{t("roundingDown")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="submit" size="lg" disabled={saving} className="gap-2">
              {saving ? (
                <>
                  <span>{t("saving")}</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>{t("saveSettings")}</span>
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Success Message */}
        {saving === false && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>{t("settingsSaved")}</span>
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
