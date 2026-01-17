/**
 * Feature Flag System
 *
 * Provides a centralized way to manage feature flags across the application.
 * This allows for safe rollouts and A/B testing.
 */

import React from 'react';
import { FeatureFlags } from '@/types';

/**
 * Default feature flag configuration
 */
const defaultFlags: FeatureFlags = {
  enableCommandPalette: true,
  enableAnimations: true,
  enableFavorites: true,
  enableRecentItems: true,
  enableEnhancedNavigation: true,
  enableAdvancedReports: false,
  enableMultiCurrency: false,
  enableInventory: false,
};

/**
 * Feature flag manager class
 */
class FeatureFlagManager {
  private flags: FeatureFlags;
  private localStorageKey = 'feature-flags';

  constructor() {
    // Load from localStorage or use defaults
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.localStorageKey);
      this.flags = stored ? { ...defaultFlags, ...JSON.parse(stored) } : { ...defaultFlags };
    } else {
      this.flags = { ...defaultFlags };
    }
  }

  /**
   * Check if a feature is enabled
   */
  isEnabled<K extends keyof FeatureFlags>(flag: K): boolean {
    return this.flags[flag] === true;
  }

  /**
   * Enable a feature
   */
  enable<K extends keyof FeatureFlags>(flag: K): void {
    this.flags[flag] = true;
    this.persist();
  }

  /**
   * Disable a feature
   */
  disable<K extends keyof FeatureFlags>(flag: K): void {
    this.flags[flag] = false;
    this.persist();
  }

  /**
   * Set a feature flag value
   */
  set<K extends keyof FeatureFlags>(flag: K, value: boolean): void {
    this.flags[flag] = value;
    this.persist();
  }

  /**
   * Get all feature flags
   */
  getAll(): FeatureFlags {
    return { ...this.flags };
  }

  /**
   * Set multiple feature flags at once
   */
  setMany(flags: Partial<FeatureFlags>): void {
    this.flags = { ...this.flags, ...flags };
    this.persist();
  }

  /**
   * Reset all flags to defaults
   */
  reset(): void {
    this.flags = { ...defaultFlags };
    this.persist();
  }

  /**
   * Persist flags to localStorage
   */
  private persist(): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.flags));
    }
  }

  /**
   * Execute callback only if feature is enabled
   */
  withFeature<K extends keyof FeatureFlags>(
    flag: K,
    callback: () => void,
    fallback?: () => void
  ): void {
    if (this.isEnabled(flag)) {
      callback();
    } else if (fallback) {
      fallback();
    }
  }

  /**
   * Get component based on feature flag
   */
  getComponent<K extends keyof FeatureFlags>(
    flag: K,
    enabledComponent: React.ComponentType,
    disabledComponent?: React.ComponentType
  ): React.ComponentType {
    return this.isEnabled(flag) ? enabledComponent : (disabledComponent || (() => null));
  }
}

// Export singleton instance
export const featureFlags = new FeatureFlagManager();

// Export class for testing
export { FeatureFlagManager };

/**
 * HOC to wrap components with feature flag check
 */
export function withFeatureFlag<K extends keyof FeatureFlags, P = {}>(
  flag: K,
  WrappedComponent: React.ComponentType<P>,
  FallbackComponent?: React.ComponentType<P>
): React.ComponentType<P> {
  return function FeatureFlagWrapper(props: P) {
    if (featureFlags.isEnabled(flag)) {
      return React.createElement(WrappedComponent as any, props as any);
    }
    return FallbackComponent ? React.createElement(FallbackComponent as any, props as any) : null;
  };
}

/**
 * Hook to use feature flags in components
 */
export function useFeatureFlags(): FeatureFlags {
  return featureFlags.getAll();
}

/**
 * Hook to check a specific feature flag
 */
export function useFeatureFlag<K extends keyof FeatureFlags>(
  flag: K
): boolean {
  return featureFlags.isEnabled(flag);
}
