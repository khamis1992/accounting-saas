/**
 * API Client Base Configuration
 * Handles authentication, token refresh, and error handling
 */

import type { ApiResponse, ApiError, User, Session, Tenant } from "@/types";
import logger from "@/lib/logger";
import { createClient } from "@/lib/supabase/browser-client";

interface LegacyApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
  user?: User;
  session?: Session;
  tenant?: Tenant;
  accessToken?: string;
  refreshToken?: string;
}

class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshTokenValue: string | null = null;
  private tokenRefreshPromise: Promise<void> | null = null;

  constructor() {
    // Backend runs on port 3000 with /api prefix
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

    // SECURITY: DO NOT use localStorage for tokens
    // Tokens are stored in httpOnly cookies by Supabase
    // This prevents XSS attacks from stealing tokens
    //
    // Tokens are managed by Supabase client and sent automatically via cookies
  }

  /**
   * Get access token from Supabase session
   * This ensures the API client always uses the current valid session token
   */
  private async getTokenFromSupabase(): Promise<string | null> {
    // Only run in browser environment
    if (typeof window === "undefined") {
      return this.accessToken;
    }

    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Update local cache for consistency
        this.accessToken = session.access_token;
        this.refreshTokenValue = session.refresh_token;
        return session.access_token;
      }
    } catch (error) {
      logger.warn("Failed to get session from Supabase", { error: error as Error });
    }

    return this.accessToken;
  }

  /**
   * Set authentication tokens (in-memory only)
   *
   * SECURITY: Tokens are NOT stored in localStorage to prevent XSS attacks.
   * They are kept in memory only and cleared when page refreshes.
   * Supabase uses httpOnly cookies which are sent automatically with requests.
   *
   * @deprecated This method is kept for backward compatibility but should not be used.
   * Supabase handles token storage automatically via httpOnly cookies.
   */
  setTokens(accessToken: string, refreshToken: string) {
    // SECURITY: Store tokens in memory only, NOT in localStorage
    // localStorage is vulnerable to XSS attacks
    this.accessToken = accessToken;
    this.refreshTokenValue = refreshToken;

    // WARNING: Never store tokens in localStorage
    // If you see code that does this, it's a security vulnerability:
    // ❌ localStorage.setItem('access_token', accessToken);
  }

  /**
   * Clear authentication tokens (in-memory only)
   *
   * SECURITY: Clears tokens from memory only.
   * httpOnly cookies are cleared by Supabase signOut().
   */
  clearTokens() {
    this.accessToken = null;
    this.refreshTokenValue = null;

    // SECURITY: Do NOT clear from localStorage as we never store there
    // If you see localStorage.removeItem calls here, remove them for security
  }

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Refresh access token using refresh token
   */
  public async refreshTokens(): Promise<void> {
    // Prevent multiple simultaneous refresh attempts
    if (this.tokenRefreshPromise) {
      return this.tokenRefreshPromise;
    }

    this.tokenRefreshPromise = (async () => {
      try {
        if (!this.refreshTokenValue) {
          throw new Error("No refresh token available");
        }

        const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ refreshToken: this.refreshTokenValue }),
        });

        if (!response.ok) {
          throw new Error("Token refresh failed");
        }

        const data: LegacyApiResponse = await response.json();

        if (data.session) {
          this.setTokens(data.session.access_token, data.session.refresh_token);
        }
      } catch (error) {
        // If refresh fails, clear tokens and redirect to signin
        this.clearTokens();
        if (typeof window !== "undefined") {
          // SECURITY: Use validated redirect to prevent open redirect vulnerabilities
          const safeRedirect = "/en/signin";
          window.location.href = safeRedirect;
        }
        throw error;
      } finally {
        this.tokenRefreshPromise = null;
      }
    })();

    return this.tokenRefreshPromise;
  }

  /**
   * Make authenticated API request with automatic token refresh
   */
  private async request<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    // Get current token from Supabase session
    const token = await this.getTokenFromSupabase();

    // Add authorization header if token exists
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && this.refreshTokenValue) {
      try {
        await this.refreshTokens();

        // Retry request with new token
        if (this.accessToken) {
          headers["Authorization"] = `Bearer ${this.accessToken}`;
        }

        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        // Refresh failed, tokens cleared in refreshTokens()
        throw {
          message: "Session expired. Please sign in again.",
          status: 401,
        } as ApiError;
      }
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = "An error occurred";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      throw {
        message: errorMessage,
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }

  /**
   * HTTP GET request
   */
  async get<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  /**
   * HTTP POST request
   */
  async post<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * HTTP PUT request
   */
  async put<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * HTTP PATCH request
   */
  async patch<T = unknown>(endpoint: string, data?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  /**
   * HTTP DELETE request
   */
  async delete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  /**
   * Raw request method for custom requests (like FormData)
   */
  async rawRequest<T = unknown>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    let url = `${this.baseURL}${endpoint}`;

    // Get current token from Supabase session
    const token = await this.getTokenFromSupabase();

    // Add authorization header if token exists
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && this.refreshTokenValue) {
      try {
        await this.refreshTokens();

        // Retry request with new token
        if (this.accessToken) {
          headers["Authorization"] = `Bearer ${this.accessToken}`;
        }

        response = await fetch(url, {
          ...options,
          headers,
        });
      } catch (error) {
        // Refresh failed, tokens cleared in refreshTokens()
        throw {
          message: "Session expired. Please sign in again.",
          status: 401,
        } as ApiError;
      }
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = "An error occurred";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      throw {
        message: errorMessage,
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }

  /**
   * HTTP Download request for files
   */
  async download(
    endpoint: string,
    filters?: Record<string, string | number | boolean>
  ): Promise<void> {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const query = params.toString();
    const url = `${this.baseURL}${endpoint}${query ? `?${query}` : ""}`;

    // Get current token from Supabase session
    const token = await this.getTokenFromSupabase();

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`Download failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = downloadUrl;

    // Extract filename from Content-Disposition header or use default
    const contentDisposition = response.headers.get("Content-Disposition");
    let filename = `download_${Date.now()}`;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(downloadUrl);
  }

  /**
   * Upload FormData (for file uploads)
   * Does NOT set Content-Type header - lets browser set it with boundary
   */
  async upload<T = unknown>(
    endpoint: string,
    formData: FormData,
    options: { method?: "POST" | "PATCH" | "PUT" } = {}
  ): Promise<ApiResponse<T>> {
    const { method = "POST" } = options;
    const url = `${this.baseURL}${endpoint}`;

    // Get current token from Supabase session
    const token = await this.getTokenFromSupabase();

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    // NOTE: Do NOT set Content-Type for FormData - browser will set it with boundary

    let response = await fetch(url, {
      method,
      headers,
      body: formData,
    });

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && this.refreshTokenValue) {
      try {
        await this.refreshTokens();

        // Retry request with new token
        if (this.accessToken) {
          headers["Authorization"] = `Bearer ${this.accessToken}`;
        }

        response = await fetch(url, {
          method,
          headers,
          body: formData,
        });
      } catch (error) {
        // Refresh failed, tokens cleared in refreshTokens()
        throw {
          message: "Session expired. Please sign in again.",
          status: 401,
        } as ApiError;
      }
    }

    // Handle other errors
    if (!response.ok) {
      let errorMessage = "An error occurred";
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch {
        errorMessage = response.statusText || errorMessage;
      }

      throw {
        message: errorMessage,
        status: response.status,
      } as ApiError;
    }

    return response.json();
  }

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string): Promise<ApiResponse<Session>> {
    const response = await this.post<Session>("/auth/sign-in", { email, password });

    // SECURITY: Tokens are stored in httpOnly cookies by Supabase
    // We do NOT store them in localStorage to prevent XSS attacks
    if (response.session) {
      this.setTokens(response.session.access_token, response.session.refresh_token);

      // SECURITY WARNING: Do NOT store user data in localStorage
      // User data should be fetched from Supabase session or API
      // localStorage is vulnerable to XSS attacks
      //
      // ❌ BAD: localStorage.setItem('user', JSON.stringify(response.user));
      // ✅ GOOD: Use Supabase session: supabase.auth.getSession()
    }

    return response;
  }

  /**
   * Sign up with email and password (for existing tenant)
   */
  async signUp(email: string, password: string, tenantId: string): Promise<ApiResponse<Session>> {
    return this.post("/auth/sign-up", { email, password, tenantId });
  }

  /**
   * Create tenant with admin user (public signup flow)
   */
  async createTenantWithAdmin(data: {
    name: string;
    nameAr: string;
    email: string;
    password: string;
  }): Promise<ApiResponse<{ tenant: Tenant; session: Session }>> {
    const response = await this.post<{ tenant: Tenant; session: Session }>("/tenants/create-with-admin", data);

    // SECURITY: Tokens are stored in httpOnly cookies by Supabase
    // We do NOT store them in localStorage to prevent XSS attacks
    if (response.session) {
      this.setTokens(response.session.access_token, response.session.refresh_token);

      // SECURITY WARNING: Do NOT store user/tenant data in localStorage
      // User data should be fetched from Supabase session or API
      // localStorage is vulnerable to XSS attacks
      //
      // ❌ BAD: localStorage.setItem('user', JSON.stringify(response.user));
      // ❌ BAD: localStorage.setItem('tenant', JSON.stringify(response.tenant));
      // ✅ GOOD: Use Supabase session: supabase.auth.getSession()
    }

    return response;
  }

  /**
   * Sign out
   */
  async signOut(): Promise<void> {
    try {
      await this.post("/auth/sign-out");
    } catch (error) {
      // Ignore sign-out errors, just clear tokens
      logger.warn("Sign out error (non-critical)", { error: error as Error });
    } finally {
      this.clearTokens();
    }
  }

  /**
   * Reset password
   */
  async resetPassword(email: string): Promise<ApiResponse<{ success: boolean }>> {
    return this.post("/auth/reset-password", { email });
  }

  /**
   * Verify current session
   */
  async verifySession(): Promise<ApiResponse<{ valid: boolean; user?: User }>> {
    return this.get("/auth/verify");
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

// Export class for testing
export { ApiClient };
export type { ApiResponse, ApiError };
