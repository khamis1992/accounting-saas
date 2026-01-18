/**
 * UsePageTitle.ts Hook
 *
 * Custom React hook for Custom React hook functionality
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { setPageTitle } from "@/lib/accessibility";

/**
 * usePageTitle Hook
 *
 * Automatically sets page title for screen readers and browser tabs
 * WCAG 2.1 AA compliant - each page must have a unique, descriptive title
 *
 * @param titleKey - Translation key for the page title
 * @param appName - Optional app name to append
 */
export function usePageTitle(titleKey: string, appName?: string) {
  const t = useTranslations();

  useEffect(() => {
    const title = t(titleKey);
    setPageTitle(title, appName);
  }, [titleKey, t, appName]);
}

/**
 * Hook for setting page title with custom text
 *
 * @param title - The page title
 * @param appName - Optional app name to append
 */
export function usePageTitleCustom(title: string, appName?: string) {
  useEffect(() => {
    setPageTitle(title, appName);
  }, [title, appName]);
}
