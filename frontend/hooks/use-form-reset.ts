/**
 * Form Utilities
 *
 * Utilities for form handling including reset, optimistic updates,
 * and submission state management
 */

import { useState, useCallback, useRef } from "react";
import logger from "@/lib/logger";

export interface FormResetOptions {
  /** Delay before resetting form (for showing success state) */
  delay?: number;
  /** Callback to run after reset */
  onSuccess?: () => void;
  /** Whether to reset to initial values or empty */
  resetToInitial?: boolean;
}

/**
 * Hook for managing form reset with success feedback
 */
export function useFormReset<T extends Record<string, unknown>>(
  initialValues: T,
  options: FormResetOptions = {}
) {
  const { delay = 1500, onSuccess, resetToInitial = true } = options;
  const [isResetting, setIsResetting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const initialValuesRef = useRef(initialValues);

  const resetForm = useCallback(() => {
    setIsResetting(true);
    setShowSuccess(true);

    setTimeout(() => {
      setShowSuccess(false);
      setIsResetting(false);
      onSuccess?.();
    }, delay);
  }, [delay, onSuccess]);

  const resetToValues = useCallback((values: T) => {
    initialValuesRef.current = values;
  }, []);

  const getResetValues = useCallback(() => {
    return resetToInitial ? initialValuesRef.current : ({} as T);
  }, [resetToInitial]);

  return {
    isResetting,
    showSuccess,
    resetForm,
    resetToValues,
    getResetValues,
  };
}

/**
 * Hook for optimistic UI updates
 */
export interface OptimisticUpdateOptions<T> {
  /** Current data */
  data: T[];
  /** ID field for identifying items */
  idField?: string;
}

export interface OptimisticState<T> {
  data: T[];
  isPending: boolean;
  error: Error | null;
  pendingId: string | null;
}

export function useOptimisticUpdate<T extends Record<string, unknown>>(
  options: OptimisticUpdateOptions<T>
) {
  const { data: initialData, idField = "id" } = options;
  const [state, setState] = useState<OptimisticState<T>>({
    data: initialData,
    isPending: false,
    error: null,
    pendingId: null,
  });

  const addOptimistic = useCallback((item: T, tempId: string) => {
    setState((prev) => ({
      ...prev,
      data: [...prev.data, item],
      isPending: true,
      pendingId: tempId,
    }));
    return tempId;
  }, []);

  const updateOptimistic = useCallback(
    (itemId: string, updates: Partial<T>) => {
      setState((prev) => ({
        ...prev,
        data: prev.data.map((item) => (item[idField] === itemId ? { ...item, ...updates } : item)),
        isPending: true,
        pendingId: itemId,
      }));
    },
    [idField]
  );

  const deleteOptimistic = useCallback(
    (itemId: string) => {
      setState((prev) => ({
        ...prev,
        data: prev.data.filter((item) => item[idField] !== itemId),
        isPending: true,
        pendingId: itemId,
      }));
    },
    [idField]
  );

  const commit = useCallback((newData?: T[]) => {
    setState((prev) => ({
      ...prev,
      data: newData ?? prev.data,
      isPending: false,
      pendingId: null,
      error: null,
    }));
  }, []);

  const rollback = useCallback((error: Error) => {
    setState((prev) => ({
      ...prev,
      isPending: false,
      pendingId: null,
      error,
    }));
  }, []);

  const sync = useCallback((serverData: T[]) => {
    setState((prev) => ({
      ...prev,
      data: serverData,
      isPending: false,
      pendingId: null,
      error: null,
    }));
  }, []);

  return {
    ...state,
    addOptimistic,
    updateOptimistic,
    deleteOptimistic,
    commit,
    rollback,
    sync,
  };
}

/**
 * Hook for form submission with loading and error handling
 */
export interface FormSubmissionOptions<TData, TResult> {
  /** Submission function */
  onSubmit: (data: TData) => Promise<TResult>;
  /** Callback on success */
  onSuccess?: (result: TResult) => void;
  /** Callback on error */
  onError?: (error: Error) => void;
  /** Whether to reset form after success */
  resetOnSuccess?: boolean;
  /** Delay before reset */
  resetDelay?: number;
}

export interface FormSubmissionState {
  isSubmitting: boolean;
  error: Error | null;
  lastResult: unknown | null;
}

export function useFormSubmission<TData, TResult>(options: FormSubmissionOptions<TData, TResult>) {
  const { onSubmit, onSuccess, onError, resetOnSuccess = false, resetDelay = 1500 } = options;

  const [state, setState] = useState<FormSubmissionState>({
    isSubmitting: false,
    error: null,
    lastResult: null,
  });

  const submit = useCallback(
    async (data: TData): Promise<TResult | null> => {
      setState({ isSubmitting: true, error: null, lastResult: null });

      try {
        const result = await onSubmit(data);
        setState({
          isSubmitting: false,
          error: null,
          lastResult: result,
        });
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error("Submission failed");
        setState({ isSubmitting: false, error: err, lastResult: null });
        onError?.(err);
        return null;
      }
    },
    [onSubmit, onSuccess, onError]
  );

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const reset = useCallback(() => {
    setState({ isSubmitting: false, error: null, lastResult: null });
  }, []);

  return {
    ...state,
    submit,
    clearError,
    reset,
  };
}

/**
 * Create a form reset handler with success feedback
 */
export function createFormResetHandler<T extends Record<string, unknown>>(
  setFormData: (data: T | ((prev: T) => T)) => void,
  initialValues: T,
  options: FormResetOptions = {}
) {
  const { delay = 1500, onSuccess } = options;

  return (callback?: () => void) => {
    // Show success state
    setTimeout(() => {
      setFormData(initialValues);
      onSuccess?.();
      callback?.();
    }, delay);
  };
}

/**
 * Create default form values with empty strings
 */
export function createEmptyFormValues<T extends Record<string, unknown>>(
  schema: Record<keyof T, unknown>
): T {
  const result = {} as T;

  for (const key in schema) {
    const value = schema[key];
    if (typeof value === "string") {
      result[key] = "" as T[Extract<keyof T, string>];
    } else if (typeof value === "number") {
      result[key] = 0 as T[Extract<keyof T, string>];
    } else if (typeof value === "boolean") {
      result[key] = false as T[Extract<keyof T, string>];
    } else if (Array.isArray(value)) {
      result[key] = [] as T[Extract<keyof T, string>];
    } else {
      result[key] = null as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * Safely reset form data to initial values
 */
export function safelyResetFormData<T extends Record<string, unknown>>(
  setFormData: (data: T | ((prev: T) => T)) => void,
  initialValues: T
) {
  setFormData(initialValues);
}

/**
 * Create an optimistic update handler for list operations
 */
export interface OptimisticListHandlers<T> {
  addItem: (item: T) => string;
  updateItem: (id: string, updates: Partial<T>) => void;
  removeItem: (id: string) => void;
  commit: (serverData?: T[]) => void;
  rollback: (error: Error) => void;
}

export function createOptimisticListHandlers<T extends Record<string, unknown>>(
  setData: (data: T[] | ((prev: T[]) => T[])) => void,
  data: T[],
  idField: keyof T = "id" as keyof T
): OptimisticListHandlers<T> {
  let pendingId: string | null = null;

  const addItem = (item: T): string => {
    const tempId = `temp-${Date.now()}`;
    const itemWithId = { ...item, [idField]: tempId };
    setData((prev) => [...prev, itemWithId]);
    pendingId = tempId;
    return tempId;
  };

  const updateItem = (id: string, updates: Partial<T>) => {
    setData((prev) => prev.map((item) => (item[idField] === id ? { ...item, ...updates } : item)));
    pendingId = id;
  };

  const removeItem = (id: string) => {
    setData((prev) => prev.filter((item) => item[idField] !== id));
    pendingId = id;
  };

  const commit = (serverData?: T[]) => {
    if (serverData) {
      setData(serverData);
    }
    pendingId = null;
  };

  const rollback = (error: Error) => {
    // Rollback would require storing previous state
    // For now, we rely on refetch from server
    logger.error("Optimistic update failed", error);
    pendingId = null;
  };

  return { addItem, updateItem, removeItem, commit, rollback };
}
