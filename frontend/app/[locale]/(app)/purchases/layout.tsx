/**
 * Layout Component
 *
 * Layout wrapper for layout
 *
 * @fileoverview Layout component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
import { AuthenticatedLayout } from "@/components/layout/authenticated-layout";
import { useTranslations } from "next-intl";
import { ReactNode } from "react";

export default function PurchasesLayout({ children }: { children: ReactNode }) {
  const t = useTranslations("purchases");

  return (
    <AuthenticatedLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-zinc-600 dark:text-zinc-400 mt-2">{t("description")}</p>
      </div>
      {children}
    </AuthenticatedLayout>
  );
}
