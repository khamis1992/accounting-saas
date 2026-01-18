/**
 * AdaptiveAnimation Component
 *
 * React component for UI functionality
 *
 * @fileoverview AdaptiveAnimation React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { motion, MotionProps } from "framer-motion";
import { ReactNode } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

interface AdaptiveAnimationProps extends MotionProps {
  children: ReactNode;
  className?: string;
}

/**
 * AdaptiveAnimation component
 *
 * Automatically respects user's prefers-reduced-motion setting.
 * Disables or simplifies animations when user prefers reduced motion.
 *
 * @example
 * ```tsx
 * <AdaptiveAnimation
 *   initial={{ opacity: 0, y: 20 }}
 *   animate={{ opacity: 1, y: 0 }}
 * >
 *   <Content />
 * </AdaptiveAnimation>
 * ```
 */
export function AdaptiveAnimation({ children, className, ...motionProps }: AdaptiveAnimationProps) {
  const reducedMotion = useReducedMotion();

  // Adjust props based on reduced motion preference
  const adaptiveProps: MotionProps = reducedMotion
    ? {
        // Override animation props to reduce motion
        initial: {},
        animate: {},
        transition: { duration: 0 },
      }
    : motionProps;

  return (
    <motion.div className={className} {...adaptiveProps}>
      {children}
    </motion.div>
  );
}
