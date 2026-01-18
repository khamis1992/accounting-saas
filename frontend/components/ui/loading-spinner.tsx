/**
 * Loading Spinner Component
 *
 * Displays an animated loading indicator for async operations
 */

import React from "react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "h-4 w-4 border-2",
  md: "h-8 w-8 border-3",
  lg: "h-12 w-12 border-4",
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`animate-spin rounded-full border-zinc-200 border-t-blue-600 dark:border-zinc-700 dark:border-t-blue-500 ${sizeClasses[size]}`}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
}

/**
 * Full-page loading overlay
 */
export function FullPageLoading({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{message}</p>
      </div>
    </div>
  );
}

/**
 * Content wrapper with loading state
 */
export function LoadingWrapper({
  loading,
  children,
  fallback,
}: {
  loading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (loading) {
    return fallback || <LoadingSpinner />;
  }

  return <>{children}</>;
}
