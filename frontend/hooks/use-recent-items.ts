/**
 * UseRecentItems.ts Hook
 *
 * Custom React hook for tracking recently visited pages
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import logger from "@/lib/logger";

export interface RecentItem {
  path: string;
  title: string;
  timestamp: number;
}

const STORAGE_KEY = "recent-items";
const MAX_RECENT_ITEMS = 10;
const MAX_AGE_DAYS = 30; // Remove items older than 30 days

export function useRecentItems() {
  const pathname = usePathname();
  const t = useTranslations("breadcrumbs");
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items: RecentItem[] = JSON.parse(stored);
        // Filter out old items
        const validItems = items.filter((item) => {
          const age = Date.now() - item.timestamp;
          return age < MAX_AGE_DAYS * 24 * 60 * 60 * 1000;
        });
        setRecentItems(validItems);
      }
    } catch (error) {
      logger.error("Failed to load recent items", error as Error);
    }
  }, []);

  // Save to localStorage whenever recentItems changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(recentItems));
    } catch (error) {
      logger.error("Failed to save recent items", error as Error);
    }
  }, [recentItems]);

  // Track current page
  useEffect(() => {
    // Skip auth pages and root
    if (
      pathname.includes("/signin") ||
      pathname.includes("/signup") ||
      pathname === "/" ||
      pathname.endsWith("/dashboard")
    ) {
      return;
    }

    // Get page title from pathname
    const title = getPageTitle(pathname, t);
    if (!title) return; // Skip if we can't get a title

    setRecentItems((prev) => {
      // Remove current path if it already exists
      const filtered = prev.filter((item) => item.path !== pathname);

      // Add current item to the beginning
      const newItem: RecentItem = {
        path: pathname,
        title,
        timestamp: Date.now(),
      };

      const updated = [newItem, ...filtered];

      // Keep only MAX_RECENT_ITEMS
      return updated.slice(0, MAX_RECENT_ITEMS);
    });
  }, [pathname, t]);

  const clearRecent = () => {
    setRecentItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.error("Failed to clear recent items", error as Error);
    }
  };

  const removeRecentItem = (path: string) => {
    setRecentItems((prev) => prev.filter((item) => item.path !== path));
  };

  return {
    recentItems,
    clearRecent,
    removeRecentItem,
  };
}

// Helper function to get page title from pathname
function getPageTitle(pathname: string, t: any): string | null {
  const segments = pathname.split("/").filter(Boolean);

  // Remove locale prefix
  if (segments.length > 0 && (segments[0] === "en" || segments[0] === "ar")) {
    segments.shift();
  }

  // Map path segments to titles using the same logic as breadcrumbs
  if (segments.length === 0) return null;

  // Get the last meaningful segment
  const lastSegment = segments[segments.length - 1];

  // Skip numeric IDs
  if (/^\d+$/.test(lastSegment)) {
    // Try to get the parent segment instead
    if (segments.length > 1) {
      const parentSegment = segments[segments.length - 2];
      return getBreadcrumbLabel(parentSegment, segments, segments.length - 2, t);
    }
    return null;
  }

  return getBreadcrumbLabel(lastSegment, segments, segments.length - 1, t);
}

/**
 * Get translated label for a path segment (same as breadcrumb logic)
 */
function getBreadcrumbLabel(
  segment: string,
  allSegments: string[],
  index: number,
  t: (key: string) => string
): string | null {
  const lowerSegment = segment.toLowerCase();

  // Map of segment variations to translation keys
  const segmentMap: Record<string, string> = {
    coa: "chartOfAccounts",
    "chart-of-accounts": "chartOfAccounts",
    "general-ledger": "generalLedger",
    "trial-balance": "trialBalance",
    "financial-statements": "financialStatements",
    "balance-sheet": "balanceSheet",
    "income-statement": "incomeStatement",
    "purchase-orders": "purchaseOrders",
    "bank-accounts": "bankAccounts",
    "fixed-assets": "fixedAssets",
    "vat-returns": "vatReturns",
    "fiscal-year": "fiscal",
    "cost-centers": "costCenters",
  };

  // Check if segment has a mapped translation key
  const mappedKey = segmentMap[lowerSegment];
  if (mappedKey) {
    return tryGetTranslation(mappedKey, t, null);
  }

  // Handle "new" prefix
  if (lowerSegment === "new" && index + 1 < allSegments.length) {
    const nextSegment = allSegments[index + 1].toLowerCase();
    const nextSegmentMapped = segmentMap[nextSegment] || nextSegment;

    const newKey = `new${nextSegmentMapped.charAt(0).toUpperCase()}${nextSegmentMapped.slice(1)}`;
    const translated = tryGetTranslation(newKey, t, "");

    if (translated) {
      return translated;
    }

    const resourceLabel = tryGetTranslation(nextSegmentMapped, t, nextSegment);
    return `${tryGetTranslation("new", t, "New")} ${resourceLabel}`;
  }

  // Handle "edit" prefix
  if (lowerSegment === "edit" && index + 1 < allSegments.length) {
    const nextSegment = allSegments[index + 1].toLowerCase();
    const nextSegmentMapped = segmentMap[nextSegment] || nextSegment;

    const resourceLabel = tryGetTranslation(nextSegmentMapped, t, nextSegment);
    return `${tryGetTranslation("edit", t, "Edit")} ${resourceLabel}`;
  }

  // Try direct translation
  const translated = tryGetTranslation(lowerSegment, t, "");
  if (translated) {
    return translated;
  }

  // Fallback: capitalize the segment
  return segment
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Try to get translation, return fallback if not found
 */
function tryGetTranslation(
  key: string,
  t: (key: string) => string,
  fallback: string | null
): string | null {
  try {
    const translated = t(key);
    // If translation returns the key itself, it means no translation exists
    if (translated === key && fallback) {
      return fallback;
    }
    return translated;
  } catch {
    return fallback;
  }
}
