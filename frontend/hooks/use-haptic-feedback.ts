/**
 * UseHapticFeedback.ts Hook
 *
 * Custom React hook for Custom React hook functionality
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { useCallback } from "react";

export type HapticFeedbackType = "light" | "medium" | "heavy" | "success" | "warning" | "error";

/**
 * Hook for providing haptic feedback on mobile devices
 * Works on iOS (via Vibration API) and Android
 */
export function useHapticFeedback() {
  const trigger = useCallback((type: HapticFeedbackType = "light") => {
    // Check if vibration API is supported
    if (!("vibrate" in navigator)) {
      return;
    }

    // Different vibration patterns for different feedback types
    switch (type) {
      case "light":
        // Single light tap
        navigator.vibrate(10);
        break;
      case "medium":
        // Single medium tap
        navigator.vibrate(20);
        break;
      case "heavy":
        // Single heavy tap
        navigator.vibrate(30);
        break;
      case "success":
        // Double tap for success
        navigator.vibrate([10, 50, 10]);
        break;
      case "warning":
        // Two medium taps
        navigator.vibrate([20, 100, 20]);
        break;
      case "error":
        // Three taps for error
        navigator.vibrate([20, 50, 20, 50, 20]);
        break;
      default:
        navigator.vibrate(10);
    }
  }, []);

  return { trigger };
}
