# Critical Fixes for Accounting Reports

This file contains ready-to-use code fixes for the critical and high-priority issues identified in the audit.

---

## Fix 1: Trial Balance - Fiscal Period Selector (CRITICAL)

**File:** `frontend/app/[locale]/(app)/accounting/trial-balance/page.tsx`

### Replace Lines 223-232:

```tsx
// OLD CODE (REMOVE):
{/* TODO: Fetch fiscal periods from API */}
<SelectItem value="current">Current Period</SelectItem>
<SelectItem value="previous">Previous Period</SelectItem>

// NEW CODE (ADD):
{fiscalPeriods.length === 0 ? (
  <SelectItem value="" disabled>
    No periods available
  </SelectItem>
) : (
  <>
    <SelectItem value="">{common('all')}</SelectItem>
    {fiscalPeriods.map((period) => (
      <SelectItem key={period.id} value={period.id}>
        {period.name}
        {period.start_date && period.end_date && (
          <span className="text-muted-foreground">
            {' '}({new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()})
          </span>
        )}
      </SelectItem>
    ))}
  </>
)}
```

### Add State for Fiscal Periods:

```tsx
// Add after line 51:
const [fiscalPeriods, setFiscalPeriods] = useState<Array<{
  id: string;
  name: string;
  start_date: string;
  end_date: string;
}>>([]);

// Add useEffect to fetch periods:
useEffect(() => {
  const fetchFiscalPeriods = async () => {
    try {
      // Replace with actual API endpoint
      const response = await fetch('/api/accounting/fiscal-periods', {
        headers: {
          'Authorization': `Bearer ${apiClient.getAccessToken()}`,
        },
      });
      const data = await response.json();
      setFiscalPeriods(data);
    } catch (error) {
      console.error('Failed to fetch fiscal periods:', error);
    }
  };

  fetchFiscalPeriods();
}, []);
```

---

## Fix 2: API Security - Standardize Auth Tokens (HIGH)

**File:** `frontend/lib/api/trial-balance.ts`

### Replace Lines 71-96:

```typescript
// OLD CODE:
async exportToPDF(filters: TrialBalanceFilters): Promise<Blob> {
  const params = new URLSearchParams();
  // ...
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/accounting/trial-balance/export/pdf${query ? `?${query}` : ''}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
        'Content-Type': 'application/json',
      },
    }
  );

// NEW CODE:
async exportToPDF(filters: TrialBalanceFilters): Promise<Blob> {
  const params = new URLSearchParams();
  if (filters.as_of_date) params.append('as_of_date', filters.as_of_date);
  if (filters.fiscal_period_id) params.append('fiscal_period_id', filters.fiscal_period_id);
  if (filters.show_zero_balances !== undefined) {
    params.append('show_zero_balances', String(filters.show_zero_balances));
  }
  if (filters.account_type) params.append('account_type', filters.account_type);

  const query = params.toString();
  const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/accounting/trial-balance/export/pdf${query ? `?${query}` : ''}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${apiClient.getAccessToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to export PDF: ${response.statusText}`);
  }

  return response.blob();
}
```

### Also Replace Lines 102-128 (exportToExcel) with same pattern.

---

## Fix 3: Financial Statements - Negative Number Formatting (MEDIUM)

**File:** `frontend/components/financial-statement-viewer.tsx`

### Replace Lines 128-136:

```typescript
// OLD CODE:
const formatCurrency = (amount: number) => {
  const currency = statement?.currency || 'QAR';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

// NEW CODE:
const formatCurrency = (amount: number) => {
  const currency = statement?.currency || 'QAR';

  // Handle negative values with parentheses (accounting standard)
  if (amount < 0) {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `(${formatter.format(Math.abs(amount))})`;
  }

  // Positive values
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};
```

---

## Fix 4: Statement Filters - Date Validation (MEDIUM)

**File:** `frontend/components/statement-filters-panel.tsx`

### Replace Lines 48-55:

```typescript
// OLD CODE:
const handleEndDateChange = (dateString: string) => {
  if (dateString) {
    onChange({
      ...filters,
      period_end: new Date(dateString).toISOString(),
    });
  }
};

// NEW CODE:
const handleEndDateChange = (dateString: string) => {
  if (dateString) {
    const newEndDate = new Date(dateString);
    const startDate = new Date(filters.period_start);

    // Validate: end date must be >= start date
    if (newEndDate < startDate) {
      toast.error('End date must be on or after start date');
      return;
    }

    onChange({
      ...filters,
      period_end: newEndDate.toISOString(),
    });
  }
};
```

### Also Add Import:

```typescript
// Add at top of file:
import { toast } from 'sonner';
```

---

## Fix 5: General Ledger - Balance Display with DR/CR Indicator (MEDIUM)

**File:** `frontend/app/[locale]/(app)/accounting/general-ledger/page.tsx`

### Replace Lines 387-390:

```tsx
// OLD CODE:
<div className="text-sm font-semibold">
  {t('table.balance')}: {formatCurrency(group.entries[group.entries.length - 1]?.balance || 0)}
</div>

// NEW CODE:
<div className="flex items-center gap-2">
  <span className="text-sm text-muted-foreground">{t('table.balance')}:</span>
  <span className="text-sm font-semibold">
    {formatCurrency(group.entries[group.entries.length - 1]?.balance || 0)}
  </span>
  <Badge variant="outline" className="text-xs">
    {group.accountType === 'asset' || group.accountType === 'expense' ? 'DR' : 'CR'}
  </Badge>
</div>
```

---

## Fix 6: Trial Balance - Colorblind-Friendly Balance Status (HIGH)

**File:** `frontend/app/[locale]/(app)/accounting/trial-balance/page.tsx`

### Replace Lines 282-332:

```tsx
// OLD CODE:
{data && data.summary && (
  <Card
    className={cn(
      'border-2',
      data.summary.is_balanced
        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
        : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
    )}
  >
    <CardContent className="py-6">
      <div className="flex items-center gap-4">
        {data.summary.is_balanced ? (
          <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
        ) : (
          <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
        )}
        <div className="flex-1">
          <h3
            className={cn(
              'text-lg font-semibold',
              data.summary.is_balanced
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            )}
          >
            {data.summary.is_balanced ? t('balanced') : t('notBalanced')}
          </h3>
          {!data.summary.is_balanced && (
            <p
              className={cn(
                'text-sm',
                data.summary.is_balanced
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              )}
            >
              {t('difference')}: {formatCurrency(Math.abs(data.summary.difference))}
            </p>
          )}
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('table.totalDebit')}: {formatCurrency(data.summary.total_debit)}
          </div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            {t('table.totalCredit')}: {formatCurrency(data.summary.total_credit)}
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)}

// NEW CODE (Improved with icon + text + pattern):
{data && data.summary && (
  <Card
    className={cn(
      'border-2',
      data.summary.is_balanced
        ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
        : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800',
      // Add pattern for colorblind users (optional CSS pattern)
      data.summary.is_balanced
        ? 'bg-[linear-gradient(45deg,rgba(34,197,94,0.05)_25%,transparent_25%,transparent_50%,rgba(34,197,94,0.05)_50%,rgba(34,197,94,0.05)_75%,transparent_75%,transparent)] bg-[length:20px_20px]'
        : 'bg-[linear-gradient(45deg,rgba(239,68,68,0.05)_25%,transparent_25%,transparent_50%,rgba(239,68,68,0.05)_50%,rgba(239,68,68,0.05)_75%,transparent_75%,transparent)] bg-[length:20px_20px]'
    )}
  >
    <CardContent className="py-6">
      <div className="flex items-center gap-4">
        {/* Icon + text for accessibility */}
        <div className="flex items-center gap-2">
          {data.summary.is_balanced ? (
            <>
              <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" aria-hidden="true" />
              <span className="sr-only">Balanced</span>
            </>
          ) : (
            <>
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" aria-hidden="true" />
              <span className="sr-only">Not Balanced</span>
            </>
          )}
        </div>

        <div className="flex-1">
          <h3
            className={cn(
              'text-lg font-semibold',
              data.summary.is_balanced
                ? 'text-green-900 dark:text-green-100'
                : 'text-red-900 dark:text-red-100'
            )}
          >
            {data.summary.is_balanced ? t('balanced') : t('notBalanced')}
          </h3>
          {!data.summary.is_balanced && (
            <p
              className={cn(
                'text-sm font-medium',
                data.summary.is_balanced
                  ? 'text-green-700 dark:text-green-300'
                  : 'text-red-700 dark:text-red-300'
              )}
            >
              Difference: <strong>{formatCurrency(Math.abs(data.summary.difference))}</strong>
            </p>
          )}
        </div>

        <div className="text-right">
          <div className="text-sm">
            <span className="font-medium">Total Debit:</span>{' '}
            <span className={cn(
              'font-semibold',
              data.summary.is_balanced
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            )}>
              {formatCurrency(data.summary.total_debit)}
            </span>
          </div>
          <div className="text-sm mt-1">
            <span className="font-medium">Total Credit:</span>{' '}
            <span className={cn(
              'font-semibold',
              data.summary.is_balanced
                ? 'text-green-700 dark:text-green-300'
                : 'text-red-700 dark:text-red-300'
            )}>
              {formatCurrency(data.summary.total_credit)}
            </span>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

---

## Fix 7: Add ARIA Labels for Accessibility (MEDIUM)

**File:** `frontend/app/[locale]/(app)/accounting/general-ledger/page.tsx`

### Update Export Buttons (Lines 215-232):

```tsx
// OLD CODE:
<Button
  variant="outline"
  size="sm"
  onClick={handleExportPDF}
  disabled={exporting || loading || data.length === 0}
>
  <Download className="mr-2 h-4 w-4" />
  PDF
</Button>

// NEW CODE:
<Button
  variant="outline"
  size="sm"
  onClick={handleExportPDF}
  disabled={exporting || loading || data.length === 0}
  aria-label="Export General Ledger to PDF"
>
  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
  PDF
</Button>

<Button
  variant="outline"
  size="sm"
  onClick={handleExportExcel}
  disabled={exporting || loading || data.length === 0}
  aria-label="Export General Ledger to Excel"
>
  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
  Excel
</Button>

<Button
  size="sm"
  onClick={fetchData}
  disabled={loading}
  aria-label={loading ? 'Loading data...' : 'Refresh data'}
>
  <RefreshCw
    className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
    aria-hidden="true"
  />
  {t('refresh')}
</Button>
```

---

## Fix 8: Add Table Captions for Accessibility (LOW)

**File:** All report pages

### General Ledger (After line 393):

```tsx
<div className="overflow-x-auto rounded-lg border">
  <Table>
    <caption className="sr-only">
      General ledger entries for account {group.accountCode} - {group.accountName}
      Showing {group.entries.length} transactions with debit, credit, and running balance
    </caption>
    <TableHeader>
      {/* ... */}
    </TableHeader>
  </Table>
</div>
```

### Trial Balance (After line 347):

```tsx
<div className="overflow-x-auto">
  <Table>
    <caption className="sr-only">
      Trial Balance as of {new Date(data.as_of_date).toLocaleDateString()}
      Total Debit: {formatCurrency(data.summary.total_debit)},
      Total Credit: {formatCurrency(data.summary.total_credit)}
      {data.summary.is_balanced ? ' - Balanced' : ' - Not Balanced'}
    </caption>
    <TableHeader>
      {/* ... */}
    </TableHeader>
  </Table>
</div>
```

### Financial Statements (After line 241):

```tsx
<Table>
  <caption className="sr-only">
    {title} for period ending {formatDate(statement.period_end)}
    {filters.compare_prior && ` compared to prior period ending ${formatDate(statement.prior_period_end || '')}`}
    {filters.show_variance && ' with variance analysis'}
  </caption>
  <TableHeader>
    {/* ... */}
  </TableHeader>
</Table>
```

---

## Fix 9: Create Shared Formatting Utilities (LOW)

**New File:** `frontend/lib/utils/format.ts`

```typescript
/**
 * Shared formatting utilities for accounting reports
 */

/**
 * Format currency with proper negative value handling (parentheses)
 * Follows accounting standards: negative values shown as (123.45)
 */
export const formatCurrency = (
  amount: number,
  currency: string = 'QAR',
  locale: string = 'en-QA'
): string => {
  // Handle negative values with parentheses (accounting standard)
  if (amount < 0) {
    const formatter = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `(${formatter.format(Math.abs(amount))})`;
  }

  // Positive values
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format date for display
 */
export const formatDate = (
  date: string | Date,
  locale: string = 'en',
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  return new Date(date).toLocaleDateString(locale, options);
};

/**
 * Format date range
 */
export const formatDateRange = (
  startDate: string | Date,
  endDate: string | Date,
  locale: string = 'en'
): string => {
  return `${formatDate(startDate, locale)} - ${formatDate(endDate, locale)}`;
};

/**
 * Format percentage with sign
 */
export const formatPercentage = (
  value: number,
  decimals: number = 1
): string => {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
};

/**
 * Get color class for variance (positive = green, negative = red)
 */
export const getVarianceColor = (value: number): string => {
  if (value > 0) return 'text-green-600 dark:text-green-400';
  if (value < 0) return 'text-red-600 dark:text-red-400';
  return 'text-zinc-600 dark:text-zinc-400';
};

/**
 * Validate date range (end >= start)
 */
export const validateDateRange = (
  startDate: string | Date,
  endDate: string | Date
): { valid: boolean; error?: string } => {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (end < start) {
    return {
      valid: false,
      error: 'End date must be on or after start date',
    };
  }

  return { valid: true };
};
```

### Usage Example:

```typescript
// In any component:
import { formatCurrency, formatDate, getVarianceColor } from '@/lib/utils/format';

// Replace existing formatCurrency function with:
const formattedAmount = formatCurrency(entry.debit, statement?.currency, locale);

const varianceColor = getVarianceColor(item.variance?.amount || 0);
```

---

## Fix 10: Add Print Styles for Financial Statements (LOW)

**New File:** `frontend/app/[locale]/(app)/accounting/financial-statements/print.css`

```css
@media print {
  /* Hide navigation and filters */
  nav,
  .filters-panel,
  button,
  .no-print {
    display: none !important;
  }

  /* Ensure tables fit on page */
  table {
    width: 100%;
    page-break-inside: avoid;
  }

  tr {
    page-break-inside: avoid;
  }

  /* Add page break before each statement */
  .statement-card {
    page-break-before: always;
  }

  /* Remove backgrounds for printing */
  .bg-zinc-50,
  .bg-zinc-100 {
    background: none !important;
    border-bottom: 2px solid #000;
  }

  /* Ensure text is readable */
  body {
    font-size: 10pt;
    color: #000;
  }

  /* Add print-specific header */
  @page {
    margin: 1cm;
    size: landscape;
  }

  /* Table borders */
  td, th {
    border: 1px solid #ddd;
  }
}
```

### Import in Page Component:

```tsx
// Add to financial-statements/page.tsx:
import './print.css';
```

---

## Testing Checklist

After applying fixes, test the following:

### Functional Testing:
- [ ] Fiscal period selector loads and filters correctly
- [ ] Export buttons work with proper auth
- [ ] Negative numbers show with parentheses
- [ ] Date validation prevents invalid ranges
- [ ] DR/CR indicators show correctly
- [ ] Balance status shows with icon + text

### Accessibility Testing:
- [ ] Run axe DevTools extension
- [ ] Test with screen reader (NVDA/JAWS)
- [ ] Test keyboard navigation (Tab through all controls)
- [ ] Verify focus indicators visible
- [ ] Check color contrast ratios

### Visual Testing:
- [ ] Test in light mode
- [ ] Test in dark mode
- [ ] Test at different viewport sizes (320px, 768px, 1024px, 1920px)
- [ ] Test with colorblind simulator
- [ ] Print preview looks correct

### Browser Testing:
- [ ] Chrome/Edge (Chromium)
- [ ] Firefox
- [ ] Safari (if available)

---

## Implementation Order

1. **Fix 2 (API Security)** - Do first (security)
2. **Fix 1 (Fiscal Periods)** - Second (critical UX)
3. **Fix 6 (Colorblind Status)** - Third (accessibility)
4. **Fix 4 (Date Validation)** - Fourth (UX)
5. **Fix 3 (Negative Numbers)** - Fifth (accounting standard)
6. **Fix 5 (DR/CR Indicator)** - Sixth (UX)
7. **Fix 7 (ARIA Labels)** - Seventh (accessibility)
8. **Fix 8 (Table Captions)** - Eighth (accessibility)
9. **Fix 9 (Shared Utils)** - Ninth (refactoring)
10. **Fix 10 (Print Styles)** - Tenth (enhancement)

---

**Estimated Total Time:** 8-12 hours
**Priority:** Complete Fixes 1-6 before production deployment
**Recommended Review:** Re-run audit after fixes 1-6 are complete
