/**
 * Company Settings Page
 * Manage company information, tax settings, and business details
 */

"use client";

import { useState, useEffect } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { companySettingsApi, CompanySettings } from "@/lib/api/company-settings";
import { toast } from "sonner";
import { Save, Building2, Globe, CreditCard, Shield, Users, DollarSign, RefreshCw } from "lucide-react";
import logger from "@/lib/logger";

export default function CompanySettingsPage() {
  const t = useTranslations("settings.company");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<CompanySettings | null>(null);

  // Fetch company settings
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const data = await companySettingsApi.get();
      setSettings(data);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to load company settings";
      toast.error(message);
      logger.error("Failed to load company settings", error as Error);
    } finally {
      setLoading(false);
    }
  };

  // Handle form changes
  const handleChange = (field: keyof CompanySettings, value: string | boolean) => {
    setSettings((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  // Handle address changes
  const handleAddressChange = (field: string, value: string) => {
    setSettings((prev) => (prev ? { ...prev, address: { ...prev.address, [field]: value } } : null));
  };

  // Handle tax settings changes
  const handleTaxChange = (field: string, value: string | boolean) => {
    setSettings((prev) => (prev ? { ...prev, tax_settings: { ...prev.tax_settings, [field]: value } } : null));
  };

  // Handle currency settings changes
  const handleCurrencyChange = (field: string, value: string | number) => {
    setSettings((prev) => (prev ? { ...prev, currency_settings: { ...prev.currency_settings, [field]: value } } : null));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    try {
      await companySettingsApi.update(settings);
      toast.success(t("updateSuccess"));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to save settings";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-2 text-zinc-500">
          <RefreshCw className="h-5 w-5 animate-spin" />
          <span>{t("loading")}</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Building2 className="h-12 w-12 text-zinc-400 mb-4" />
        <h3 className="text-lg font-medium">{t("error.noSettings.title")}</h3>
        <p className="text-zinc-500">{t("error.noSettings.description")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t("description")}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("companyInformation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <Tabs defaultValue="company" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="company" className="gap-2">
                    <Building2 className="h-4 w-4" />
                    {t("tabs.company")}
                  </TabsTrigger>
                  <TabsTrigger value="address" className="gap-2">
                    <Globe className="h-4 w-4" />
                    {t("tabs.address")}
                  </TabsTrigger>
                  <TabsTrigger value="tax" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    {t("tabs.tax")}
                  </TabsTrigger>
                  <TabsTrigger value="currency" className="gap-2">
                    <DollarSign className="h-4 w-4" />
                    {t("tabs.currency")}
                  </TabsTrigger>
                </TabsList>

                {/* Company Information Tab */}
                <TabsContent value="company" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyNameEn">{t("fields.companyNameEn")}</Label>
                      <Input
                        id="companyNameEn"
                        value={settings.company_name_en || ""}
                        onChange={(e) => handleChange("company_name_en", e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="companyNameAr">{t("fields.companyNameAr")}</Label>
                      <Input
                        id="companyNameAr"
                        value={settings.company_name_ar || ""}
                        onChange={(e) => handleChange("company_name_ar", e.target.value)}
                        dir="rtl"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="legalName">{t("fields.legalName")}</Label>
                      <Input
                        id="legalName"
                        value={settings.legal_name || ""}
                        onChange={(e) => handleChange("legal_name", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="businessType">{t("fields.businessType")}</Label>
                      <Select
                        value={settings.business_type || "other"}
                        onValueChange={(value) => handleChange("business_type", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sole_proprietorship">{t("businessTypes.soleProprietorship")}</SelectItem>
                          <SelectItem value="partnership">{t("businessTypes.partnership")}</SelectItem>
                          <SelectItem value="limited_company">{t("businessTypes.limitedCompany")}</SelectItem>
                          <SelectItem value="non_profit">{t("businessTypes.nonProfit")}</SelectItem>
                          <SelectItem value="other">{t("businessTypes.other")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxNumber">{t("fields.taxNumber")}</Label>
                      <Input
                        id="taxNumber"
                        value={settings.tax_number || ""}
                        onChange={(e) => handleChange("tax_number", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="registrationNumber">{t("fields.registrationNumber")}</Label>
                      <Input
                        id="registrationNumber"
                        value={settings.registration_number || ""}
                        onChange={(e) => handleChange("registration_number", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="industry">{t("fields.industry")}</Label>
                    <Select
                      value={settings.industry || "other"}
                      onValueChange={(value) => handleChange("industry", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retail">{t("industries.retail")}</SelectItem>
                        <SelectItem value="wholesale">{t("industries.wholesale")}</SelectItem>
                        <SelectItem value="manufacturing">{t("industries.manufacturing")}</SelectItem>
                        <SelectItem value="services">{t("industries.services")}</SelectItem>
                        <SelectItem value="construction">{t("industries.construction")}</SelectItem>
                        <SelectItem value="technology">{t("industries.technology")}</SelectItem>
                        <SelectItem value="healthcare">{t("industries.healthcare")}</SelectItem>
                        <SelectItem value="education">{t("industries.education")}</SelectItem>
                        <SelectItem value="hospitality">{t("industries.hospitality")}</SelectItem>
                        <SelectItem value="other">{t("industries.other")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t("fields.description")}</Label>
                    <Textarea
                      id="description"
                      value={settings.description || ""}
                      onChange={(e) => handleChange("description", e.target.value)}
                      rows={4}
                    />
                  </div>
                </TabsContent>

                {/* Address Tab */}
                <TabsContent value="address" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">{t("fields.street")}</Label>
                      <Input
                        id="street"
                        value={settings.address?.street || ""}
                        onChange={(e) => handleAddressChange("street", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">{t("fields.city")}</Label>
                      <Input
                        id="city"
                        value={settings.address?.city || ""}
                        onChange={(e) => handleAddressChange("city", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="state">{t("fields.state")}</Label>
                      <Input
                        id="state"
                        value={settings.address?.state || ""}
                        onChange={(e) => handleAddressChange("state", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">{t("fields.postalCode")}</Label>
                      <Input
                        id="postalCode"
                        value={settings.address?.postal_code || ""}
                        onChange={(e) => handleAddressChange("postal_code", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">{t("fields.country")}</Label>
                    <Select
                      value={settings.address?.country || "QA"}
                      onValueChange={(value) => handleAddressChange("country", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="QA">{t("countries.qatar")}</SelectItem>
                        <SelectItem value="SA">{t("countries.saudiArabia")}</SelectItem>
                        <SelectItem value="AE">{t("countries.unitedArabEmirates")}</SelectItem>
                        <SelectItem value="KW">{t("countries.kuwait")}</SelectItem>
                        <SelectItem value="BH">{t("countries.bahrain")}</SelectItem>
                        <SelectItem value="OM">{t("countries.oman")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* Tax Settings Tab */}
                <TabsContent value="tax" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="vatNumber">{t("fields.vatNumber")}</Label>
                      <Input
                        id="vatNumber"
                        value={settings.tax_settings?.vat_number || ""}
                        onChange={(e) => handleTaxChange("vat_number", e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="taxRate">{t("fields.taxRate")}</Label>
                      <Input
                        id="taxRate"
                        type="number"
                        step="0.01"
                        min="0"
                        max="100"
                        value={settings.tax_settings?.default_tax_rate || ""}
                        onChange={(e) => handleTaxChange("default_tax_rate", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="enableTax">{t("fields.enableTax")}</Label>
                      <Switch
                        id="enableTax"
                        checked={settings.tax_settings?.is_tax_enabled || false}
                        onCheckedChange={(checked) => handleTaxChange("is_tax_enabled", checked)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="taxCalculation">{t("fields.taxCalculation")}</Label>
                    <Select
                      value={settings.tax_settings?.tax_calculation_method || "exclusive"}
                      onValueChange={(value) => handleTaxChange("tax_calculation_method", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="exclusive">{t("taxCalculation.exclusive")}</SelectItem>
                        <SelectItem value="inclusive">{t("taxCalculation.inclusive")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* Currency Settings Tab */}
                <TabsContent value="currency" className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="baseCurrency">{t("fields.baseCurrency")}</Label>
                      <Select
                        value={settings.currency_settings?.base_currency || "QAR"}
                        onValueChange={(value) => handleCurrencyChange("base_currency", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="QAR">QAR - Qatari Riyal</SelectItem>
                          <SelectItem value="USD">USD - US Dollar</SelectItem>
                          <SelectItem value="EUR">EUR - Euro</SelectItem>
                          <SelectItem value="GBP">GBP - British Pound</SelectItem>
                          <SelectItem value="SAR">SAR - Saudi Riyal</SelectItem>
                          <SelectItem value="AED">AED - UAE Dirham</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="decimalPlaces">{t("fields.decimalPlaces")}</Label>
                      <Select
                        value={settings.currency_settings?.decimal_places?.toString() || "2"}
                        onValueChange={(value) => handleCurrencyChange("decimal_places", parseInt(value))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">0</SelectItem>
                          <SelectItem value="2">2</SelectItem>
                          <SelectItem value="3">3</SelectItem>
                          <SelectItem value="4">4</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="thousandsSeparator">{t("fields.thousandsSeparator")}</Label>
                    <Select
                      value={settings.currency_settings?.thousands_separator || ","}
                      onValueChange={(value) => handleCurrencyChange("thousands_separator", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=",">1,000,000</SelectItem>
                        <SelectItem value=".">1.000.000</SelectItem>
                        <SelectItem value=" ">1 000 000</SelectItem>
                        <SelectItem value="">{t("thousandsSeparators.none")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="symbolPosition">{t("fields.symbolPosition")}</Label>
                    <Select
                      value={settings.currency_settings?.symbol_position || "before"}
                      onValueChange={(value) => handleCurrencyChange("symbol_position", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="before">$1,000.00</SelectItem>
                        <SelectItem value="after">1,000.00$</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={fetchSettings}>
                  {t("actions.cancel")}
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      {t("actions.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {t("actions.save")}
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