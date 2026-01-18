/**
 * useDateTimezone Hook
 *
 * Handles date/time operations with timezone support
 * Normalizes dates to UTC and handles timezone display
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import { DATE_CONFIG } from "@/lib/constants";
import logger from "@/lib/logger";

export interface DateWithTimezone {
  utc: Date;
  local: Date;
  timezone: string;
  formatted: {
    utc: string;
    local: string;
    input: string;
  };
}

export interface UseDateOptions {
  /** Timezone to use (default: from DATE_CONFIG) */
  timezone?: string;
  /** Locale for formatting (default: 'en-US') */
  locale?: string;
}

export function useDateTimezone(options: UseDateOptions = {}) {
  const { timezone = DATE_CONFIG.TIMEZONE, locale = "en-US" } = options;

  const [userTimezone, setUserTimezone] = useState<string>(timezone);

  // Detect user timezone on mount
  useEffect(() => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setUserTimezone(detected);
      }
    } catch (error) {
      logger.warn("Could not detect timezone", { error });
    }
  }, []);

  /**
   * Convert date to UTC and return both UTC and local versions
   */
  const normalizeDate = useCallback(
    (date: Date | string): DateWithTimezone => {
      const inputDate = typeof date === "string" ? new Date(date) : date;

      // Ensure we're working with valid date
      if (isNaN(inputDate.getTime())) {
        throw new Error("Invalid date provided");
      }

      const utc = new Date(inputDate.toISOString());
      const local = new Date(inputDate);

      return {
        utc,
        local,
        timezone: userTimezone,
        formatted: {
          utc: utc.toISOString(),
          local: local.toLocaleString(locale),
          input: inputDate.toISOString().split("T")[0], // YYYY-MM-DD
        },
      };
    },
    [userTimezone, locale]
  );

  /**
   * Format date for display with timezone indicator
   */
  const formatDate = useCallback(
    (date: Date | string, format: "short" | "long" | "input" = "short"): string => {
      const { utc, local } = normalizeDate(date);

      switch (format) {
        case "short":
          return local.toLocaleDateString(locale, {
            year: "numeric",
            month: "short",
            day: "numeric",
          });

        case "long":
          return local.toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          });

        case "input":
          return utc.toISOString().split("T")[0];

        default:
          return local.toLocaleDateString();
      }
    },
    [normalizeDate, locale]
  );

  /**
   * Format date range with timezone handling
   */
  const formatDateRange = useCallback(
    (startDate: Date | string, endDate: Date | string): string => {
      const start = normalizeDate(startDate);
      const end = normalizeDate(endDate);

      const startFormatted = start.local.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      });

      const endFormatted = end.local.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      return `${startFormatted} - ${endFormatted}`;
    },
    [normalizeDate, locale]
  );

  /**
   * Parse input date and convert to UTC
   */
  const parseToUTC = useCallback((input: string): Date => {
    // Parse as local time
    const date = new Date(input);

    // If input is just date (YYYY-MM-DD), set to noon to avoid timezone issues
    if (input.match(/^\d{4}-\d{2}-\d{2}$/)) {
      date.setHours(12, 0, 0, 0);
    }

    return new Date(date.toISOString());
  }, []);

  /**
   * Check if date is in range considering timezones
   */
  const isInDateRange = useCallback(
    (date: Date | string, startDate: Date | string, endDate: Date | string): boolean => {
      const target = normalizeDate(date).utc.getTime();
      const start = normalizeDate(startDate).utc.getTime();
      const end = normalizeDate(endDate).utc.getTime();

      return target >= start && target <= end;
    },
    [normalizeDate]
  );

  /**
   * Get start/end of day in UTC for a given date
   */
  const getDayRange = useCallback(
    (date: Date | string) => {
      const normalized = normalizeDate(date);
      const local = normalized.local;

      const startOfDay = new Date(local);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(local);
      endOfDay.setHours(23, 59, 59, 999);

      return {
        start: new Date(startOfDay.toISOString()),
        end: new Date(endOfDay.toISOString()),
      };
    },
    [normalizeDate]
  );

  /**
   * Get timezone offset string (e.g., UTC+3)
   */
  const getTimezoneOffset = useCallback((): string => {
    const offset = new Date().getTimezoneOffset();
    const hours = Math.abs(Math.floor(offset / 60));
    const minutes = Math.abs(offset % 60);
    const sign = offset <= 0 ? "+" : "-";

    return `UTC${sign}${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }, []);

  // Memoized current timezone info
  const timezoneInfo = useMemo(
    () => ({
      timezone: userTimezone,
      offset: getTimezoneOffset(),
    }),
    [userTimezone, getTimezoneOffset]
  );

  return {
    timezone: userTimezone,
    timezoneInfo,
    normalizeDate,
    formatDate,
    formatDateRange,
    parseToUTC,
    isInDateRange,
    getDayRange,
    getTimezoneOffset,
  };
}
