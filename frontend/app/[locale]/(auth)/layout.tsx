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

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
