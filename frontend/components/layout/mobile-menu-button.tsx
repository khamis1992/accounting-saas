/**
 * MobileMenuButton Component
 *
 * React component for UI functionality
 *
 * @fileoverview MobileMenuButton React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

interface MobileMenuButtonProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export function MobileMenuButton({ isOpen, onClick, className }: MobileMenuButtonProps) {
  const t = useTranslations("common");

  return (
    <Button
      onClick={onClick}
      size="icon"
      className={cn(
        "lg:hidden fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg",
        "bg-primary text-primary-foreground hover:bg-primary/90",
        "transition-all duration-200 ease-out",
        "hover:scale-110 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isOpen && "rotate-90",
        className
      )}
      aria-label={isOpen ? t("closeMenu") : t("openMenu")}
      aria-expanded={isOpen}
    >
      <Menu className="h-6 w-6 transition-transform duration-200" />
      {/* Pulse animation when closed */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" />
      )}
    </Button>
  );
}
