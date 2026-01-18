/**
 * FavoritesButton Component
 *
 * React component for UI functionality
 *
 * @fileoverview FavoritesButton React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";
import { useFavorites } from "@/hooks/use-favorites";
import { usePathname } from "next/navigation";
import { Star, StarOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { useLocale } from "next-intl";

export function FavoritesButton() {
  const pathname = usePathname();
  const t = useTranslations("breadcrumbs");
  const locale = useLocale();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [pageTitle, setPageTitle] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  // Get current page title
  useEffect(() => {
    // Skip auth pages and root
    if (
      pathname.includes("/signin") ||
      pathname.includes("/signup") ||
      pathname === "/" ||
      pathname === `/${locale}` ||
      pathname === `/${locale}/dashboard`
    ) {
      setPageTitle("");
      return;
    }

    // Extract page title from pathname using breadcrumb logic
    const segments = pathname.split("/").filter(Boolean);

    // Remove locale prefix
    if (segments.length > 0 && (segments[0] === "en" || segments[0] === "ar")) {
      segments.shift();
    }

    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];

      // Skip numeric IDs
      if (!/^\d+$/.test(lastSegment)) {
        const title = getBreadcrumbLabel(lastSegment, segments, segments.length - 1, t);
        if (title) {
          setPageTitle(title);
          setIsInitialized(true);
          return;
        }
      }
    }

    setPageTitle("");
    setIsInitialized(true);
  }, [pathname, locale, t]);

  const favorite = isFavorite(pathname);

  // Don't show button on auth pages or if no title
  if (
    !isInitialized ||
    !pageTitle ||
    pathname.includes("/signin") ||
    pathname.includes("/signup") ||
    pathname === "/" ||
    pathname === `/${locale}` ||
    pathname === `/${locale}/dashboard`
  ) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => toggleFavorite(pathname, pageTitle)}
      title={favorite ? t("removeFavorite") : t("addFavorite")}
      aria-label={favorite ? t("removeFavorite") : t("addFavorite")}
    >
      {favorite ? (
        <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
      ) : (
        <StarOff className="h-5 w-5" />
      )}
    </Button>
  );
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
