# UI/UX Audit Developer Action Plan
## Al-Muhasib Accounting SaaS - Technical Implementation Guide

**Date:** January 17, 2026
**Auditor:** UI/UX Audit Coordinator
**Version:** 1.0
**Target Audience:** Frontend Developers, Full-stack Developers

---

## Quick Reference

**Total Issues:** 40+
**Critical (P0):** 5 issues
**High (P1):** 7 issues
**Medium (P2):** 18 issues
**Low (P3):** 10 issues

**Total Effort:** ~300 hours
**Timeline:** 8 weeks
**Team Size:** 1-2 developers

---

## Phase 1: Critical Fixes (Week 1-2)

### Issue #1: Data Handling Inconsistency ⚡ CRITICAL

**File:** `frontend/app/[locale]/(app)/sales/quotations/page.tsx:230-266`

**Problem:**
Frontend uses camelCase but backend expects snake_case, causing data loss.

**Solution:**

```typescript
// ❌ BEFORE (BROKEN)
await quotationsApi.create({
  customerId: data.customerId,  // Wrong!
  date: data.date.toISOString(),
  lineItems: data.items,  // Wrong!
});

// ✅ AFTER (FIXED)
await quotationsApi.create({
  customer_id: data.customerId,  // Correct snake_case
  date: data.date.toISOString(),
  valid_until: data.validUntil.toISOString(),
  items: data.items.map(item => ({
    description: item.description,
    description_ar: item.descriptionAr,  // snake_case
    description_en: item.descriptionEn,  // snake_case
    quantity: item.quantity,
    unit_price: item.unitPrice,  // snake_case
    discount: item.discount,
    tax_rate: item.taxRate,  // snake_case
  })),
  notes: data.notes,
});
```

**Files to Update:**
1. `frontend/lib/api/quotations.ts` - API client
2. `frontend/app/[locale]/(app)/sales/quotations/page.tsx` - Form submission
3. `frontend/lib/api/invoices.ts` - Invoice API
4. `frontend/lib/api/payments.ts` - Payment API
5. All API clients in `frontend/lib/api/`

**Testing:**
```bash
# Test quotation creation
npm run test -- quotations.test.ts

# Manual test
1. Create quotation with English description
2. Create quotation with Arabic description
3. Create quotation with both
4. Verify in database (SELECT * FROM quotations ORDER BY id DESC LIMIT 1)
5. Verify display in UI
```

**Time Estimate:** 12 hours

---

### Issue #2: Payment Allocation Race Condition ⚡ CRITICAL

**File:** `frontend/app/[locale]/(app)/sales/payments/page.tsx:122-143`

**Problem:**
Fetches ALL invoices then filters client-side, causing race conditions and performance issues.

**Solution:**

**Frontend Change:**
```typescript
// ❌ BEFORE (BROKEN)
const fetchAvailableInvoices = async (partyType: string, partyId: string) => {
  const filters: any = { partyType, status: 'posted' };
  const data = await invoicesApi.getAll(filters);  // Fetches ALL invoices!
  return data.filter(
    (inv) => inv.party_id === partyId && inv.outstanding_amount > 0
  );
};

// ✅ AFTER (FIXED)
const fetchAvailableInvoices = async (partyType: string, partyId: string) => {
  const data = await invoicesApi.getAvailableForPayment({
    party_type: partyType,
    party_id: partyId,
    status: 'posted',
  });
  return data;
}
```

**Backend Change Required:**
```typescript
// backend/src/modules/payments/payments.controller.ts
@Get('available-for-payment')
async getAvailableForPayment(
  @Query('party_type') partyType: string,
  @Query('party_id') partyId: string,
  @Query('status') status: string,
) {
  // Database filters by party_id - MUCH FASTER
  return this.paymentsService.getAvailableInvoices({
    partyType,
    partyId,
    status,
  });
}
```

**Service Implementation:**
```typescript
// backend/src/modules/payments/payments.service.ts
async getAvailableInvoices(filters: {
  partyType: string;
  partyId: string;
  status: string;
}) {
  return this.invoiceRepository.find({
    where: {
      party_id: filters.partyId,  // Database-level filter
      status: filters.status,
      outstanding_amount: MoreThan(0),
    },
    order: { invoice_date: 'ASC' },
  });
}
```

**Time Estimate:** 8 hours (4h frontend + 4h backend)

---

### Issue #3: No Allocation Validation ⚡ CRITICAL

**File:** `frontend/app/[locale]/(app)/sales/payments/page.tsx:359-384`

**Problem:**
Users can allocate more than payment amount or invoice outstanding amount.

**Solution:**

```typescript
// ✅ CREATE NEW UTILITY FILE
// frontend/lib/utils/payment-allocation.ts

interface Allocation {
  invoiceId: string;
  amount: number;
}

export function validateAllocation(
  allocations: Allocation[],
  paymentAmount: number,
  invoiceOutstanding: Map<string, number>
): { valid: boolean; error?: string } {
  // Check 1: Total allocation cannot exceed payment amount
  const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
  if (totalAllocated > paymentAmount) {
    return {
      valid: false,
      error: `Total allocation (${formatCurrency(totalAllocated)}) exceeds payment amount (${formatCurrency(paymentAmount)})`
    };
  }

  // Check 2: Each allocation cannot exceed invoice outstanding
  for (const allocation of allocations) {
    const outstanding = invoiceOutstanding.get(allocation.invoiceId) || 0;
    if (allocation.amount > outstanding) {
      return {
        valid: false,
        error: `Allocation (${formatCurrency(allocation.amount)}) exceeds invoice outstanding (${formatCurrency(outstanding)})`
      };
    }
  }

  // Check 3: No negative amounts
  if (allocations.some(a => a.amount <= 0)) {
    return {
      valid: false,
      error: 'Allocation amounts must be greater than zero'
    };
  }

  // Check 4: No duplicate invoices
  const invoiceIds = allocations.map(a => a.invoiceId);
  const uniqueIds = new Set(invoiceIds);
  if (invoiceIds.length !== uniqueIds.size) {
    return {
      valid: false,
      error: 'Cannot allocate to same invoice multiple times'
    };
  }

  return { valid: true };
}

export function calculateMaxAllocation(
  invoiceId: string,
  outstandingAmount: number,
  currentAllocations: Allocation[],
  paymentAmount: number
): number {
  const currentTotal = currentAllocations.reduce((sum, a) => sum + a.amount, 0);
  const remainingToAllocate = paymentAmount - currentTotal;
  return Math.min(outstandingAmount, remainingToAllocate);
}
```

**Usage in Component:**
```typescript
import { validateAllocation, calculateMaxAllocation } from '@/lib/utils/payment-allocation';

const addAllocation = (invoiceId: string, outstandingAmount: number) => {
  const newAllocations = [...allocations, { invoiceId, amount: 0 }];
  const maxAmount = calculateMaxAllocation(
    invoiceId,
    outstandingAmount,
    allocations,
    parseFloat(formData.amount) || 0
  );

  if (maxAmount <= 0) {
    toast.error('Payment fully allocated or insufficient amount');
    return;
  }

  // Add with calculated max
  setAllocations([...allocations, {
    invoiceId,
    amount: maxAmount
  }]);
};

// Validate before submit
const handleSubmit = async () => {
  const validation = validateAllocation(
    allocations,
    parseFloat(formData.amount) || 0,
    invoiceOutstandingMap
  );

  if (!validation.valid) {
    toast.error(validation.error);
    return;
  }

  // Submit...
};
```

**Tests Required:**
```typescript
// __tests__/payment-allocation.test.ts
describe('Payment Allocation Validation', () => {
  it('should prevent over-allocation', () => {
    const result = validateAllocation(
      [{ invoiceId: '1', amount: 150 }],
      100,
      new Map([['1', 200]])
    );
    expect(result.valid).toBe(false);
    expect(result.error).toContain('exceeds payment amount');
  });

  it('should allow valid allocation', () => {
    const result = validateAllocation(
      [{ invoiceId: '1', amount: 50 }],
      100,
      new Map([['1', 200]])
    );
    expect(result.valid).toBe(true);
  });
});
```

**Time Estimate:** 8 hours

---

### Issue #4: Mobile Menu Content Jump ⚡ CRITICAL

**File:** `frontend/components/layout/sidebar.tsx:187-201`

**Problem:**
Mobile menu button creates fixed header below topbar, pushing content down.

**Solution:**

**Step 1: Remove duplicate button from sidebar.tsx**
```typescript
// ❌ DELETE THESE LINES (187-201)
{/*
<div className="lg:hidden fixed top-16 left-0 right-0 z-50 border-b bg-white dark:bg-zinc-950 p-4">
  <div className="flex items-center justify-between">
    <span className="font-semibold">Menu</span>
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    >
      {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
    </Button>
  </div>
</div>
*/}
```

**Step 2: Add button to topbar.tsx**
```typescript
// frontend/components/layout/topbar.tsx

// Add to imports
import { Menu } from 'lucide-react';
import { useMobileMenu } from '@/hooks/use-mobile-menu';

// In component
const { isMobileMenuOpen, setIsMobileMenuOpen } = useMobileMenu();

// In return JSX, add mobile menu button
<div className="flex items-center gap-2">
  {/* Mobile menu button - only visible on mobile */}
  <Button
    variant="ghost"
    size="icon"
    className="lg:hidden size-11"
    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
    aria-label="Toggle menu"
    aria-expanded={isMobileMenuOpen}
  >
    <Menu className="h-6 w-6" />
  </Button>

  {/* Rest of topbar content... */}
</div>
```

**Step 3: Create shared hook**
```typescript
// frontend/hooks/use-mobile-menu.ts
import { createContext, useContext, useState, ReactNode } from 'react';

interface MobileMenuContextType {
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
}

const MobileMenuContext = createContext<MobileMenuContextType | undefined>(undefined);

export function MobileMenuProvider({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <MobileMenuContext.Provider value={{ isMobileMenuOpen, setIsMobileMenuOpen }}>
      {children}
    </MobileMenuContext.Provider>
  );
}

export function useMobileMenu() {
  const context = useContext(MobileMenuContext);
  if (!context) {
    throw new Error('useMobileMenu must be used within MobileMenuProvider');
  }
  return context;
}
```

**Step 4: Wrap app in provider**
```typescript
// frontend/app/[locale]/(app)/layout.tsx

import { MobileMenuProvider } from '@/hooks/use-mobile-menu';

export default function Layout({ children, params }) {
  return (
    <MobileMenuProvider>
      <AuthenticatedLayout>
        {children}
      </AuthenticatedLayout>
    </MobileMenuProvider>
  );
}
```

**Time Estimate:** 4 hours

---

### Issue #5: Mobile Tables Unusable ⚡ CRITICAL

**Files:** All table components (Dashboard, Customers, Invoices, etc.)

**Problem:**
Tables with 4-8 columns force horizontal scrolling on mobile.

**Solution:**

**Step 1: Create reusable mobile card component**
```typescript
// frontend/components/ui/mobile-card-table.tsx

import { Card } from './card';
import { Button } from './button';
import { Edit, Trash2, Mail, Phone } from 'lucide-react';

interface MobileCardTableProps<T> {
  data: T[];
  getTitle: (item: T) => string;
  getSubtitle?: (item: T) => string;
  getFields: (item: T) => Array<{
    label: string;
    value: string;
    href?: string;
  }>;
  getActions?: (item: T) => Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }>;
}

export function MobileCardTable<T>({
  data,
  getTitle,
  getSubtitle,
  getFields,
  getActions
}: MobileCardTableProps<T>) {
  return (
    <div className="sm:hidden space-y-4">
      {data.map((item, index) => (
        <Card key={index} className="p-4">
          {/* Title and subtitle */}
          <div className="mb-3">
            <div className="font-semibold text-base">{getTitle(item)}</div>
            {getSubtitle && (
              <div className="text-sm text-zinc-500">{getSubtitle(item)}</div>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-2 text-sm mb-4">
            {getFields(item).map((field, fieldIndex) => {
              const Icon = field.href?.startsWith('tel:') ? Phone :
                         field.href?.startsWith('mailto:') ? Mail :
                         null;

              return (
                <div key={fieldIndex} className="flex items-center gap-2">
                  {Icon && <Icon className="h-4 w-4 text-zinc-400" />}
                  {field.href ? (
                    <a href={field.href} className="text-blue-600">
                      {field.value}
                    </a>
                  ) : (
                    <span className="text-zinc-600">{field.label}:</span>
                  )}
                  {!field.href && <span>{field.value}</span>}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          {getActions && (
            <div className="flex gap-2 pt-4 border-t">
              {getActions(item).map((action, actionIndex) => (
                <Button
                  key={actionIndex}
                  variant={action.variant === 'destructive' ? 'ghost' : 'outline'}
                  size="sm"
                  className="flex-1"
                  onClick={action.onClick}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
```

**Step 2: Use in customers page**
```typescript
// frontend/app/[locale]/(app)/sales/customers/page.tsx

import { MobileCardTable } from '@/components/ui/mobile-card-table';
import { Edit, Trash2 } from 'lucide-react';

// In component return
<>
  {/* Mobile card layout */}
  <MobileCardTable
    data={filteredCustomers}
    getTitle={(customer) => customer.name_en}
    getSubtitle={(customer) => customer.code}
    getFields={(customer) => [
      customer.email && {
        label: 'Email',
        value: customer.email,
        href: `mailto:${customer.email}`
      },
      customer.phone && {
        label: 'Phone',
        value: customer.phone,
        href: `tel:${customer.phone}`
      },
      {
        label: 'Credit Limit',
        value: customer.credit_limit
          ? `QAR ${customer.credit_limit.toLocaleString()}`
          : '-'
      },
      {
        label: 'Payment Terms',
        value: customer.payment_terms_days
          ? `${customer.payment_terms_days} days`
          : '-'
      }
    ].filter(Boolean)}
    getActions={(customer) => [
      {
        label: 'Edit',
        onClick: () => handleEdit(customer)
      },
      {
        label: 'Delete',
        onClick: () => handleDelete(customer),
        variant: 'destructive'
      }
    ]}
  />

  {/* Desktop table layout */}
  <div className="hidden sm:block">
    <Table>...</Table>
  </div>
</>
```

**Step 3: Apply to all table pages**
- Dashboard tables
- Customers table
- Invoices table
- Quotations table
- Payments table
- Vendors table

**Time Estimate:** 24 hours (4h per page × 6 pages)

---

## Phase 2: High Priority Issues (Week 3-4)

### Issue #6: No Code Splitting ⚡ HIGH

**Problem:**
All code loaded eagerly - 800KB-1MB initial bundle.

**Solution:**

```typescript
// ✅ DYNAMIC IMPORTS FOR HEAVY COMPONENTS

// Dashboard page - lazy load recharts
const BarChart = dynamic(
  () => import('recharts').then(m => m.BarChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);

// Financial statement viewer
const FinancialStatementViewer = dynamic(
  () => import('@/components/financial-statement-viewer'),
  {
    loading: () => <Skeleton className="h-96 w-full" />,
    ssr: false
  }
);

// Command palette
const CommandPalette = dynamic(
  () => import('@/components/layout/command-palette'),
  { ssr: false }
);
```

**Bundle analyzer setup:**
```bash
npm install --save-dev @next/bundle-analyzer
```

```typescript
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(nextConfig);
```

**Time Estimate:** 16 hours

---

### Issue #7: Missing Error Boundaries ⚡ HIGH

**Solution:**

```typescript
// frontend/components/error-boundary.tsx
'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);

    // Send to error tracking (Sentry, LogRocket, etc.)
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } }
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex items-center justify-center min-h-screen bg-zinc-50 p-4">
          <Card className="max-w-md w-full p-8 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
            <p className="text-zinc-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <p className="text-sm text-zinc-500 mb-6">
              The error has been logged. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Reload Page
            </Button>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ✅ USAGE IN LAYOUT
// frontend/app/[locale]/(app)/layout.tsx
import { ErrorBoundary } from '@/components/error-boundary';

export default function Layout({ children }) {
  return (
    <ErrorBoundary>
      {children}
    </ErrorBoundary>
  );
}
```

**Time Estimate:** 8 hours

---

### Issue #10: Touch Targets Too Small ⚡ HIGH

**Problem:**
Most touch targets are 36px, below 44px WCAG AAA requirement.

**Solution:**

```typescript
// frontend/components/ui/button.tsx

// ✅ UPDATE BUTTON SIZE VARIANTS
const buttonVariants = cva(
  base,
  {
    variants: {
      size: {
        default: "h-10 px-4 py-2",  // 40px height
        sm: "h-9 rounded-md px-3",  // 36px height
        lg: "h-11 rounded-md px-8", // 44px height - ADD THIS
        icon: "h-10 w-10",         // 40px - UPDATE FROM h-9
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

// ✅ EXPORT CUSTOM SIZE FOR MOBILE
export function Button({ className, size, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        buttonVariants({ size }),
        // Mobile-specific: ensure 44px minimum
        "min-h-[44px] sm:min-h-0",  // ADD THIS
        className
      )}
      {...props}
    />
  );
}
```

**Navigation items:**
```typescript
// frontend/components/layout/sidebar.tsx

<button
  className={cn(
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium min-h-[44px] sm:min-h-0",  // ADD min-h-[44px]
    isActive
      ? 'bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
      : 'text-zinc-600 hover:bg-zinc-100'
  )}
>
```

**Time Estimate:** 8 hours

---

## Testing Strategy

### Automated Tests

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest-environment-jsdom

# Run tests
npm run test
npm run test:watch
npm run test:coverage
```

### Unit Tests Example

```typescript
// __tests__/payment-allocation.test.ts
import { validateAllocation, calculateMaxAllocation } from '@/lib/utils/payment-allocation';

describe('Payment Allocation', () => {
  describe('validateAllocation', () => {
    it('should reject allocation exceeding payment amount', () => {
      const result = validateAllocation(
        [{ invoiceId: '1', amount: 150 }],
        100,
        new Map([['1', 200]])
      );
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject negative amounts', () => {
      const result = validateAllocation(
        [{ invoiceId: '1', amount: -10 }],
        100,
        new Map([['1', 200]])
      );
      expect(result.valid).toBe(false);
    });

    it('should reject duplicate invoice allocations', () => {
      const result = validateAllocation(
        [
          { invoiceId: '1', amount: 50 },
          { invoiceId: '1', amount: 30 }
        ],
        100,
        new Map([['1', 200]])
      );
      expect(result.valid).toBe(false);
    });

    it('should accept valid allocation', () => {
      const result = validateAllocation(
        [{ invoiceId: '1', amount: 50 }],
        100,
        new Map([['1', 200]])
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('calculateMaxAllocation', () => {
    it('should calculate correct max amount', () => {
      const max = calculateMaxAllocation(
        'inv-1',
        200,
        [],
        100
      );
      expect(max).toBe(100); // Payment amount is limiting
    });

    it('should consider invoice outstanding', () => {
      const max = calculateMaxAllocation(
        'inv-1',
        50,
        [],
        100
      );
      expect(max).toBe(50); // Invoice outstanding is limiting
    });
  });
});
```

### E2E Tests Example

```typescript
// e2e/quotations.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Quotations', () => {
  test('should create quotation with validation', async ({ page }) => {
    await page.goto('/sales/quotations');

    // Click new quotation
    await page.click('button:has-text("New Quotation")');

    // Fill form
    await page.fill('[name="customerId"]', '1');
    await page.fill('[name="date"]', '2026-01-17');

    // Add line item
    await page.click('button:has-text("Add Line")');
    await page.fill('[name="items.0.description"]', 'Test Item');
    await page.fill('[name="items.0.quantity"]', '10');
    await page.fill('[name="items.0.unitPrice"]', '100');

    // Submit
    await page.click('button:has-text("Save")');

    // Verify
    await expect(page).toHaveURL(/\/sales\/quotations$/);
    await expect(page.locator('text=Quotation created')).toBeVisible();
  });

  test('should prevent data loss with snake_case', async ({ page }) => {
    await page.goto('/sales/quotations/new');

    // Fill with Arabic description
    await page.fill('[name="customerId"]', '1');
    await page.fill('[name="items.0.descriptionAr"]', 'فاتورة تجريبية');

    // Submit
    await page.click('button:has-text("Save")');

    // Navigate to detail
    await page.click('text=فاتورة تجريبية');

    // Verify Arabic text persisted
    await expect(page.locator('text=فاتورة تجريبية')).toBeVisible();
  });
});
```

---

## Performance Optimization Checklist

- [ ] Implement dynamic imports for recharts
- [ ] Implement dynamic imports for heavy components
- [ ] Add bundle analyzer to CI/CD
- [ ] Implement image optimization with next/image
- [ ] Add React Query for data caching
- [ ] Implement virtual scrolling for large lists
- [ ] Add service worker for caching
- [ ] Optimize font loading
- [ ] Enable compression middleware
- [ ] Add prefetching for likely routes

---

## Code Review Checklist

### Before Pull Request

- [ ] Code follows TypeScript best practices
- [ ] All props are properly typed
- [ ] Error handling implemented
- [ ] Loading states added
- [ ] Mobile responsiveness tested
- [ ] Accessibility attributes added
- [ ] Unit tests written (>80% coverage)
- [ ] E2E tests for critical paths
- [ ] No console errors or warnings
- [ ] Performance impact assessed

### For Each Issue Fix

- [ ] Root cause addressed (not just symptoms)
- [ ] Edge cases handled
- [ ] Backward compatibility maintained
- [ ] Database migrations tested
- [ ] API contracts validated
- [ ] Frontend-backend data flow verified
- [ ] User acceptance criteria met
- [ ] Documentation updated

---

## Common Patterns

### API Call Pattern

```typescript
// ✅ CORRECT PATTERN
import { useQuery } from '@tanstack/react-query';

export function useInvoices(filters: InvoiceFilters) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: () => invoicesApi.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// ✅ USAGE IN COMPONENT
function InvoicesPage() {
  const { data: invoices, isLoading, error } = useInvoices({
    status: 'posted'
  });

  if (isLoading) return <LoadingSkeleton />;
  if (error) return <ErrorState error={error} />;

  return <InvoiceTable invoices={invoices} />;
}
```

### Form Validation Pattern

```typescript
// ✅ CORRECT PATTERN
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

const quotationSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  date: z.date(),
  items: z.array(z.object({
    description: z.string().min(1, 'Description required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Price must be positive'),
  })).min(1, 'At least one item required'),
});

function QuotationForm() {
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(quotationSchema),
  });

  const onSubmit = async (data) => {
    try {
      await quotationsApi.create(data);
      toast.success('Quotation created');
    } catch (error) {
      toast.error('Failed to create quotation');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Form fields with error handling */}
    </form>
  );
}
```

---

## Debugging Tips

### Common Issues

**1. Data not persisting:**
```typescript
// Check network tab in DevTools
// Verify API request payload
// Check backend logs
// Verify database schema

console.log('Submitting:', data);  // Debug payload
await api.create(data);
console.log('Success');  // Confirm success
```

**2. Mobile layout broken:**
```typescript
// Use Chrome DevTools device emulation
// Test on actual devices
// Check viewport meta tag
// Verify Tailwind breakpoints

<meta name="viewport" content="width=device-width, initial-scale=1" />
```

**3. Performance issues:**
```bash
# Run bundle analyzer
ANALYZE=true npm run build

# Check network waterfall
# Look for large chunks
# Verify lazy loading working
```

---

## Resources

### Documentation
- Next.js: https://nextjs.org/docs
- React: https://react.dev
- TypeScript: https://www.typescriptlang.org/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com

### Tools
- Bundle Analyzer: `@next/bundle-analyzer`
- Testing: Vitest, Playwright
- Linting: ESLint, Prettier
- Type Checking: `tsc --noEmit`

### Standards
- WCAG 2.1: https://www.w3.org/WAI/WCAG21/quickref/
- Mobile UX: Apple HIG, Material Design
- Performance: Web Vitals

---

## Next Steps

1. **Read the full comprehensive report:** `COMPREHENSIVE_UI_UX_AUDIT_REPORT.md`
2. **Review executive summary:** `AUDIT_EXECUTIVE_SUMMARY.md`
3. **Set up development environment**
4. **Start with P0 critical issues**
5. **Create pull requests for review**
6. **Track progress in project management tool**

---

**Document Version:** 1.0
**Last Updated:** January 17, 2026
**Maintained By:** UI/UX Audit Coordinator
**Questions:** Refer to individual audit reports for detailed technical guidance
