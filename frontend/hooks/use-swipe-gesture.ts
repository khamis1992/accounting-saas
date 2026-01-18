/**
 * UseSwipeGesture.ts Hook
 *
 * Custom React hook for Custom React hook functionality
 *
 * @fileoverview Custom React hook
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { useRef, useEffect, useCallback } from "react";

interface UseSwipeGestureOptions {
  onSwipedLeft?: () => void;
  onSwipedRight?: () => void;
  onSwiping?: (deltaX: number) => void;
  threshold?: number;
  trackMouse?: boolean;
}

interface SwipeHandlers {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
}

export function useSwipeGesture({
  onSwipedLeft,
  onSwipedRight,
  onSwiping,
  threshold = 50,
  trackMouse = false,
}: UseSwipeGestureOptions): SwipeHandlers {
  const startX = useRef<number>(0);
  const currentX = useRef<number>(0);
  const isDragging = useRef<boolean>(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
    currentX.current = e.touches[0].clientX;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging.current) return;

      currentX.current = e.touches[0].clientX;
      const deltaX = currentX.current - startX.current;

      if (onSwiping) {
        onSwiping(deltaX);
      }
    },
    [onSwiping]
  );

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;

    const deltaX = currentX.current - startX.current;
    const absDeltaX = Math.abs(deltaX);

    if (absDeltaX > threshold) {
      if (deltaX > 0 && onSwipedRight) {
        onSwipedRight();
      } else if (deltaX < 0 && onSwipedLeft) {
        onSwipedLeft();
      }
    }

    isDragging.current = false;
  }, [threshold, onSwipedLeft, onSwipedRight]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!trackMouse) return;
      startX.current = e.clientX;
      currentX.current = e.clientX;
      isDragging.current = true;
    },
    [trackMouse]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging.current || !trackMouse) return;

      currentX.current = e.clientX;
      const deltaX = currentX.current - startX.current;

      if (onSwiping) {
        onSwiping(deltaX);
      }
    },
    [onSwiping, trackMouse]
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current || !trackMouse) return;

    const deltaX = currentX.current - startX.current;
    const absDeltaX = Math.abs(deltaX);

    if (absDeltaX > threshold) {
      if (deltaX > 0 && onSwipedRight) {
        onSwipedRight();
      } else if (deltaX < 0 && onSwipedLeft) {
        onSwipedLeft();
      }
    }

    isDragging.current = false;
  }, [threshold, onSwipedLeft, onSwipedRight, trackMouse]);

  // Cleanup mouse events on unmount
  useEffect(() => {
    if (!trackMouse) return;

    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mouseup", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [trackMouse]);

  return {
    onTouchStart: handleTouchStart,
    onTouchMove: handleTouchMove,
    onTouchEnd: handleTouchEnd,
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
  };
}
