/**
 * SkipLink Component
 *
 * React component for UI functionality
 *
 * @fileoverview SkipLink React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skip Navigation Link - WCAG 2.1 AA Compliant
 *
 * Allows keyboard users to skip navigation and jump directly to main content
 * Becomes visible on first tab and when focused
 *
 * Usage: Place at the top of your layout, before any navigation
 */

export interface SkipLinkProps {
  label?: string;
  targetId?: string;
  className?: string;
}

export function SkipLink({
  label = "Skip to main content",
  targetId = "main-content",
  className,
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={cn(
        // Base styles - hidden by default
        "sr-only",

        // When focused, make visible and positioned
        "focus:not-sr-only",
        "focus:absolute",
        "focus:top-4",
        "focus:left-4",
        "focus:z-[100]",
        "focus:px-4",
        "focus:py-2",
        "focus:bg-white",
        "focus:dark:bg-zinc-800",
        "focus:text-zinc-900",
        "focus:dark:text-zinc-100",
        "focus:border-2",
        "focus:border-blue-600",
        "focus:rounded-md",
        "focus:shadow-lg",
        "focus:text-sm",
        "focus:font-medium",

        // High contrast for accessibility
        "focus:outline-none",

        className
      )}
    >
      {label}
    </a>
  );
}

/**
 * MainContent wrapper component
 *
 * Wraps your main content with the target ID for skip link
 */
export interface MainContentProps {
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export function MainContent({ id = "main-content", children, className }: MainContentProps) {
  return (
    <main id={id} className={className} tabIndex={-1}>
      {children}
    </main>
  );
}

/**
 * useSkipLink Hook
 *
 * Automatically handles focus when skip link is activated
 */
export function useSkipLink(targetId = "main-content") {
  React.useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === `#${targetId}`) {
        const element = document.getElementById(targetId);
        element?.focus();
      }
    };

    window.addEventListener("hashchange", handleHashChange);

    // Check on mount in case URL already has hash
    handleHashChange();

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [targetId]);
}
