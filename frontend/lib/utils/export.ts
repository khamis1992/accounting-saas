/**
 * Export utility for downloading files from API responses
 */

export interface ExportOptions {
  filters?: Record<string, any>;
  language?: 'en' | 'ar' | 'both';
  includeInactive?: boolean;
}

/**
 * Generic export function that handles file downloads
 * @param url - The API endpoint URL
 * @param filename - The filename for the downloaded file (without extension)
 * @param format - The export format ('csv' or 'excel')
 * @param options - Optional query parameters
 * @returns Promise<void>
 */
export async function exportData(
  url: string,
  filename: string,
  format: 'csv' | 'excel',
  options: ExportOptions = {},
): Promise<void> {
  try {
    // Build query parameters
    const params = new URLSearchParams();

    if (options.filters) {
      Object.entries(options.filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });
    }

    if (options.language) {
      params.append('language', options.language);
    }

    if (options.includeInactive !== undefined) {
      params.append('includeInactive', String(options.includeInactive));
    }

    // Construct full URL with query parameters
    const queryString = params.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    // Make request
    const response = await fetch(fullUrl);

    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    // Get blob from response
    const blob = await response.blob();

    // Create download link
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;

    // Generate filename with date
    const date = new Date().toISOString().split('T')[0];
    const extension = format === 'excel' ? 'xlsx' : 'csv';
    link.download = `${filename}_${date}.${extension}`;

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('Export error:', error);
    throw error;
  }
}

/**
 * Export customers data
 */
export async function exportCustomers(
  format: 'csv' | 'excel',
  options: ExportOptions = {},
): Promise<void> {
  const apiUrl = '/api/customers/export/' + format;
  return exportData(apiUrl, 'customers', format, options);
}

/**
 * Export vendors data
 */
export async function exportVendors(
  format: 'csv' | 'excel',
  options: ExportOptions = {},
): Promise<void> {
  const apiUrl = '/api/vendors/export/' + format;
  return exportData(apiUrl, 'vendors', format, options);
}

/**
 * Export invoices data
 */
export async function exportInvoices(
  format: 'csv' | 'excel',
  options: ExportOptions = {},
): Promise<void> {
  const apiUrl = '/api/invoices/export/' + format;
  return exportData(apiUrl, 'invoices', format, options);
}

/**
 * Export payments data
 */
export async function exportPayments(
  format: 'csv' | 'excel',
  options: ExportOptions = {},
): Promise<void> {
  const apiUrl = '/api/payments/export/' + format;
  return exportData(apiUrl, 'payments', format, options);
}

/**
 * Export journal entries data
 */
export async function exportJournals(
  format: 'csv' | 'excel',
  options: ExportOptions = {},
): Promise<void> {
  const apiUrl = '/api/journals/export/' + format;
  return exportData(apiUrl, 'journals', format, options);
}

/**
 * Export chart of accounts data
 */
export async function exportChartOfAccounts(
  format: 'csv' | 'excel',
  options: ExportOptions = {},
): Promise<void> {
  const apiUrl = '/api/coa/export/' + format;
  return exportData(apiUrl, 'chart_of_accounts', format, options);
}
