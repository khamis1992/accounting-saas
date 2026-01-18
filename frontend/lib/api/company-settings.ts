/**
 * Company Settings API
 * Company settings and configuration API calls
 */

import { apiClient } from "./client";

export interface CompanySettings {
  id: string;
  tenant_id: string;
  company_name_en: string;
  company_name_ar: string;
  legal_name?: string;
  business_type: string;
  tax_number?: string;
  cr_number?: string;
  email?: string;
  phone?: string;
  website?: string;
  logo_url?: string;
  address: {
    street?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
  };
  tax_settings: {
    vat_enabled: boolean;
    vat_rate: number;
    vat_number?: string;
    tax_year_start?: string;
  };
  currency_settings: {
    base_currency: string;
    decimal_places: number;
    thousand_separator: string;
    decimal_separator: string;
  };
  created_at: string;
  updated_at: string;
}

export const companySettingsApi = {
  async get(): Promise<CompanySettings> {
    const response = await apiClient.get<CompanySettings>("/settings/company");
    return response.data as CompanySettings;
  },

  async update(data: Partial<CompanySettings>): Promise<CompanySettings> {
    const response = await apiClient.patch<CompanySettings>("/settings/company", data);
    return response.data as CompanySettings;
  },

  async uploadLogo(file: File): Promise<{ logo_url: string }> {
    const formData = new FormData();
    formData.append("logo", file);
    const response = await apiClient.post<{ logo_url: string }>("/settings/company/logo", formData);
    return response.data as { logo_url: string };
  },
};
