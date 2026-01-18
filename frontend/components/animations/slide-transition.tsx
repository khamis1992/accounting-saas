/**
 * SlideTransition Component
 *
 * React component for UI functionality
 *
 * @fileoverview SlideTransition React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

type Direction = "left" | "right" | "up" | "down";

interface SlideTransitionProps {
  children: ReactNode;
  direction?: Direction;
  duration?: number;
  distance?: number;
  className?: string;
}

/**
 * SlideTransition component
 *
 * Slides content in from a specified direction.
 * Great for navigation transitions and drawer animations.
 *
 * @example
 * ```tsx
 * <SlideTransition direction="right" duration={0.3}>
 *   <Content />
 * </SlideTransition>
 * ```
 */
export function SlideTransition({
  children,
  direction = "right",
  duration = 0.3,
  distance = 20,
  className,
}: SlideTransitionProps) {
  const variants: Record<Direction, { x?: number; y?: number }> = {
    left: { x: -distance },
    right: { x: distance },
    up: { y: distance },
    down: { y: -distance },
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...variants[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...variants[direction] }}
      transition={{
        duration,
        ease: "easeInOut",
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
