/**
 * UsePaginatedData.ts Hook
 *
 * Custom React hook for Custom React hook functionality
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
import { useState, useCallback, useEffect, useMemo } from "react";

/**
 * Pagination metadata interface
 */
export interface PaginationMeta {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Paginated data response interface
 */
export interface PaginatedData<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Fetch function signature for paginated data
 */
export type PaginatedFetchFunction<T> = (params: {
  page: number;
  pageSize: number;
  search?: string;
  [key: string]: any;
}) => Promise<PaginatedData<T>>;

/**
 * Default page sizes for different data types
 */
export const DEFAULT_PAGE_SIZES = {
  table: 50,
  grid: 24,
  list: 20,
  compact: 100,
} as const;

/**
 * usePaginatedData Hook
 *
 * Manages paginated data fetching with caching and optimization.
 * Implements server-side pagination with intelligent page size management.
 *
 * @param fetchFunction - Function to fetch paginated data
 * @param options - Configuration options
 * @returns Paginated data state and control functions
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   meta,
 *   loading,
 *   error,
 *   setPage,
 *   setPageSize,
 *   refresh,
 *   hasNextPage,
 *   hasPreviousPage,
 *   nextPage,
 *   previousPage,
 * } = usePaginatedData(fetchInvoices, {
 *   pageSize: 50,
 *   initialFilters: { status: 'active' },
 *   cacheKey: 'invoices',
 * });
 * ```
 */
export function usePaginatedData<T>(
  fetchFunction: PaginatedFetchFunction<T>,
  options: {
    pageSize?: number;
    initialPage?: number;
    initialFilters?: Record<string, any>;
    cacheKey?: string;
    enabled?: boolean;
    onSuccess?: (data: PaginatedData<T>) => void;
    onError?: (error: Error) => void;
  } = {}
) {
  const {
    pageSize: initialPageSize = 50,
    initialPage = 1,
    initialFilters = {},
    cacheKey,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({
    currentPage: initialPage,
    pageSize: initialPageSize,
    totalPages: 0,
    totalItems: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [currentPageSize, setCurrentPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<Record<string, any>>(initialFilters);

  // Fetch data function
  const fetchData = useCallback(
    async (page?: number, size?: number, filterParams?: Record<string, any>) => {
      if (!enabled) return;

      const targetPage = page ?? currentPage;
      const targetPageSize = size ?? currentPageSize;
      const mergedFilters = { ...filters, ...filterParams };

      setLoading(true);
      setError(null);

      try {
        const result = await fetchFunction({
          page: targetPage,
          pageSize: targetPageSize,
          ...mergedFilters,
        });

        setData(result.data);
        setMeta(result.meta);
        setCurrentPage(targetPage);
        setCurrentPageSize(targetPageSize);
        setFilters(mergedFilters);

        onSuccess?.(result);

        // Cache the result if cacheKey is provided
        if (cacheKey) {
          try {
            sessionStorage.setItem(
              `${cacheKey}_page_${targetPage}`,
              JSON.stringify({ data: result.data, meta: result.meta, timestamp: Date.now() })
            );
          } catch {
            // Ignore storage errors
          }
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Failed to fetch data");
        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);
      }
    },
    [fetchFunction, currentPage, currentPageSize, filters, enabled, cacheKey, onSuccess, onError]
  );

  // Initial fetch and fetch when dependencies change
  useEffect(() => {
    fetchData();
  }, []);

  // Computed values
  const hasNextPage = useMemo(() => meta.currentPage < meta.totalPages, [meta]);
  const hasPreviousPage = useMemo(() => meta.currentPage > 1, [meta]);

  // Control functions
  const setPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= meta.totalPages && page !== currentPage) {
        fetchData(page);
      }
    },
    [currentPage, meta.totalPages, fetchData]
  );

  const setPageSize = useCallback(
    (size: number) => {
      if (size !== currentPageSize) {
        // Reset to first page when changing page size
        fetchData(1, size);
      }
    },
    [currentPageSize, fetchData]
  );

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(currentPage + 1);
    }
  }, [hasNextPage, currentPage, setPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(currentPage - 1);
    }
  }, [hasPreviousPage, setPage]);

  const refresh = useCallback(() => {
    // Clear cache and refetch current page
    if (cacheKey) {
      try {
        sessionStorage.removeItem(`${cacheKey}_page_${currentPage}`);
      } catch {
        // Ignore storage errors
      }
    }
    fetchData();
  }, [cacheKey, currentPage, fetchData]);

  const updateFilters = useCallback(
    (newFilters: Record<string, any>) => {
      // Reset to first page when filters change
      fetchData(1, currentPageSize, { ...newFilters });
    },
    [currentPageSize, fetchData]
  );

  return {
    // Data
    data,
    meta,

    // State
    loading,
    error,
    isEmpty: data.length === 0 && !loading,

    // Computed
    hasNextPage,
    hasPreviousPage,

    // Controls
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    refresh,
    updateFilters,

    // Current state
    currentPage,
    currentPageSize,
    filters,
  };
}

/**
 * useClientSidePagination Hook
 *
 * Provides client-side pagination for already loaded data.
 * Useful for smaller datasets where server-side pagination is not needed.
 *
 * @param allData - Complete dataset to paginate
 * @param options - Configuration options
 * @returns Paginated subset of data and control functions
 *
 * @example
 * ```tsx
 * const {
 *   paginatedData,
 *   meta,
 *   setPage,
 *   setPageSize,
 * } = useClientSidePagination(allCustomers, {
 *   initialPageSize: 20,
 * });
 * ```
 */
export function useClientSidePagination<T>(
  allData: T[],
  options: {
    initialPageSize?: number;
    initialPage?: number;
  } = {}
) {
  const { initialPageSize = 20, initialPage = 1 } = options;

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const meta = useMemo(() => {
    const totalPages = Math.ceil(allData.length / pageSize);
    return {
      currentPage,
      pageSize,
      totalPages,
      totalItems: allData.length,
      hasNextPage: currentPage < totalPages,
      hasPreviousPage: currentPage > 1,
    };
  }, [currentPage, pageSize, allData.length]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return allData.slice(start, end);
  }, [allData, currentPage, pageSize]);

  const nextPage = useCallback(() => {
    if (meta.hasNextPage) {
      setCurrentPage((p) => p + 1);
    }
  }, [meta.hasNextPage]);

  const previousPage = useCallback(() => {
    if (meta.hasPreviousPage) {
      setCurrentPage((p) => p - 1);
    }
  }, [meta.hasPreviousPage]);

  const setPage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= meta.totalPages) {
        setCurrentPage(page);
      }
    },
    [meta.totalPages]
  );

  const updatePageSize = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing size
  }, []);

  return {
    paginatedData,
    meta,
    currentPage,
    pageSize,
    setPage,
    setPageSize: updatePageSize,
    nextPage,
    previousPage,
    hasNextPage: meta.hasNextPage,
    hasPreviousPage: meta.hasPreviousPage,
  };
}
