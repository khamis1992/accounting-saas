/**
 * template.tsx
 *
 * @fileoverview TypeScript module
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
import { TemplateTransition } from "@/components/animations/template-transition";

/**
 * Template for Next.js App Router
 *
 * This template wraps all pages with transition animations.
 * Unlike layout, template remounts on navigation, triggering animations.
 *
 * Read more: https://nextjs.org/docs/app/building-your-application/routing/pages-and-layouts#templates
 */
export default function Template({ children }: { children: React.ReactNode }) {
  return <TemplateTransition>{children}</TemplateTransition>;
}
