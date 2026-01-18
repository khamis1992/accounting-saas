/**
 * Layout Component
 *
 * Layout wrapper for settings module pages
 * Note: AuthenticatedLayout is already provided by (app)/layout.tsx
 *
 * @fileoverview Settings module layout component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const t = await getTranslations("settings");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">{t("description")}</p>
      </div>
      {children}
    </div>
  );
}
