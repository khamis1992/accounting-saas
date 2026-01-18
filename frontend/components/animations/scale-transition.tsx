/**
 * ScaleTransition Component
 *
 * React component for UI functionality
 *
 * @fileoverview ScaleTransition React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";

interface ScaleTransitionProps {
  children: ReactNode;
  duration?: number;
  initialScale?: number;
  className?: string;
}

/**
 * ScaleTransition component
 *
 * Scales content up/down with fade effect.
 * Perfect for modals, dialogs, and focused content.
 *
 * @example
 * ```tsx
 * <ScaleTransition duration={0.2} initialScale={0.95}>
 *   <ModalContent />
 * </ScaleTransition>
 * ```
 */
export function ScaleTransition({
  children,
  duration = 0.2,
  initialScale = 0.95,
  className,
}: ScaleTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: initialScale }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: initialScale }}
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
