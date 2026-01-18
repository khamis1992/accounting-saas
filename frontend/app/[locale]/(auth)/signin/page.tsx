/**
 * page Page
 *
 * Route page component for /
 *
 * @fileoverview page page component
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import Link from "next/link";
import { FormField } from "@/components/ui/form-field";
import { setPageTitle } from "@/lib/accessibility";

export default function SignInPage() {
  const t = useTranslations("auth");
  const tCommon = useTranslations("common");
  const { signIn, loading, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});

  // Set page title - using useEffect to avoid SSR issues
  useEffect(() => {
    setPageTitle(t("signIn"));
  }, [t("signIn")]);

  // If user is already authenticated, redirect to dashboard
  if (user) {
    router.push(`/${locale}/dashboard`);
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});

    // Basic validation
    const newFieldErrors: { email?: string; password?: string } = {};
    if (!email) {
      newFieldErrors.email = t("errors.emailRequired") || "Email is required";
    }
    if (!password) {
      newFieldErrors.password = t("errors.passwordRequired") || "Password is required";
    }

    if (Object.keys(newFieldErrors).length > 0) {
      setFieldErrors(newFieldErrors);
      return;
    }

    try {
      await signIn(email, password);
      // Redirect is handled by signIn function
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 px-4 py-12">
      <div className="w-full max-w-md bg-white dark:bg-zinc-800 rounded-lg shadow-md p-8">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{t("signIn")}</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-2">
            Welcome back to {tCommon("appName")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-md text-sm border border-red-200 dark:border-red-800"
              role="alert"
              aria-live="polite"
            >
              {error}
            </div>
          )}

          <FormField id="email" label={t("email")} error={fieldErrors.email} required>
            {({ id, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby }) => (
              <input
                id={id}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="your@email.com"
                aria-invalid={ariaInvalid}
                aria-describedby={ariaDescribedby}
                disabled={loading}
              />
            )}
          </FormField>

          <FormField id="password" label={t("password")} error={fieldErrors.password} required>
            {({ id, "aria-invalid": ariaInvalid, "aria-describedby": ariaDescribedby }) => (
              <input
                id={id}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-300 dark:border-zinc-700 rounded-md bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                aria-invalid={ariaInvalid}
                aria-describedby={ariaDescribedby}
                disabled={loading}
              />
            )}
          </FormField>

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t("rememberMe")}
              </span>
            </label>

            <Link
              href={`/${locale}/forgot-password`}
              className="text-sm text-blue-600 hover:text-blue-500"
            >
              {t("forgotPassword")}
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? tCommon("loading") : t("signIn")}
          </button>
        </form>

        <div className="mt-6 text-center text-sm">
          <span className="text-zinc-600 dark:text-zinc-400">{t("dontHaveAccount")}</span>
          <Link
            href={`/${locale}/signup`}
            className="ml-1 text-blue-600 hover:text-blue-500 font-medium"
          >
            {t("signUpNow")}
          </Link>
        </div>
      </div>
    </div>
  );
}
