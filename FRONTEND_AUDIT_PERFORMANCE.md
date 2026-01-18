# Frontend Performance & Bundle Size Audit Report

**Date:** 2026-01-17
**Auditor:** Claude Code
**Project:** Accounting SaaS Frontend
**Framework:** Next.js 16.1.1, React 19.2.3

---

## Executive Summary

This audit analyzes the frontend application for performance bottlenecks, bundle size issues, and optimization opportunities. The application shows **good foundational performance** but has several **high-impact optimization opportunities** that could improve load times by 40-60%.

### Key Metrics
- **Node modules size:** 588MB
- **Total component LOC:** ~5,310 lines
- **Total page LOC:** ~16,262 lines
- **Dependencies:** 19 production, 10 dev

---

## 1. Bundle Size Analysis

### 1.1 Large Dependencies

| Dependency | Version | Est. Size | Impact |
|-----------|---------|-----------|--------|
| `recharts` | 3.6.0 | ~200KB gzipped | HIGH - Only used in 1 page |
| `framer-motion` | 11.18.2 | ~85KB gzipped | HIGH - Used in 10+ components |
| `@tanstack/react-table` | 8.21.3 | ~45KB gzipped | MEDIUM - Used in tables |
| `date-fns` | 4.1.0 | ~70KB gzipped | MEDIUM - Could use tree-shaking |
| `@supabase/supabase-js` | 2.90.1 | ~100KB gzipped | MEDIUM - Core dependency |
| `next-intl` | 4.7.0 | ~50KB gzipped | LOW - Essential for i18n |

### 1.2 Radix UI Dependencies

Radix UI packages are tree-shakeable but multiple imports add up:
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-label
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-tabs

**Estimated total:** ~60KB gzipped (acceptable for component library)

---

## 2. Code Splitting & Lazy Loading

### 2.1 Current State ⚠️ **CRITICAL ISSUE**

**Finding:** **ZERO** dynamic imports or lazy loading detected in the codebase.

```bash
# Searched for: dynamic, lazy, Suspense
# Results: None found
```

**Impact:** ALL page code, components, and dependencies are loaded on initial page load, including:
- Dashboard (with recharts - 200KB)
- All 20+ route pages
- Command palette (304 lines)
- Financial statement viewer (412 lines)
- All animation components

**Example: Dashboard Page**
```typescript
// app/[locale]/(app)/dashboard/page.tsx
// Currently loads recharts eagerly (200KB)
import {
  BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
```

### 2.2 Recommendation - Implement Route-Based Splitting

```typescript
// BEFORE (current)
import { BarChart } from 'recharts';

// AFTER (optimized)
const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

**Priority:** CRITICAL
**Estimated Impact:** 40-50% reduction in initial bundle size

---

## 3. Component Size Analysis

### 3.1 Largest Components (By Lines of Code)

| Component | Lines | Issues | Priority |
|-----------|-------|--------|----------|
| `command-palette.test.tsx` | 391 | Test file in src | MEDIUM |
| `sidebar.tsx` | 364 | Monolithic, complex state | HIGH |
| `command-palette.tsx` | 304 | Not lazy loaded | HIGH |
| `financial-statement-viewer.tsx` | 412 | Complex component | HIGH |
| `breadcrumb.tsx` | 238 | Over-engineered | MEDIUM |
| `favorites-button.tsx` | 175 | Could be simplified | LOW |

### 3.2 Largest Page Files

| Page | Lines | Issues | Priority |
|------|-------|--------|----------|
| `sales/payments/page.tsx` | 951 | Massive file, needs splitting | HIGH |
| `sales/invoices/page.tsx` | 874 | Massive file, needs splitting | HIGH |
| `sales/quotations/page.tsx` | 827 | Massive file, needs splitting | HIGH |
| `purchases/purchase-orders/page.tsx` | 798 | Massive file, needs splitting | HIGH |
| `purchases/expenses/page.tsx` | 750 | Large form components | HIGH |

### 3.3 Recommendations

1. **Split large pages into components**
   - Extract form components
   - Extract table components
   - Extract filter components

2. **Implement component lazy loading**
   ```typescript
   // Heavy components should be lazy loaded
   const FinancialStatementViewer = dynamic(
     () => import('@/components/financial-statement-viewer'),
     { loading: () => <Skeleton /> }
   );
   ```

---

## 4. Image Optimization

### 4.1 Current State ⚠️ **NEEDS IMPROVEMENT**

**Finding:** Mixed usage of Next.js Image vs native img tag

```typescript
// GOOD (Next.js Image)
import Image from "next/image";
<Image src="/logo.png" width={100} height={100} />

// BAD (native img tag)
<img src={user?.user_metadata.avatar_url} />
```

### 4.2 Issues Found

1. **Avatar images in sidebar** - Uses custom Avatar component with img tag
2. **Settings pages** - Multiple native img tags found
3. **No image optimization configuration** for remote patterns

### 4.3 Recommendations

```typescript
// next.config.ts - Add remote patterns
images: {
  domains: ['gbbmicjucestjpxtkjyp.supabase.co'],
  remotePatterns: [
    {
      protocol: 'https',
      hostname: '**.supabase.co',
    },
  ],
  formats: ['image/webp', 'image/avif'],
  minimumCacheTTL: 60,
  deviceSizes: [640, 750, 828, 1080, 1200, 1920],
}
```

**Priority:** MEDIUM
**Estimated Impact:** 20-30% reduction in image payload

---

## 5. Unused Dependencies

### 5.1 Potential Unused Dependencies

Based on import analysis:

| Dependency | Usage | Assessment |
|-----------|-------|------------|
| `recharts` | 1 page only | Consider lazy loading or lighter alternative |
| `@hookform/resolvers` | Low usage | Verify if needed |
| `next-themes` | Not found in imports | **POTENTIALLY UNUSED** |

### 5.2 Action Items

1. **Audit next-themes usage**
   ```bash
   grep -r "useTheme\|ThemeProvider" app components
   ```
   If not found, remove from dependencies

2. **Consider recharts alternatives**
   - Chart.js or Victory for smaller bundle
   - Or use dynamic import (see section 2.2)

---

## 6. N+1 Query Problems

### 6.1 Dashboard Analysis

**Current Implementation:**
```typescript
// lib/api/dashboard.ts
export async function getDashboardData(): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>('/dashboard');
  // Single API call - GOOD!
}
```

**Assessment:** ✅ Dashboard uses single aggregated API endpoint

### 6.2 Invoices Page Analysis

**Potential N+1 Issue:**
```typescript
// app/[locale]/(app)/sales/invoices/page.tsx
useEffect(() => {
  fetchInvoices();      // API call 1
  fetchCustomers();     // API call 2
  fetchVendors();       // API call 3
}, [typeFilter, statusFilter, partyTypeFilter]);
```

**Impact:** 3 parallel API calls on every filter change

### 6.3 Recommendations

1. **Backend aggregation** - Combine customer/vendor data into invoices response
2. **Implement cache** - Cache customer/vendor lists (rarely change)
3. **Use React Query** - For automatic caching and deduplication

```typescript
// Recommended approach
import { useQuery } from '@tanstack/react-query';

const { data: customers } = useQuery({
  queryKey: ['customers'],
  queryFn: () => customersApi.getAll({ isActive: true }),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## 7. Memory Leak Risks

### 7.1 Event Listeners

**Finding:** No manual event listeners found in components (good!)

**But:** Check for these patterns:
- Command palette keyboard shortcuts
- Custom hooks with effects
- Animation components

### 7.2 Cleanup Patterns

**Current state:** Components use React hooks properly

```typescript
// auth-context.tsx - Good cleanup
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(...);
  return () => subscription.unsubscribe();
}, [supabase]);
```

**Recommendation:** Add cleanup for command palette:
```typescript
// command-palette.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      onOpenChange(true);
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => document.removeEventListener('keydown', handleKeyDown);
}, [onOpenChange]);
```

---

## 8. Performance Optimization Roadmap

### Phase 1: Quick Wins (1-2 days) ⚡

1. **Lazy load recharts** (Dashboard only)
   ```typescript
   const BarChart = dynamic(() => import('recharts').then(m => m.BarChart), { ssr: false });
   ```
   **Impact:** -200KB initial bundle

2. **Add bundle analyzer**
   ```bash
   npm install --save-dev @next/bundle-analyzer
   ```
   Add to next.config.ts for ongoing monitoring

3. **Remove unused dependencies**
   - Verify and remove next-themes if unused

### Phase 2: Component Splitting (3-5 days) 🔧

1. **Split large pages** (800-950 LOC)
   - Extract form components
   - Extract table components
   - Extract filter components

2. **Lazy load heavy components**
   - FinancialStatementViewer
   - CommandPalette (conditional load)
   - Animation components

3. **Implement React Query**
   - Replace manual useState/useEffect
   - Add automatic caching
   - Fix N+1 queries

### Phase 3: Image & Asset Optimization (1-2 days) 🖼️

1. **Replace all img tags with Next.js Image**
2. **Add image optimization config**
3. **Implement image lazy loading**
4. **Add WebP/AVIF support**

### Phase 4: Advanced Optimizations (5-7 days) 🚀

1. **Implement route-based code splitting**
   ```typescript
   // Dynamic routes for heavy pages
   const InvoicesPage = dynamic(() => import('./page'), {
     loading: () => <PageSkeleton />
   });
   ```

2. **Add service worker for caching**
3. **Implement prefetching for likely routes**
4. **Add compression middleware**

---

## 9. Specific File Recommendations

### 9.1 High Priority

**C:\Users\khamis\Desktop\accounting-saas-new\frontend\app\[locale]\(app)\sales\invoices\page.tsx**
- Split into: InvoiceList, InvoiceForm, InvoiceFilters
- Extract form validation to separate hook
- Lazy load form components

**C:\Users\khamis\Desktop\accounting-saas-new\frontend\components\layout\command-palette.tsx**
- Lazy load on Cmd+K trigger
- Split icon mapping to separate file
- Debounce search input

**C:\Users\khamis\Desktop\accounting-saas-new\frontend\components\layout\sidebar.tsx**
- Split NavItem components to separate file
- Extract navigation data to separate module (already done in navigation-data.ts)
- Consider virtual scrolling for large nav lists

### 9.2 Medium Priority

**C:\Users\khamis\Desktop\accounting-saas-new\frontend\app\[locale]\(app)\dashboard\page.tsx**
- Lazy load recharts
- Extract StatCard to separate component
- Add chart skeleton loading state

**C:\Users\khamis\Desktop\accounting-saas-new\frontend\components\financial-statement-viewer.tsx**
- Lazy load export functionality
- Add virtual scrolling for large statements
- Implement pagination for line items

---

## 10. Configuration Recommendations

### 10.1 next.config.ts Improvements

```typescript
const nextConfig: NextConfig = {
  // Existing config...

  // Add production source maps (smaller builds in dev)
  productionBrowserSourceMaps: false,

  // Optimize package imports
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'recharts',
      'date-fns',
    ],
  },

  // Compression
  compress: true,

  // SWC minification (already default in Next.js 12+)
  swcMinify: true,
};
```

### 10.2 Add Bundle Analyzer

```bash
npm install --save-dev @next/bundle-analyzer
```

```typescript
// next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer';

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default withBundleAnalyzer(withNextIntl(nextConfig));
```

Usage:
```bash
ANALYZE=true npm run build
```

---

## 11. Performance Metrics Targets

### Current (Estimated)
- **Initial Bundle:** ~800KB - 1MB (including all dependencies)
- **Time to Interactive:** ~3-5s (estimated)
- **First Contentful Paint:** ~1.5-2s (estimated)

### Target (After Optimizations)
- **Initial Bundle:** ~400-500KB (50% reduction)
- **Time to Interactive:** ~1.5-2s (60% improvement)
- **First Contentful Paint:** ~0.8-1.2s (40% improvement)

---

## 12. Monitoring & Testing

### 12.1 Add Performance Monitoring

```typescript
// lib/performance.ts
export function reportWebVitals(metric) {
  const { name, value, id } = metric;

  // Send to analytics
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', name, {
      event_category: 'Web Vitals',
      event_label: id,
      value: Math.round(name === 'CLS' ? value * 1000 : value),
      non_interaction: true,
    });
  }
}
```

### 12.2 Lighthouse CI

Add to CI/CD pipeline:
```yaml
# .github/workflows/lighthouse.yml
- name: Run Lighthouse
  run: |
    npm install -g @lhci/cli
    lhci autorun
```

---

## 13. Priority Action Items

### Immediate (This Week)
1. ✅ Lazy load recharts in dashboard
2. ✅ Add bundle analyzer
3. ✅ Remove unused dependencies
4. ✅ Fix N+1 query in invoices page

### Short-term (Next 2 Weeks)
1. Split large page files (800+ LOC)
2. Implement React Query for caching
3. Lazy load heavy components
4. Add image optimization

### Long-term (Next Month)
1. Implement service worker
2. Add performance monitoring
3. Set up Lighthouse CI
4. Optimize animations with framer-motion lazy loading

---

## 14. Conclusion

The frontend application has a **solid foundation** but requires **critical optimizations** in code splitting and lazy loading. The main issues are:

1. **No code splitting** - All code loaded eagerly
2. **Large dependencies** - recharts and framer-motion not lazy loaded
3. **Large page files** - Need component extraction
4. **No query caching** - N+1 patterns in some pages

**Estimated improvement:** 40-60% reduction in initial bundle size and 2-3x faster load times with recommended changes.

---

## Appendix A: Tools & Commands

### Bundle Analysis
```bash
# Install analyzer
npm install --save-dev @next/bundle-analyzer

# Run analysis
ANALYZE=true npm run build

# Check bundle size
npm run build
ls -lh .next/static/chunks/
```

### Dependency Analysis
```bash
# Check unused dependencies
npx depcheck

# Check outdated packages
npm outdated

# Analyze dependency sizes
npx cost-of-modules
```

### Performance Testing
```bash
# Run Lighthouse
npx lighthouse http://localhost:3000 --view

# Run Lighthouse CI
npx @lhci/cli autorun
```

---

**Report Generated:** 2026-01-17
**Next Review:** After Phase 1 implementation
**Auditor:** Claude Code (Sonnet 4.5)
