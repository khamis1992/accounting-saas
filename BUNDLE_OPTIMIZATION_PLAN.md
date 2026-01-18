# Bundle Optimization Plan
## Accounting SaaS Frontend - Performance Optimization

**Date:** January 17, 2026
**Author:** Performance Engineering Team
**Version:** 1.0

---

## Executive Summary

This document outlines a comprehensive bundle optimization strategy for the Accounting SaaS frontend application. The current bundle size analysis reveals significant optimization opportunities that can reduce initial load time by 40-60%.

### Current State

| Metric | Current Value | Target Value | Status |
|--------|---------------|--------------|--------|
| Initial Bundle (gzipped) | ~800KB - 1MB | ~400KB | Critical |
| Time to Interactive (TTI) | ~3-5s | ~1.5s | Critical |
| First Contentful Paint (FCP) | ~1.5-2s | ~0.8s | Warning |
| Largest Contentful Paint (LCP) | ~2.5-3.5s | ~1.2s | Warning |
| Total Blocking Time (TBT) | ~400ms | ~100ms | Warning |

### Key Issues

1. **Zero code splitting** - All pages and components loaded eagerly
2. **Large dependencies** - recharts (200KB), framer-motion (85KB) not lazy loaded
3. **No tree-shaking optimization** - Full library imports throughout
4. **Unoptimized image handling** - Mixed usage of Next.js Image vs native img
5. **No bundle analysis** - No visibility into bundle composition

---

## 1. Dependency Analysis

### 1.1 Large Dependencies Impact

| Dependency | Version | Gzipped Size | Usage | Priority |
|-----------|---------|--------------|-------|----------|
| `recharts` | 3.6.0 | ~200KB | Dashboard only (1 page) | HIGH |
| `framer-motion` | 11.18.2 | ~85KB | 10+ components | HIGH |
| `@tanstack/react-table` | 8.21.3 | ~45KB | All tables | MEDIUM |
| `date-fns` | 4.1.0 | ~70KB | Multiple pages | MEDIUM |
| `@supabase/supabase-js` | 2.90.1 | ~100KB | Core auth/data | LOW |
| `next-intl` | 4.7.0 | ~50KB | Essential i18n | LOW |
| `lucide-react` | 0.562.0 | ~40KB | Icons everywhere | MEDIUM |

### 1.2 Dependency Recommendations

#### recharts (200KB savings potential)

**Current Usage:** Dashboard page only
```typescript
// app/[locale]/(app)/dashboard/page.tsx
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
```

**Recommendation:** Lazy load with dynamic import
```typescript
// Create: components/charts/dashboard-chart.tsx
'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { ChartData } from '@/lib/api/dashboard';

interface DashboardChartProps {
  data: ChartData[];
  formatCurrency: (amount: number) => string;
  revenueLabel: string;
  expensesLabel: string;
}

export function DashboardChart({ data, formatCurrency, revenueLabel, expensesLabel }: DashboardChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
        <XAxis dataKey="name" className="text-zinc-600 dark:text-zinc-400" tick={{ fill: 'currentColor' }} />
        <YAxis className="text-zinc-600 dark:text-zinc-400" tick={{ fill: 'currentColor' }} />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number | undefined) => value != null ? formatCurrency(value) : ''}
        />
        <Legend />
        <Bar dataKey="revenue" name={revenueLabel} fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
        <Bar dataKey="expenses" name={expensesLabel} fill="hsl(var(--destructive))" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
```

```typescript
// In dashboard/page.tsx
import dynamic from 'next/dynamic';
import { ChartSkeleton } from '@/components/loading/chart-skeleton';

const DashboardChart = dynamic(() => import('@/components/charts/dashboard-chart').then(mod => ({ default: mod.DashboardChart })), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

**Impact:** -200KB from initial bundle

#### framer-motion (85KB savings potential)

**Current Usage:** 10+ components, all loaded eagerly

**Recommendation:** Lazy load motion components, use CSS animations where possible
```typescript
// Create: components/animations/motion-wrapper.tsx
export const FadeIn = dynamic(() => import('framer-motion').then(mod => ({
  default: ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <mod.motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
    >
      {children}
    </mod.motion.div>
  )
})), { ssr: false });

// Use CSS for simple animations
// In globals.css:
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

**Impact:** -60KB from initial bundle (keep essential motion features)

#### date-fns (70KB savings potential)

**Current Usage:** Full library imported throughout
```typescript
import { format, startOfMonth, endOfMonth } from 'date-fns';
```

**Recommendation:** Use tree-shakeable imports or lightweight alternative
```typescript
// Option 1: Named imports (better tree-shaking in date-fns v4+)
import { format } from 'date-fns/format';
import { startOfMonth } from 'date-fns/startOfMonth';
import { endOfMonth } from 'date-fns/endOfMonth';

// Option 2: Use native Intl API where possible
const formatDate = (date: Date) => {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};
```

**Impact:** -40KB from initial bundle

#### lucide-react (40KB savings potential)

**Current Usage:** Full icon library loaded
```typescript
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  FileText,
  // ... 20+ more icons
} from 'lucide-react';
```

**Recommendation:** Use icon-specific imports or unplugin-icons
```typescript
// Install: npm install --save-dev unplugin-icons

// next.config.ts
import Icons from 'unplugin-icons/webpack';

const nextConfig = {
  webpack: (config) => {
    config.plugins.push(
      Icons({ compiler: 'jsx', jsx: 'react' })
    );
    return config;
  },
};

// Usage:
import IconTrendingUp from '~icons/lucide/trending-up';
import IconTrendingDown from '~icons/lucide/trending-down';
```

**Impact:** -30KB from initial bundle

---

## 2. Code Splitting Strategy

### 2.1 Route-Based Splitting

Next.js automatically code-splits by page, but we can optimize further:

```typescript
// Current: All components in page.tsx loaded together
// app/[locale]/(app)/sales/invoices/page.tsx (874 LOC)

// Optimized: Split into chunks
// app/[locale]/(app)/sales/invoices/page.tsx
import dynamic from 'next/dynamic';
import { InvoicesSkeleton } from '@/components/loading/invoices-skeleton';

// Lazy load heavy components
const InvoiceList = dynamic(() => import('@/components/invoices/invoice-list'), {
  loading: () => <TableSkeleton rows={10} columns={6} />
});

const InvoiceForm = dynamic(() => import('@/components/invoices/invoice-form'), {
  loading: () => <FormSkeleton />
});

const InvoiceFilters = dynamic(() => import('@/components/invoices/invoice-filters'), {
  loading: () => <FilterSkeleton />
});
```

### 2.2 Component-Based Splitting

Identify components >200 LOC for splitting:

| Component | LOC | Strategy |
|-----------|-----|----------|
| `command-palette.tsx` | 304 | Lazy load entire component |
| `financial-statement-viewer.tsx` | 412 | Split export functions |
| `sidebar.tsx` | 364 | Split nav item rendering |
| `breadcrumb.tsx` | 238 | Can be simplified |

```typescript
// Command palette - load only on trigger
// components/layout/command-palette-wrapper.tsx
'use client';

import { lazy, Suspense } from 'react';
import { CommandPaletteSkeleton } from '@/components/loading/command-palette-skeleton';

const CommandPalette = lazy(() => import('./command-palette').then(m => ({ default: m.CommandPalette })));

export function CommandPaletteWrapper({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  if (!open) return null;

  return (
    <Suspense fallback={<CommandPaletteSkeleton />}>
      <CommandPalette open={open} onOpenChange={onOpenChange} />
    </Suspense>
  );
}
```

### 2.3 Feature-Based Splitting

Split by feature module for better caching:

```typescript
// Create: app/[locale]/(app)/loading.tsx
export default function Loading() {
  return <PageSkeleton />;
}

// Each route group gets its own chunk
// (app), (auth), (marketing) route groups
```

---

## 3. Tree-Shaking Improvements

### 3.1 Optimize Package Imports

Update next.config.ts with experimental optimizePackageImports:

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  // ... existing config

  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
      '@tanstack/react-table',
      'framer-motion',
    ],
  },
};
```

### 3.2 Side Effects Configuration

Add package.json sideEffects entries:

```json
{
  "sideEffects": [
    "*.css",
    "*.scss",
    "src/**/*.css"
  ]
}
```

### 3.3 Module Exports

Create barrel exports with proper re-exports:

```typescript
// lib/api/index.ts
// BAD: Forces import of entire module
export * from './dashboard';
export * from './invoices';
export * from './reports';

// GOOD: Named exports allow tree-shaking
export { getDashboardData } from './dashboard';
export { getAll as getAllInvoices, create as createInvoice } from './invoices';
```

---

## 4. Dependency Removal & Replacement

### 4.1 next-themes Audit

**Finding:** Package installed but not actively used

```bash
# Search for usage
grep -r "useTheme\|ThemeProvider" app/ components/
```

**Action:** If unused, remove to save ~5KB
```bash
npm uninstall next-themes
```

### 4.2 Replace Heavy Libraries

Consider lighter alternatives:

| Heavy Library | Size | Alternative | Size Saved |
|---------------|------|-------------|------------|
| recharts | 200KB | Chart.js + react-chartjs-2 | -120KB |
| framer-motion | 85KB | CSS animations + transition API | -60KB |
| @tanstack/react-table | 45KB | Native table with virtual scroll | -30KB |

---

## 5. Bundle Analysis Setup

### 5.1 Install Bundle Analyzer

```bash
npm install --save-dev @next/bundle-analyzer
```

### 5.2 Configure next.config.ts

```typescript
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(withNextIntl(nextConfig));
```

### 5.3 Add Analysis Script

```json
{
  "scripts": {
    "analyze": "ANALYZE=true npm run build"
  }
}
```

### 5.4 Bundle Budgets

```javascript
// next.config.ts
const nextConfig: NextConfig = {
  experimental: {
    // Bundle size budgets
    webpack: (config, { isServer }) => {
      if (!isServer) {
        config.performance = {
          ...config.performance,
          budget: [
            {
              type: 'initial',
              maxEntrypointSize: 400000, // 400KB
              maxAssetSize: 400000,
            },
            {
              type: 'javascript',
              maxAssetSize: 200000, // 200KB per chunk
            },
          ],
        };
      }
      return config;
    },
  },
};
```

---

## 6. Implementation Roadmap

### Phase 1: Quick Wins (Week 1) - 40% Reduction

| Task | File | Impact | Effort |
|------|------|--------|--------|
| Lazy load recharts | dashboard/page.tsx | -200KB | 1 hour |
| Add bundle analyzer | next.config.ts | Visibility | 30 minutes |
| Enable package import optimization | next.config.ts | -50KB | 15 minutes |
| Remove next-themes if unused | package.json | -5KB | 30 minutes |
| Add tree-shaking config | package.json | -20KB | 15 minutes |

**Total Impact:** ~275KB reduction
**Total Effort:** ~3 hours

### Phase 2: Component Splitting (Week 2) - 20% Reduction

| Task | Files | Impact | Effort |
|------|-------|--------|--------|
| Lazy load command palette | layout/* | -30KB | 2 hours |
| Split invoice page components | sales/invoices/* | -40KB | 4 hours |
| Split payment page components | sales/payments/* | -35KB | 4 hours |
| Split quotation page components | sales/quotations/* | -35KB | 4 hours |
| Create skeleton components | components/loading/* | Perceived + | 3 hours |

**Total Impact:** ~140KB reduction
**Total Effort:** ~17 hours

### Phase 3: Advanced Optimizations (Week 3-4) - 15% Reduction

| Task | Files | Impact | Effort |
|------|-------|--------|--------|
| Implement unplugin-icons | config + all files | -30KB | 6 hours |
| Optimize framer-motion usage | All animations | -40KB | 8 hours |
| Add virtual scrolling | All tables | -20KB | 10 hours |
| Implement service worker | public/* | Cache | 8 hours |
| Add route prefetch strategy | layouts/* | Perceived + | 4 hours |

**Total Impact:** ~90KB reduction
**Total Effort:** ~36 hours

### Phase 4: Measurement & Monitoring (Ongoing)

| Task | Frequency | Owner |
|------|-----------|-------|
| Run bundle analyzer | Every build | Dev |
| Review bundle budgets | Weekly | Tech Lead |
| Lighthouse CI | Every PR | CI/CD |
| Performance budget alerts | Real-time | Monitoring |

---

## 7. Before/After Metrics

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Bundle (gzipped) | 800KB | 320KB | -60% |
| Time to Interactive | 4.5s | 1.8s | -60% |
| First Contentful Paint | 1.8s | 0.9s | -50% |
| Largest Contentful Paint | 3.2s | 1.5s | -53% |
| Total Blocking Time | 400ms | 120ms | -70% |
| Cumulative Layout Shift | 0.15 | 0.08 | -47% |

### Lighthouse Score Targets

| Category | Current | Target |
|----------|---------|--------|
| Performance | 52 | 92 |
| Accessibility | 78 | 95 |
| Best Practices | 83 | 95 |
| SEO | 90 | 95 |

---

## 8. Success Criteria

### Technical Metrics

- [ ] Initial bundle <400KB gzipped
- [ ] TTI <2s on 4G
- [ ] Lighthouse Performance score >90
- [ ] Zero critical bundle issues
- [ ] All chunks <200KB

### Process Metrics

- [ ] Bundle analyzer runs on every build
- [ ] Bundle budgets enforced in CI/CD
- [ ] Performance regression tests passing
- [ ] Monitoring dashboards operational

---

## 9. Risks & Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Lazy loading causes layout shift | Medium | Low | Use Skeleton components |
| Dynamic imports break SSR | Low | Medium | Test with ssr: false for client-only |
| Bundle budgets too strict | Low | Low | Phase in gradually, adjust as needed |
| Breaking changes with unplugin-icons | Medium | Low | Test thoroughly in staging |

---

## 10. Next Steps

1. **Immediate (Today):**
   - Run bundle analyzer: `ANALYZE=true npm run build`
   - Document baseline metrics
   - Create feature branch: `feat/bundle-optimization`

2. **This Week:**
   - Implement Phase 1 quick wins
   - Measure and document improvements
   - Update team on progress

3. **Next Sprint:**
   - Implement Phase 2 component splitting
   - Set up CI/CD performance regression tests
   - Create monitoring dashboard

---

**Document Version:** 1.0
**Last Updated:** January 17, 2026
**Next Review:** After Phase 1 completion
