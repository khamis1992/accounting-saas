# Lazy Loading Implementation Guide
## Frontend Performance Optimization - Code Splitting Strategy

**Date:** January 17, 2026
**Author:** Performance Engineering Team
**Version:** 1.0

---

## Executive Summary

This guide provides comprehensive implementation patterns for lazy loading in the Accounting SaaS frontend. Lazy loading is critical for reducing initial bundle size and improving Time to Interactive (TTI).

### Expected Impact

| Area | Before | After | Improvement |
|------|--------|-------|-------------|
| Initial Bundle Size | 800KB | 320KB | -60% |
| Time to Interactive | 4.5s | 1.8s | -60% |
| First Contentful Paint | 1.8s | 0.9s | -50% |

---

## 1. Next.js Dynamic Import Patterns

### 1.1 Basic Dynamic Import

The simplest form of lazy loading for components:

```typescript
// BEFORE - Eager loading
import { ChartComponent } from '@/components/charts/chart-component';

// AFTER - Lazy loading
import dynamic from 'next/dynamic';

const ChartComponent = dynamic(() => import('@/components/charts/chart-component'));
```

### 1.2 With Custom Loading Component

```typescript
import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/loading/chart-skeleton';

const ChartComponent = dynamic(() => import('@/components/charts/chart-component'), {
  loading: () => <ChartSkeleton />,
});
```

### 1.3 With SSR Disabled

For client-only components (like charts):

```typescript
import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/loading/chart-skeleton';

const ChartComponent = dynamic(() => import('@/components/charts/chart-component'), {
  loading: () => <ChartSkeleton />,
  ssr: false, // Don't render on server, load only on client
});
```

### 1.4 Named Exports

When importing a component with named exports:

```typescript
// BEFORE
import { BarChart } from 'recharts';

// AFTER - Method 1: Default export wrapper
const BarChart = dynamic(() =>
  import('recharts').then(mod => ({ default: mod.BarChart })),
  { ssr: false }
);

// AFTER - Method 2: Direct named import
const BarChart = dynamic(
  () => import('recharts').then(recharts => recharts.BarChart),
  { ssr: false }
);
```

---

## 2. Component Lazy Loading

### 2.1 Heavy Chart Components

```typescript
// app/[locale]/(app)/dashboard/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { ChartSkeleton } from '@/components/loading/chart-skeleton';

// Lazy load recharts (200KB savings)
const DashboardChart = dynamic(
  () => import('@/components/charts/dashboard-chart').then(mod => ({ default: mod.DashboardChart })),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export default function DashboardPage() {
  // ... other code

  return (
    <div className="space-y-6">
      {/* Other content */}

      <Card>
        <CardHeader>
          <CardTitle>Revenue Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<ChartSkeleton />}>
            {chartData.length > 0 && (
              <DashboardChart
                data={chartData}
                formatCurrency={formatCurrency}
                revenueLabel={t('totalRevenue')}
                expensesLabel={t('totalExpenses')}
              />
            )}
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
```

### 2.2 Command Palette (On-Demand)

The command palette should only load when triggered:

```typescript
// components/layout/command-palette-wrapper.tsx
'use client';

import { lazy, Suspense, useEffect, useState } from 'react';
import { CommandPaletteSkeleton } from '@/components/loading/command-palette-skeleton';

const CommandPalette = lazy(() =>
  import('./command-palette').then(mod => ({ default: mod.CommandPalette }))
);

interface CommandPaletteWrapperProps {
  triggerKey?: string;
}

export function CommandPaletteWrapper({ triggerKey = 'k' }: CommandPaletteWrapperProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key === triggerKey) {
        e.preventDefault();
        setIsOpen(true);
        setIsLoaded(true);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [triggerKey]);

  // Only render when opened
  if (!isLoaded) return null;

  return (
    <Suspense fallback={<CommandPaletteSkeleton />}>
      <CommandPalette open={isOpen} onOpenChange={setIsOpen} />
    </Suspense>
  );
}
```

### 2.3 Financial Statement Viewer

```typescript
// components/reports/financial-statement-loader.tsx
'use client';

import dynamic from 'next/dynamic';
import { StatementSkeleton } from '@/components/loading/statement-skeleton';

const FinancialStatementViewer = dynamic(
  () => import('./financial-statement-viewer').then(mod => ({ default: mod.FinancialStatementViewer })),
  {
    loading: () => <StatementSkeleton />,
  }
);

export { FinancialStatementViewer };
```

### 2.4 Export Functionality

```typescript
// Lazy load export functionality
const ExportToPDF = dynamic(
  () => import('@/components/export/pdf-exporter').then(mod => ({ default: mod.ExportToPDF })),
  {
    loading: () => <Button disabled><Loader className="animate-spin" /></Button>
  }
);
```

---

## 3. Route-Based Code Splitting

### 3.1 Prefetching Strategy

```typescript
// components/layout/link-with-prefetch.tsx
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface PrefetchLinkProps {
  href: string;
  children: React.ReactNode;
  prefetchOnHover?: boolean;
  delay?: number;
}

export function PrefetchLink({
  href,
  children,
  prefetchOnHover = true,
  delay = 100
}: PrefetchLinkProps) {
  const router = useRouter();
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    if (prefetchOnHover && !timeoutId) {
      const id = setTimeout(() => {
        router.prefetch(href);
      }, delay);
      setTimeoutId(id);
    }
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(undefined);
    }
  };

  return (
    <Link
      href={href}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
    </Link>
  );
}
```

### 3.2 Route Group Splitting

Next.js automatically creates separate chunks for route groups:

```
app/
  [locale]/
    (app)/          # Creates shared chunk for authenticated pages
      dashboard/
      sales/
      accounting/
    (auth)/          # Creates shared chunk for auth pages
      signin/
      signup/
    (marketing)/     # Creates shared chunk for marketing pages
      pricing/
      about/
```

### 3.3 Dynamic Route Transitions

```typescript
// hooks/use-navigate-with-loading.ts
'use client';

import { useRouter } from 'next/navigation';
import { useState, startTransition } from 'react';

export function useNavigateWithLoading() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const navigate = (href: string) => {
    setIsLoading(true);

    // Use transition for smooth loading
    startTransition(() => {
      router.push(href);
      setIsLoading(false);
    });
  };

  return { navigate, isLoading };
}
```

---

## 4. Third-Party Library Lazy Loading

### 4.1 Recharts (Charts)

```typescript
// lib/charts/lazy-chart-imports.ts
import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/loading/chart-skeleton';

// Chart components - loaded only when needed
export const BarChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.BarChart })),
  { ssr: false }
);

export const LineChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.LineChart })),
  { ssr: false }
);

export const PieChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.PieChart })),
  { ssr: false }
);

export const AreaChart = dynamic(
  () => import('recharts').then(mod => ({ default: mod.AreaChart })),
  { ssr: false }
);

export const ResponsiveContainer = dynamic(
  () => import('recharts').then(mod => ({ default: mod.ResponsiveContainer })),
  { ssr: false }
);

// Full chart components with wrappers
export const DashboardBarChart = dynamic(
  () => import('@/components/charts/dashboard-bar-chart'),
  {
    loading: () => <ChartSkeleton />,
    ssr: false
  }
);
```

### 4.2 Framer Motion (Animations)

```typescript
// lib/animations/lazy-motion.ts
import dynamic from 'next/dynamic';

// Only load motion features when needed
export const FadeIn = dynamic(
  () => import('framer-motion').then(mod => {
    const { motion } = mod;
    return {
      default: ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay }}
        >
          {children}
        </motion.div>
      ),
    };
  }),
  { ssr: false }
);

export const SlideIn = dynamic(
  () => import('framer-motion').then(mod => {
    const { motion } = mod;
    return {
      default: ({ children, direction = 'left' }: { children: React.ReactNode; direction?: 'left' | 'right' }) => {
        const variants = {
          left: { x: -20 },
          right: { x: 20 },
        };
        return (
          <motion.div
            initial={{ opacity: 0, x: variants[direction] }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        );
      },
    };
  }),
  { ssr: false }
);
```

### 4.3 Date Utilities

```typescript
// lib/utils/lazy-date-fns.ts
// Use named imports for better tree-shaking
export const format = async () => import('date-fns/format');
export const startOfMonth = async () => import('date-fns/startOfMonth');
export const endOfMonth = async () => import('date-fns/endOfMonth');
export const differenceInDays = async () => import('date-fns/differenceInDays');

// Or create a facade
export const dateUtils = {
  format: async (date: Date, formatStr: string) => {
    const { format: fmt } = await import('date-fns/format');
    return fmt(date, formatStr);
  },
  startOfMonth: async (date: Date) => {
    const { startOfMonth } = await import('date-fns/startOfMonth');
    return startOfMonth(date);
  },
  // ... other methods
};
```

---

## 5. Skeleton Components

### 5.1 Chart Skeleton

```typescript
// components/loading/chart-skeleton.tsx
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent>
        <div className="h-[300px] flex items-center justify-center">
          <div className="w-full h-full flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-end gap-1 h-full">
                {[...Array(12)].map((_, j) => (
                  <Skeleton
                    key={j}
                    className="flex-1"
                    style={{ height: `${Math.random() * 60 + 20}%` }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5.2 Table Skeleton

```typescript
// components/loading/table-skeleton.tsx
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 10, columns = 6 }: TableSkeletonProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="w-full">
          {/* Header */}
          <div className="flex border-b p-4">
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={`header-${i}`} className="h-4 w-24" />
            ))}
          </div>

          {/* Rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={`row-${i}`} className="flex border-b p-4">
              {Array.from({ length: columns }).map((_, j) => (
                <Skeleton key={`cell-${i}-${j}`} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5.3 Form Skeleton

```typescript
// components/loading/form-skeleton.tsx
'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function FormSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form fields */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  );
}
```

### 5.4 Command Palette Skeleton

```typescript
// components/loading/command-palette-skeleton.tsx
'use client';

import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

export function CommandPaletteSkeleton() {
  return (
    <Dialog open>
      <DialogContent className="overflow-hidden p-0 shadow-lg">
        <div className="flex items-center border-b px-3">
          <Skeleton className="h-4 w-4 mr-2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="max-h-[300px] overflow-y-auto p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-48" />
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

---

## 6. Page-Level Lazy Loading

### 6.1 Dashboard Page Optimization

```typescript
// app/[locale]/(app)/dashboard/page.tsx - Optimized
'use client';

import { useTranslations, useLocale } from 'next-intl';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Lazy load chart
const RevenueChart = dynamic(
  () => import('@/components/charts/revenue-chart'),
  {
    loading: () => <RevenueChartSkeleton />,
  }
);

// Lazy load recent items tables
const RecentInvoicesTable = dynamic(
  () => import('@/components/dashboard/recent-invoices-table'),
  {
    loading: () => <TableSkeleton rows={5} columns={4} />,
  }
);

const RecentPaymentsTable = dynamic(
  () => import('@/components/dashboard/recent-payments-table'),
  {
    loading: () => <TableSkeleton rows={5} columns={4} />,
  }
);

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  return (
    <div className="space-y-6">
      {/* Stat cards - always load immediately */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* ... stat cards ... */}
      </div>

      {/* Chart - lazy load */}
      <Suspense fallback={<RevenueChartSkeleton />}>
        <RevenueChart />
      </Suspense>

      {/* Tables - lazy load separately */}
      <div className="grid gap-4 md:grid-cols-2">
        <Suspense fallback={<TableSkeleton rows={5} columns={4} />}>
          <RecentInvoicesTable />
        </Suspense>
        <Suspense fallback={<TableSkeleton rows={5} columns={4} />}>
          <RecentPaymentsTable />
        </Suspense>
      </div>
    </div>
  );
}
```

### 6.2 Reports Page Optimization

```typescript
// app/[locale]/(app)/reports/page.tsx - Partial
'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load report generation dialog
const GenerateReportDialog = dynamic(
  () => import('@/components/reports/generate-report-dialog'),
  {
    loading: () => <DialogSkeleton />,
  }
);

// Lazy load report card actions
const ReportCardActions = dynamic(
  () => import('@/components/reports/report-card-actions'),
  {
    loading: () => <Skeleton className="h-8 w-24" />,
  }
);
```

---

## 7. Testing Lazy Loading

### 7.1 Verify Code Splitting

```bash
# Build and analyze
ANALYZE=true npm run build

# Check for separate chunks
ls -lh .next/static/chunks/

# Expected output should show:
# - framework-*.js
# - main-*.js
# - pages-*.js (route chunks)
# - Individual component chunks
```

### 7.2 Verify Loading States

```typescript
// __tests__/lazy-loading.test.tsx
import { render, screen, waitFor } from '@testing-library/react';

describe('Lazy Loading', () => {
  it('shows skeleton while loading', async () => {
    const { container } = render(
      <Suspense fallback={<ChartSkeleton />}>
        <LazyChart />
      </Suspense>
    );

    // Should show skeleton first
    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument();

    // Should replace with chart after loading
    await waitFor(() => {
      expect(screen.getByTestId('chart-container')).toBeInTheDocument();
    });
  });

  it('loads component on demand', async () => {
    const onOpenChange = jest.fn();
    render(
      <CommandPaletteWrapper open={false} onOpenChange={onOpenChange} />
    );

    // Component should not be in DOM when closed
    expect(screen.queryByTestId('command-palette')).not.toBeInTheDocument();

    // After opening, should load
    onOpenChange(true);
    await waitFor(() => {
      expect(screen.getByTestId('command-palette')).toBeInTheDocument();
    });
  });
});
```

### 7.3 Performance Verification

```typescript
// __tests__/performance.test.tsx
describe('Performance', () => {
  it('loads dashboard within budget', async () => {
    const startTime = performance.now();

    render(<DashboardPage />);

    await waitFor(() => {
      expect(screen.getByTestId('dashboard-content')).toBeInTheDocument();
    });

    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(2000); // 2 second budget
  });
});
```

---

## 8. Common Patterns

### 8.1 Conditional Lazy Loading

```typescript
const FeatureFlagComponent = dynamic(
  () => import('@/components/feature-flag-component'),
  {
    loading: () => <Skeleton />,
  }
);

function Page() {
  const { featureEnabled } = useFeatureFlags();

  if (!featureEnabled) return null;

  return <FeatureFlagComponent />;
}
```

### 8.2 Intersection Observer Loading

```typescript
// hooks/use-lazy-on-visibility.ts
'use client';

import { useEffect, useRef, useState } from 'react';

export function useLazyOnVisibility<T>(
  factory: () => Promise<{ default: T }>
) {
  const ref = useRef<HTMLDivElement>(null);
  const [Component, setComponent] = useState<T | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !Component) {
          factory().then(mod => setComponent(mod.default));
        }
      },
      { rootMargin: '100px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [factory, Component]);

  return { ref, Component };
}

// Usage
function Page() {
  const { ref: chartRef, Component: Chart } = useLazyOnVisibility(
    () => import('@/components/heavy-chart')
  );

  return (
    <div ref={chartRef}>
      {Chart ? <Chart /> : <ChartSkeleton />}
    </div>
  );
}
```

### 8.3 Route Preloading on Idle

```typescript
// hooks/use-preload-on-idle.ts
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function usePreloadOnIdle(href: string, delay = 5000) {
  const router = useRouter();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
          router.prefetch(href);
        });
      } else {
        router.prefetch(href);
      }
    }, delay);

    return () => clearTimeout(timeoutId);
  }, [href, delay, router]);
}
```

---

## 9. Implementation Checklist

- [ ] Audit all components >200 LOC for lazy loading candidates
- [ ] Create skeleton components for all heavy components
- [ ] Lazy load recharts (dashboard only)
- [ ] Lazy load command palette
- [ ] Lazy load financial statement viewer
- [ ] Lazy load export functionality
- [ ] Add loading states to all dynamic imports
- [ ] Test loading states with slow 3G connection
- [ ] Verify code splitting with bundle analyzer
- [ ] Update TypeScript types for dynamic imports

---

## 10. Troubleshooting

### Issue: Flash of Unstyled Content

```typescript
// Solution: Use proper loading component
const Component = dynamic(() => import('./component'), {
  loading: () => <div className="min-h-[200px]" />, // Maintain height
});
```

### Issue: Component Not Updating

```typescript
// Solution: Pass component to dynamic
const Component = dynamic(
  () => import('./component').then(mod => ({ default: mod.Component })),
  {
    ssr: false,
  }
);
```

### Issue: Hydration Mismatch

```typescript
// Solution: Use client-only directive or ssr: false
'use client';

const Component = dynamic(() => import('./component'), {
  ssr: false, // Skip SSR
});
```

---

**Document Version:** 1.0
**Last Updated:** January 17, 2026
**Related Documents:**
- BUNDLE_OPTIMIZATION_PLAN.md
- VIRTUAL_SCROLLING_IMPLEMENTATION.md
- PERFORMANCE_MONITORING_STRATEGY.md
