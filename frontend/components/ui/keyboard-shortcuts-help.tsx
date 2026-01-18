/**
 * KeyboardShortcutsHelp Component
 *
 * Displays available keyboard shortcuts
 * Modal/dialog with categorized shortcuts
 */

"use client";

import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface ShortcutCategory {
  name: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

export interface KeyboardShortcutsHelpProps {
  /** Shortcut categories to display */
  categories: ShortcutCategory[];
  /** Trigger button label */
  triggerLabel?: string;
  /** Custom trigger */
  trigger?: React.ReactNode;
}

export function KeyboardShortcutsHelp({
  categories,
  triggerLabel = "Keyboard Shortcuts",
  trigger,
}: KeyboardShortcutsHelpProps) {
  const formatKey = (key: string) => {
    const modifiers: Record<string, string> = {
      Ctrl: "⌃",
      Cmd: "⌘",
      Alt: "⌥",
      Shift: "⇧",
      Enter: "↵",
      Escape: "⎋",
      Tab: "⇥",
      Delete: "⌫",
    };

    return modifiers[key] || key;
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="gap-2">
            <Keyboard className="h-4 w-4" />
            {triggerLabel}
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Keyboard Shortcuts</DialogTitle>
          <DialogDescription>Navigate and work faster with keyboard shortcuts</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {categories.map((category, idx) => (
            <div key={idx}>
              <h3 className="font-semibold text-sm text-zinc-700 mb-3">{category.name}</h3>

              <div className="space-y-2">
                {category.shortcuts.map((shortcut, shortcutIdx) => (
                  <div key={shortcutIdx} className="flex items-center justify-between py-2">
                    <span className="text-sm text-zinc-600">{shortcut.description}</span>

                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, keyIdx) => (
                        <span key={keyIdx}>
                          <Badge variant="outline" className="font-mono text-xs px-2 py-1">
                            {formatKey(key)}
                          </Badge>
                          {keyIdx < shortcut.keys.length - 1 && (
                            <span className="mx-1 text-zinc-400">+</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t text-xs text-zinc-500">
          <strong>Tip:</strong> Press <kbd>?</kbd> anywhere to open this dialog
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Default shortcuts for common operations
export const DEFAULT_SHORTCUTS: ShortcutCategory[] = [
  {
    name: "General",
    shortcuts: [
      { keys: ["Ctrl", "K"], description: "Open command palette" },
      { keys: ["Ctrl", "/"], description: "Show keyboard shortcuts" },
      { keys: ["Escape"], description: "Close dialog/modal" },
    ],
  },
  {
    name: "Forms",
    shortcuts: [
      { keys: ["Ctrl", "S"], description: "Save form" },
      { keys: ["Ctrl", "N"], description: "New record" },
      { keys: ["Ctrl", "E"], description: "Edit selected" },
      { keys: ["Tab"], description: "Next field" },
      { keys: ["Shift", "Tab"], description: "Previous field" },
      { keys: ["Enter"], description: "Submit form" },
    ],
  },
  {
    name: "Tables & Lists",
    shortcuts: [
      { keys: ["↑", "↓"], description: "Navigate rows" },
      { keys: ["Enter"], description: "Open selected" },
      { keys: ["Delete"], description: "Delete selected" },
      { keys: ["Ctrl", "A"], description: "Select all" },
    ],
  },
  {
    name: "Line Items",
    shortcuts: [
      { keys: ["Tab"], description: "Next field / Add line" },
      { keys: ["Shift", "Tab"], description: "Previous field" },
      { keys: ["Enter"], description: "Save & add new line" },
      { keys: ["Ctrl", "D"], description: "Delete line" },
    ],
  },
];
