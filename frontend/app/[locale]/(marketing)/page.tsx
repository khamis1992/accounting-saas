'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, Languages } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePathname, useRouter } from 'next/navigation';

export default function HomePage() {
  const t = useTranslations('common');
  const pathname = usePathname();
  const router = useRouter();

  const currentLocale = pathname.split('/')[1] || 'en';

  const changeLocale = (newLocale: string) => {
    const newPathname = pathname.replace(`/${currentLocale}`, `/${newLocale}`);
    router.push(newPathname);
    router.refresh();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-black">
      <div className="absolute top-6 right-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Languages className="h-5 w-5" />
              <span className="sr-only">Change language</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => changeLocale('en')}
              className={currentLocale === 'en' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => changeLocale('ar')}
              className={currentLocale === 'ar' ? 'bg-zinc-100 dark:bg-zinc-800' : ''}
            >
              العربية
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="w-full max-w-4xl px-6 py-12 text-center">
        <h1 className="mb-4 text-5xl font-bold text-zinc-900 dark:text-zinc-50">
          Welcome to {t('appName')}
        </h1>
        <p className="mb-8 text-xl text-zinc-600 dark:text-zinc-400">
          Enterprise-level Accounting SaaS platform for Qatar market
        </p>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link href="/auth/signin">
            <Button size="lg" className="gap-2">
              {t('signIn')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/auth/signup">
            <Button size="lg" variant="outline">
              {t('signUp')}
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
