/**
 * CommandPalette Component
 *
 * Global command palette for quick navigation
 *
 * @fileoverview CommandPalette React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

/**
 * Command Palette Component
 *
 * Keyboard-driven search and navigation system (Cmd+K / Ctrl+K)
 * Provides quick access to all pages in the application
 *
 * Fully internationalized with support for English and Arabic
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Book,
  BookOpen,
  FileText,
  Scale,
  BarChart3,
  Users,
  FileStack,
  DollarSign,
  Building2,
  ShoppingCart,
  Receipt,
  Landmark,
  CheckCircle,
  Building,
  TrendingDown,
  Percent,
  FileSpreadsheet,
  BarChart2,
  Shield,
  Calendar,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import {
  navigationItems,
  getGroupedNavigationItems,
  NavigationItem,
  getNavigationLabel,
  getNavigationModule,
} from "@/lib/navigation-data";
import { useCommandPalette } from "@/hooks/use-command-palette";
import logger from "@/lib/logger";

// Map icon names to Lucide components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard,
  Book,
  BookOpen,
  FileText,
  Scale,
  BarChart3,
  Users,
  FileStack,
  DollarSign,
  Building2,
  ShoppingCart,
  Receipt,
  Landmark,
  CheckCircle,
  Building,
  TrendingDown,
  Percent,
  FileSpreadsheet,
  BarChart2,
  Shield,
  Calendar,
  Target,
};

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations();
  const tCommon = useTranslations("common");
  const tCommandPalette = useTranslations("commandPalette");

  const [recentItems, setRecentItems] = React.useState<string[]>([]);
  const [favorites, setFavorites] = React.useState<string[]>([]);

  // Load recent items and favorites from localStorage on mount
  React.useEffect(() => {
    try {
      const savedRecent = localStorage.getItem("command-palette-recent");
      const savedFavorites = localStorage.getItem("command-palette-favorites");
      if (savedRecent) setRecentItems(JSON.parse(savedRecent));
      if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
    } catch (error) {
      logger.error("Failed to load command palette history", error as Error);
    }
  }, []);

  // Save to localStorage when they change
  const saveRecentItem = (href: string) => {
    const newRecent = [href, ...recentItems.filter((item) => item !== href)].slice(0, 5);
    setRecentItems(newRecent);
    try {
      localStorage.setItem("command-palette-recent", JSON.stringify(newRecent));
    } catch (error) {
      logger.error("Failed to save recent item", error as Error);
    }
  };

  const toggleFavorite = (href: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFavorites = favorites.includes(href)
      ? favorites.filter((f) => f !== href)
      : [...favorites, href];
    setFavorites(newFavorites);
    try {
      localStorage.setItem("command-palette-favorites", JSON.stringify(newFavorites));
    } catch (error) {
      logger.error("Failed to save favorites", error as Error);
    }
  };

  const handleNavigate = (href: string, isImplemented: boolean) => {
    if (!isImplemented) {
      toast.info(tCommandPalette("comingSoon"), {
        description: tCommandPalette("underDevelopment"),
        duration: 3000,
      });
      onOpenChange(false);
      return;
    }

    const fullPath = `/${locale}${href}`;
    router.push(fullPath);
    saveRecentItem(href);
    onOpenChange(false);
  };

  // Get recent navigation items
  const recentNavItems = React.useMemo(() => {
    return recentItems
      .map((href) => navigationItems.find((item) => item.href === href))
      .filter(Boolean) as NavigationItem[];
  }, [recentItems]);

  // Get favorite navigation items
  const favoriteNavItems = React.useMemo(() => {
    return favorites
      .map((href) => navigationItems.find((item) => item.href === href))
      .filter(Boolean) as NavigationItem[];
  }, [favorites]);

  // Get grouped navigation items
  const groupedItems = React.useMemo(() => getGroupedNavigationItems(), []);

  // Render icon component
  const renderIcon = (iconName: string, className = "h-4 w-4") => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className={className} /> : null;
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder={tCommandPalette("searchPlaceholder")} />
      <CommandList>
        <CommandEmpty>{tCommandPalette("noResults")}</CommandEmpty>

        {/* Favorites Section */}
        {favoriteNavItems.length > 0 && (
          <>
            <CommandGroup heading={tCommon("favorites")}>
              {favoriteNavItems.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleNavigate(item.href, item.implemented!)}
                  className="group"
                >
                  {item.icon && renderIcon(item.icon)}
                  <span className="flex-1">{getNavigationLabel(item, t)}</span>
                  <span className="text-xs text-zinc-500">{getNavigationModule(item, t)}</span>
                  <button
                    onClick={(e) => toggleFavorite(item.href, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    aria-label={tCommon("removeFavorite")}
                  >
                    ★
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* Recent Section */}
        {recentNavItems.length > 0 && (
          <>
            <CommandGroup heading={tCommon("recent")}>
              {recentNavItems.map((item) => (
                <CommandItem
                  key={item.id}
                  onSelect={() => handleNavigate(item.href, item.implemented!)}
                  className="group"
                >
                  {item.icon && renderIcon(item.icon)}
                  <span className="flex-1">{getNavigationLabel(item, t)}</span>
                  <span className="text-xs text-zinc-500">{getNavigationModule(item, t)}</span>
                  <button
                    onClick={(e) => toggleFavorite(item.href, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                    aria-label={
                      favorites.includes(item.href)
                        ? tCommon("removeFavorite")
                        : tCommon("addFavorite")
                    }
                  >
                    {favorites.includes(item.href) ? "★" : "☆"}
                  </button>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}

        {/* All Pages Grouped by Module */}
        {Object.entries(groupedItems).map(([moduleKey, items]) => (
          <CommandGroup key={moduleKey} heading={t(moduleKey)}>
            {items.map((item) => (
              <CommandItem
                key={item.id}
                onSelect={() => handleNavigate(item.href, item.implemented!)}
                className="group"
              >
                {item.icon && renderIcon(item.icon)}
                <span className="flex-1">{getNavigationLabel(item, t)}</span>
                {!item.implemented && (
                  <span className="text-xs text-zinc-500">{tCommandPalette("comingSoon")}</span>
                )}
                <button
                  onClick={(e) => toggleFavorite(item.href, e)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                  aria-label={
                    favorites.includes(item.href)
                      ? tCommon("removeFavorite")
                      : tCommon("addFavorite")
                  }
                >
                  {favorites.includes(item.href) ? "★" : "☆"}
                </button>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}

        {/* Keyboard Shortcuts Info */}
        <CommandSeparator />
        <CommandGroup heading={tCommandPalette("keyboardShortcuts")}>
          <CommandItem disabled>
            <span>{tCommandPalette("openPalette")}</span>
            <CommandShortcut>⌘K</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            <span>{tCommandPalette("navigate")}</span>
            <CommandShortcut>↑↓ Enter</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            <span>{tCommandPalette("close")}</span>
            <CommandShortcut>Esc</CommandShortcut>
          </CommandItem>
          <CommandItem disabled>
            <span>{tCommandPalette("toggleFavorite")}</span>
            <CommandShortcut>Click ☆</CommandShortcut>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

/**
 * Standalone hook for integrating command palette into layouts
 */
export function useCommandPaletteIntegration() {
  const [open, setOpen] = React.useState(false);

  useCommandPalette(open, setOpen);

  return { open, setOpen };
}
