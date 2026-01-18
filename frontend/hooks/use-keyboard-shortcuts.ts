/**
 * useKeyboardShortcuts Hook
 *
 * Registers global keyboard shortcuts for enhanced UX
 * Supports common patterns: Ctrl+S (save), Ctrl+N (new), etc.
 */

import { useEffect, useRef } from "react";

export interface ShortcutConfig {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  handler: (e: KeyboardEvent) => void;
  description: string;
  enabled?: boolean;
}

export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: { enabled?: boolean; scope?: HTMLElement } = {}
) {
  const { enabled = true, scope } = options;
  const shortcutsRef = useRef(shortcuts);

  // Keep shortcutsRef updated
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (evt: Event) => {
      const e = evt as KeyboardEvent;
      // Check if we're in an input field
      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.contentEditable === "true";

      // Find matching shortcut
      const matchingShortcut = shortcutsRef.current.find((shortcut) => {
        if (shortcut.enabled === false) return false;

        return (
          e.key.toLowerCase() === shortcut.key.toLowerCase() &&
          !!e.ctrlKey === !!shortcut.ctrlKey &&
          !!e.shiftKey === !!shortcut.shiftKey &&
          !!e.altKey === !!shortcut.altKey &&
          !!e.metaKey === !!shortcut.metaKey
        );
      });

      if (matchingShortcut) {
        // Prevent default unless in specific inputs
        // Allow Ctrl+S in inputs, but block other shortcuts
        if (!isInInput || matchingShortcut.ctrlKey) {
          e.preventDefault();
          matchingShortcut.handler(e);
        }
      }
    };

    // Add event listener to scope or document
    const target = scope || document;
    target.addEventListener("keydown", handleKeyDown);

    return () => {
      target.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, scope]);
}

// Common shortcut configurations
export const COMMON_SHORTCUTS = {
  SAVE: {
    key: "s",
    ctrlKey: true,
    description: "Save",
  },
  NEW: {
    key: "n",
    ctrlKey: true,
    description: "New record",
  },
  SEARCH: {
    key: "k",
    ctrlKey: true,
    description: "Search",
  },
  DELETE: {
    key: "Delete",
    description: "Delete",
  },
  ESCAPE: {
    key: "Escape",
    description: "Cancel/Close",
  },
  EDIT: {
    key: "e",
    ctrlKey: true,
    description: "Edit",
  },
  SUBMIT: {
    key: "Enter",
    description: "Submit",
  },
  UNDO: {
    key: "z",
    ctrlKey: true,
    description: "Undo",
  },
  PRINT: {
    key: "p",
    ctrlKey: true,
    description: "Print",
  },
};
