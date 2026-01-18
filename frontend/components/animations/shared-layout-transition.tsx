/**
 * SharedLayoutTransition Component
 *
 * React component for UI functionality
 *
 * @fileoverview SharedLayoutTransition React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface SharedLayoutTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * SharedLayoutTransition component
 *
 * Provides smooth layout transitions with shared element animations.
 * Use when animating layout changes or reordering content.
 *
 * @example
 * ```tsx
 * <SharedLayoutTransition>
 *   <ReorderableContent />
 * </SharedLayoutTransition>
 * ```
 */
export function SharedLayoutTransition({ children, className }: SharedLayoutTransitionProps) {
  return (
    <motion.div
      layout
      initial={false}
      animate={{
        scale: [0.95, 1],
        opacity: [0, 1],
      }}
      transition={{
        duration: 0.2,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
