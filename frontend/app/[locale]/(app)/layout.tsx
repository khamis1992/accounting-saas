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
import { ReactNode } from "react";

export default function AppLayout({ children }: { children: ReactNode }) {
  return <AuthenticatedLayout>{children}</AuthenticatedLayout>;
}
