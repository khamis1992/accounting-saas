# Performance Monitoring Strategy
## Accounting SaaS Frontend - Real User Monitoring & Analytics

**Date:** January 17, 2026
**Author:** Performance Engineering Team
**Version:** 1.0

---

## Executive Summary

This document outlines a comprehensive performance monitoring strategy for the Accounting SaaS frontend application. Effective monitoring enables data-driven optimization decisions and prevents performance regressions.

### Monitoring Objectives

1. **Real User Monitoring (RUM)** - Capture actual user experience
2. **Synthetic Monitoring** - Simulated user journeys for testing
3. **CI/CD Integration** - Automated performance regression detection
4. **Alerting** - Proactive notification of performance degradation
5. **Reporting** - Regular performance dashboards and trends

---

## 1. Performance KPIs Definition

### 1.1 Core Web Vitals

Google's Core Web Vitals are the foundation of our KPIs:

| Metric | Good | Needs Improvement | Poor | Target |
|--------|------|-------------------|------|--------|
| **LCP** (Largest Contentful Paint) | <2.5s | 2.5s-4s | >4s | <1.2s |
| **FID** (First Input Delay) | <100ms | 100-300ms | >300ms | <50ms |
| **CLS** (Cumulative Layout Shift) | <0.1 | 0.1-0.25 | >0.25 | <0.08 |

### 1.2 Custom KPIs

Application-specific performance indicators:

| KPI | Target | Measurement Method |
|-----|--------|-------------------|
| Time to Interactive (TTI) | <1.5s | Performance API |
| First Contentful Paint (FCP) | <0.8s | Performance API |
| Time to First Byte (TTFB) | <600ms | Navigation Timing |
| Dashboard Load Time | <2s | Custom timing |
| Report Generation Time | <3s | Custom timing |
| Search Response Time | <100ms | Custom timing |
| API Error Rate | <2% | Error tracking |

### 1.3 Business KPIs

Performance impact on business metrics:

| Metric | Current | Target |
|--------|---------|--------|
| Bounce Rate | 45% | <25% |
| Average Session Duration | 2.5min | >5min |
| Task Completion Rate | 68% | >90% |
| User Satisfaction Score | 3.2/5 | >4.5/5 |

---

## 2. RAIL Targets

Response, Animation, Idle, Load framework for performance targets:

### Response (0-50ms)

- **Goal:** Respond to user input immediately
- **Target:** <50ms for all interactive elements
- **Measurement:** First Input Delay, Event Timing API

```typescript
// Track interaction delays
document.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const startTime = performance.now();

  requestAnimationFrame(() => {
    const processingTime = performance.now() - startTime;
    if (processingTime > 50) {
      trackSlowInteraction(target, processingTime);
    }
  });
});
```

### Animation (0-16ms)

- **Goal:** Maintain 60fps for animations
- **Target:** <16ms per frame
- **Measurement:** Frame timing, long tasks detection

```typescript
// Track frame drops
let lastFrameTime = performance.now();

function trackFrameRate() {
  const now = performance.now();
  const frameDuration = now - lastFrameTime;

  if (frameDuration > 16) {
    trackDroppedFrame(frameDuration);
  }

  lastFrameTime = now;
  requestAnimationFrame(trackFrameRate);
}

trackFrameRate();
```

### Idle (50ms)

- **Goal:** Maximize idle time for main thread
- **Target:** <50ms long tasks
- **Measurement:** Long Tasks API, total blocking time

### Load (0-3s)

- **Goal:** Load content quickly
- **Target:** <3s for full page load
- **Measurement:** Page Load Time, DOM Content Loaded

---

## 3. Real User Monitoring (RUM) Plan

### 3.1 Web Vitals Collection

```typescript
// lib/performance/web-vitals.ts
import { onCLS, onFID, onFCP, onLCP, onTTFB } from 'web-vitals';

interface Metric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  navigationType?: string;
}

const vitalsThresholds = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
};

function getRating(name: string, value: number): Metric['rating'] {
  const threshold = vitalsThresholds[name as keyof typeof vitalsThresholds];
  if (!threshold) return 'good';

  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

function sendToAnalytics(metric: Metric) {
  // Send to analytics backend
  fetch('/api/analytics/performance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...metric,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      connection: (navigator as any).connection?.effectiveType,
    }),
    // Use sendBeacon for better reliability
    keepalive: true,
  }).catch(console.error);

  // Also log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', metric);
  }
}

export function initWebVitals() {
  onCLS((metric) => sendToAnalytics({
    name: metric.name,
    value: metric.value,
    rating: getRating('CLS', metric.value),
  }));

  onFID((metric) => sendToAnalytics({
    name: metric.name,
    value: metric.value,
    rating: getRating('FID', metric.value),
  }));

  onFCP((metric) => sendToAnalytics({
    name: metric.name,
    value: metric.value,
    rating: getRating('FCP', metric.value),
  }));

  onLCP((metric) => sendToAnalytics({
    name: metric.name,
    value: metric.value,
    rating: getRating('LCP', metric.value),
  }));

  onTTFB((metric) => sendToAnalytics({
    name: metric.name,
    value: metric.value,
    rating: getRating('TTFB', metric.value),
  }));
}
```

### 3.2 Custom Metrics

```typescript
// lib/performance/custom-metrics.ts
import { mark, measure, getEntriesByName } from 'perf_hooks';

export class PerformanceTracker {
  private marks: Map<string, number> = new Map();

  markStart(name: string) {
    const markName = `${name}-start`;
    performance.mark(markName);
    this.marks.set(name, performance.now());
  }

  markEnd(name: string): number | null {
    const markName = `${name}-end`;
    performance.mark(markName);

    const startMark = `${name}-start`;
    const measureName = `${name}-measure`;

    try {
      performance.measure(measureName, startMark, markName);
      const entries = getEntriesByName(measureName);
      const duration = entries[entries.length - 1]?.duration ?? 0;

      this.reportMetric(name, duration);

      // Cleanup marks
      performance.clearMarks(startMark);
      performance.clearMarks(markName);
      performance.clearMeasures(measureName);

      this.marks.delete(name);
      return duration;
    } catch (e) {
      console.warn(`Failed to measure ${name}:`, e);
      return null;
    }
  }

  private reportMetric(name: string, duration: number) {
    // Send to analytics
    this.sendToAnalytics({
      metricName: name,
      duration,
      timestamp: Date.now(),
      page: window.location.pathname,
    });
  }

  private sendToAnalytics(data: any) {
    if (typeof navigator !== 'undefined' && 'sendBeacon' in navigator) {
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      navigator.sendBeacon('/api/analytics/custom', blob);
    }
  }
}

// Singleton instance
export const perfTracker = new PerformanceTracker();
```

### 3.3 API Performance Tracking

```typescript
// lib/api/tracking-client.ts
import { perfTracker } from '@/lib/performance/custom-metrics';

class TrackedApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const metricName = `api-get-${endpoint.replace(/\//g, '-')}`;
    perfTracker.markStart(metricName);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } finally {
      perfTracker.markEnd(metricName);
    }
  }

  async post<T>(endpoint: string, data: any, options?: RequestInit): Promise<T> {
    const metricName = `api-post-${endpoint.replace(/\//g, '-')}`;
    perfTracker.markStart(metricName);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } finally {
      perfTracker.markEnd(metricName);
    }
  }
}
```

---

## 4. Performance Budget Creation

### 4.1 Budget Definition

```typescript
// performance-budget.json
{
  "budgets": [
    {
      "resourceType": "script",
      "budget": 400,
      "key": "initial-js"
    },
    {
      "resourceType": "stylesheet",
      "budget": 50,
      "key": "initial-css"
    },
    {
      "resourceType": "image",
      "budget": 200,
      "key": "images"
    },
    {
      "resourceType": "total",
      "budget": 1000,
      "key": "total-page-weight"
    },
    {
      "resourceType": "script",
      "budget": 200,
      "key": "third-party-js"
    }
  ],
  "timings": [
    {
      "metric": "FCP",
      "budget": 800,
      "tolerance": 0.1
    },
    {
      "metric": "LCP",
      "budget": 1200,
      "tolerance": 0.1
    },
    {
      "metric": "TTI",
      "budget": 1500,
      "tolerance": 0.1
    },
    {
      "metric": "CLS",
      "budget": 0.08,
      "tolerance": 0.02
    }
  ]
}
```

### 4.2 Budget Enforcement

```typescript
// scripts/check-performance-budgets.ts
import type { Budget } from './performance-budget.json';

async function checkPerformanceBudgets(url: string, budgets: typeof Budget) {
  // Use Chrome DevTools Protocol or Lighthouse
  const lighthouse = await import('lighthouse');
  const chromeLauncher = await import('chrome-launcher');

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info' as const,
    output: 'json' as const,
    onlyCategories: ['performance'],
    port: chrome.port,
  };

  const runnerResult = await lighthouse(url, options);
  await chrome.kill();

  const report = JSON.parse(runnerResult.report);
  const violations: string[] = [];

  // Check resource budgets
  for (const budget of budgets.budgets) {
    const size = getReportSize(report, budget);
    if (size > budget.budget) {
      violations.push(
        `${budget.key}: ${size}KB exceeds budget of ${budget.budget}KB`
      );
    }
  }

  // Check timing budgets
  for (const timing of budgets.timings) {
    const value = report.audits['metric'].numericValue;
    if (value > timing.budget * (1 + timing.tolerance)) {
      violations.push(
        `${timing.metric}: ${value}ms exceeds budget of ${timing.budget}ms`
      );
    }
  }

  return {
    passed: violations.length === 0,
    violations,
    report,
  };
}
```

---

## 5. CI/CD Performance Regression Testing

### 5.1 GitHub Actions Workflow

```yaml
# .github/workflows/performance.yml
name: Performance Tests

on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build
        env:
          NEXT_PUBLIC_API_URL: ${{ secrets.API_URL }}
          NEXT_PUBLIC_APP_URL: http://localhost:3000

      - name: Start server
        run: npm start &

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v10
        with:
          urls: |
            http://localhost:3000/en/dashboard
            http://localhost:3000/en/sales/invoices
            http://localhost:3000/en/reports
          uploadArtifacts: true
          temporaryPublicStorage: true

      - name: Assert performance budgets
        run: |
          npx lhci autorun --assert.lighthouse:all=90 \
            --assert.pwa:all=0 \
            --assert.performance:all=90 \
            --assert.accessibility:all=90

  bundle-size:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Build with bundle analysis
        run: ANALYZE=true npm run build

      - name: Check bundle sizes
        run: npm run check-bundles

      - name: Comment PR with bundle size changes
        uses: andresz1/size-limit-action@v1
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

### 5.2 Bundle Size Tracking

```json
// package.json - Add size-limit configuration
{
  "scripts": {
    "size": "size-limit",
    "size:why": "size-limit --why"
  },
  "size-limit": [
    {
      "name": "Dashboard",
      "path": "app/[locale]/(app)/dashboard/page.tsx",
      "limit": "150 KB",
      "webpack": true
    },
    {
      "name": "Invoices Page",
      "path": "app/[locale]/(app)/sales/invoices/page.tsx",
      "limit": "200 KB",
      "webpack": true
    },
    {
      "name": "Reports Hub",
      "path": "app/[locale]/(app)/reports/page.tsx",
      "limit": "180 KB",
      "webpack": true
    },
    {
      "name": "Total JS",
      "limit": "400 KB",
      "webpack": true
    }
  ]
}
```

---

## 6. Monitoring Dashboard Setup

### 6.1 Supabase Analytics Table

```sql
-- Create performance metrics table
CREATE TABLE performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,

  -- Web Vitals
  lcp FLOAT,
  fid FLOAT,
  cls FLOAT,
  fcp FLOAT,
  ttfb FLOAT,

  -- Custom metrics
  page_load_time FLOAT,
  tti FLOAT,
  api_response_time FLOAT,

  -- Context
  page_url TEXT,
  route TEXT,
  device_type TEXT,
  connection_type TEXT,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for querying
CREATE INDEX idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX idx_performance_metrics_page_url ON performance_metrics(page_url);
CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);

-- Create aggregation view
CREATE VIEW performance_daily_summary AS
SELECT
  DATE(created_at) as date,
  route,
  COUNT(*) as page_views,
  AVG(lcp) as avg_lcp,
  AVG(fid) as avg_fid,
  AVG(cls) as avg_cls,
  AVG(page_load_time) as avg_load_time,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY lcp) as p75_lcp,
  PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY page_load_time) as p75_load_time
FROM performance_metrics
GROUP BY DATE(created_at), route;
```

### 6.2 Dashboard Queries

```typescript
// lib/api/analytics.ts
export interface PerformanceSummary {
  date: string;
  route: string;
  pageViews: number;
  avgLCP: number;
  avgFID: number;
  avgCLS: number;
  avgLoadTime: number;
  p75LCP: number;
  p75LoadTime: number;
}

export async function getPerformanceSummary(
  startDate: Date,
  endDate: Date,
  route?: string
): Promise<PerformanceSummary[]> {
  const query = supabase
    .from('performance_daily_summary')
    .select('*')
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString());

  if (route) {
    query.eq('route', route);
  }

  const { data, error } = await query.order('date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getSlowestPages(limit: number = 10): Promise<string[]> {
  const { data, error } = await supabase
    .from('performance_metrics')
    .select('route, avg(page_load_time) as avg_load')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('avg_load', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data?.map(d => d.route) || [];
}
```

### 6.3 Grafana Dashboard Configuration

```json
{
  "dashboard": {
    "title": "Frontend Performance",
    "panels": [
      {
        "title": "Core Web Vitals - P75",
        "targets": [
          {
            "query": "SELECT p75_lcp FROM performance_daily_summary WHERE date > NOW() - INTERVAL '7 days'"
          }
        ]
      },
      {
        "title": "Page Load Time by Route",
        "targets": [
          {
            "query": "SELECT route, avg_load_time FROM performance_daily_summary WHERE date > NOW() - INTERVAL '24 hours' ORDER BY avg_load_time DESC LIMIT 10"
          }
        ]
      },
      {
        "title": "LCP Distribution",
        "type": "histogram",
        "targets": [
          {
            "query": "SELECT lcp FROM performance_metrics WHERE created_at > NOW() - INTERVAL '24 hours'"
          }
        ]
      },
      {
        "title": "API Response Times",
        "targets": [
          {
            "query": "SELECT api_response_time FROM performance_metrics WHERE created_at > NOW() - INTERVAL '1 hour'"
          }
        ]
      }
    ]
  }
}
```

---

## 7. Alerting Strategy

### 7.1 Alert Thresholds

| Metric | Warning | Critical | Check Frequency |
|--------|---------|----------|-----------------|
| P75 LCP | >2s | >4s | Every 5 minutes |
| P75 FID | >100ms | >300ms | Every 5 minutes |
| P75 CLS | >0.1 | >0.25 | Every 5 minutes |
| Error Rate | >5% | >10% | Every minute |
| API P95 Latency | >1s | >3s | Every minute |

### 7.2 Alert Configuration

```typescript
// lib/performance/alerting.ts
interface AlertRule {
  name: string;
  metric: string;
  threshold: number;
  comparison: 'gt' | 'lt';
  severity: 'warning' | 'critical';
  notificationChannels: string[];
}

const alertRules: AlertRule[] = [
  {
    name: 'LCP Degraded',
    metric: 'p75_lcp',
    threshold: 2000,
    comparison: 'gt',
    severity: 'warning',
    notificationChannels: ['slack', 'email'],
  },
  {
    name: 'LCP Critical',
    metric: 'p75_lcp',
    threshold: 4000,
    comparison: 'gt',
    severity: 'critical',
    notificationChannels: ['slack', 'email', 'pagerduty'],
  },
  {
    name: 'High Error Rate',
    metric: 'error_rate',
    threshold: 0.05,
    comparison: 'gt',
    severity: 'warning',
    notificationChannels: ['slack'],
  },
];

export async function checkAlerts() {
  const currentMetrics = await fetchCurrentMetrics();

  for (const rule of alertRules) {
    const value = currentMetrics[rule.metric];
    const isViolated = rule.comparison === 'gt' ? value > rule.threshold : value < rule.threshold;

    if (isViolated) {
      await sendAlert(rule, value);
    }
  }
}
```

---

## 8. Implementation Roadmap

### Phase 1: Foundation (Week 1)

- [ ] Install web-vitals package
- [ ] Implement Web Vitals collection
- [ ] Create Supabase metrics table
- [ ] Set up basic analytics endpoint

### Phase 2: Custom Metrics (Week 2)

- [ ] Implement performance tracker
- [ ] Add API tracking
- [ ] Create custom metrics for key workflows
- [ ] Build dashboard queries

### Phase 3: CI/CD Integration (Week 3)

- [ ] Set up Lighthouse CI
- [ ] Configure bundle size tracking
- [ ] Create performance budgets
- [ ] Set up PR comments

### Phase 4: Alerting & Reporting (Week 4)

- [ ] Configure alert thresholds
- [ ] Set up Slack/webhook notifications
- [ ] Build Grafana dashboard
- [ ] Create weekly reporting automation

---

## 9. Success Criteria

### Technical Metrics

- [ ] 95% of pages pass Core Web Vitals
- [ ] P75 LCP < 1.5s
- [ ] P75 FID < 100ms
- [ ] P75 CLS < 0.1
- [ ] Performance regression detection in CI/CD

### Process Metrics

- [ ] All PRs include performance metrics
- [ ] Weekly performance reports generated
- [ ] Alert system operational
- [ ] Performance budget compliance >90%

---

**Document Version:** 1.0
**Last Updated:** January 17, 2026
**Next Review:** After Phase 1 completion
