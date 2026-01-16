'use client';

/**
 * Export Button Component
 * Provides dropdown menu to export data in CSV or Excel format
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Download, FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import * as exportUtil from '@/lib/utils/export';

export interface ExportButtonProps {
  entityType:
    | 'customers'
    | 'vendors'
    | 'invoices'
    | 'payments'
    | 'journals'
    | 'chartOfAccounts';
  filters?: Record<string, any>;
  language?: 'en' | 'ar' | 'both';
  includeInactive?: boolean;
  disabled?: boolean;
}

export function ExportButton({
  entityType,
  filters = {},
  language = 'both',
  includeInactive = false,
  disabled = false,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<'csv' | 'excel' | null>(null);

  const handleExport = async (format: 'csv' | 'excel') => {
    try {
      setIsExporting(true);
      setExportFormat(format);

      const options = {
        filters,
        language,
        includeInactive,
      };

      // Call the appropriate export function based on entity type
      switch (entityType) {
        case 'customers':
          await exportUtil.exportCustomers(format, options);
          break;
        case 'vendors':
          await exportUtil.exportVendors(format, options);
          break;
        case 'invoices':
          await exportUtil.exportInvoices(format, options);
          break;
        case 'payments':
          await exportUtil.exportPayments(format, options);
          break;
        case 'journals':
          await exportUtil.exportJournals(format, options);
          break;
        case 'chartOfAccounts':
          await exportUtil.exportChartOfAccounts(format, options);
          break;
        default:
          throw new Error(`Unknown entity type: ${entityType}`);
      }

      toast.success(
        `Successfully exported ${entityType} as ${format.toUpperCase()}`,
      );
    } catch (error: any) {
      console.error('Export failed:', error);
      toast.error(error.message || `Failed to export ${entityType}`);
    } finally {
      setIsExporting(false);
      setExportFormat(null);
    }
  };

  const isCurrentFormat = (format: 'csv' | 'excel') =>
    isExporting && exportFormat === format;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled || isExporting}>
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Export
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('excel')}
          disabled={isCurrentFormat('excel')}
        >
          {isCurrentFormat('excel') ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileSpreadsheet className="h-4 w-4 mr-2" />
          )}
          Export as Excel
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isCurrentFormat('csv')}
        >
          {isCurrentFormat('csv') ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <FileText className="h-4 w-4 mr-2" />
          )}
          Export as CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
