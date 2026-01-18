/**
 * FocusTrap Component
 *
 * React component for UI functionality
 *
 * @fileoverview FocusTrap React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Focus Trap Hook - WCAG 2.1 AA Compliant
 *
 * Traps focus within a container (modals, dialogs)
 * Returns focus to trigger element on unmount
 */

export function useFocusTrap(
  active: boolean,
  options: {
    returnFocus?: boolean;
    initialFocus?: HTMLElement | null;
  } = {}
) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  const { returnFocus = true, initialFocus } = options;

  React.useEffect(() => {
    if (!active) return;

    // Store the currently focused element
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    // Set initial focus
    const targetElement = initialFocus || firstElement;
    targetElement?.focus();

    // Handle Tab key
    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      // Shift + Tab
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      }
      // Tab
      else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleTab);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleTab);

      // Return focus to previous element
      if (returnFocus && previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [active, returnFocus, initialFocus]);

  return containerRef;
}

/**
 * FocusTrap Component
 *
 * Wraps children to trap focus when active
 */
export interface FocusTrapProps {
  active: boolean;
  children: React.ReactNode;
  className?: string;
  returnFocus?: boolean;
  initialFocus?: HTMLElement | null;
}

export function FocusTrap({
  active,
  children,
  className,
  returnFocus = true,
  initialFocus,
}: FocusTrapProps) {
  const containerRef = useFocusTrap(active, { returnFocus, initialFocus });

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}

/**
 * useFocusManagement Hook
 *
 * Manages focus for interactive components
 */
export function useFocusManagement() {
  const focusRef = React.useRef<HTMLElement>(null);

  const setFocus = React.useCallback(() => {
    focusRef.current?.focus();
  }, []);

  const returnFocus = React.useCallback(() => {
    const previousElement = document.activeElement as HTMLElement;
    return () => {
      previousElement?.focus();
    };
  }, []);

  return { focusRef, setFocus, returnFocus };
}
