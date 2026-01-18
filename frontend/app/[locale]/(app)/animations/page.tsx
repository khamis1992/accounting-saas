/**
 * page Page
 *
 * Route page component for /
 *
 * @fileoverview page page component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { PageTransition } from "@/components/animations";
import {
  FadeTransition,
  SlideTransition,
  ScaleTransition,
  StaggerChildren,
} from "@/components/animations";
import { SkeletonCard, SkeletonWithAnimation } from "@/components/loading";
import { useAnimationPreset } from "@/hooks";
import { motion } from "framer-motion";

/**
 * Animation Examples Page
 *
 * Demonstrates all available animation components and presets.
 * Use this page to test and visualize different animations.
 */
export default function AnimationsPage() {
  const fadeInPreset = useAnimationPreset("fadeIn");
  const scaleInPreset = useAnimationPreset("scaleIn");

  return (
    <PageTransition>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Animation Examples</h1>
          <p className="text-zinc-600 dark:text-zinc-400 mt-2">
            Showcase of available animation components and presets
          </p>
        </div>

        {/* Fade Transition */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Fade Transition</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Simple fade in/out animation</p>
          </div>
          <FadeTransition duration={0.5}>
            <div className="p-6 bg-white dark:bg-zinc-900 rounded-lg border">
              <p>This content fades in smoothly</p>
            </div>
          </FadeTransition>
        </section>

        {/* Slide Transition */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Slide Transition</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Slide animation from different directions
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SlideTransition direction="right">
              <div className="p-6 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-medium">Slide from Right</p>
              </div>
            </SlideTransition>
            <SlideTransition direction="left">
              <div className="p-6 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <p className="font-medium">Slide from Left</p>
              </div>
            </SlideTransition>
          </div>
        </section>

        {/* Scale Transition */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Scale Transition</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Scale animation with fade effect
            </p>
          </div>
          <ScaleTransition duration={0.3}>
            <div className="p-6 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
              <p className="font-medium">Scale Animation</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                Perfect for modals and focused content
              </p>
            </div>
          </ScaleTransition>
        </section>

        {/* Stagger Children */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Stagger Animation</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Cascading animation for list items
            </p>
          </div>
          <StaggerChildren staggerDelay={0.1}>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((item) => (
                <div key={item} className="p-4 bg-white dark:bg-zinc-900 rounded-lg border">
                  <p className="font-medium">Item {item}</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Each item animates with a delay
                  </p>
                </div>
              ))}
            </div>
          </StaggerChildren>
        </section>

        {/* Animation Presets */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Animation Presets</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Pre-configured animation presets via hooks
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.div
              {...fadeInPreset}
              className="p-6 bg-white dark:bg-zinc-900 rounded-lg border"
            >
              <p className="font-medium">Fade In Preset</p>
            </motion.div>
            <motion.div
              {...scaleInPreset}
              className="p-6 bg-white dark:bg-zinc-900 rounded-lg border"
            >
              <p className="font-medium">Scale In Preset</p>
            </motion.div>
          </div>
        </section>

        {/* Loading Skeletons */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Loading Skeletons</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Animated skeleton loaders</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <SkeletonWithAnimation className="h-4 w-3/4" />
              <SkeletonWithAnimation className="h-4 w-1/2" />
              <SkeletonWithAnimation className="h-4 w-5/6" />
            </div>
            <SkeletonCard />
          </div>
        </section>

        {/* Interactive Cards */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Interactive Cards</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Hover and tap animations</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, y: -5 }}
                whileTap={{ scale: 0.95 }}
                className="p-6 bg-white dark:bg-zinc-900 rounded-lg border cursor-pointer shadow-sm hover:shadow-md"
              >
                <p className="font-medium">Card {i}</p>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
                  Hover to see animation
                </p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Button Animations */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Button Animations</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Interactive button states</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Hover Me
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Click Me
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Tap Me
            </motion.button>
          </div>
        </section>

        {/* Layout Animation */}
        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">Layout Animations</h2>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">Smooth layout changes</p>
          </div>
          <motion.div layout className="p-6 bg-white dark:bg-zinc-900 rounded-lg border">
            <p className="font-medium">Layout Animation</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
              Content animates smoothly when layout changes
            </p>
          </motion.div>
        </section>

        {/* Performance Tips */}
        <section className="space-y-4 p-6 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <h2 className="text-xl font-semibold text-yellow-900 dark:text-yellow-100">
            Performance Tips
          </h2>
          <ul className="list-disc list-inside space-y-2 text-sm text-yellow-800 dark:text-yellow-200">
            <li>Use CSS transforms (x, y, scale) instead of layout properties</li>
            <li>Avoid animating width and height</li>
            <li>Test on mobile devices</li>
            <li>Respect prefers-reduced-motion</li>
            <li>Keep animations under 300ms for snappy feel</li>
          </ul>
        </section>
      </div>
    </PageTransition>
  );
}
