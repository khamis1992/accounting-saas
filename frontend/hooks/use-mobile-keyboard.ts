/**
 * useMobileKeyboard Hook
 *
 * Handles virtual keyboard covering fields on mobile
 * Scrolls to focused input and adjusts viewport
 */

import { useEffect, useRef } from "react";

export interface MobileKeyboardOptions {
  /** Enable/disable keyboard handling (default: true) */
  enabled?: boolean;
  /** Additional offset in pixels (default: 20) */
  offset?: number;
  /** Delay before scrolling (default: 300ms) */
  delay?: number;
}

export function useMobileKeyboard(options: MobileKeyboardOptions = {}) {
  const { enabled = true, offset = 20, delay = 300 } = options;

  const originalHeightRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    // Store original viewport height
    originalHeightRef.current = window.innerHeight;

    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLElement;

      // Only handle inputs
      const isInput =
        target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT";

      if (!isInput) return;

      // Wait for keyboard to appear
      timeoutRef.current = setTimeout(() => {
        const currentHeight = window.innerHeight;
        const originalHeight = originalHeightRef.current;
        const heightDiff = originalHeight - currentHeight;

        // Check if keyboard is open (height decreased significantly)
        if (heightDiff > 150) {
          // Get target position
          const rect = target.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const targetTop = rect.top + scrollTop;

          // Calculate scroll position to show input above keyboard
          const scrollPosition = targetTop - heightDiff - offset;

          // Smooth scroll to position
          window.scrollTo({
            top: scrollPosition,
            behavior: "smooth",
          });
        }
      }, delay);
    };

    const handleBlur = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };

    const handleResize = () => {
      // Update original height on resize
      if (window.innerHeight > originalHeightRef.current) {
        originalHeightRef.current = window.innerHeight;
      }
    };

    // Add event listeners
    document.addEventListener("focusin", handleFocus);
    document.addEventListener("focusout", handleBlur);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("focusin", handleFocus);
      document.removeEventListener("focusout", handleBlur);
      window.removeEventListener("resize", handleResize);

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, offset, delay]);

  return {
    originalHeight: originalHeightRef.current,
  };
}

/**
 * Hook to add safe-area-inset support for mobile
 * Adds padding for notched phones (iPhone X+)
 */
export function useSafeArea() {
  useEffect(() => {
    if (typeof document === "undefined") return;

    // Add safe-area support to document
    const style = document.createElement("style");
    style.innerHTML = `
      :root {
        --safe-area-inset-top: env(safe-area-inset-top, 0px);
        --safe-area-inset-right: env(safe-area-inset-right, 0px);
        --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
        --safe-area-inset-left: env(safe-area-inset-left, 0px);
      }

      .safe-area-top {
        padding-top: var(--safe-area-inset-top);
      }

      .safe-area-bottom {
        padding-bottom: var(--safe-area-inset-bottom);
      }

      .safe-area-left {
        padding-left: var(--safe-area-inset-left);
      }

      .safe-area-right {
        padding-right: var(--safe-area-inset-right);
      }

      .safe-area-all {
        padding-top: var(--safe-area-inset-top);
        padding-right: var(--safe-area-inset-right);
        padding-bottom: var(--safe-area-inset-bottom);
        padding-left: var(--safe-area-inset-left);
      }
    `;

    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);
}
