/**
 * AuthenticatedLayout Component
 *
 * Layout wrapper for authenticated pages
 *
 * @fileoverview AuthenticatedLayout React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { Breadcrumb } from "./breadcrumb";
import { CommandPalette } from "./command-palette";
import { useCommandPalette } from "@/hooks/use-command-palette";
import { PageTransition } from "@/components/animations";
import { SkipLink, MainContent } from "@/components/ui/skip-link";

export function AuthenticatedLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Set up keyboard shortcut for command palette
  useCommandPalette(commandPaletteOpen, setCommandPaletteOpen);

  useEffect(() => {
    if (!loading && !user) {
      // Extract locale from pathname or default to 'en'
      const locale = pathname.split("/")[1] || "en";
      router.push(`/${locale}/signin`);
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen flex-row overflow-hidden">
      {/* Skip Navigation Link - WCAG 2.1 AA Compliance */}
      <SkipLink />

      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar openCommandPalette={() => setCommandPaletteOpen(true)} />
        <MainContent className="flex-1 overflow-y-auto bg-zinc-50 p-4 md:p-6 dark:bg-zinc-950 pt-20 lg:pt-6">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb />
            <PageTransition>{children}</PageTransition>
          </div>
        </MainContent>
      </div>

      {/* Global Command Palette */}
      <CommandPalette open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen} />
    </div>
  );
}
