/**
 * SkeletonWithAnimation Component
 *
 * React component for UI functionality
 *
 * @fileoverview SkeletonWithAnimation React component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SkeletonWithAnimationProps {
  className?: string;
  width?: string | number;
  height?: string | number;
}

/**
 * SkeletonWithAnimation component
 *
 * Animated skeleton loader with smooth pulse effect.
 * Use for loading states while content is being fetched.
 *
 * @example
 * ```tsx
 * <SkeletonWithAnimation className="h-12 w-full" />
 * <SkeletonWithAnimation width="100%" height="200px" />
 * ```
 */
export function SkeletonWithAnimation({ className, width, height }: SkeletonWithAnimationProps) {
  return (
    <motion.div
      animate={{
        opacity: [0.5, 1, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
      className={cn("bg-zinc-200 dark:bg-zinc-800 rounded", className)}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
      }}
    />
  );
}

/**
 * SkeletonCard component
 *
 * Pre-built card skeleton with header, content, and footer animations.
 *
 * @example
 * ```tsx
 * <SkeletonCard />
 * ```
 */
export function SkeletonCard() {
  return (
    <div className="space-y-3 p-4 border rounded-lg bg-white dark:bg-zinc-900">
      <div className="flex items-center space-x-3">
        <SkeletonWithAnimation className="h-12 w-12 rounded-full" />
        <div className="space-y-2 flex-1">
          <SkeletonWithAnimation className="h-4 w-3/4" />
          <SkeletonWithAnimation className="h-3 w-1/2" />
        </div>
      </div>
      <div className="space-y-2">
        <SkeletonWithAnimation className="h-4 w-full" />
        <SkeletonWithAnimation className="h-4 w-full" />
        <SkeletonWithAnimation className="h-4 w-2/3" />
      </div>
      <div className="flex justify-between">
        <SkeletonWithAnimation className="h-8 w-20" />
        <SkeletonWithAnimation className="h-8 w-20" />
      </div>
    </div>
  );
}
