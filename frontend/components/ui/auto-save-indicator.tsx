/**
 * AutoSaveIndicator Component
 *
 * Shows auto-save status with visual feedback
 * States: Saving, Saved, Error
 */

"use client";

import { Check, AlertCircle, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";

export interface AutoSaveIndicatorProps {
  /** Is currently saving */
  isSaving: boolean;
  /** Last save time */
  lastSaved: Date | null;
  /** Error message */
  error?: string | null;
  /** Custom position (default: 'top-right') */
  position?: "top-right" | "top-left" | "bottom-right" | "bottom-left";
}

export function AutoSaveIndicator({
  isSaving,
  lastSaved,
  error,
  position = "top-right",
}: AutoSaveIndicatorProps) {
  const [visible, setVisible] = useState(false);

  // Show/hide indicator based on state
  useEffect(() => {
    if (isSaving || lastSaved || error) {
      setVisible(true);
    }
  }, [isSaving, lastSaved, error]);

  // Auto-hide after 3 seconds if saved
  useEffect(() => {
    if (lastSaved && !isSaving && !error) {
      const timer = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [lastSaved, isSaving, error]);

  if (!visible) return null;

  const positionClasses = {
    "top-right": "top-4 right-4",
    "top-left": "top-4 left-4",
    "bottom-right": "bottom-4 right-4",
    "bottom-left": "bottom-4 left-4",
  };

  const getState = () => {
    if (error) {
      return {
        icon: <AlertCircle className="h-4 w-4 text-red-500" />,
        text: "Save failed",
        bgColor: "bg-red-50 border-red-200",
      };
    }

    if (isSaving) {
      return {
        icon: <Loader2 className="h-4 w-4 animate-spin text-blue-500" />,
        text: "Saving...",
        bgColor: "bg-blue-50 border-blue-200",
      };
    }

    if (lastSaved) {
      const timeAgo = getTimeAgo(lastSaved);
      return {
        icon: <Check className="h-4 w-4 text-green-500" />,
        text: `Saved ${timeAgo}`,
        bgColor: "bg-green-50 border-green-200",
      };
    }

    return null;
  };

  const state = getState();

  if (!state) return null;

  return (
    <div
      className={`
        fixed z-50
        ${positionClasses[position]}
        flex items-center gap-2
        rounded-md border
        px-3 py-2
        shadow-sm
        transition-all duration-300
        ${state.bgColor}
      `}
    >
      {state.icon}
      <span className="text-sm font-medium text-zinc-700">{state.text}</span>
    </div>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Hook to manage auto-save state
 */
export function useAutoSaveIndicator() {
  const [state, setState] = useState<{
    isSaving: boolean;
    lastSaved: Date | null;
    error: string | null;
  }>({
    isSaving: false,
    lastSaved: null,
    error: null,
  });

  const startSaving = () => {
    setState({ isSaving: true, lastSaved: null, error: null });
  };

  const setSaved = () => {
    setState({ isSaving: false, lastSaved: new Date(), error: null });
  };

  const setError = (error: string) => {
    setState({ isSaving: false, lastSaved: null, error });
  };

  const reset = () => {
    setState({ isSaving: false, lastSaved: null, error: null });
  };

  return {
    ...state,
    startSaving,
    setSaved,
    setError,
    reset,
  };
}
