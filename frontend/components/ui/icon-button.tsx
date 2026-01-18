/**
 * Icon Button Component
 *
 * An accessible button component for icon-only buttons
 * Ensures proper ARIA labels and screen reader support
 */

import React from "react";
import { Menu, X } from "lucide-react";
import { Button, ButtonProps } from "@/components/ui/button";

interface IconButtonProps extends ButtonProps {
  /**
   * The icon to display
   */
  icon: React.ReactNode;

  /**
   * Accessible label for screen readers
   * This is required for accessibility
   */
  label: string;

  /**
   * Whether to show the label visually alongside the icon
   * @default false
   */
  showLabel?: boolean;
}

export function IconButton({
  icon,
  label,
  showLabel = false,
  className = "",
  ...props
}: IconButtonProps) {
  return (
    <Button
      variant={props.variant || "ghost"}
      size={props.size || "icon"}
      className={className}
      aria-label={label}
      {...props}
    >
      {icon}
      {showLabel && <span className="ml-2">{label}</span>}
      {/* Screen reader text always included (even if visually hidden) */}
      {!showLabel && <span className="sr-only">{label}</span>}
    </Button>
  );
}

/**
 * Menu Button Component
 *
 * Specialized icon button for menu toggles
 */
export function MenuButton({
  isOpen,
  onToggle,
  className = "",
}: {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <IconButton
      icon={isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      label={isOpen ? "Close menu" : "Open menu"}
      onClick={onToggle}
      className={className}
    />
  );
}

/**
 * Action Button Component
 *
 * Common action buttons with consistent icons
 */
export function ActionButton({
  action,
  onAction,
  disabled = false,
  className = "",
}: {
  action: "add" | "edit" | "delete" | "save" | "cancel" | "refresh";
  onAction: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const icons = {
    add: () => import("lucide-react").then((m) => <m.Plus className="h-4 w-4" />),
    edit: () => import("lucide-react").then((m) => <m.Pencil className="h-4 w-4" />),
    delete: () => import("lucide-react").then((m) => <m.Trash2 className="h-4 w-4" />),
    save: () => import("lucide-react").then((m) => <m.Check className="h-4 w-4" />),
    cancel: () => import("lucide-react").then((m) => <m.X className="h-4 w-4" />),
    refresh: () => import("lucide-react").then((m) => <m.RefreshCw className="h-4 w-4" />),
  };

  const labels = {
    add: "Add new",
    edit: "Edit",
    delete: "Delete",
    save: "Save",
    cancel: "Cancel",
    refresh: "Refresh",
  };

  const variants = {
    add: "default" as const,
    edit: "ghost" as const,
    delete: "ghost" as const,
    save: "default" as const,
    cancel: "outline" as const,
    refresh: "ghost" as const,
  };

  return (
    <IconButton
      icon={icons[action]()}
      label={labels[action]}
      onClick={onAction}
      disabled={disabled}
      variant={variants[action]}
      className={className}
    />
  );
}
