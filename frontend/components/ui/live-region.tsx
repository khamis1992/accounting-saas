/**
 * LiveRegion Component
 *
 * React component for UI functionality
 *
 * @fileoverview LiveRegion React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * LiveRegion Component - WCAG 2.1 AA Compliant
 *
 * Announces dynamic content changes to screen readers
 * without moving focus or interrupting the user.
 *
 * @example
 * ```tsx
 * <LiveRegion role="status">
 *   {statusMessage}
 * </LiveRegion>
 *
 * <LiveRegion role="alert" aria-live="assertive">
 *   {errorMessage}
 * </LiveRegion>
 * ```
 */

export interface LiveRegionProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The type of live region
   * - "status": Polite announcements (default)
   * - "alert": Assertive announcements (interrupts user)
   */
  role?: "status" | "alert";

  /**
   * When to announce the message
   * - "polite": Wait until user is idle (default for status)
   * - "assertive": Interrupt immediately (default for alert)
   */
  ariaLive?: "polite" | "assertive";

  /**
   * Whether to announce updates to the live region
   * @default true
   */
  atomic?: boolean;

  /**
   * Whether to clear the message after it's announced
   * Useful for one-time notifications
   */
  clearAfterAnnouncement?: boolean;

  /**
   * Delay in ms before clearing the message
   * @default 5000
   */
  clearDelay?: number;
}

export function LiveRegion({
  role = "status",
  ariaLive,
  atomic = true,
  clearAfterAnnouncement = false,
  clearDelay = 5000,
  children,
  className,
  ...props
}: LiveRegionProps) {
  const [message, setMessage] = React.useState<string | React.ReactNode>("");

  // Determine aria-live based on role
  const live = ariaLive || (role === "alert" ? "assertive" : "polite");

  // Handle message clearing
  React.useEffect(() => {
    if (children && clearAfterAnnouncement) {
      const timer = setTimeout(() => {
        setMessage("");
      }, clearDelay);

      return () => clearTimeout(timer);
    }
  }, [children, clearAfterAnnouncement, clearDelay]);

  // Update message when children change
  React.useEffect(() => {
    if (children) {
      setMessage(children);
    }
  }, [children]);

  if (!message) {
    return null;
  }

  return (
    <div
      role={role}
      aria-live={live}
      aria-atomic={atomic}
      className={cn("sr-only", className)}
      {...props}
    >
      {message}
    </div>
  );
}

/**
 * StatusMessage - For polite status updates
 *
 * Use for: Loading states, success messages, progress updates
 */
export interface StatusMessageProps {
  message?: string | React.ReactNode;
  className?: string;
}

export function StatusMessage({ message, className }: StatusMessageProps) {
  return (
    <LiveRegion role="status" ariaLive="polite" className={className}>
      {message}
    </LiveRegion>
  );
}

/**
 * AlertMessage - For assertive alerts
 *
 * Use for: Error messages, validation errors, important warnings
 */
export interface AlertMessageProps {
  message?: string | React.ReactNode;
  className?: string;
}

export function AlertMessage({ message, className }: AlertMessageProps) {
  return (
    <LiveRegion role="alert" ariaLive="assertive" className={className}>
      {message}
    </LiveRegion>
  );
}

/**
 * useLiveRegion Hook
 *
 * Programmatically announce messages to screen readers
 *
 * @example
 * ```tsx
 * const { announce, announceStatus, announceAlert } = useLiveRegion()
 *
 * // Announce a status update
 * announceStatus("Loading complete")
 *
 * // Announce an alert
 * announceAlert("Error saving changes")
 *
 * // Custom announcement
 * announce("Custom message", "polite")
 * ```
 */
export function useLiveRegion() {
  const [messages, setMessages] = React.useState<{
    status?: string;
    alert?: string;
  }>({});

  const announce = React.useCallback(
    (message: string, priority: "polite" | "assertive" = "polite") => {
      setMessages((prev) => ({
        ...prev,
        [priority === "assertive" ? "alert" : "status"]: message,
      }));

      // Clear message after announcement
      setTimeout(() => {
        setMessages((prev) => ({
          ...prev,
          [priority === "assertive" ? "alert" : "status"]: undefined,
        }));
      }, 1000);
    },
    []
  );

  const announceStatus = React.useCallback(
    (message: string) => {
      announce(message, "polite");
    },
    [announce]
  );

  const announceAlert = React.useCallback(
    (message: string) => {
      announce(message, "assertive");
    },
    [announce]
  );

  return {
    announce,
    announceStatus,
    announceAlert,
    messages,
  };
}
