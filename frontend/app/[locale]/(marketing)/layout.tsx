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
import { ReactNode } from "react";

export default function MarketingLayout({ children }: { children: ReactNode }) {
  return <div className="min-h-screen">{children}</div>;
}
