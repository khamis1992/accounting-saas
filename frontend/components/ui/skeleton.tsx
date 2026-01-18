/**
 * Skeleton Component
 *
 * Skeleton placeholder components to use during content loading
 * Provides better perceived performance compared to spinners
 */

import React from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800 ${className}`}
      {...props}
    />
  );
}

/**
 * Table Skeleton
 *
 * Placeholder for table content
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-10 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Card Skeleton
 *
 * Placeholder for card-based content
 */
export function CardSkeleton({
  hasHeader = true,
  hasImage = false,
  lines = 3,
}: {
  hasHeader?: boolean;
  hasImage?: boolean;
  lines?: number;
}) {
  return (
    <div className="space-y-4 rounded-lg border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
      {hasHeader && (
        <div className="space-y-2">
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}

      {hasImage && <Skeleton className="h-48 w-full" />}

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4" style={{ width: `${Math.max(60, 100 - i * 10)}%` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * List Skeleton
 *
 * Placeholder for list items
 */
export function ListSkeleton({
  items = 5,
  hasAvatar = true,
  lines = 2,
}: {
  items?: number;
  hasAvatar?: boolean;
  lines?: number;
}) {
  return (
    <div className="space-y-4">
      {Array.from({ length: items }).map((_, itemIndex) => (
        <div key={itemIndex} className="flex items-start space-x-4">
          {hasAvatar && <Skeleton className="h-12 w-12 rounded-full" />}

          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            {Array.from({ length: lines - 1 }).map((_, lineIndex) => (
              <Skeleton
                key={lineIndex}
                className="h-4"
                style={{ width: `${Math.max(40, 100 - lineIndex * 15)}%` }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Chart Skeleton
 *
 * Placeholder for chart content
 */
export function ChartSkeleton({
  hasLegend = true,
  height = 300,
}: {
  hasLegend?: boolean;
  height?: number;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2" style={{ height: `${height}px` }}>
        {/* Y-axis labels */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-full flex-1" />
        </div>

        {/* X-axis */}
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-8" />
          <div className="flex flex-1 justify-between">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-12" />
            ))}
          </div>
        </div>
      </div>

      {hasLegend && (
        <div className="flex justify-center space-x-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Form Skeleton
 *
 * Placeholder for form content
 */
export function FormSkeleton({
  fieldCount = 4,
  hasActions = true,
}: {
  fieldCount?: number;
  hasActions?: boolean;
}) {
  return (
    <div className="space-y-6">
      {Array.from({ length: fieldCount }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}

      {hasActions && (
        <div className="flex space-x-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </div>
  );
}

/**
 * Page Skeleton
 *
 * Placeholder for full page content with header
 */
export function PageSkeleton({
  hasHeader = true,
  hasFilters = true,
  children,
}: {
  hasHeader?: boolean;
  hasFilters?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {hasHeader && (
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
      )}

      {hasFilters && (
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-64" />
        </div>
      )}

      {children || <TableSkeleton />}
    </div>
  );
}

/**
 * Stats Skeleton
 *
 * Placeholder for stats cards
 */
export function StatsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="pb-2">
            <Skeleton className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-32 mb-2" />
            <Skeleton className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-40" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

/**
 * Table Skeleton Loader
 *
 * Specialized table skeleton with loading indicator
 */
export function TableSkeletonLoader({
  columns = 4,
  rows = 5,
  message = "Loading data...",
}: {
  columns?: number;
  rows?: number;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="w-full max-w-md">
        <TableSkeleton columns={columns} rows={rows} />
        <p className="text-center text-sm text-zinc-500 mt-4">{message}</p>
      </div>
    </div>
  );
}
