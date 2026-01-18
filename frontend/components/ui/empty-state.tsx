/**
 * Empty State Component
 *
 * Reusable empty state component for list pages and data tables
 * Provides helpful guidance with call-to-action buttons
 */

import React from "react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  /**
   * Icon to display in the empty state
   */
  icon?: LucideIcon;
  /**
   * Title of the empty state
   */
  title: string;
  /**
   * Description of the empty state
   */
  description?: string;
  /**
   * Label for the primary action button
   */
  actionLabel?: string;
  /**
   * Click handler for the primary action
   */
  onAction?: () => void;
  /**
   * Whether to render the action as a Link component
   */
  actionHref?: string;
  /**
   * Additional classes to apply
   */
  className?: string;
  /**
   * Size variant
   */
  size?: "sm" | "md" | "lg";
}

/**
 * EmptyState component for displaying when no data is available
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: "py-6",
    md: "py-12",
    lg: "py-16",
  };

  const iconSize = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  };

  if (actionHref) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center text-center",
          sizeClasses[size],
          className
        )}
      >
        {Icon && <Icon className={cn(iconSize[size], "text-zinc-400 mb-4")} />}
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        {description && (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">{description}</p>
        )}
        {actionLabel && (
          <div className="mt-4">
            <Button asChild variant={size === "sm" ? "link" : "default"}>
              <a href={actionHref}>{actionLabel}</a>
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        sizeClasses[size],
        className
      )}
    >
      {Icon && <Icon className={cn(iconSize[size], "text-zinc-400 mb-4")} />}
      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 max-w-md">{description}</p>
      )}
      {actionLabel && onAction && (
        <div className="mt-4">
          <Button onClick={onAction} variant={size === "sm" ? "link" : "default"}>
            {actionLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * TableEmptyState - specialized empty state for tables
 */
export interface TableEmptyStateProps {
  colSpan: number;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  icon?: LucideIcon;
}

export function TableEmptyState({
  colSpan,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  icon: Icon,
}: TableEmptyStateProps) {
  return (
    <tr>
      <td colSpan={colSpan}>
        <EmptyState
          icon={Icon}
          title={title}
          description={description}
          actionLabel={actionLabel}
          onAction={onAction}
          actionHref={actionHref}
          size="sm"
          className="py-8"
        />
      </td>
    </tr>
  );
}
