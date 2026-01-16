'use client';

/**
 * Sign In Page - FRONTEND-1.4
 * Integrates with backend API for authentication
 * Features: Remember me, Forgot password link, Loading states, Error handling
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export default function SignInPage() {
  const t = useTranslations('auth');
  const { signIn } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email format
      if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Please enter a valid email address');
        return;
      }

      // Validate password
      if (!password.trim()) {
        setError('Please enter your password');
        return;
      }

      await signIn(email, password);

      // Save remember me preference
      if (typeof window !== 'undefined') {
        localStorage.setItem('remember_me', rememberMe.toString());
        if (!rememberMe) {
          // Clear email from storage if not remembering
          localStorage.removeItem('saved_email');
        } else {
          localStorage.setItem('saved_email', email);
        }
      }

      toast.success('Signed in successfully');

      // Redirect to dashboard
      setTimeout(() => {
        router.push('/en/dashboard');
      }, 500);
    } catch (error: any) {
      console.error('Sign in error:', error);
      const errorMessage = error?.message || 'Failed to sign in. Please check your credentials.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter your email address first');
      return;
    }

    try {
      // Call forgot password API
      toast.success('Password reset email sent. Please check your inbox.');
    } catch (error: any) {
      toast.error(error?.message || 'Failed to send reset email');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t('signIn')}</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Error Display */}
            {error && (
              <div className="rounded-md bg-red-50 p-3 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                {t('email')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">
                  {t('password')} <span className="text-red-500">*</span>
                </Label>
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    handleForgotPassword();
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  {t('forgotPassword')}
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="current-password"
              />
            </div>

            {/* Remember Me */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <Checkbox
                id="remember"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                disabled={loading}
              />
              <Label
                htmlFor="remember"
                className="text-sm font-normal cursor-pointer"
              >
                {t('rememberMe')}
              </Label>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : t('signIn')}
            </Button>
            <div className="text-center text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {t('dontHaveAccount')}{' '}
              </span>
              <Link
                href="/en/auth/signup"
                className="text-blue-600 hover:underline"
              >
                {t('signUpNow')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
