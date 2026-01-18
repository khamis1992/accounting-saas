/**
 * useUndo Hook
 *
 * Manages undo/redo functionality for destructive actions
 * Provides toast notifications with undo capability
 */

import { useState, useCallback, useRef } from "react";
import logger from "@/lib/logger";

export interface UndoAction<T = any> {
  id: string;
  type: string;
  data: T;
  timestamp: Date;
  onUndo: () => Promise<void> | void;
}

export interface UndoOptions {
  /** How long to keep undo history (default: 30s) */
  timeout?: number;
  /** Maximum undo history size (default: 10) */
  maxHistory?: number;
}

export function useUndo<T = any>(options: UndoOptions = {}) {
  const { timeout = 30000, maxHistory = 10 } = options;

  const [history, setHistory] = useState<UndoAction<T>[]>([]);
  const [isUndoing, setIsUndoing] = useState(false);
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  // Add action to history
  const addAction = useCallback(
    (action: Omit<UndoAction<T>, "id" | "timestamp">) => {
      const id = Math.random().toString(36).substring(7);
      const undoAction: UndoAction<T> = {
        ...action,
        id,
        timestamp: new Date(),
      };

      setHistory((prev) => {
        const newHistory = [undoAction, ...prev].slice(0, maxHistory);

        // Clean up old timeouts
        newHistory.forEach((item) => {
          if (item.id !== id && !timeoutsRef.current.has(item.id)) {
            const timeoutId = setTimeout(() => {
              removeAction(item.id);
            }, timeout);
            timeoutsRef.current.set(item.id, timeoutId);
          }
        });

        return newHistory;
      });

      // Set timeout for this action
      const timeoutId = setTimeout(() => {
        removeAction(id);
      }, timeout);
      timeoutsRef.current.set(id, timeoutId);

      return id;
    },
    [maxHistory, timeout]
  );

  // Remove action from history
  const removeAction = useCallback((id: string) => {
    setHistory((prev) => prev.filter((action) => action.id !== id));

    // Clear timeout
    const timeoutId = timeoutsRef.current.get(id);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutsRef.current.delete(id);
    }
  }, []);

  // Undo action
  const undo = useCallback(
    async (id: string) => {
      const action = history.find((a) => a.id === id);
      if (!action) return;

      setIsUndoing(true);

      try {
        await action.onUndo();
        removeAction(id);
      } catch (error) {
        logger.error("Undo failed", error as Error);
      } finally {
        setIsUndoing(false);
      }
    },
    [history, removeAction]
  );

  // Clear all history
  const clearAll = useCallback(() => {
    setHistory([]);

    // Clear all timeouts
    timeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    timeoutsRef.current.clear();
  }, []);

  // Get latest action of a type
  const getLatestAction = useCallback(
    (type: string) => {
      return history.find((action) => action.type === type);
    },
    [history]
  );

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    timeoutsRef.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    timeoutsRef.current.clear();
  }, []);

  return {
    history,
    isUndoing,
    addAction,
    undo,
    removeAction,
    clearAll,
    getLatestAction,
    cleanup,
  };
}
