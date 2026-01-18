/**
 * ErrorBoundary Component
 *
 * React component for UI functionality
 *
 * @fileoverview ErrorBoundary React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import logger from "@/lib/logger";

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of the
 * component tree that crashed.
 *
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error reporting service
    logger.error("Error caught by boundary", error, { componentStack: errorInfo.componentStack });

    // You could send this to Sentry, LogRocket, etc.
    // logErrorToService(error, errorInfo);

    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-900">
            <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 shadow-lg dark:border-red-800 dark:bg-zinc-950">
              <h2 className="mb-4 text-lg font-semibold text-red-800 dark:text-red-400">
                Something went wrong
              </h2>

              <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">
                We apologize for the inconvenience. An error has occurred and we&apos;re working to
                fix it.
              </p>

              {this.state.error && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Error details
                  </summary>
                  <pre className="mt-2 overflow-auto rounded bg-zinc-100 p-2 text-xs text-red-700 dark:bg-zinc-800 dark:text-red-400">
                    {this.state.error.toString()}
                    {this.state.errorInfo?.componentStack}
                  </pre>
                </details>
              )}

              <div className="flex gap-2">
                <Button onClick={this.handleReset} variant="default">
                  Try again
                </Button>
                <Button onClick={() => (window.location.href = "/")} variant="outline">
                  Go to homepage
                </Button>
              </div>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
