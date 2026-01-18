/**
 * DynamicCharts Component
 *
 * React component for UI functionality
 *
 * @fileoverview DynamicCharts React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { ComponentType, lazy, Suspense, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Dynamic Chart Components with Code Splitting
 *
 * This module provides lazy-loaded versions of heavy chart libraries
 * to reduce initial bundle size. Charts are only loaded when needed.
 *
 * Bundle size impact:
 * - Recharts: ~200KB gzipped
 * - Framer Motion: ~100KB gzipped (when using motion components)
 *
 * Usage:
 * ```tsx
 * import { BarChart, LineChart } from '@/components/ui/dynamic-charts';
 *
 * // These will only load when rendered
 * <BarChart data={data} />
 * ```
 */

// Loading fallback component
const ChartLoader = ({
  size = "md",
  message = "Loading chart...",
}: {
  size?: "sm" | "md" | "lg";
  message?: string;
}) => {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[200px]">
      <div className="flex flex-col items-center gap-3 text-zinc-500">
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        <span className="text-sm">{message}</span>
      </div>
    </div>
  );
};

// Suspense wrapper for charts
const withSuspense = <P extends object>(Component: ComponentType<P>, fallback?: ReactNode) => {
  return (props: P) => (
    <Suspense fallback={fallback || <ChartLoader />}>
      <Component {...props} />
    </Suspense>
  );
};

// Lazy load Recharts components
// These are only loaded when the chart is actually rendered
const RechartsBarChart = lazy(() =>
  import("recharts").then((mod) => ({
    default: (props: any) => {
      const { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } =
        mod;
      const { data, bars, xAxisKey, height, ...rest } = props;
      return (
        <ResponsiveContainer width="100%" height={height || 300}>
          <BarChart data={data} {...rest}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
            <XAxis
              dataKey={xAxisKey || "name"}
              className="text-zinc-600 dark:text-zinc-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis className="text-zinc-600 dark:text-zinc-400" tick={{ fill: "currentColor" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
            {bars?.map((bar: any, i: number) => (
              <Bar
                key={i}
                dataKey={bar.dataKey}
                name={bar.name}
                fill={bar.fill || "hsl(var(--primary))"}
                radius={[8, 8, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      );
    },
  }))
);

const RechartsLineChart = lazy(() =>
  import("recharts").then((mod) => ({
    default: (props: any) => {
      const { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } =
        mod;
      const { data, lines, xAxisKey, height, ...rest } = props;
      return (
        <ResponsiveContainer width="100%" height={height || 300}>
          <LineChart data={data} {...rest}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
            <XAxis
              dataKey={xAxisKey || "name"}
              className="text-zinc-600 dark:text-zinc-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis className="text-zinc-600 dark:text-zinc-400" tick={{ fill: "currentColor" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
            {lines?.map((line: any, i: number) => (
              <Line
                key={i}
                type="monotone"
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.stroke || "hsl(var(--primary))"}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      );
    },
  }))
);

const RechartsPieChart = lazy(() =>
  import("recharts").then((mod) => ({
    default: (props: any) => {
      const { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } = mod;
      const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];
      const { data, dataKey, height, outerRadius, ...rest } = props;
      return (
        <ResponsiveContainer width="100%" height={height || 300}>
          <PieChart {...rest}>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={outerRadius || 80}
              dataKey={dataKey || "value"}
            >
              {data?.map((entry: any, index: number) => (
                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    },
  }))
);

const RechartsAreaChart = lazy(() =>
  import("recharts").then((mod) => ({
    default: (props: any) => {
      const { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } = mod;
      const { data, areas, xAxisKey, height, ...rest } = props;
      return (
        <ResponsiveContainer width="100%" height={height || 300}>
          <AreaChart data={data} {...rest}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-zinc-200 dark:stroke-zinc-800" />
            <XAxis
              dataKey={xAxisKey || "name"}
              className="text-zinc-600 dark:text-zinc-400"
              tick={{ fill: "currentColor" }}
            />
            <YAxis className="text-zinc-600 dark:text-zinc-400" tick={{ fill: "currentColor" }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "0.5rem",
              }}
            />
            {areas?.map((area: any, i: number) => (
              <Area
                key={i}
                type="monotone"
                dataKey={area.dataKey}
                name={area.name}
                fill={area.fill || "hsl(var(--primary))"}
                stroke={area.stroke || "hsl(var(--primary))"}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      );
    },
  }))
);

/**
 * Bar Chart Component
 * Lazy loads recharts BarChart only when rendered
 */
export const BarChart = withSuspense(RechartsBarChart);

/**
 * Line Chart Component
 * Lazy loads recharts LineChart only when rendered
 */
export const LineChart = withSuspense(RechartsLineChart);

/**
 * Pie Chart Component
 * Lazy loads recharts PieChart only when rendered
 */
export const PieChart = withSuspense(RechartsPieChart);

/**
 * Area Chart Component
 * Lazy loads recharts AreaChart only when rendered
 */
export const AreaChart = withSuspense(RechartsAreaChart);

/**
 * Preload chart components
 * Call this to preload charts before they are needed
 * (e.g., when navigating to a reports page)
 */
export const preloadCharts = async () => {
  await Promise.all([import("recharts")]);
};

/**
 * Chart Container Component
 * Provides consistent styling and loading states for all charts
 */
export const ChartContainer = ({
  children,
  title,
  description,
  className,
  loading = false,
}: {
  children: ReactNode;
  title?: string;
  description?: string;
  className?: string;
  loading?: boolean;
}) => {
  return (
    <div className={cn("rounded-lg border bg-white dark:bg-zinc-900", className)}>
      {(title || description) && (
        <div className="border-b px-6 py-4">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && (
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{description}</p>
          )}
        </div>
      )}
      <div className="p-6">{loading ? <ChartLoader /> : children}</div>
    </div>
  );
};

/**
 * Advanced chart builder for custom chart configurations
 * Use this when you need full control over chart configuration
 */
export const AdvancedChart = lazy(() =>
  import("recharts").then((mod) => ({
    default: (props: {
      type: "bar" | "line" | "area" | "pie" | "scatter";
      data: any[];
      config: Record<string, any>;
      className?: string;
    }) => {
      const { type, data, config, className } = props;
      const { ResponsiveContainer } = mod;

      const ChartComponent = (() => {
        switch (type) {
          case "bar":
            return mod.BarChart;
          case "line":
            return mod.LineChart;
          case "area":
            return mod.AreaChart;
          case "pie":
            return mod.PieChart;
          case "scatter":
            return mod.ScatterChart;
          default:
            return mod.BarChart;
        }
      })();

      return (
        <div className={className}>
          <ResponsiveContainer width="100%" height={config.height || 300}>
            <ChartComponent data={data} {...config.chartProps}>
              {config.children}
            </ChartComponent>
          </ResponsiveContainer>
        </div>
      );
    },
  }))
);
