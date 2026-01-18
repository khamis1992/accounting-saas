/**
 * Fetch with timeout and retry logic
 *
 * Provides enhanced fetch functionality with:
 * - Configurable timeouts
 * - Automatic retry with exponential backoff
 * - Better error handling
 */

import logger from "./logger";

const DEFAULT_TIMEOUT = 10000; // 10 seconds
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_BASE_DELAY = 1000; // 1 second

/**
 * Fetch with timeout support
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param timeout - Timeout in milliseconds (default: 10000)
 * @returns Promise<Response>
 *
 * @throws {Error} If request times out
 *
 * @example
 * ```typescript
 * const response = await fetchWithTimeout(
 *   'https://api.example.com/data',
 *   { method: 'GET' },
 *   15000 // 15 second timeout
 * );
 * ```
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeout}ms`);
    }

    throw error;
  }
}

/**
 * Retry logic with exponential backoff
 *
 * @param operation - The operation to retry
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @returns Promise<T>
 *
 * @throws {Error} If all retry attempts fail
 *
 * @example
 * ```typescript
 * const data = await retryWithBackoff(
 *   () => fetchWithTimeout(url, options),
 *   3,
 *   1000
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  baseDelay: number = DEFAULT_BASE_DELAY
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this is the last attempt, throw the error
      if (attempt === maxRetries - 1) {
        throw lastError;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);

      logger.warn(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`, {
        message: lastError.message,
        attempt,
        maxRetries,
        delay,
      });

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError!;
}

/**
 * Enhanced fetch with timeout and retry
 *
 * Combines timeout and retry functionality for robust API calls.
 *
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param config - Configuration object
 * @returns Promise<Response>
 *
 * @example
 * ```typescript
 * const response = await fetchEnhanced(
 *   '/api/data',
 *   { method: 'GET' },
 *   {
 *     timeout: 15000,
 *     maxRetries: 3,
 *     retryDelay: 1000
 *   }
 * );
 * ```
 */
export async function fetchEnhanced(
  url: string,
  options: RequestInit = {},
  config: {
    timeout?: number;
    maxRetries?: number;
    retryDelay?: number;
  } = {}
): Promise<Response> {
  const {
    timeout = DEFAULT_TIMEOUT,
    maxRetries = DEFAULT_MAX_RETRIES,
    retryDelay = DEFAULT_BASE_DELAY,
  } = config;

  return retryWithBackoff(() => fetchWithTimeout(url, options, timeout), maxRetries, retryDelay);
}

/**
 * Helper for GET requests
 */
export async function fetchGet<T = unknown>(
  url: string,
  config?: { timeout?: number; maxRetries?: number }
): Promise<T> {
  const response = await fetchEnhanced(
    url,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    config
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Helper for POST requests
 */
export async function fetchPost<T = unknown>(
  url: string,
  data: unknown,
  config?: { timeout?: number; maxRetries?: number }
): Promise<T> {
  const response = await fetchEnhanced(
    url,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    config
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Helper for PUT requests
 */
export async function fetchPut<T = unknown>(
  url: string,
  data: unknown,
  config?: { timeout?: number; maxRetries?: number }
): Promise<T> {
  const response = await fetchEnhanced(
    url,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    },
    config
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

/**
 * Helper for DELETE requests
 */
export async function fetchDelete<T = unknown>(
  url: string,
  config?: { timeout?: number; maxRetries?: number }
): Promise<T> {
  const response = await fetchEnhanced(
    url,
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    },
    config
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
