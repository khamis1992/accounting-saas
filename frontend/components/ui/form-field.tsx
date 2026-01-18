/**
 * FormField Component
 *
 * React component for UI functionality
 *
 * @fileoverview FormField React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * FormField Component - WCAG 2.1 AA Compliant
 *
 * Features:
 * - Proper ARIA error association with aria-describedby
 * - aria-invalid attribute for screen readers
 * - Required field indicators
 * - Error message announcements with aria-live
 * - Proper label association via htmlFor
 * - Error messages link to input fields for easy navigation
 */

export interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  required?: boolean;
  description?: string;
  children: (props: {
    id: string;
    "aria-invalid"?: boolean;
    "aria-describedby"?: string;
  }) => React.ReactNode;
}

export function FormField({
  id,
  label,
  error,
  required = false,
  description,
  children,
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const descriptionId = `${id}-description`;
  const hasError = !!error;

  // Build aria-describedby string
  const describedBy = [hasError ? errorId : null, description ? descriptionId : null]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-zinc-900 dark:text-zinc-100"
        id={hasError ? `${id}-label` : undefined}
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">
            *
          </span>
        )}
      </label>

      {description && (
        <p id={descriptionId} className="text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      )}

      {children({
        id,
        "aria-invalid": hasError || undefined,
        "aria-describedby": describedBy || undefined,
      })}

      {error && (
        <p
          id={errorId}
          className="text-sm text-red-600 dark:text-red-400 font-medium"
          role="alert"
          aria-live="polite"
        >
          <a
            href={`#${id}`}
            className="underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(id)?.focus();
            }}
          >
            {error}
          </a>
        </p>
      )}
    </div>
  );
}

/**
 * FormError component for standalone error display
 */
export interface FormErrorProps {
  id: string;
  message: string;
  className?: string;
}

export function FormError({ id, message, className }: FormErrorProps) {
  return (
    <p
      id={id}
      className={cn("text-sm text-red-600 dark:text-red-400 font-medium", className)}
      role="alert"
      aria-live="polite"
    >
      {message}
    </p>
  );
}

/**
 * FormHint component for helper text
 */
export interface FormHintProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function FormHint({ id, children, className }: FormHintProps) {
  return (
    <p id={id} className={cn("text-sm text-zinc-600 dark:text-zinc-400", className)}>
      {children}
    </p>
  );
}
