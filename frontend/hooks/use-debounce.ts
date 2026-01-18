/**
 * UseDebounce.ts Hook
 *
 * Custom React hook for Custom React hook functionality
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
import { useState, useEffect } from "react";

/**
 * useDebounce Hook
 *
 * Debounces a value, delaying updates until after a specified delay.
 * Critical for search inputs to prevent excessive re-renders and API calls.
 *
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 *
 * @example
 * ```tsx
 * const [search, setSearch] = useState('');
 * const debouncedSearch = useDebounce(search, 300);
 *
 * useEffect(() => {
 *   // This only runs 300ms after search stops changing
 *   performSearch(debouncedSearch);
 * }, [debouncedSearch]);
 * ```
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set up timeout to update debounced value
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cleanup timeout if value changes before delay expires
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * useDebounceCallback Hook
 *
 * Returns a debounced version of the provided callback function.
 * Useful for debouncing event handlers directly.
 *
 * @param callback - The function to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced callback function
 *
 * @example
 * ```tsx
 * const handleChange = useDebounceCallback((value: string) => {
 *   performSearch(value);
 * }, 300);
 *
 * <input onChange={(e) => handleChange(e.target.value)} />
 * ```
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 300
): T {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [timeoutId]);

  return ((...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const newTimeoutId = setTimeout(() => {
      callback(...args);
    }, delay);

    setTimeoutId(newTimeoutId);
  }) as T;
}
