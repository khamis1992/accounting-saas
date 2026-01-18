/**
 * useCurrency Hook
 *
 * Manages currency display and formatting
 * Supports multi-currency from user settings
 */

import { useState, useEffect, useCallback } from "react";
import logger from "@/lib/logger";
import { CURRENCY } from "@/lib/constants";

export interface CurrencySettings {
  code: keyof typeof CURRENCY.SYMBOLS;
  symbol: string;
  decimalPlaces: number;
}

export interface UseCurrencyOptions {
  /** Default currency if none in settings (default: 'QAR') */
  defaultCurrency?: keyof typeof CURRENCY.SYMBOLS;
}

const STORAGE_KEY = "user_currency";

export function useCurrency(options: UseCurrencyOptions = {}) {
  const { defaultCurrency = "QAR" } = options;

  const [currency, setCurrencyState] = useState<CurrencySettings>({
    code: defaultCurrency,
    symbol: CURRENCY.SYMBOLS[defaultCurrency],
    decimalPlaces: CURRENCY.DECIMAL_PLACES,
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load currency from localStorage or settings
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        const code = JSON.parse(stored) as keyof typeof CURRENCY.SYMBOLS;

        if (CURRENCY.SUPPORTED.includes(code)) {
          setCurrencyState({
            code,
            symbol: CURRENCY.SYMBOLS[code],
            decimalPlaces: CURRENCY.DECIMAL_PLACES,
          });
        }
      }
    } catch (error) {
      logger.error("Failed to load currency", error as Error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Set currency
  const setCurrency = useCallback((code: keyof typeof CURRENCY.SYMBOLS) => {
    if (!CURRENCY.SUPPORTED.includes(code)) {
      logger.warn(`Unsupported currency: ${code}`);
      return;
    }

    const newSettings: CurrencySettings = {
      code,
      symbol: CURRENCY.SYMBOLS[code],
      decimalPlaces: CURRENCY.DECIMAL_PLACES,
    };

    setCurrencyState(newSettings);

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(code));
    } catch (error) {
      logger.error("Failed to save currency", error as Error);
    }
  }, []);

  // Format amount for display
  const formatAmount = useCallback(
    (
      amount: string | number,
      options?: {
        showSymbol?: boolean;
        locale?: string;
      }
    ) => {
      const { showSymbol = true, locale = currency.code === "QAR" ? "ar-QA" : "en-US" } = options || {};

      const numAmount = typeof amount === "string" ? parseFloat(amount) || 0 : amount;

      try {
        return new Intl.NumberFormat(locale, {
          style: showSymbol ? "currency" : "decimal",
          currency: currency.code,
          minimumFractionDigits: currency.decimalPlaces,
          maximumFractionDigits: currency.decimalPlaces,
        }).format(numAmount);
      } catch (error) {
        // Fallback formatting
        return showSymbol
          ? `${currency.symbol} ${numAmount.toFixed(currency.decimalPlaces)}`
          : numAmount.toFixed(currency.decimalPlaces);
      }
    },
    [currency]
  );

  // Parse amount from formatted string
  const parseAmount = useCallback((formatted: string): number => {
    try {
      // Remove currency symbol and non-numeric chars (except decimal, minus)
      const cleaned = formatted.replace(/[^\d.-]/g, "");
      return parseFloat(cleaned) || 0;
    } catch (error) {
      logger.error("Failed to parse amount", error as Error);
      return 0;
    }
  }, []);

  // Convert between currencies (simple rate-based conversion)
  const convert = useCallback(
    (
      amount: number,
      fromCurrency: keyof typeof CURRENCY.SYMBOLS,
      toCurrency: keyof typeof CURRENCY.SYMBOLS,
      rate: number = 1
    ): number => {
      if (fromCurrency === toCurrency) return amount;
      return amount * rate;
    },
    []
  );

  return {
    currency,
    setCurrency,
    formatAmount,
    parseAmount,
    convert,
    isLoading,
    supportedCurrencies: CURRENCY.SUPPORTED,
  };
}
