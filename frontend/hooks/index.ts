/**
 * Custom Hooks
 *
 * Export all custom hooks for easy importing.
 *
 * @example
 * ```tsx
 * import { useReducedMotion, useRouteTransition, useAnimationPreset } from '@/hooks';
 * import { useDebounce, usePaginatedData } from '@/hooks';
 * import { useApiRequest, useAsyncFetch } from '@/hooks';
 * import { useAutoSave, useKeyboardShortcuts, useUndo } from '@/hooks';
 * ```
 */

// Animation hooks
export { useReducedMotion } from "./use-reduced-motion";
export { useRouteTransition } from "./use-route-transition";
export { useAnimationPreset, useAnimationConfig, presets } from "./use-animation-preset";

// Performance hooks
export { useDebounce, useDebounceCallback } from "./use-debounce";
export {
  usePaginatedData,
  useClientSidePagination,
  type PaginationMeta,
  type PaginatedData,
} from "./use-paginated-data";
export { useVirtualizedList, useVirtualizedGrid } from "./use-virtualized-list";

// API & Async hooks
export { useApiRequest, useLazyApiRequest, useImmediateApiRequest } from "./use-api-request";
export { useAsyncFetch, useImmediateFetch } from "./use-async-fetch";

// UX Enhancement hooks
export { useAutoSave, type AutoSaveOptions, type AutoSaveState } from "./use-auto-save";
export {
  useKeyboardShortcuts,
  COMMON_SHORTCUTS,
  type ShortcutConfig,
} from "./use-keyboard-shortcuts";
export { useUndo, type UndoAction, type UndoOptions } from "./use-undo";
export { useMobileKeyboard, useSafeArea } from "./use-mobile-keyboard";
export { useCurrency, type CurrencySettings, type UseCurrencyOptions } from "./use-currency";
export { useDateTimezone, type DateWithTimezone, type UseDateOptions } from "./use-date-timezone";
