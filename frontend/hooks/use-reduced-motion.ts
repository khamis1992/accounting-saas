/**
 * UseReducedMotion.ts Hook
 *
 * Custom React hook for Custom React hook functionality
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { useEffect, useState } from "react";

/**
 * Hook to detect if user prefers reduced motion
 *
 * Respects the prefers-reduced-motion media query for accessibility.
 * Automatically updates when the preference changes.
 *
 * @returns boolean - true if user prefers reduced motion
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const reducedMotion = useReducedMotion();
 *
 *   return (
 *     <motion.div
 *       animate={{ scale: reducedMotion ? 1 : 1.1 }}
 *       transition={reducedMotion ? { duration: 0 } : undefined}
 *     >
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check initial value
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const listener = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener("change", listener);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener("change", listener);
    };
  }, []);

  return prefersReducedMotion;
}
