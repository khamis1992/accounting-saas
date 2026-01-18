/**
 * UseFavorites.ts Hook
 *
 * Custom React hook for managing favorite pages
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";
import { useState, useEffect } from "react";
import logger from "@/lib/logger";

export interface FavoriteItem {
  path: string;
  title: string;
  icon?: string;
  addedAt: number;
}

const STORAGE_KEY = "favorite-pages";

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const items: FavoriteItem[] = JSON.parse(stored);
        setFavorites(items);
      }
    } catch (error) {
      logger.error("Failed to load favorites", error as Error);
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Save to localStorage whenever favorites changes
  useEffect(() => {
    if (!isInitialized) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      logger.error("Failed to save favorites", error as Error);
    }
  }, [favorites, isInitialized]);

  const addFavorite = (path: string, title: string, icon?: string) => {
    setFavorites((prev) => {
      // Check if already exists
      if (prev.some((fav) => fav.path === path)) {
        return prev;
      }

      const newFavorite: FavoriteItem = {
        path,
        title,
        icon,
        addedAt: Date.now(),
      };

      return [...prev, newFavorite];
    });
  };

  const removeFavorite = (path: string) => {
    setFavorites((prev) => prev.filter((fav) => fav.path !== path));
  };

  const toggleFavorite = (path: string, title: string, icon?: string) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav.path === path);

      if (exists) {
        return prev.filter((fav) => fav.path !== path);
      } else {
        const newFavorite: FavoriteItem = {
          path,
          title,
          icon,
          addedAt: Date.now(),
        };
        return [...prev, newFavorite];
      }
    });
  };

  const isFavorite = (path: string) => {
    return favorites.some((fav) => fav.path === path);
  };

  const clearFavorites = () => {
    setFavorites([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.error("Failed to clear favorites", error as Error);
    }
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    isInitialized,
  };
}
