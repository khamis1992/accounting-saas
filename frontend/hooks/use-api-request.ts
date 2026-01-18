/**
 * Custom hook for API requests with automatic cleanup and cancellation
 *
 * Prevents memory leaks by cancelling requests when component unmounts.
 * Provides consistent error handling and loading states.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { AsyncState } from "@/types";
import { handleError } from "@/lib/errors";

interface UseApiRequestOptions<T> {
  initialData?: T | null;
  executeOnMount?: boolean;
  onError?: (error: Error) => void;
  onSuccess?: (data: T) => void;
}

interface UseApiRequestReturn<T> extends AsyncState<T> {
  execute: (...args: unknown[]) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing API requests with automatic cleanup
 */
export function useApiRequest<T = unknown>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options: UseApiRequestOptions<T> = {}
): UseApiRequestReturn<T> {
  const { initialData = null, executeOnMount = false, onError, onSuccess } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(
    async (...args: unknown[]) => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Update state to loading
      if (isMountedRef.current) {
        setState({
          data: state.data,
          loading: true,
          error: null,
        });
      }

      try {
        // Execute the async function with abort signal
        const result = await asyncFunction(...args);

        // Update state if component is still mounted
        if (isMountedRef.current && !abortController.signal.aborted) {
          setState({
            data: result,
            loading: false,
            error: null,
          });
          onSuccess?.(result);
        }
      } catch (error) {
        // Only update state if error wasn't due to abort
        if (isMountedRef.current && !abortController.signal.aborted) {
          const appError = handleError(error);
          setState({
            data: null,
            loading: false,
            error: appError,
          });
          onError?.(appError);
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [asyncFunction, state.data, onError, onSuccess]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  // Execute on mount if requested
  useEffect(() => {
    if (executeOnMount) {
      execute();
    }
  }, [executeOnMount]); // Only run when executeOnMount changes

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for API requests with manual trigger
 */
export function useLazyApiRequest<T = unknown>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options?: UseApiRequestOptions<T>
): UseApiRequestReturn<T> {
  return useApiRequest(asyncFunction, { ...options, executeOnMount: false });
}

/**
 * Hook for API requests that run immediately on mount
 */
export function useImmediateApiRequest<T = unknown>(
  asyncFunction: (...args: unknown[]) => Promise<T>,
  options?: Omit<UseApiRequestOptions<T>, "executeOnMount">
): UseApiRequestReturn<T> {
  return useApiRequest(asyncFunction, { ...options, executeOnMount: true });
}
