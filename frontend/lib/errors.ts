/**
 * Type-Safe Error Handling Utilities
 *
 * Provides standardized error classes and utilities for consistent
 * error handling across the application.
 */

import logger from "./logger";

/**
 * Base application error class with additional context
 */
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: unknown
  ) {
    super(message);
    this.name = "AppError";

    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

/**
 * Authentication error (401)
 */
export class AuthError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "AUTH_ERROR", 401, details);
    this.name = "AuthError";
  }
}

/**
 * Network/server error (503)
 */
export class NetworkError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "NETWORK_ERROR", 503, details);
    this.name = "NetworkError";
  }
}

/**
 * Validation error (400)
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", 400, details);
    this.name = "ValidationError";
  }
}

/**
 * Not found error (404)
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "NOT_FOUND", 404, details);
    this.name = "NotFoundError";
  }
}

/**
 * Permission error (403)
 */
export class PermissionError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, "PERMISSION_ERROR", 403, details);
    this.name = "PermissionError";
  }
}

/**
 * API response error interface
 */
interface ApiErrorResponse {
  message?: string;
  error?: string;
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Converts unknown errors to AppError instances
 */
export function handleError(error: unknown): AppError {
  // Already an AppError, return as-is
  if (error instanceof AppError) {
    return error;
  }

  // Standard Error
  if (error instanceof Error) {
    // Try to extract more context from error message
    if (error.message.includes("timeout") || error.message.includes("Timeout")) {
      return new NetworkError("Request timeout. Please try again.", error);
    }

    if (error.message.includes("network") || error.message.includes("Network")) {
      return new NetworkError("Network error. Please check your connection.", error);
    }

    if (error.message.includes("auth") || error.message.includes("unauthorized")) {
      return new AuthError(error.message, error);
    }

    return new AppError(error.message, "UNKNOWN_ERROR", 500, error);
  }

  // String error
  if (typeof error === "string") {
    return new AppError(error, "UNKNOWN_ERROR", 500);
  }

  // Unknown error type
  return new AppError("An unknown error occurred", "UNKNOWN_ERROR", 500, error);
}

/**
 * Wraps an operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`Error in ${context}`, error as Error);
    throw handleError(error);
  }
}

/**
 * Handles API error responses
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorData: ApiErrorResponse;

  try {
    errorData = await response.json();
  } catch {
    errorData = { message: "Unknown error" };
  }

  const message =
    errorData.message || errorData.error || `Request failed with status ${response.status}`;

  // Map HTTP status codes to appropriate error types
  if (response.status === 401) {
    throw new AuthError(message, errorData);
  } else if (response.status === 403) {
    throw new PermissionError(message, errorData);
  } else if (response.status === 404) {
    throw new NotFoundError(message, errorData);
  } else if (response.status === 400) {
    throw new ValidationError(message, errorData);
  } else if (response.status >= 500) {
    throw new NetworkError(message, errorData);
  } else {
    throw new AppError(message, "API_ERROR", response.status, errorData);
  }
}

/**
 * Type guard to check if error is an AppError
 */
export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

/**
 * Type guard to check if error is AuthError
 */
export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}

/**
 * Type guard to check if error is NetworkError
 */
export function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof NetworkError;
}
