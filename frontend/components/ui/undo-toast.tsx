/**
 * UndoToast Component
 *
 * Toast notification with undo functionality
 * Shows success message with undo button for destructive actions
 */

"use client";

import { X, Undo } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export interface UndoToastProps {
  /** Message to display */
  message: string;
  /** Undo callback */
  onUndo: () => void;
  /** Auto-dismiss delay in ms (default: 5000) */
  duration?: number;
  /** On close callback */
  onClose?: () => void;
}

export function UndoToast({ message, onUndo, duration = 5000, onClose }: UndoToastProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 100) {
          handleUndo();
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [duration]);

  const handleUndo = () => {
    setIsClosing(true);
    setTimeout(() => {
      onUndo();
      onClose?.();
    }, 300);
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose?.();
    }, 300);
  };

  const progressPercent = (timeLeft / duration) * 100;

  return (
    <div
      className={`
        fixed bottom-4 right-4 z-50
        flex items-center gap-3
        rounded-lg bg-white shadow-lg
        border border-zinc-200
        p-4
        min-w-[300px] max-w-md
        transition-all duration-300
        ${isClosing ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0"}
      `}
    >
      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-100"
        style={{ width: `${progressPercent}%` }}
      />

      {/* Content */}
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-900">{message}</p>
        <p className="text-xs text-zinc-500">Undo available for {Math.ceil(timeLeft / 1000)}s</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleUndo} className="gap-1">
          <Undo className="h-3 w-3" />
          Undo
        </Button>
        <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * Hook to manage undo toasts
 */
export function useUndoToast() {
  const [toasts, setToasts] = useState<
    Array<{
      id: string;
      message: string;
      onUndo: () => void;
    }>
  >([]);

  const showToast = (message: string, onUndo: () => void) => {
    const id = Math.random().toString(36).substring(7);
    const toast = { id, message, onUndo };

    setToasts((prev) => [...prev, toast]);

    return id;
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const clearAll = () => {
    setToasts([]);
  };

  return {
    toasts,
    showToast,
    removeToast,
    clearAll,
  };
}
