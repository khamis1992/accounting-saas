/**
 * auth-context.tsx
 *
 * @fileoverview TypeScript module
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";

interface CreateTenantWithAdminParams {
  companyNameEn: string;
  companyNameAr: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  createTenantWithAdmin: (data: CreateTenantWithAdminParams) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const supabase = createClient();

  // Get backend API URL from environment variable - must be set
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (() => {
      throw new Error(
        "NEXT_PUBLIC_API_URL environment variable is not configured. Please check your .env.local file."
      );
    })();

  // Helper function to get current locale from URL
  const getCurrentLocale = (): string => {
    if (typeof window === "undefined") return "en";

    const pathname = window.location.pathname;
    const segments = pathname.split("/").filter(Boolean);

    if (segments.length > 0) {
      const potentialLocale = segments[0];
      // Validate it's a supported locale
      if (["en", "ar"].includes(potentialLocale)) {
        return potentialLocale;
      }
    }

    return "en";
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);

      // Call backend API instead of Supabase directly
      const response = await fetch(`${API_URL}/auth/sign-in`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
        credentials: "include", // Include cookies if needed
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Login failed" }));
        throw new Error(errorData.message || `Login failed with status ${response.status}`);
      }

      const data = await response.json();

      // Set the session in Supabase client
      if (data.session && data.session.access_token && data.session.refresh_token) {
        const { data: sessionData, error } = await supabase.auth.setSession({
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
        });

        if (error) {
          console.error("Error setting session:", error);
          throw error;
        }

        // Update local state immediately
        if (sessionData.session) {
          setSession(sessionData.session);
          setUser(sessionData.session.user);
        }

        // Redirect to dashboard after successful login with current locale
        const locale = getCurrentLocale();
        router.push(`/${locale}/dashboard`);
        router.refresh(); // Force refresh to update the UI
      } else {
        throw new Error("No session returned from server");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const createTenantWithAdmin = async (data: CreateTenantWithAdminParams) => {
    try {
      setLoading(true);

      // Call backend API to create tenant with admin
      const response = await fetch(`${API_URL}/tenants/create-with-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create tenant");
      }

      const result = await response.json();

      // Set the auth tokens from the response
      if (result.session && result.session.access_token && result.session.refresh_token) {
        const { data: sessionData, error } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (error) {
          console.error("Error setting session:", error);
          throw error;
        }

        // Update local state immediately
        if (sessionData.session) {
          setSession(sessionData.session);
          setUser(sessionData.session.user);
        }

        // Redirect to dashboard after successful tenant creation with current locale
        const locale = getCurrentLocale();
        router.push(`/${locale}/dashboard`);
        router.refresh();
      }

      return result;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    // Redirect to signin page after sign out with current locale
    const locale = getCurrentLocale();
    router.push(`/${locale}/signin`);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signIn,
        signUp,
        signOut,
        createTenantWithAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
