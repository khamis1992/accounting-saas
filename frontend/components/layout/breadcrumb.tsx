/**
 * Breadcrumb Component
 *
 * Breadcrumb navigation component
 *
 * @fileoverview Breadcrumb React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Home, ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Breadcrumb item interface
 */
interface BreadcrumbItem {
  label: string;
  href: string;
  isCurrent: boolean;
}

/**
 * Breadcrumb navigation component
 * Auto-generates breadcrumbs from current pathname with full i18n support
 */
export function Breadcrumb() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("breadcrumbs");

  // Generate breadcrumb items from pathname
  const breadcrumbs = generateBreadcrumbs(pathname, locale, t);

  // Don't show breadcrumbs on home page or if there's only one item (home)
  if (breadcrumbs.length <= 1) {
    return null;
  }

  const isRTL = locale === "ar";
  const SeparatorIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <nav
      className="flex items-center space-x-1 space-x-reverse text-sm text-zinc-600 dark:text-zinc-400 mb-4"
      aria-label="Breadcrumb"
    >
      <ol className="flex items-center space-x-1 space-x-reverse">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb.href} className="flex items-center">
            {index > 0 && <SeparatorIcon className="h-4 w-4 shrink-0 text-zinc-400 mx-1" />}

            {breadcrumb.isCurrent ? (
              <span className="font-medium text-zinc-900 dark:text-zinc-50" aria-current="page">
                {breadcrumb.label}
              </span>
            ) : (
              <Link
                href={breadcrumb.href}
                className={cn(
                  "flex items-center hover:text-zinc-900 dark:hover:text-zinc-50 transition-colors",
                  index === 0 && "hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md p-1"
                )}
              >
                {index === 0 && <Home className="h-4 w-4" />}
                <span className={index === 0 ? "sr-only" : ""}>{breadcrumb.label}</span>
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/**
 * Generate breadcrumb items from pathname
 */
function generateBreadcrumbs(
  pathname: string,
  locale: string,
  t: (key: string) => string
): BreadcrumbItem[] {
  const breadcrumbs: BreadcrumbItem[] = [];

  // Remove locale prefix from pathname
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  // Split path into segments
  const segments = pathWithoutLocale.split("/").filter(Boolean);

  // Always add home breadcrumb
  breadcrumbs.push({
    label: t("home"),
    href: `/${locale}`,
    isCurrent: segments.length === 0,
  });

  // Build cumulative path for each segment
  let cumulativePath = "";
  const translatedSegments: string[] = [];

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    cumulativePath += `/${segment}`;

    // Skip numeric segments (IDs)
    if (/^\d+$/.test(segment)) {
      // Check if previous segment was "new" or "edit"
      const prevSegment = i > 0 ? segments[i - 1] : "";
      if (prevSegment === "new" || prevSegment === "edit") {
        // This is likely an ID following new/edit, skip it
        continue;
      }

      // For other ID cases, skip the numeric segment
      translatedSegments.push(segment);
      continue;
    }

    // Get translation for the segment
    const label = getBreadcrumbLabel(segment, segments, i, t);
    translatedSegments.push(label);

    // Determine if this is the current page
    const isCurrent = i === segments.length - 1;

    breadcrumbs.push({
      label,
      href: `/${locale}${cumulativePath}`,
      isCurrent,
    });
  }

  return breadcrumbs;
}

/**
 * Get translated label for a path segment
 */
function getBreadcrumbLabel(
  segment: string,
  allSegments: string[],
  index: number,
  t: (key: string) => string
): string {
  // Handle special cases
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
    return tryGetTranslation(mappedKey, t, segment);
  }

  // Handle "new" prefix - combine with next segment if available
  if (lowerSegment === "new" && index + 1 < allSegments.length) {
    const nextSegment = allSegments[index + 1].toLowerCase();
    const nextSegmentMapped = segmentMap[nextSegment] || nextSegment;

    // Try to get "new[Resource]" translation
    const newKey = `new${nextSegmentMapped.charAt(0).toUpperCase()}${nextSegmentMapped.slice(1)}`;
    const translated = tryGetTranslation(newKey, t, "");

    if (translated) {
      return translated;
    }

    // Fallback to "New" + translated resource name
    const resourceLabel = tryGetTranslation(nextSegmentMapped, t, nextSegment);
    return `${t("new")} ${resourceLabel}`;
  }

  // Handle "edit" prefix - combine with next segment if available
  if (lowerSegment === "edit" && index + 1 < allSegments.length) {
    const nextSegment = allSegments[index + 1].toLowerCase();
    const nextSegmentMapped = segmentMap[nextSegment] || nextSegment;

    const resourceLabel = tryGetTranslation(nextSegmentMapped, t, nextSegment);
    return `${t("edit")} ${resourceLabel}`;
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
function tryGetTranslation(key: string, t: (key: string) => string, fallback: string): string {
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
