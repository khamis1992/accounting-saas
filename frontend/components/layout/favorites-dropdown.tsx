/**
 * FavoritesDropdown Component
 *
 * React component for UI functionality
 *
 * @fileoverview FavoritesDropdown React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";
import { useFavorites } from "@/hooks/use-favorites";
import { Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

export function FavoritesDropdown() {
  const { favorites, removeFavorite, clearFavorites, isInitialized } = useFavorites();
  const router = useRouter();
  const t = useTranslations("common");

  // Don't render until favorites are loaded from localStorage
  if (!isInitialized || favorites.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title={t("favorites") || "Favorites"}>
          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
          <span className="sr-only">{t("favorites") || "Favorites"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("favorites") || "Favorites"}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              clearFavorites();
            }}
            className="h-auto p-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {t("clear") || "Clear"}
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {favorites.map((item) => (
          <DropdownMenuItem
            key={item.path}
            onClick={() => router.push(item.path)}
            className="flex items-center justify-between group cursor-pointer"
          >
            <span className="flex-1 truncate">{item.title}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              onClick={(e) => {
                e.stopPropagation();
                removeFavorite(item.path);
              }}
              aria-label={`Remove ${item.title} from favorites`}
              title={`Remove ${item.title} from favorites`}
            >
              <X className="h-3 w-3" />
              <span className="sr-only">{t("remove") || t("delete")}</span>
            </Button>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
