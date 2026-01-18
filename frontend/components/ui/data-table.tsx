/**
 * DataTable Component
 *
 * React component for UI functionality
 *
 * @fileoverview DataTable React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import React, { useState, useCallback, useMemo, memo, forwardRef, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

/**
 * Performance-optimized Data Table Component
 *
 * Features:
 * - Memoized cells to prevent unnecessary re-renders
 * - Optional virtualization for large datasets
 * - Built-in pagination support
 * - Efficient sorting and filtering
 * - Accessible markup
 *
 * @example
 * ```tsx
 * <DataTable
 *   data={invoices}
 *   columns={[
 *     { key: 'id', header: 'ID', cell: (row) => row.id },
 *     { key: 'name', header: 'Name', cell: (row) => row.name },
 *   ]}
 *   pagination
 *   pageSize={50}
 *   sortable
 * />
 * ```
 */

export interface ColumnDef<T> {
  /** Unique key for the column */
  key: string;
  /** Header content */
  header:
    | React.ReactNode
    | ((props: { sort?: "asc" | "desc" | null; onSort?: () => void }) => React.ReactNode);
  /** Render function for cell content */
  cell: (row: T, index: number) => React.ReactNode;
  /** Column width */
  width?: string | number;
  /** Minimum column width */
  minWidth?: string | number;
  /** Enable sorting for this column */
  sortable?: boolean;
  /** CSS class name for header */
  headerClassName?: string;
  /** CSS class name for cells */
  cellClassName?: string;
  /** Alignment */
  align?: "left" | "center" | "right";
}

export interface DataTableProps<T> {
  /** Data array to display */
  data: T[];
  /** Column definitions */
  columns: ColumnDef<T>[];
  /** Unique key selector for rows */
  getRowId?: (item: T, index: number) => string;
  /** Enable virtualization for large datasets */
  virtualized?: boolean;
  /** Fixed row height for virtualization (required if virtualized) */
  rowHeight?: number;
  /** Container height for virtualization */
  height?: number | string;
  /** Enable pagination */
  pagination?: boolean;
  /** Initial page size */
  pageSize?: number;
  /** Enable sorting */
  sortable?: boolean;
  /** Enable row selection */
  selectable?: boolean;
  /** Selected row IDs */
  selectedIds?: Set<string>;
  /** onSelectionChange callback */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /** Empty state message */
  emptyMessage?: string;
  /** Loading state */
  loading?: boolean;
  /** Custom loading state */
  loadingState?: React.ReactNode;
  /** Custom empty state */
  emptyState?: React.ReactNode;
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Row className */
  rowClassName?: string | ((row: T, index: number) => string);
  /** Table container className */
  className?: string;
  /** Sticky header */
  stickyHeader?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Borderless */
  borderless?: boolean;
  /** Hover effect on rows */
  hoverable?: boolean;
  /** Striped rows */
  striped?: boolean;
  /** onSort callback (controlled) */
  onSort?: (column: string, direction: "asc" | "desc" | null) => void;
  /** Current sort column */
  sortColumn?: string;
  /** Current sort direction */
  sortDirection?: "asc" | "desc" | null;
}

interface SortState {
  column: string | null;
  direction: "asc" | "desc" | null;
}

// Memoized cell component
const TableCellInner = <T,>({
  row,
  column,
  index,
}: {
  row: T;
  column: ColumnDef<T>;
  index: number;
}) => {
  const content = column.cell(row, index);
  const alignClass =
    column.align === "center"
      ? "text-center"
      : column.align === "right"
        ? "text-right"
        : "text-left";

  return <td className={cn("px-4 py-3", column.cellClassName, alignClass)}>{content}</td>;
};

// Use a wrapper to properly type the memo
const TableCell = memo(TableCellInner) as <T>(props: {
  row: T;
  column: ColumnDef<T>;
  index: number;
}) => React.JSX.Element;
(TableCell as any).displayName = "TableCell";

// Memoized row component
const TableRowInner = <T,>({
  row,
  columns,
  index,
  getRowId,
  selected,
  selectable,
  onSelectionChange,
  onRowClick,
  rowClassName,
  hoverable,
  striped,
}: {
  row: T;
  columns: ColumnDef<T>[];
  index: number;
  getRowId?: (item: T, index: number) => string;
  selected?: boolean;
  selectable?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  hoverable?: boolean;
  striped?: boolean;
}) => {
  const rowId = getRowId?.(row, index) || String(index);

  const handleClick = useCallback(() => {
    onRowClick?.(row, index);
  }, [row, index, onRowClick]);

  const handleSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onSelectionChange?.(rowId, e.target.checked);
    },
    [rowId, onSelectionChange]
  );

  const className = typeof rowClassName === "function" ? rowClassName(row, index) : rowClassName;

  return (
    <tr
      className={cn(
        "border-b transition-colors",
        hoverable && "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer",
        striped && index % 2 === 0 && "bg-zinc-50/50 dark:bg-zinc-800/30",
        selected && "bg-zinc-100 dark:bg-zinc-800",
        className
      )}
      onClick={handleClick}
    >
      {selectable && (
        <td className="px-4 py-3 w-12">
          <input
            type="checkbox"
            checked={selected}
            onChange={handleSelect}
            onClick={(e) => e.stopPropagation()}
            className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:text-zinc-100"
          />
        </td>
      )}
      {columns.map((column) => (
        <TableCell key={column.key} row={row} column={column} index={index} />
      ))}
    </tr>
  );
};

const TableRow = memo(TableRowInner) as <T>(props: {
  row: T;
  columns: ColumnDef<T>[];
  index: number;
  getRowId?: (item: T, index: number) => string;
  selected?: boolean;
  selectable?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  hoverable?: boolean;
  striped?: boolean;
}) => React.JSX.Element;
(TableRow as any).displayName = "TableRow";

// Virtualized list version
interface VirtualizedTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  rowHeight: number;
  height: number;
  getRowId?: (item: T, index: number) => string;
  onRowClick?: (row: T, index: number) => void;
  rowClassName?: string | ((row: T, index: number) => string);
  selectedIds?: Set<string>;
  selectable?: boolean;
  onSelectionChange?: (id: string, selected: boolean) => void;
  hoverable?: boolean;
  striped?: boolean;
}

const VirtualizedTableBodyInner = <T,>(props: VirtualizedTableProps<T>) => {
  const {
    data,
    columns,
    rowHeight,
    height,
    getRowId,
    onRowClick,
    rowClassName,
    selectedIds,
    selectable,
    onSelectionChange,
    hoverable,
    striped,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const overscan = 5;

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const start = Math.max(0, Math.floor(scrollTop / rowHeight) - overscan);
    const visibleCount = Math.ceil(height / rowHeight);
    const end = Math.min(data.length - 1, start + visibleCount + overscan * 2);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, rowHeight, height, data.length, overscan]);

  const totalHeight = data.length * rowHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const visibleData = useMemo(() => {
    return data.slice(startIndex, endIndex + 1);
  }, [data, startIndex, endIndex]);

  return (
    <div ref={containerRef} className="overflow-auto" style={{ height }} onScroll={handleScroll}>
      <div style={{ height: totalHeight, position: "relative" }}>
        {visibleData.map((row, i) => {
          const index = startIndex + i;
          const rowId = getRowId?.(row, index) || String(index);
          const selected = selectedIds?.has(rowId);

          return (
            <div
              key={rowId}
              className={cn(
                "flex items-center border-b transition-colors",
                hoverable && "hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer",
                striped && index % 2 === 0 && "bg-zinc-50/50 dark:bg-zinc-800/30",
                selected && "bg-zinc-100 dark:bg-zinc-800",
                typeof rowClassName === "function" ? rowClassName(row, index) : rowClassName
              )}
              style={{
                position: "absolute",
                top: index * rowHeight,
                left: 0,
                right: 0,
                height: rowHeight,
              }}
              onClick={() => onRowClick?.(row, index)}
            >
              {selectable && (
                <div className="px-4 py-3 w-12 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={(e) => onSelectionChange?.(rowId, e.target.checked)}
                    onClick={(e) => e.stopPropagation()}
                    className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:text-zinc-100"
                  />
                </div>
              )}
              {columns.map((column, colIndex) => {
                const alignClass =
                  column.align === "center"
                    ? "justify-center text-center"
                    : column.align === "right"
                      ? "justify-end text-right"
                      : "justify-start text-left";

                return (
                  <div
                    key={column.key}
                    className={cn("px-4 py-3 flex-shrink-0", column.cellClassName, alignClass)}
                    style={{
                      width: column.width || column.minWidth,
                      flex: column.width ? undefined : 1,
                    }}
                  >
                    {column.cell(row, index)}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const VirtualizedTableBody = memo(VirtualizedTableBodyInner) as <T>(
  props: VirtualizedTableProps<T>
) => React.JSX.Element;
(VirtualizedTableBody as any).displayName = "VirtualizedTableBody";

// Main DataTable component
function DataTableInner<T>(props: DataTableProps<T>, ref: React.ForwardedRef<HTMLTableElement>) {
  const {
    data,
    columns,
    getRowId,
    virtualized = false,
    rowHeight = 50,
    height = 400,
    pagination = false,
    pageSize = 50,
    sortable: globalSortable = false,
    selectable = false,
    selectedIds = new Set(),
    onSelectionChange,
    emptyMessage = "No data available",
    loading = false,
    loadingState,
    emptyState,
    onRowClick,
    rowClassName,
    className,
    stickyHeader = false,
    compact = false,
    borderless = false,
    hoverable = false,
    striped = false,
    onSort,
    sortColumn: controlledSortColumn,
    sortDirection: controlledSortDirection,
  } = props;

  const [internalSort, setInternalSort] = useState<SortState>({
    column: null,
    direction: null,
  });

  const [currentPage, setCurrentPage] = useState(1);

  // Use controlled or uncontrolled sort state
  const sortState = onSort
    ? { column: controlledSortColumn ?? null, direction: controlledSortDirection ?? null }
    : internalSort;

  // Handle sort
  const handleSort = useCallback(
    (columnKey: string) => {
      let newDirection: "asc" | "desc" | null = "asc";

      if (sortState.column === columnKey) {
        if (sortState.direction === "asc") {
          newDirection = "desc";
        } else if (sortState.direction === "desc") {
          newDirection = null;
        }
      }

      if (onSort) {
        onSort(columnKey, newDirection);
      } else {
        setInternalSort({ column: columnKey, direction: newDirection });
      }
    },
    [sortState, onSort]
  );

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortState.column || !sortState.direction) {
      return data;
    }

    const column = columns.find((c) => c.key === sortState.column);
    if (!column) return data;

    return [...data].sort((a, b) => {
      const aVal = column.cell(a, 0);
      const bVal = column.cell(b, 0);

      if (typeof aVal === "number" && typeof bVal === "number") {
        return sortState.direction === "asc" ? aVal - bVal : bVal - aVal;
      }

      const aStr = String(aVal ?? "");
      const bStr = String(bVal ?? "");

      return sortState.direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
    });
  }, [data, columns, sortState]);

  // Paginated data
  const paginatedData = useMemo(() => {
    if (!pagination) return sortedData;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, pagination, currentPage, pageSize]);

  // Pagination metadata
  const paginationMeta = useMemo(() => {
    if (!pagination) return null;

    const totalPages = Math.ceil(sortedData.length / pageSize);
    return {
      currentPage,
      totalPages,
      totalItems: sortedData.length,
      startIndex: (currentPage - 1) * pageSize,
      endIndex: Math.min(currentPage * pageSize, sortedData.length),
    };
  }, [pagination, sortedData.length, currentPage, pageSize]);

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === paginatedData.length) {
      onSelectionChange?.(new Set());
    } else {
      const newSelection = new Set(paginatedData.map((row, i) => getRowId?.(row, i) || String(i)));
      onSelectionChange?.(newSelection);
    }
  }, [selectedIds, paginatedData, getRowId, onSelectionChange]);

  const handleSelectRow = useCallback(
    (id: string, selected: boolean) => {
      const newSelection = new Set(selectedIds);
      if (selected) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      onSelectionChange?.(newSelection);
    },
    [selectedIds, onSelectionChange]
  );

  // Render header
  const renderHeader = useCallback(() => {
    return (
      <thead
        className={cn("border-b bg-zinc-50 dark:bg-zinc-900", stickyHeader && "sticky top-0 z-10")}
      >
        <tr>
          {selectable && (
            <th className="px-4 py-3 w-12">
              <input
                type="checkbox"
                checked={paginatedData.length > 0 && selectedIds.size === paginatedData.length}
                onChange={handleSelectAll}
                className="rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500 dark:border-zinc-600 dark:text-zinc-100"
              />
            </th>
          )}
          {columns.map((column) => {
            const isSortable = column.sortable ?? globalSortable;
            const isActive = sortState.column === column.key;
            const SortIcon = sortState.direction === "asc" ? "↑" : "↓";

            return (
              <th
                key={column.key}
                className={cn(
                  "px-4 py-3 text-left text-xs font-medium uppercase text-zinc-500 dark:text-zinc-400",
                  column.headerClassName,
                  isSortable && "cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300",
                  column.align === "center" && "text-center",
                  column.align === "right" && "text-right"
                )}
                style={{ width: column.width, minWidth: column.minWidth }}
                onClick={isSortable ? () => handleSort(column.key) : undefined}
              >
                <div className="flex items-center gap-1">
                  {typeof column.header === "function"
                    ? column.header({
                        sort: isActive ? sortState.direction : null,
                        onSort: isSortable ? () => handleSort(column.key) : undefined,
                      })
                    : column.header}
                  {isSortable && isActive && (
                    <span className="text-zinc-900 dark:text-zinc-100">{SortIcon}</span>
                  )}
                </div>
              </th>
            );
          })}
        </tr>
      </thead>
    );
  }, [
    columns,
    selectable,
    stickyHeader,
    globalSortable,
    sortState,
    handleSort,
    handleSelectAll,
    selectedIds,
    paginatedData.length,
  ]);

  // Render content
  const renderContent = useCallback(() => {
    if (loading) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center">
              {loadingState || <div className="text-zinc-500">Loading...</div>}
            </td>
          </tr>
        </tbody>
      );
    }

    if (paginatedData.length === 0) {
      return (
        <tbody>
          <tr>
            <td colSpan={columns.length + (selectable ? 1 : 0)} className="px-4 py-8 text-center">
              {emptyState || <div className="text-zinc-500">{emptyMessage}</div>}
            </td>
          </tr>
        </tbody>
      );
    }

    return (
      <tbody>
        {paginatedData.map((row, index) => (
          <TableRow
            key={getRowId?.(row, index) || index}
            row={row}
            columns={columns}
            index={index}
            getRowId={getRowId}
            selected={selectedIds.has(getRowId?.(row, index) || String(index))}
            selectable={selectable}
            onSelectionChange={handleSelectRow}
            onRowClick={onRowClick}
            rowClassName={rowClassName}
            hoverable={hoverable}
            striped={striped}
          />
        ))}
      </tbody>
    );
  }, [
    loading,
    loadingState,
    paginatedData,
    columns,
    selectable,
    selectedIds,
    getRowId,
    onRowClick,
    rowClassName,
    hoverable,
    striped,
    handleSelectRow,
    emptyMessage,
    emptyState,
  ]);

  // Render pagination controls
  const renderPagination = useCallback(() => {
    if (!pagination || !paginationMeta) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <div className="text-sm text-zinc-600 dark:text-zinc-400">
          Showing {paginationMeta.startIndex + 1} to {paginationMeta.endIndex} of{" "}
          {paginationMeta.totalItems} results
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={paginationMeta.currentPage === 1}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="px-3 py-1 text-sm">
            Page {paginationMeta.currentPage} of {paginationMeta.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(paginationMeta.totalPages, p + 1))}
            disabled={paginationMeta.currentPage === paginationMeta.totalPages}
            className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  }, [pagination, paginationMeta]);

  // Virtualized version
  if (virtualized) {
    return (
      <div className={cn("border rounded-lg overflow-hidden", className)}>
        <table className="w-full" ref={ref}>
          {renderHeader()}
        </table>
        <VirtualizedTableBody
          data={sortedData}
          columns={columns}
          rowHeight={rowHeight}
          height={typeof height === "number" ? height : 400}
          getRowId={getRowId}
          onRowClick={onRowClick}
          rowClassName={rowClassName}
          selectedIds={selectedIds}
          selectable={selectable}
          onSelectionChange={handleSelectRow}
          hoverable={hoverable}
          striped={striped}
        />
        {renderPagination()}
      </div>
    );
  }

  // Standard version
  return (
    <div className={cn("border rounded-lg overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table
          className={cn("w-full", compact && "text-sm", !borderless && "border-collapse")}
          ref={ref}
        >
          {renderHeader()}
          {renderContent()}
        </table>
      </div>
      {renderPagination()}
    </div>
  );
}

// Export as forwardRef and memo for performance
export const DataTable = memo(forwardRef(DataTableInner)) as <T>(
  props: DataTableProps<T> & { ref?: React.ForwardedRef<HTMLTableElement> }
) => ReturnType<typeof DataTableInner>;

(DataTable as any).displayName = "DataTable";
