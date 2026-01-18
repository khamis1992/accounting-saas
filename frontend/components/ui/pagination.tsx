/**
 * Pagination Component
 *
 * React component for UI functionality
 *
 * @fileoverview Pagination React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import React, { useCallback, memo } from "react";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

/**
 * Performance-optimized Pagination Component
 *
 * Features:
 * - Memoized buttons to prevent unnecessary re-renders
 * - Efficient page range calculation
 * - Accessible navigation
 * - Support for large page counts with ellipsis
 * - Compact variant available
 *
 * @example
 * ```tsx
 * <Pagination
 *   currentPage={1}
 *   totalPages={10}
 *   onPageChange={(page) => setPage(page)}
 *   showFirstLast
 *   showInfo
 * />
 * ```
 */

export interface PaginationProps {
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Total number of pages */
  totalPages: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Total number of items (optional, for info display) */
  totalItems?: number;
  /** Number of items per page (optional, for info display) */
  pageSize?: number;
  /** Show first/last page buttons */
  showFirstLast?: boolean;
  /** Show page info text */
  showInfo?: boolean;
  /** Maximum number of page buttons to show */
  maxVisiblePages?: number;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional className for container */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Custom page range for complex scenarios */
  pageRange?: number[];
  /** Compact mode */
  compact?: boolean;
  /** Alignment */
  align?: "left" | "center" | "right";
}

// Size classes
const sizeClasses = {
  sm: "px-2 py-1 text-sm",
  md: "px-3 py-2",
  lg: "px-4 py-3",
};

// Memoized page button component
const PageButton = memo(
  ({
    page,
    isActive,
    isDisabled,
    onClick,
    size = "md",
    children,
  }: {
    page?: number;
    isActive?: boolean;
    isDisabled?: boolean;
    onClick: () => void;
    size?: "sm" | "md" | "lg";
    children: React.ReactNode;
  }) => {
    return (
      <button
        type="button"
        onClick={onClick}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center justify-center border transition-colors",
          "focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2",
          "dark:focus:ring-zinc-600 dark:focus:ring-offset-zinc-900",
          sizeClasses[size],
          isActive
            ? "bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100"
            : "bg-white text-zinc-700 border-zinc-300 hover:bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600 dark:hover:bg-zinc-700",
          isDisabled && "opacity-50 cursor-not-allowed"
        )}
        aria-current={isActive ? "page" : undefined}
        aria-label={typeof page === "number" ? `Page ${page}` : undefined}
      >
        {children}
      </button>
    );
  }
);
PageButton.displayName = "PageButton";

// Calculate visible page range with ellipsis
function calculatePageRange(
  currentPage: number,
  totalPages: number,
  maxVisible: number = 7
): (number | string)[] {
  // If total pages is less than max visible, show all
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Always show first page
  const pages: (number | string)[] = [1];

  // Calculate range around current page
  const sideCount = Math.floor((maxVisible - 3) / 2); // -3 for first, last, and ellipsis

  if (currentPage <= sideCount + 2) {
    // Current page is near the start
    for (let i = 2; i <= maxVisible - 1; i++) {
      pages.push(i);
    }
    pages.push("...");
    pages.push(totalPages);
  } else if (currentPage >= totalPages - sideCount - 1) {
    // Current page is near the end
    pages.push("...");
    for (let i = totalPages - maxVisible + 2; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    // Current page is in the middle
    pages.push("...");
    for (let i = currentPage - sideCount; i <= currentPage + sideCount; i++) {
      pages.push(i);
    }
    pages.push("...");
    pages.push(totalPages);
  }

  return pages;
}

// Pagination info component
const PaginationInfo = memo(
  ({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    size = "md",
  }: {
    currentPage: number;
    totalPages: number;
    totalItems?: number;
    pageSize?: number;
    size?: "sm" | "md" | "lg";
  }) => {
    if (totalItems && pageSize) {
      const startItem = (currentPage - 1) * pageSize + 1;
      const endItem = Math.min(currentPage * pageSize, totalItems);

      return (
        <p
          className={cn(
            "text-zinc-600 dark:text-zinc-400",
            size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm"
          )}
        >
          Showing {startItem} to {endItem} of {totalItems} results
        </p>
      );
    }

    return (
      <p
        className={cn(
          "text-zinc-600 dark:text-zinc-400",
          size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm"
        )}
      >
        Page {currentPage} of {totalPages}
      </p>
    );
  }
);
PaginationInfo.displayName = "PaginationInfo";

// Main pagination component
export const Pagination = memo(
  ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    pageSize,
    showFirstLast = true,
    showInfo = true,
    maxVisiblePages = 7,
    size = "md",
    className,
    disabled = false,
    pageRange,
    compact = false,
    align = "right",
  }: PaginationProps) => {
    // Navigation handlers
    const goToFirst = useCallback(() => {
      if (!disabled && currentPage > 1) {
        onPageChange(1);
      }
    }, [currentPage, onPageChange, disabled]);

    const goToLast = useCallback(() => {
      if (!disabled && currentPage < totalPages) {
        onPageChange(totalPages);
      }
    }, [currentPage, totalPages, onPageChange, disabled]);

    const goToPrevious = useCallback(() => {
      if (!disabled && currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    }, [currentPage, onPageChange, disabled]);

    const goToNext = useCallback(() => {
      if (!disabled && currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    }, [currentPage, totalPages, onPageChange, disabled]);

    const goToPage = useCallback(
      (page: number) => {
        if (!disabled && page >= 1 && page <= totalPages && page !== currentPage) {
          onPageChange(page);
        }
      },
      [currentPage, totalPages, onPageChange, disabled]
    );

    // Calculate page range
    const visiblePages = React.useMemo(() => {
      if (pageRange) return pageRange;
      return calculatePageRange(currentPage, totalPages, maxVisiblePages);
    }, [currentPage, totalPages, maxVisiblePages, pageRange]);

    // Alignment classes
    const alignClasses = {
      left: "justify-start",
      center: "justify-center",
      right: "justify-end",
    };

    // Early return if no pages
    if (totalPages <= 1) {
      return showInfo && totalItems ? (
        <div className={cn("flex items-center", alignClasses[align], className)}>
          <PaginationInfo
            currentPage={1}
            totalPages={1}
            totalItems={totalItems}
            pageSize={pageSize}
            size={size}
          />
        </div>
      ) : null;
    }

    return (
      <div className={cn("flex items-center gap-4", alignClasses[align], className)}>
        {/* Page Info */}
        {showInfo && !compact && (
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            size={size}
          />
        )}

        {/* Navigation Buttons */}
        <nav className="flex items-center gap-1" aria-label="Pagination">
          {showFirstLast && (
            <PageButton
              onClick={goToFirst}
              isDisabled={disabled || currentPage <= 1}
              size={size}
              aria-label="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </PageButton>
          )}

          <PageButton
            onClick={goToPrevious}
            isDisabled={disabled || currentPage <= 1}
            size={size}
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </PageButton>

          {/* Page Numbers */}
          {!compact && (
            <div className="flex items-center gap-1">
              {visiblePages.map((page, index) => {
                if (typeof page === "string") {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className={cn(
                        "px-2 text-zinc-400 dark:text-zinc-600",
                        size === "sm" ? "text-sm" : size === "lg" ? "text-base" : "text-sm"
                      )}
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <PageButton
                    key={page}
                    page={page}
                    isActive={page === currentPage}
                    isDisabled={disabled}
                    onClick={() => goToPage(page)}
                    size={size}
                  >
                    {page}
                  </PageButton>
                );
              })}
            </div>
          )}

          {showFirstLast && (
            <PageButton
              onClick={goToNext}
              isDisabled={disabled || currentPage >= totalPages}
              size={size}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </PageButton>
          )}

          {showFirstLast && (
            <PageButton
              onClick={goToLast}
              isDisabled={disabled || currentPage >= totalPages}
              size={size}
              aria-label="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </PageButton>
          )}
        </nav>

        {/* Compact page info */}
        {compact && showInfo && (
          <PaginationInfo
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            size={size}
          />
        )}
      </div>
    );
  }
);

Pagination.displayName = "Pagination";

/**
 * Compact pagination component for smaller spaces
 */
export const CompactPagination = memo((props: Omit<PaginationProps, "compact">) => {
  return <Pagination {...props} compact />;
});

CompactPagination.displayName = "CompactPagination";

/**
 * Simple pagination with just prev/next buttons
 */
export const SimplePagination = memo(
  ({
    currentPage,
    totalPages,
    onPageChange,
    disabled = false,
    className,
  }: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    className?: string;
  }) => {
    const goToPrevious = useCallback(() => {
      if (!disabled && currentPage > 1) {
        onPageChange(currentPage - 1);
      }
    }, [currentPage, onPageChange, disabled]);

    const goToNext = useCallback(() => {
      if (!disabled && currentPage < totalPages) {
        onPageChange(currentPage + 1);
      }
    }, [currentPage, totalPages, onPageChange, disabled]);

    return (
      <div className={cn("flex items-center justify-between", className)}>
        <button
          onClick={goToPrevious}
          disabled={disabled || currentPage <= 1}
          className="px-3 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-sm text-zinc-600 dark:text-zinc-400">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goToNext}
          disabled={disabled || currentPage >= totalPages}
          className="px-3 py-2 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  }
);

SimplePagination.displayName = "SimplePagination";
