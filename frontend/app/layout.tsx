/**
 * Root Layout Component
 *
 * This is the root layout that wraps all pages.
 * It should NOT include <html> or <body> tags as those are defined
 * in the locale-specific layout ([locale]/layout.tsx).
 *
 * @fileoverview Root layout component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-18
 */
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Simply pass through children - locale layout handles html/body
  return children;
}
