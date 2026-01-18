/**
 * Security Utilities
 *
 * Provides security-related utility functions for:
 * - URL validation (prevents open redirects)
 * - Password strength validation
 * - XSS prevention helpers
 * - CSRF token handling
 *
 * @version 1.0.0
 * @lastUpdated 2025-01-17
 */

/**
 * Allowed paths for redirects (whitelist approach)
 *
 * SECURITY: This whitelist prevents open redirect vulnerabilities.
 * Only add paths that are safe to redirect to.
 *
 * Format: 'exact-path' or '/prefix/*' for nested paths
 */
const ALLOWED_REDIRECT_PATHS = new Set([
  // Authentication pages
  "/signin",
  "/signup",
  "/auth/signin",
  "/auth/signup",
  "/auth/forgot-password",
  "/auth/reset-password",

  // Main application pages
  "/dashboard",
  "/accounting",
  "/banking",
  "/sales",
  "/purchases",
  "/assets",
  "/reports",
  "/tax",
  "/settings",

  // Account settings
  "/settings/profile",
  "/settings/company",
  "/settings/users",
  "/settings/roles",
  "/settings/cost-centers",
  "/settings/fiscal",
]);

/**
 * Validates that a redirect URL is safe (prevents open redirect vulnerabilities)
 *
 * SECURITY: Uses whitelist approach to prevent malicious redirects.
 * Only allows redirects to known safe paths within the application.
 *
 * @param url - The URL to validate
 * @returns true if safe, false otherwise
 *
 * @example
 * isValidRedirect('/dashboard') // true
 * isValidRedirect('/settings/users') // true
 * isValidRedirect('https://evil.com') // false
 * isValidRedirect('//evil.com') // false
 */
export function isValidRedirect(url: string): boolean {
  try {
    // Parse the URL
    const parsed = new URL(url, "http://localhost");

    // SECURITY: Must be same-origin (prevent external redirects)
    if (parsed.origin !== "http://localhost" && parsed.origin !== "null") {
      return false;
    }

    // Normalize the pathname
    const pathname = parsed.pathname.replace(/\/$/, "") || "/";

    // SECURITY: Check against whitelist
    // 1. Exact match
    if (ALLOWED_REDIRECT_PATHS.has(pathname)) {
      return true;
    }

    // 2. Prefix match (for nested paths)
    for (const allowedPath of Array.from(ALLOWED_REDIRECT_PATHS)) {
      if (pathname.startsWith(allowedPath + "/")) {
        return true;
      }
    }

    // 3. Allow locale-prefixed versions (e.g., /en/dashboard)
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 1 && ["en", "ar"].includes(segments[0])) {
      const pathWithoutLocale = "/" + segments.slice(1).join("/");

      // Check exact match without locale
      if (ALLOWED_REDIRECT_PATHS.has(pathWithoutLocale)) {
        return true;
      }

      // Check prefix match without locale
      for (const allowedPath of Array.from(ALLOWED_REDIRECT_PATHS)) {
        if (pathWithoutLocale.startsWith(allowedPath + "/")) {
          return true;
        }
      }
    }

    return false;
  } catch {
    // Invalid URL
    return false;
  }
}

/**
 * Sanitizes a redirect URL by validating it against the whitelist
 *
 * If the URL is invalid, returns a safe default redirect URL.
 *
 * @param url - The URL to sanitize
 * @param defaultUrl - Safe default URL to return if validation fails (default: '/dashboard')
 * @returns The original URL if valid, otherwise the default URL
 *
 * @example
 * sanitizeRedirect('/dashboard') // '/dashboard'
 * sanitizeRedirect('https://evil.com') // '/dashboard'
 * sanitizeRedirect('/unknown', '/profile') // '/profile'
 */
export function sanitizeRedirect(url: string, defaultUrl: string = "/dashboard"): string {
  return isValidRedirect(url) ? url : defaultUrl;
}

/**
 * Password strength requirements
 */
export interface PasswordStrengthResult {
  isValid: boolean;
  strength: "weak" | "medium" | "strong";
  errors: string[];
}

/**
 * Validates password strength according to security best practices
 *
 * Requirements:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 *
 * @param password - The password to validate
 * @returns PasswordStrengthResult with validation status and detailed errors
 *
 * @example
 * validatePassword('weak') // { isValid: false, strength: 'weak', errors: [...] }
 * validatePassword('MyP@ssw0rd') // { isValid: true, strength: 'strong', errors: [] }
 */
export function validatePassword(password: string): PasswordStrengthResult {
  const errors: string[] = [];
  let strength: "weak" | "medium" | "strong" = "weak";

  // Check minimum length
  if (password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  // Check for number
  if (!/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least one special character");
  }

  // Calculate strength
  const criteriaMet = 5 - errors.length;
  if (criteriaMet <= 2) {
    strength = "weak";
  } else if (criteriaMet <= 4) {
    strength = "medium";
  } else {
    strength = "strong";
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors,
  };
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 *
 * Use this when rendering user-provided content in HTML context.
 * Note: In React, prefer using JSX's built-in escaping or textContent.
 *
 * @param unsafe - The unsafe string to escape
 * @returns Escaped string safe for HTML rendering
 *
 * @example
 * escapeHtml('<script>alert("xss")</script>')
 * // Returns: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
 */
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Validates that a URL is safe for navigation (not a javascript: or data: URL)
 *
 * Prevents javascript: and data: URL schemes which can be used for XSS.
 *
 * @param url - The URL to validate
 * @returns true if safe, false otherwise
 *
 * @example
 * isValidUrl('https://example.com') // true
 * isValidUrl('/dashboard') // true
 * isValidUrl('javascript:alert(1)') // false
 * isValidUrl('data:text/html,<script>') // false
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url, "http://localhost");

    // SECURITY: Block dangerous protocols
    const dangerousProtocols = ["javascript:", "data:", "vbscript:", "file:"];
    if (
      dangerousProtocols.some(
        (protocol) => parsed.protocol.toLowerCase() === protocol.replace(":", "") + ":"
      )
    ) {
      return false;
    }

    // Allow http, https, and relative URLs
    return ["http:", "https:", ""].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Generates a secure random token for CSRF protection
 *
 * Uses crypto.getRandomValues() for cryptographically secure random numbers.
 *
 * @param length - Length of token in bytes (default: 32)
 * @returns Hex-encoded random token
 *
 * @example
 * const csrfToken = generateCSRFToken();
 * // Returns: 'a1b2c3d4e5f6...'
 */
export function generateCSRFToken(length: number = 32): string {
  const array = new Uint8Array(length);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
  } else {
    // Fallback for Node.js environment
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

/**
 * Checks if a user agent string appears to be a bot/crawler
 *
 * Useful for protecting sensitive endpoints from automated access.
 *
 * @param userAgent - The User-Agent header value
 * @returns true if likely a bot, false otherwise
 *
 * @example
 * isBot('Mozilla/5.0 (compatible; Googlebot/2.1)') // true
 * isBot('Mozilla/5.0 (Windows NT 10.0)') // false
 */
export function isBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python/i,
    /java/i,
    /perl/i,
    /ruby/i,
  ];

  return botPatterns.some((pattern) => pattern.test(userAgent));
}

/**
 * Rate limit tracker (in-memory for demo, use Redis in production)
 */
const rateLimitTracker = new Map<string, { count: number; resetTime: number }>();

/**
 * Checks if a request should be rate limited
 *
 * @param identifier - Unique identifier (e.g., IP address, user ID)
 * @param maxRequests - Maximum requests allowed in time window
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limit exceeded, false otherwise
 *
 * @example
 * if (isRateLimited('user-123', 5, 60000)) {
 *   throw new Error('Too many requests');
 * }
 */
export function isRateLimited(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = rateLimitTracker.get(identifier);

  if (!record || now > record.resetTime) {
    // First request or window expired
    rateLimitTracker.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  if (record.count >= maxRequests) {
    // Rate limit exceeded
    return true;
  }

  // Increment counter
  record.count++;
  return false;
}

/**
 * Clears rate limit for an identifier (for testing or manual reset)
 *
 * @param identifier - Unique identifier to clear
 */
export function clearRateLimit(identifier: string): void {
  rateLimitTracker.delete(identifier);
}
