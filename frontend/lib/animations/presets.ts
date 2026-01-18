/**
 * Animation Presets Library
 *
 * Collection of reusable animation configurations for Framer Motion.
 * All presets are optimized for 60fps performance and accessibility.
 */

import { Transition, Variants } from "framer-motion";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

// ============================================================================
// TRANSITION PRESETS
// ============================================================================

/**
 * Standard transition - balanced speed and smoothness
 */
export const standardTransition: Transition = {
  duration: 0.2,
  ease: "easeInOut",
};

/**
 * Fast transition - for quick interactions
 */
export const fastTransition: Transition = {
  duration: 0.15,
  ease: "easeOut",
};

/**
 * Slow transition - for deliberate movements
 */
export const slowTransition: Transition = {
  duration: 0.4,
  ease: "easeInOut",
};

/**
 * Spring transition - playful, natural feel
 */
export const springTransition: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 20,
};

/**
 * Gentle spring - softer bounce
 */
export const gentleSpringTransition: Transition = {
  type: "spring",
  stiffness: 150,
  damping: 25,
};

// ============================================================================
// VARIANT PRESETS
// ============================================================================

/**
 * Fade variants - simple opacity transition
 */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/**
 * Slide from right variants
 */
export const slideRightVariants: Variants = {
  initial: { x: 20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: -20, opacity: 0 },
};

/**
 * Slide from left variants
 */
export const slideLeftVariants: Variants = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
};

/**
 * Slide from bottom variants
 */
export const slideUpVariants: Variants = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  exit: { y: 20, opacity: 0 },
};

/**
 * Scale variants - grow/shrink with fade
 */
export const scaleVariants: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

/**
 * Stagger container variants
 */
export const staggerContainerVariants: Variants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0,
    },
  },
};

/**
 * Stagger item variants
 */
export const staggerItemVariants: Variants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

/**
 * Modal variants - scale with backdrop blur
 */
export const modalVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

export const modalContentVariants: Variants = {
  initial: { scale: 0.9, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.9, opacity: 0 },
};

/**
 * Drawer/sheet variants
 */
export const drawerVariants: Variants = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
};

/**
 * Dropdown menu variants
 */
export const dropdownVariants: Variants = {
  initial: { opacity: 0, y: -10, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -10, scale: 0.95 },
};

/**
 * Hover card/popover variants
 */
export const popoverVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 10 },
};

// ============================================================================
// COMPLETE PRESET OBJECTS
// ============================================================================

export const presets = {
  /**
   * Fade preset
   */
  fadeIn: {
    variants: fadeVariants,
    transition: standardTransition,
  },

  /**
   * Slide from right preset
   */
  slideInRight: {
    variants: slideRightVariants,
    transition: standardTransition,
  },

  /**
   * Slide from left preset
   */
  slideInLeft: {
    variants: slideLeftVariants,
    transition: standardTransition,
  },

  /**
   * Scale preset
   */
  scaleIn: {
    variants: scaleVariants,
    transition: standardTransition,
  },

  /**
   * Spring preset
   */
  springIn: {
    variants: scaleVariants,
    transition: springTransition,
  },

  /**
   * Stagger preset
   */
  stagger: {
    container: staggerContainerVariants,
    item: staggerItemVariants,
  },

  /**
   * Modal preset
   */
  modal: {
    backdrop: modalVariants,
    content: modalContentVariants,
    transition: standardTransition,
  },

  /**
   * Drawer preset
   */
  drawer: {
    variants: drawerVariants,
    transition: {
      type: "spring" as const,
      damping: 30,
      stiffness: 300,
    },
  },

  /**
   * Dropdown preset
   */
  dropdown: {
    variants: dropdownVariants,
    transition: {
      duration: 0.15,
      ease: "easeOut" as const,
    },
  },

  /**
   * Popover preset
   */
  popover: {
    variants: popoverVariants,
    transition: {
      duration: 0.2,
      ease: "easeOut" as const,
    },
  },
} as const;

export type PresetName = keyof typeof presets;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get preset with reduced motion support
 *
 * @param presetName - Name of the preset
 * @returns Preset config or empty object if reduced motion
 */
export function usePreset(presetName: PresetName) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return {
      variants: {
        initial: {},
        animate: {},
        exit: {},
      },
      transition: { duration: 0 },
    };
  }

  return presets[presetName];
}

/**
 * Create custom preset with reduced motion support
 *
 * @param config - Custom animation config
 * @returns Config with reduced motion support
 */
export function createPreset(config: { variants?: Variants; transition?: Transition }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return {
      variants: {
        initial: {},
        animate: {},
        exit: {},
      },
      transition: { duration: 0 },
    };
  }

  return config;
}

// ============================================================================
// EXPORT ALL
// ============================================================================

export const animationPresets = {
  // Transitions
  standardTransition,
  fastTransition,
  slowTransition,
  springTransition,
  gentleSpringTransition,

  // Variants
  fadeVariants,
  slideRightVariants,
  slideLeftVariants,
  slideUpVariants,
  scaleVariants,
  staggerContainerVariants,
  staggerItemVariants,
  modalVariants,
  modalContentVariants,
  drawerVariants,
  dropdownVariants,
  popoverVariants,

  // Complete presets
  presets,

  // Utilities
  usePreset,
  createPreset,
};
