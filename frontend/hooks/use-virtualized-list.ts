/**
 * UseVirtualizedList.ts Hook
 *
 * Custom React hook for Custom React hook functionality
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
import { useState, useRef, useCallback, useMemo, useEffect } from "react";

/**
 * Configuration for virtualized list
 */
export interface VirtualizedListConfig {
  /**
   * Fixed height of each item in pixels
   * If not provided, will use dynamic measurement
   */
  itemHeight?: number;

  /**
   * Estimated height for dynamic measurement
   */
  estimatedItemHeight?: number;

  /**
   * Number of extra items to render above/below viewport
   * Higher values reduce flickering but increase memory
   */
  overscan?: number;

  /**
   * Enable dynamic height measurement
   */
  measureDynamicHeight?: boolean;
}

/**
 * Item metadata for dynamic height tracking
 */
interface ItemMetadata {
  offset: number;
  size: number;
}

/**
 * useVirtualizedList Hook
 *
 * Implements windowing/virtualization for large lists.
 * Only renders visible items + overscan buffer for optimal performance.
 * Handles both fixed and dynamic item heights.
 *
 * @param itemCount - Total number of items in the list
 * @param config - Virtualization configuration
 * @returns Virtualization state and ref for container
 *
 * @example
 * ```tsx
 * const {
 *   visibleRange,
 *   totalHeight,
 *   getOffsetForIndex,
 *   containerRef,
 *   scrollToIndex,
 * } = useVirtualizedList(1000, {
 *   itemHeight: 50,
 *   overscan: 5,
 * });
 *
 * <div ref={containerRef} style={{ height: '400px', overflow: 'auto' }}>
 *   <div style={{ height: totalHeight }}>
 *     {visibleRange.map((index) => (
 *       <Row
 *         key={index}
 *         style={{
 *           position: 'absolute',
 *           top: getOffsetForIndex(index),
 *           height: 50,
 *         }}
 *       />
 *     ))}
 *   </div>
 * </div>
 * ```
 */
export function useVirtualizedList(itemCount: number, config: VirtualizedListConfig = {}) {
  const {
    itemHeight,
    estimatedItemHeight = 50,
    overscan = 3,
    measureDynamicHeight = false,
  } = config;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Track dynamic item heights
  const itemMetadataCache = useRef<Map<number, ItemMetadata>>(new Map());
  const lastMeasuredIndex = useRef(-1);

  // Compute total height
  const totalHeight = useMemo(() => {
    if (itemHeight) {
      return itemCount * itemHeight;
    }

    // For dynamic heights, sum measured items and estimate remaining
    let totalHeight = 0;
    const cache = itemMetadataCache.current;

    if (lastMeasuredIndex.current >= 0) {
      const lastMeasured = cache.get(lastMeasuredIndex.current);
      if (lastMeasured) {
        totalHeight = lastMeasured.offset + lastMeasured.size;
        totalHeight += (itemCount - lastMeasuredIndex.current - 1) * estimatedItemHeight;
      }
    } else {
      totalHeight = itemCount * estimatedItemHeight;
    }

    return totalHeight;
  }, [itemCount, itemHeight, estimatedItemHeight]);

  // Get item metadata (for dynamic heights)
  const getItemMetadata = useCallback(
    (index: number): ItemMetadata => {
      // Fixed height mode
      if (itemHeight) {
        return {
          offset: index * itemHeight,
          size: itemHeight,
        };
      }

      // Dynamic height mode
      const cache = itemMetadataCache.current;
      const cached = cache.get(index);

      if (cached) {
        return cached;
      }

      // Find the last measured item
      let metadata: ItemMetadata;
      if (lastMeasuredIndex.current >= 0 && index <= lastMeasuredIndex.current) {
        // Should have been in cache, but compute as fallback
        const lastMeasured = cache.get(lastMeasuredIndex.current);
        if (lastMeasured) {
          metadata = {
            offset: index * estimatedItemHeight,
            size: estimatedItemHeight,
          };
        } else {
          metadata = {
            offset: index * estimatedItemHeight,
            size: estimatedItemHeight,
          };
        }
      } else {
        // Estimate for unmeasured items
        const lastMeasured = cache.get(lastMeasuredIndex.current);
        const offset = lastMeasured ? lastMeasured.offset + lastMeasured.size : 0;
        metadata = {
          offset: offset + (index - lastMeasuredIndex.current - 1) * estimatedItemHeight,
          size: estimatedItemHeight,
        };
      }

      return metadata;
    },
    [itemHeight, estimatedItemHeight]
  );

  // Get offset for a specific item index
  const getOffsetForIndex = useCallback(
    (index: number) => {
      return getItemMetadata(index).offset;
    },
    [getItemMetadata]
  );

  // Find the start index for a given offset
  const findStartIndex = useCallback(
    (offset: number): number => {
      if (itemHeight) {
        return Math.floor(offset / itemHeight);
      }

      // Binary search for dynamic heights
      let low = 0;
      let high = lastMeasuredIndex.current;

      while (low < high) {
        const mid = Math.floor((low + high) / 2);
        const metadata = getItemMetadata(mid);

        if (metadata.offset < offset) {
          low = mid + 1;
        } else {
          high = mid;
        }
      }

      return low;
    },
    [itemHeight, getItemMetadata]
  );

  // Compute visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.max(0, findStartIndex(scrollTop) - overscan);
    const endIndex = Math.min(
      itemCount - 1,
      findStartIndex(scrollTop + containerHeight) + overscan
    );

    return Array.from({ length: endIndex - startIndex + 1 }, (_, i) => startIndex + i);
  }, [scrollTop, containerHeight, itemCount, overscan, findStartIndex]);

  // Handle scroll events with throttling
  const scrollHandler = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Resize observer for container height
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Set initial height
    setContainerHeight(container.clientHeight);

    // Observe container size changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Register dynamic item height
  const registerItemHeight = useCallback(
    (index: number, height: number) => {
      if (!measureDynamicHeight || itemHeight) return;

      const cache = itemMetadataCache.current;
      const existing = cache.get(index);

      if (!existing || existing.size !== height) {
        const metadata: ItemMetadata = {
          offset:
            index > 0 ? getItemMetadata(index - 1).offset + getItemMetadata(index - 1).size : 0,
          size: height,
        };

        cache.set(index, metadata);

        if (index > lastMeasuredIndex.current) {
          lastMeasuredIndex.current = index;
        }

        // Update offsets for subsequent items
        for (let i = index + 1; i <= lastMeasuredIndex.current; i++) {
          const prev = cache.get(i - 1);
          if (prev) {
            cache.set(i, {
              offset: prev.offset + prev.size,
              size: cache.get(i)?.size || estimatedItemHeight,
            });
          }
        }
      }
    },
    [measureDynamicHeight, itemHeight, estimatedItemHeight, getItemMetadata]
  );

  // Scroll to specific index
  const scrollToIndex = useCallback(
    (index: number, align: "start" | "center" | "end" = "start") => {
      const container = containerRef.current;
      if (!container || index < 0 || index >= itemCount) return;

      const metadata = getItemMetadata(index);
      let scrollTop = metadata.offset;

      if (align === "center") {
        scrollTop = metadata.offset - containerHeight / 2 + metadata.size / 2;
      } else if (align === "end") {
        scrollTop = metadata.offset - containerHeight + metadata.size;
      }

      container.scrollTo({
        top: Math.max(0, scrollTop),
        behavior: "smooth",
      });
    },
    [containerHeight, itemCount, getItemMetadata]
  );

  return {
    // State
    visibleRange,
    totalHeight,
    scrollTop,

    // Refs
    containerRef,

    // Methods
    getOffsetForIndex,
    scrollToIndex,
    onScroll: scrollHandler,
    registerItemHeight,

    // Computed
    isVirtualized: itemCount > 100, // Only virtualize for large lists
  };
}

/**
 * useVirtualizedGrid Hook
 *
 * Implements virtualization for grid layouts with multiple columns.
 *
 * @param itemCount - Total number of items
 * @param options - Grid configuration
 * @returns Virtualization state for grid
 *
 * @example
 * ```tsx
 * const { visibleIndices, totalHeight, containerRef } = useVirtualizedGrid(1000, {
 *   columnCount: 4,
 *   itemHeight: 200,
 *   gap: 16,
 * });
 * ```
 */
export function useVirtualizedGrid(
  itemCount: number,
  options: {
    columnCount: number;
    itemHeight: number;
    gap?: number;
    containerWidth?: number;
    overscan?: number;
  }
) {
  const { columnCount, itemHeight, gap = 0, containerWidth = 0, overscan = 2 } = options;

  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);

  // Calculate item width based on container
  const itemWidth = useMemo(() => {
    if (!containerWidth) return 0;
    const totalGap = (columnCount - 1) * gap;
    return (containerWidth - totalGap) / columnCount;
  }, [containerWidth, columnCount, gap]);

  // Calculate rows count
  const rowCount = useMemo(() => {
    return Math.ceil(itemCount / columnCount);
  }, [itemCount, columnCount]);

  // Total height
  const totalHeight = useMemo(() => {
    return rowCount * (itemHeight + gap) - gap;
  }, [rowCount, itemHeight, gap]);

  // Visible rows
  const visibleRange = useMemo(() => {
    const itemsPerScreen = Math.ceil(containerHeight / (itemHeight + gap));
    const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + gap)) - overscan);
    const endRow = Math.min(rowCount - 1, startRow + itemsPerScreen + overscan * 2);

    const indices: number[] = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < columnCount; col++) {
        const index = row * columnCount + col;
        if (index < itemCount) {
          indices.push(index);
        }
      }
    }

    return indices;
  }, [scrollTop, containerHeight, itemHeight, gap, rowCount, itemCount, columnCount, overscan]);

  // Get position for item
  const getItemPosition = useCallback(
    (index: number) => {
      const row = Math.floor(index / columnCount);
      const col = index % columnCount;

      return {
        top: row * (itemHeight + gap),
        left: col * (itemWidth + gap),
        width: itemWidth,
        height: itemHeight,
      };
    },
    [columnCount, itemHeight, itemWidth, gap]
  );

  // Scroll handler
  const scrollHandler = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  // Resize observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setContainerHeight(container.clientHeight);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Scroll to index
  const scrollToIndex = useCallback(
    (index: number) => {
      const container = containerRef.current;
      if (!container || index < 0 || index >= itemCount) return;

      const row = Math.floor(index / columnCount);
      const scrollTop = row * (itemHeight + gap);

      container.scrollTo({
        top: Math.max(0, scrollTop - containerHeight / 2 + itemHeight / 2),
        behavior: "smooth",
      });
    },
    [columnCount, itemHeight, gap, containerHeight, itemCount]
  );

  return {
    visibleIndices: visibleRange,
    totalHeight,
    containerRef,
    getItemPosition,
    scrollToIndex,
    onScroll: scrollHandler,
    itemWidth,
  };
}
