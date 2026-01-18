/**
 * UseAnimationPreset.ts Hook
 *
 * Custom React hook for Custom React hook functionality
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { Variants, Transition } from "framer-motion";
import { useReducedMotion } from "./use-reduced-motion";

/**
 * Animation presets
 *
 * Reusable animation configurations for common patterns.
 */
export const presets = {
  /**
   * Simple fade in/out
   */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.2, ease: "easeInOut" as const },
  },

  /**
   * Slide in from right
   */
  slideInRight: {
    initial: { x: 20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -20, opacity: 0 },
    transition: { duration: 0.3, ease: "easeInOut" as const },
  },

  /**
   * Slide in from left
   */
  slideInLeft: {
    initial: { x: -20, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: 20, opacity: 0 },
    transition: { duration: 0.3, ease: "easeInOut" as const },
  },

  /**
   * Scale with fade
   */
  scaleIn: {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 },
    transition: { duration: 0.2, ease: "easeInOut" as const },
  },

  /**
   * Spring animation for playful interactions
   */
  springIn: {
    initial: { scale: 0.8, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    transition: {
      type: "spring" as const,
      stiffness: 200,
      damping: 20,
    },
  },

  /**
   * Smooth slide up (for drawers/bottom sheets)
   */
  slideUp: {
    initial: { y: 20, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { y: 20, opacity: 0 },
    transition: { duration: 0.3, ease: "easeOut" as const },
  },
} as const;

export type AnimationPreset = keyof typeof presets;

/**
 * Hook to use animation presets with reduced motion support
 *
 * @param preset - Name of the preset to use
 * @returns Animation config with reduced motion support
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const preset = useAnimationPreset('fadeIn');
 *
 *   return (
 *     <motion.div {...preset}>
 *       Content
 *     </motion.div>
 *   );
 * }
 * ```
 */
export function useAnimationPreset(preset: AnimationPreset) {
  const reducedMotion = useReducedMotion();

  const config = presets[preset];

  if (reducedMotion) {
    return {
      initial: {},
      animate: {},
      exit: {},
      transition: { duration: 0 },
    };
  }

  return config;
}

/**
 * Hook to create custom animation config with reduced motion support
 *
 * @param config - Custom animation config
 * @returns Animation config with reduced motion support
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const config = useAnimationConfig({
 *     initial: { scale: 0 },
 *     animate: { scale: 1 },
 *     transition: { duration: 0.5 }
 *   });
 *
 *   return <motion.div {...config}>Content</motion.div>;
 * }
 * ```
 */
export function useAnimationConfig(config: {
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: Transition;
}) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return {
      initial: {},
      animate: {},
      exit: {},
      transition: { duration: 0 },
    };
  }

  return config;
}
