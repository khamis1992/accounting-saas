/**
 * UseRouteTransition.ts Hook
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
import { usePathname } from "next/navigation";

/**
 * Hook to detect and manage route transitions
 *
 * Tracks route changes and provides transition state.
 * Useful for coordinating animations during navigation.
 *
 * @returns Object with transition state
 * - isTransitioning: true if currently transitioning
 * - pathname: current pathname
 * - prevPathname: previous pathname
 * - direction: 'forward' | 'backward' | null
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isTransitioning, pathname } = useRouteTransition();
 *
 *   return (
 *     <div className={isTransitioning ? 'opacity-50' : 'opacity-100'}>
 *       Content
 *     </div>
 *   );
 * }
 * ```
 */
export function useRouteTransition() {
  const pathname = usePathname();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);
  const [direction, setDirection] = useState<"forward" | "backward" | null>(null);

  useEffect(() => {
    if (pathname !== prevPathname) {
      setIsTransitioning(true);

      // Determine direction based on path depth
      const currentDepth = pathname.split("/").length;
      const prevDepth = prevPathname.split("/").length;

      if (currentDepth > prevDepth) {
        setDirection("forward");
      } else if (currentDepth < prevDepth) {
        setDirection("backward");
      } else {
        setDirection(null);
      }

      // Reset transition state after animation completes
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPrevPathname(pathname);
        setDirection(null);
      }, 300); // Match animation duration (300ms)

      return () => clearTimeout(timer);
    }
  }, [pathname, prevPathname]);

  return {
    isTransitioning,
    pathname,
    prevPathname,
    direction,
  };
}
