/**
 * Loading Button Component
 *
 * A button component that shows a loading state when disabled/processing
 */

import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { LoadingSpinner } from "./loading-spinner";

interface LoadingButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
}

export function LoadingButton({
  loading = false,
  loadingText = "Loading...",
  children,
  disabled,
  className = "",
  ...props
}: LoadingButtonProps) {
  return (
    <Button disabled={loading || disabled} className={className} {...props}>
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      {loading ? loadingText : children}
    </Button>
  );
}
