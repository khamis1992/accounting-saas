/**
 * TemplateTransition Component
 *
 * React component for UI functionality
 *
 * @fileoverview TemplateTransition React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface TemplateTransitionProps {
  children: ReactNode;
}

/**
 * Variants for template transitions
 * Used in Next.js App Router for smoother page transitions
 */
const variants = {
  hidden: { opacity: 0, x: -20, scale: 0.95 },
  enter: { opacity: 1, x: 0, scale: 1 },
  exit: { opacity: 0, x: 20, scale: 0.95 },
};

/**
 * TemplateTransition component
 *
 * Designed for Next.js App Router template.tsx files.
 * Provides subtle slide and scale animations for better perceived performance.
 *
 * @example
 * ```tsx
 * // app/[locale]/template.tsx
 * export default function Template({ children }: { children: ReactNode }) {
 *   return <TemplateTransition>{children}</TemplateTransition>;
 * }
 * ```
 */
export function TemplateTransition({ children }: TemplateTransitionProps) {
  return (
    <motion.div
      initial="hidden"
      animate="enter"
      exit="exit"
      variants={variants}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
