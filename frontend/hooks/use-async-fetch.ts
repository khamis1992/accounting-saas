/**
 * Custom hook for async operations with fetch API
 *
 * Provides type-safe fetch wrapper with automatic abort on unmount.
 */

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { AsyncState, RequestOptions } from "@/types";
import { handleApiError } from "@/lib/errors";

interface UseAsyncFetchOptions<T> {
  initialData?: T | null;
  executeOnMount?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

interface UseAsyncFetchReturn<T> extends AsyncState<T> {
  execute: (url: string, options?: RequestOptions) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for type-safe fetch requests with automatic cleanup
 */
export function useAsyncFetch<T = unknown>(
  options: UseAsyncFetchOptions<T> = {}
): UseAsyncFetchReturn<T> {
  const { initialData = null, executeOnMount = false, onSuccess, onError } = options;

  const [state, setState] = useState<AsyncState<T>>({
    data: initialData,
    loading: false,
    error: null,
  });

  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(
    async (url: string, fetchOptions: RequestOptions = {}) => {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create abort controller
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      // Merge abort signal
      const options = {
        ...fetchOptions,
        signal: abortController.signal,
      };

      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const response = await fetch(url, options);

        if (!response.ok) {
          await handleApiError(response);
        }

        const data: T = await response.json();

        if (isMountedRef.current && !abortController.signal.aborted) {
          setState({
            data,
            loading: false,
            error: null,
          });
          onSuccess?.(data);
        }
      } catch (error) {
        if (isMountedRef.current && !abortController.signal.aborted) {
          const errorObj = error instanceof Error ? error : new Error(String(error));
          setState({
            data: null,
            loading: false,
            error: errorObj,
          });
          onError?.(errorObj);
        }
      } finally {
        abortControllerRef.current = null;
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setState({
      data: initialData,
      loading: false,
      error: null,
    });
  }, [initialData]);

  return {
    ...state,
    execute,
    reset,
  };
}

/**
 * Hook for fetch with automatic execution on mount
 */
export function useImmediateFetch<T = unknown>(
  url: string,
  options?: UseAsyncFetchOptions<T> & RequestOptions
): UseAsyncFetchReturn<T> {
  const { executeOnMount = true, ...fetchOptions } = options || {};
  const result = useAsyncFetch<T>({
    ...options,
    executeOnMount: false,
  });

  useEffect(() => {
    if (executeOnMount && url) {
      result.execute(url, fetchOptions);
    }
  }, [url]); // Only re-run if URL changes

  return result;
}
