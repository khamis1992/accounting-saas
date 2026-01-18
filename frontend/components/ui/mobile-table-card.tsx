/**
 * MobileTableCard Component
 *
 * React component for UI functionality
 *
 * @fileoverview MobileTableCard React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MoreVertical, Pencil, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/**
 * MobileTableCard Component
 *
 * Transforms table data into mobile-friendly card layout.
 * Each card displays a single record with vertical field arrangement.
 *
 * @example
 * ```tsx
 * <MobileTableCard
 *   title="Account Name"
 *   subtitle="Account Code"
 *   fields={[
 *     { label: 'Type', value: 'Asset' },
 *     { label: 'Balance', value: '$1,000.00' },
 *   ]}
 *   actions={[
 *     { icon: <Eye />, label: 'View', onClick: () => {} },
 *     { icon: <Pencil />, label: 'Edit', onClick: () => {} },
 *   ]}
 * />
 * ```
 */

export interface MobileCardField {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  highlight?: boolean;
}

export interface MobileCardAction {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

export interface MobileTableCardProps {
  title: string;
  subtitle?: string;
  fields: MobileCardField[];
  actions?: MobileCardAction[];
  className?: string;
  status?: "active" | "inactive" | "pending" | "overdue";
}

const statusColors = {
  active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  inactive: "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400",
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export function MobileTableCard({
  title,
  subtitle,
  fields,
  actions,
  className,
  status,
}: MobileTableCardProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border bg-white p-4 shadow-sm dark:bg-zinc-900",
        "hover:shadow-md transition-shadow duration-200",
        "active:scale-[0.98] transition-transform duration-150",
        className
      )}
    >
      {/* Header Section */}
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-50 truncate">
            {title}
          </h3>
          {subtitle && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400 truncate">{subtitle}</p>
          )}
        </div>

        {/* Status Badge */}
        {status && (
          <span
            className={cn(
              " shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
              statusColors[status]
            )}
          >
            {status}
          </span>
        )}

        {/* Actions Menu */}
        {actions && actions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-11 w-11 shrink-0"
                aria-label="Actions"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {actions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    "min-h-[44px] cursor-pointer",
                    action.variant === "destructive" &&
                      "text-red-600 focus:text-red-600 dark:text-red-400"
                  )}
                >
                  {action.icon}
                  <span className="ml-2">{action.label}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Fields Section - Vertical Layout */}
      <div className="space-y-3">
        {fields.map((field, index) => (
          <div
            key={index}
            className={cn(
              "flex justify-between items-start gap-2",
              field.highlight && "bg-zinc-50 dark:bg-zinc-800/50 -mx-2 px-2 py-1.5 rounded"
            )}
          >
            <div className="flex items-center gap-2 min-w-0">
              {field.icon && <span className="shrink-0 text-zinc-400">{field.icon}</span>}
              <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                {field.label}
              </span>
            </div>
            <div className="shrink-0 text-right">
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {field.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Action Buttons (Optional) */}
      {actions && actions.length <= 3 && (
        <div className="mt-4 flex gap-2 border-t pt-3">
          {actions.slice(0, 3).map((action, index) => (
            <Button
              key={index}
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
              className="flex-1 min-h-[44px]"
            >
              {action.icon}
              <span className="ml-2">{action.label}</span>
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * MobileCardGrid - Container for mobile cards
 */
export interface MobileCardGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileCardGrid({ children, className }: MobileCardGridProps) {
  return (
    <div
      className={cn(
        // Mobile: single column
        "grid grid-cols-1 gap-3",
        // Tablet: 2 columns
        "sm:grid-cols-2",
        // Desktop: hide (show table instead)
        "lg:hidden",
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * MobileOnly - Wrapper that shows content only on mobile/tablet
 */
export interface MobileOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function MobileOnly({ children, className }: MobileOnlyProps) {
  return <div className={cn("lg:hidden", className)}>{children}</div>;
}

/**
 * DesktopOnly - Wrapper that shows content only on desktop
 */
export interface DesktopOnlyProps {
  children: React.ReactNode;
  className?: string;
}

export function DesktopOnly({ children, className }: DesktopOnlyProps) {
  return <div className={cn("hidden lg:block", className)}>{children}</div>;
}
