/**
 * FilteredList Component
 *
 * React component for UI functionality
 *
 * @fileoverview FilteredList React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import React, { useState, useCallback, useMemo, memo, useEffect, useRef } from "react";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

/**
 * Performance-optimized Filtered List Component
 *
 * Features:
 * - Debounced search input to prevent excessive filtering
 * - Memoized filtered results
 * - Efficient keyboard navigation
 * - Optional virtualization for large lists
 * - Accessible ARIA attributes
 *
 * @example
 * ```tsx
 * <FilteredList
 *   data={customers}
 *   renderItem={(customer) => (
 *     <div>{customer.name}</div>
 *   )}
 *   filterableFields={['name', 'email']}
 *   placeholder="Search customers..."
 * />
 * ```
 */

export interface FilteredListProps<T> {
  /** Data array to filter */
  data: T[];
  /** Render function for each item */
  renderItem: (item: T, index: number) => React.ReactNode;
  /** Key selector for list rendering */
  getKey?: (item: T, index: number) => string;
  /** Fields to search in (for object data) */
  filterableFields?: (keyof T)[];
  /** Custom filter function */
  filterFn?: (item: T, query: string) => boolean;
  /** Search input placeholder */
  placeholder?: string;
  /** Enable virtualization for large lists */
  virtualized?: boolean;
  /** Item height for virtualization */
  itemHeight?: number;
  /** Container height */
  height?: number | string;
  /** Empty state when no results */
  emptyState?: React.ReactNode;
  /** Loading state */
  loading?: boolean;
  /** Show clear button */
  showClear?: boolean;
  /** Debounce delay for search (ms) */
  debounceDelay?: number;
  /** Minimum characters to trigger search */
  minChars?: number;
  /** Highlight matches in results */
  highlightMatches?: boolean;
  /** Custom search wrapper class */
  searchClassName?: string;
  /** Container className */
  className?: string;
  /** Initial search value */
  initialValue?: string;
  /** onSearch callback */
  onSearchChange?: (query: string) => void;
  /** onFilter callback */
  onFilterChange?: (filtered: T[]) => void;
  /** Selected item tracking */
  selectedIds?: Set<string>;
  /** onSelectionChange callback */
  onSelectionChange?: (item: T, selected: boolean) => void;
  /** Multi-select mode */
  multiSelect?: boolean;
  /** Enable keyboard navigation */
  keyboardNav?: boolean;
}

// Highlight matches component
const HighlightMatches = memo(({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <mark key={i} className="bg-yellow-200 dark:bg-yellow-800 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
});
HighlightMatches.displayName = "HighlightMatches";

// Memoized list item
function FilteredListItem<T>({
  item,
  index,
  renderItem,
  selected,
  onSelect,
  highlightMatches,
  query,
  filterableFields,
}: {
  item: T;
  index: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  highlightMatches?: boolean;
  query?: string;
  filterableFields?: (keyof T)[];
}) {
  const content = renderItem(item, index);

  return (
    <div
      className={cn(
        "px-4 py-3 border-b last:border-b-0 transition-colors",
        "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
        selected && "bg-zinc-100 dark:bg-zinc-800",
        onSelect && "cursor-pointer"
      )}
      onClick={onSelect}
      role="option"
      aria-selected={selected}
    >
      {highlightMatches && query && typeof item === "object" ? (
        // Apply highlighting to object fields
        <>{content}</>
      ) : (
        content
      )}
    </div>
  );
}

// Virtualized list implementation
function VirtualizedList<T>({
  items,
  renderItem,
  itemHeight = 50,
  height,
  getKey,
  selectedIds,
  onSelectionChange,
}: {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight: number;
  height: number | string;
  getKey?: (item: T, index: number) => string;
  selectedIds?: Set<string>;
  onSelectionChange?: (item: T, selected: boolean) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(
    typeof height === "number" ? height : 400
  );

  // Calculate visible range
  const { startIndex, endIndex } = useMemo(() => {
    const overscan = 3;
    const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(items.length - 1, start + visibleCount + overscan * 2);
    return { startIndex: start, endIndex: end };
  }, [scrollTop, itemHeight, containerHeight, items.length]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Update container height on mount
  useEffect(() => {
    if (containerRef.current && typeof height === "string") {
      setContainerHeight(containerRef.current.clientHeight);
    }
  }, [height]);

  return (
    <div
      ref={containerRef}
      className="overflow-auto"
      style={{ height: typeof height === "number" ? height : undefined }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: "relative" }}>
        {items.slice(startIndex, endIndex + 1).map((item, i) => {
          const index = startIndex + i;
          const key = getKey?.(item, index) || String(index);
          const selected = selectedIds?.has(key);

          return (
            <div
              key={key}
              style={{
                position: "absolute",
                top: index * itemHeight,
                left: 0,
                right: 0,
                height: itemHeight,
              }}
            >
              <FilteredListItem
                item={item}
                index={index}
                renderItem={renderItem}
                selected={selected}
                onSelect={() => onSelectionChange?.(item, !selected)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main FilteredList component
export function FilteredList<T>(props: FilteredListProps<T>) {
  const {
    data,
    renderItem,
    getKey,
    filterableFields = [],
    filterFn,
    placeholder = "Search...",
    virtualized = false,
    itemHeight = 50,
    height = 400,
    emptyState,
    loading = false,
    showClear = true,
    debounceDelay = 300,
    minChars = 0,
    highlightMatches = false,
    searchClassName,
    className,
    initialValue = "",
    onSearchChange,
    onFilterChange,
    selectedIds = new Set(),
    onSelectionChange,
    multiSelect = false,
    keyboardNav = true,
  } = props;

  const [searchQuery, setSearchQuery] = useState(initialValue);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search query
  const debouncedQuery = useDebounce(searchQuery, debounceDelay);

  // Filtered data
  const filteredData = useMemo(() => {
    if (!debouncedQuery || debouncedQuery.length < minChars) {
      return data;
    }

    const query = debouncedQuery.toLowerCase();

    return data.filter((item) => {
      // Custom filter function takes precedence
      if (filterFn) {
        return filterFn(item, debouncedQuery);
      }

      // Default filter for objects
      if (typeof item === "object" && item !== null) {
        return filterableFields.some((field) => {
          const value = (item as any)[field];
          if (typeof value === "string") {
            return value.toLowerCase().includes(query);
          }
          if (typeof value === "number") {
            return value.toString().includes(query);
          }
          return false;
        });
      }

      // Default filter for primitives
      return String(item).toLowerCase().includes(query);
    });
  }, [data, debouncedQuery, filterFn, filterableFields, minChars]);

  // Update filter change callback
  useEffect(() => {
    onFilterChange?.(filteredData);
  }, [filteredData, onFilterChange]);

  // Update search change callback
  useEffect(() => {
    onSearchChange?.(debouncedQuery);
  }, [debouncedQuery, onSearchChange]);

  // Handle search input change
  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setFocusedIndex(-1);
  }, []);

  // Clear search
  const handleClear = useCallback(() => {
    setSearchQuery("");
    inputRef.current?.focus();
  }, []);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!keyboardNav) return;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setFocusedIndex((i) => Math.min(i + 1, filteredData.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < filteredData.length) {
            const item = filteredData[focusedIndex];
            const key = getKey?.(item, focusedIndex) || String(focusedIndex);
            onSelectionChange?.(item, !selectedIds.has(key));
          }
          break;
        case "Escape":
          setSearchQuery("");
          break;
      }
    },
    [keyboardNav, filteredData, focusedIndex, getKey, onSelectionChange, selectedIds]
  );

  // Handle item selection
  const handleSelectItem = useCallback(
    (item: T, selected: boolean) => {
      const index = filteredData.indexOf(item);
      const key = getKey?.(item, index) || String(index);
      const currentlySelected = selectedIds.has(key);

      if (!multiSelect) {
        // Clear all selections
        selectedIds.clear();
      }

      if (selected) {
        selectedIds.add(key);
      } else {
        selectedIds.delete(key);
      }

      onSelectionChange?.(item, selected);
    },
    [filteredData, getKey, selectedIds, onSelectionChange, multiSelect]
  );

  // Render list content
  const renderListContent = useCallback(() => {
    if (loading) {
      return <div className="px-4 py-8 text-center text-zinc-500">Loading...</div>;
    }

    if (filteredData.length === 0) {
      return (
        <div className="px-4 py-8 text-center">
          {emptyState || (
            <div className="text-zinc-500">
              {searchQuery ? "No results found" : "No items to display"}
            </div>
          )}
        </div>
      );
    }

    if (virtualized) {
      return (
        <VirtualizedList
          items={filteredData}
          renderItem={renderItem}
          itemHeight={itemHeight}
          height={height}
          getKey={getKey}
          selectedIds={selectedIds}
          onSelectionChange={handleSelectItem}
        />
      );
    }

    return (
      <div
        className={cn(virtualized && "overflow-auto")}
        style={virtualized ? { height } : undefined}
      >
        {filteredData.map((item, index) => {
          const key = getKey?.(item, index) || String(index);
          const selected = selectedIds.has(key);
          const focused = index === focusedIndex;

          return (
            <div
              key={key}
              className={cn(focused && "ring-2 ring-inset ring-zinc-400 dark:ring-zinc-600")}
            >
              <FilteredListItem
                item={item}
                index={index}
                renderItem={renderItem}
                selected={selected}
                onSelect={() => handleSelectItem(item, !selected)}
                highlightMatches={highlightMatches}
                query={debouncedQuery}
                filterableFields={filterableFields}
              />
            </div>
          );
        })}
      </div>
    );
  }, [
    loading,
    filteredData,
    emptyState,
    searchQuery,
    virtualized,
    itemHeight,
    height,
    getKey,
    selectedIds,
    renderItem,
    focusedIndex,
    highlightMatches,
    debouncedQuery,
    filterableFields,
    handleSelectItem,
  ]);

  return (
    <div className={cn("border rounded-lg overflow-hidden bg-white dark:bg-zinc-900", className)}>
      {/* Search Input */}
      <div className={cn("flex items-center gap-2 px-4 py-3 border-b", searchClassName)}>
        <Search className="h-4 w-4 text-zinc-400 flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 bg-transparent outline-none text-sm placeholder:text-zinc-400"
          aria-label="Search"
          role="searchbox"
        />
        {showClear && searchQuery && (
          <button
            onClick={handleClear}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded"
            aria-label="Clear search"
          >
            <X className="h-4 w-4 text-zinc-400" />
          </button>
        )}
      </div>

      {/* List Content */}
      <div
        role="listbox"
        aria-label="Filtered results"
        aria-activedescendant={focusedIndex >= 0 ? `item-${focusedIndex}` : undefined}
      >
        {renderListContent()}
      </div>

      {/* Result count */}
      {!loading && filteredData.length > 0 && (
        <div className="px-4 py-2 border-t text-xs text-zinc-500 dark:text-zinc-400 flex justify-between">
          <span>
            {filteredData.length} result{filteredData.length !== 1 ? "s" : ""}
          </span>
          {searchQuery && <span>filtered from {data.length} total</span>}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for managing filtered list state
 */
export function useFilteredList<T>(initialData: T[] = []) {
  const [data, setData] = useState<T[]>(initialData);
  const [filteredData, setFilteredData] = useState<T[]>(initialData);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const updateData = useCallback((newData: T[]) => {
    setData(newData);
  }, []);

  const toggleSelection = useCallback((key: string, selected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (selected) {
        next.add(key);
      } else {
        next.delete(key);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isAllSelected = useMemo(() => {
    return filteredData.length > 0 && selectedIds.size === filteredData.length;
  }, [filteredData.length, selectedIds.size]);

  return {
    data,
    filteredData,
    setFilteredData,
    searchQuery,
    setSearchQuery,
    selectedIds,
    setSelectedIds,
    updateData,
    toggleSelection,
    clearSelection,
    isAllSelected,
  };
}
