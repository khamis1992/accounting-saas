/**
 * RecentItemsDropdown Component
 *
 * React component for UI functionality
 *
 * @fileoverview RecentItemsDropdown React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";
import { useRecentItems } from "@/hooks/use-recent-items";
import { Clock, X } from "lucide-react";
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

export function RecentItemsDropdown() {
  const { recentItems, clearRecent, removeRecentItem } = useRecentItems();
  const router = useRouter();
  const t = useTranslations("common");

  if (recentItems.length === 0) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" title={t("recent") || "Recent"}>
          <Clock className="h-5 w-5" />
          <span className="sr-only">{t("recent") || "Recent"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("recent") || "Recent"}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              clearRecent();
            }}
            className="h-auto p-1 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            {t("clear") || "Clear"}
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {recentItems.slice(0, 5).map((item) => (
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
                removeRecentItem(item.path);
              }}
              aria-label={`Remove ${item.title} from recent items`}
              title={`Remove ${item.title} from recent items`}
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
