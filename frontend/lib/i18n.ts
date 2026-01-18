/**
 * Utility Functions
 *
 * Helper functions for i18n.ts
 *
 * @fileoverview Utility functions
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
import { getRequestConfig } from "next-intl/server";

/**
 * Simple server-side logger for i18n errors
 * In production, this could be replaced with a proper logging service
 */
const serverLogger = {
  error: (message: string, error?: unknown) => {
    // Only log in development or if there's a logging service configured
    if (process.env.NODE_ENV === "development") {
      console.error(`[i18n] ${message}`, error);
    }
  },
  warn: (message: string) => {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[i18n] ${message}`);
    }
  },
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  // Validate locale
  if (!locale || !["en", "ar"].includes(locale)) {
    locale = "en";
  }

  // Safely load messages with comprehensive error handling
  let messages;
  try {
    const messagesModule = await import(`../messages/${locale}.json`);
    messages = messagesModule.default;
  } catch (error) {
    serverLogger.error(`Failed to load messages for locale: ${locale}`, error);

    // Fallback to English
    try {
      const fallbackModule = await import(`../messages/en.json`);
      messages = fallbackModule.default;
      serverLogger.warn(`Loaded fallback messages for locale: ${locale}`);
    } catch (fallbackError) {
      serverLogger.error("Failed to load fallback messages", fallbackError);

      // Last resort - minimal messages to prevent crash
      messages = {
        common: {
          loading: "Loading...",
          error: "An error occurred",
        },
      };
    }
  }

  // Validate messages is an object
  if (typeof messages !== "object" || messages === null) {
    serverLogger.error("Invalid messages format, using minimal fallback");
    messages = {
      common: {
        loading: "Loading...",
        error: "An error occurred",
      },
    };
  }

  return {
    locale,
    messages,
    timeZone: "Asia/Qatar",
  };
});
