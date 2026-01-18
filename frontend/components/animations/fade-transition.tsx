/**
 * FadeTransition Component
 *
 * React component for UI functionality
 *
 * @fileoverview FadeTransition React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FadeTransitionProps {
  children: ReactNode;
  duration?: number;
  delay?: number;
  className?: string;
}

/**
 * FadeTransition component
 *
 * Simple fade-in/fade-out transition.
 * Useful for subtle content changes and modal animations.
 *
 * @example
 * ```tsx
 * <FadeTransition duration={0.3} delay={0.1}>
 *   <Content />
 * </FadeTransition>
 * ```
 */
export function FadeTransition({
  children,
  duration = 0.2,
  delay = 0,
  className,
}: FadeTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration,
        delay,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
