/**
 * useAutoSave Hook
 *
 * Automatically saves form data to localStorage at intervals
 * Shows saving indicator and manages draft state
 */

import { useState, useEffect, useRef, useCallback } from "react";
import logger from "@/lib/logger";

export interface AutoSaveOptions {
  /** Storage key prefix (will append entity type) */
  storageKey: string;
  /** Auto-save interval in milliseconds (default: 30000 = 30s) */
  interval?: number;
  /** Entity ID for editing existing records */
  entityId?: string;
  /** Enable/disable auto-save (default: true) */
  enabled?: boolean;
  /** Callback when auto-save completes */
  onSave?: (data: any) => void;
}

export interface AutoSaveState {
  isSaving: boolean;
  lastSaved: Date | null;
  hasDraft: boolean;
  draftRestored: boolean;
}

export function useAutoSave<T extends Record<string, any>>(formData: T, options: AutoSaveOptions) {
  const { storageKey, interval = 30000, entityId, enabled = true, onSave } = options;

  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasDraft: false,
    draftRestored: false,
  });

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Build full storage key with entity ID
  const getStorageKey = useCallback(() => {
    return entityId ? `${storageKey}_${entityId}` : `${storageKey}_new`;
  }, [storageKey, entityId]);

  // Save to localStorage
  const saveDraft = useCallback(
    async (data: T) => {
      if (!enabled || !mountedRef.current) return;

      setState((prev) => ({ ...prev, isSaving: true }));

      try {
        const key = getStorageKey();
        const draftData = {
          data,
          savedAt: new Date().toISOString(),
        };

        localStorage.setItem(key, JSON.stringify(draftData));

        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            isSaving: false,
            lastSaved: new Date(),
            hasDraft: true,
          }));
        }

        onSave?.(data);
      } catch (error) {
        logger.error("Auto-save failed", error as Error);
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isSaving: false }));
        }
      }
    },
    [enabled, getStorageKey, onSave]
  );

  // Load draft from localStorage
  const loadDraft = useCallback((): T | null => {
    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);

      if (stored) {
        const draftData = JSON.parse(stored);

        // Check if draft is less than 7 days old
        const savedAt = new Date(draftData.savedAt);
        const daysSinceSave = (Date.now() - savedAt.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceSave < 7) {
          setState((prev) => ({
            ...prev,
            hasDraft: true,
            draftRestored: true,
            lastSaved: savedAt,
          }));
          return draftData.data;
        } else {
          // Delete old draft
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      logger.error("Failed to load draft", error as Error);
    }

    return null;
  }, [getStorageKey]);

  // Clear draft from localStorage
  const clearDraft = useCallback(() => {
    try {
      const key = getStorageKey();
      localStorage.removeItem(key);

      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          hasDraft: false,
          lastSaved: null,
        }));
      }
    } catch (error) {
      logger.error("Failed to clear draft", error as Error);
    }
  }, [getStorageKey]);

  // Manual save trigger
  const manualSave = useCallback(() => {
    saveDraft(formData);
  }, [formData, saveDraft]);

  // Setup auto-save interval
  useEffect(() => {
    if (!enabled) return;

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Setup new interval
    timeoutRef.current = setTimeout(() => {
      saveDraft(formData);
    }, interval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [formData, interval, enabled, saveDraft]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    saveDraft: manualSave,
    loadDraft,
    clearDraft,
  };
}
