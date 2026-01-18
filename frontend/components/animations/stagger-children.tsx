/**
 * StaggerChildren Component
 *
 * React component for UI functionality
 *
 * @fileoverview StaggerChildren React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import React from "react";
import { motion, Variants } from "framer-motion";
import { ReactNode, useCallback } from "react";

interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  className?: string;
  variants?: Variants;
}

/**
 * Container variants for stagger animations
 */
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    },
  },
};

/**
 * Item variants for stagger animations
 */
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

/**
 * StaggerChildren component
 *
 * Animates list items with a cascading stagger effect.
 * Perfect for lists, grids, and card collections.
 *
 * @example
 * ```tsx
 * <StaggerChildren staggerDelay={0.05}>
 *   <Item>Item 1</Item>
 *   <Item>Item 2</Item>
 *   <Item>Item 3</Item>
 * </StaggerChildren>
 * ```
 */
export function StaggerChildren({
  children,
  staggerDelay = 0.05,
  className,
  variants: customVariants,
}: StaggerChildrenProps) {
  // Create container variants with custom stagger delay
  const container = useCallback((): Variants => {
    if (customVariants) return customVariants;

    return {
      hidden: { opacity: 0 },
      show: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay,
          delayChildren: 0,
        },
      },
    };
  }, [staggerDelay, customVariants]);

  return (
    <motion.div variants={container()} initial="hidden" animate="show" className={className}>
      {React.Children.map(children, (child) => (
        <motion.div variants={customVariants || itemVariants}>{child}</motion.div>
      ))}
    </motion.div>
  );
}
