'use client';

/**
 * Sign Up Page - FRONTEND-1.3
 * Creates a new tenant with admin user
 * Fields: Company Name (EN), Company Name (AR), Email, Password, Confirm Password
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/auth-context';
import { toast } from 'sonner';

export default function SignUpPage() {
  const t = useTranslations('auth');
  const { createTenantWithAdmin } = useAuth();
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [companyNameAr, setCompanyNameAr] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Password strength validation
  const getPasswordStrength = (pwd: string) => {
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (pwd.length >= 12) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++;
    return strength;
  };

  const passwordStrength = getPasswordStrength(password);
  const isPasswordValid = password.length >= 8 && passwordStrength >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    if (!lastName.trim()) {
      toast.error('Last name is required');
      return;
    }

    if (!companyName.trim()) {
      toast.error('Company name is required');
      return;
    }

    if (!companyNameAr.trim()) {
      toast.error('Arabic company name is required');
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!isPasswordValid) {
      toast.error('Password must be at least 8 characters with letters, numbers, and special characters');
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t('passwordMismatch') || 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await createTenantWithAdmin({
        companyNameEn: companyName,
        companyNameAr: companyNameAr,
        firstName,
        lastName,
        email,
        password,
      });

      toast.success('Account created successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/en/dashboard');
      }, 1000);
    } catch (error: any) {
      console.error('Sign up error:', error);
      toast.error(error.message || 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-black">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">{t('signUp')}</CardTitle>
          <CardDescription>
            Create your company account to get started with المحاسب
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {/* Company Name (English) */}
            <div className="space-y-2">
              <Label htmlFor="companyName">
                Company Name (English) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyName"
                placeholder="My Company LLC"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Company Name (Arabic) */}
            <div className="space-y-2">
              <Label htmlFor="companyNameAr">
                اسم الشركة (عربي) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="companyNameAr"
                placeholder="شركتي ذ.م.م"
                value={companyNameAr}
                onChange={(e) => setCompanyNameAr(e.target.value)}
                required
                disabled={loading}
                dir="rtl"
              />
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="firstName"
                placeholder="Ahmed"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="lastName"
                placeholder="Al-Mansouri"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                disabled={loading}
              />
            </div>

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
              <Label htmlFor="password">
                {t('password')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter a strong password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded ${
                          i < passwordStrength
                            ? passwordStrength <= 2
                              ? 'bg-red-500'
                              : passwordStrength <= 4
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-zinc-200 dark:bg-zinc-700'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {passwordStrength <= 2 && 'Weak password'}
                    {passwordStrength === 3 && 'Moderate password'}
                    {passwordStrength === 4 && 'Strong password'}
                    {passwordStrength === 5 && 'Very strong password'}
                  </p>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                {t('confirmPassword')} <span className="text-red-500">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                autoComplete="new-password"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Passwords do not match</p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-500">Passwords match</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={loading || !isPasswordValid}
            >
              {loading ? 'Creating account...' : t('signUp')}
            </Button>
            <div className="text-center text-sm">
              <span className="text-zinc-600 dark:text-zinc-400">
                {t('alreadyHaveAccount')}{' '}
              </span>
              <Link
                href="/en/auth/signin"
                className="text-blue-600 hover:underline"
              >
                {t('signInNow')}
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
