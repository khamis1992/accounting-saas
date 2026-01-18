/**
 * Topbar Component
 *
 * Top navigation bar with search and user menu
 *
 * @fileoverview Topbar React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Languages, Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { RecentItemsDropdown } from "./recent-items-dropdown";
import { FavoritesDropdown } from "./favorites-dropdown";
import { FavoritesButton } from "./favorites-button";

interface TopbarProps {
  openCommandPalette?: () => void;
}

export function Topbar({ openCommandPalette }: TopbarProps) {
  const t = useTranslations("common");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  const changeLocale = (newLocale: string) => {
    // Replace the locale in the pathname
    const segments = pathname.split("/");
    segments[1] = newLocale;
    const newPathname = segments.join("/");
    router.push(newPathname);
    router.refresh();
  };

  const isMac = typeof window !== "undefined" ? /Mac/.test(window.navigator.platform) : false;
  const shortcutKey = isMac ? "⌘K" : "Ctrl+K";

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-4 lg:px-6 dark:bg-zinc-950">
      <div className="flex items-center gap-4">
        {/* Command Palette Trigger - Desktop Only */}
        {openCommandPalette && (
          <Button
            variant="outline"
            onClick={openCommandPalette}
            className="hidden md:flex relative w-64 justify-start text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            <Search className="mr-2 h-4 w-4" />
            <span>{t("searchPlaceholder") || t("search")}...</span>
            <kbd className="pointer-events-none absolute right-2 top-2 h-5 select-none rounded border border-zinc-200 bg-zinc-100 px-1.5 font-mono text-[10px] font-medium text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
              {shortcutKey}
            </kbd>
          </Button>
        )}

        {/* Mobile Search Icon Only */}
        {openCommandPalette && (
          <Button
            variant="ghost"
            size="icon"
            onClick={openCommandPalette}
            className="md:hidden"
            aria-label={t("search")}
          >
            <Search className="h-5 w-5" />
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <RecentItemsDropdown />
        <FavoritesDropdown />
        <FavoritesButton />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={t("changeLanguage")}>
              <Languages className="h-5 w-5" />
              <span className="sr-only">{t("changeLanguage")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => changeLocale("en")}
              className={locale === "en" ? "bg-zinc-100 dark:bg-zinc-800" : ""}
            >
              <span className="mr-2">🇬🇧</span>
              {t("english") || "English"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => changeLocale("ar")}
              className={locale === "ar" ? "bg-zinc-100 dark:bg-zinc-800" : ""}
            >
              <span className="mr-2">🇶🇦</span>
              {t("arabic") || "العربية"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" aria-label={t("notifications")}>
          <Bell className="h-5 w-5" />
          <span className="sr-only">{t("notifications")}</span>
        </Button>
      </div>
    </header>
  );
}
