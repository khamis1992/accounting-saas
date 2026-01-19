/**
 * SEO Meta Tags Component
 *
 * Provides comprehensive SEO meta tags for all pages using Next.js Metadata API.
 * Includes Open Graph, Twitter Cards, and structured data.
 */

import { Metadata } from 'next';

export interface SEOMetaProps {
  title: string;
  titleAr?: string;
  description: string;
  descriptionAr?: string;
  keywords?: string[];
  ogImage?: string;
  ogType?: 'website' | 'article';
  twitterCard?: 'summary' | 'summary_large_image';
  canonical?: string;
  noindex?: boolean;
  nofollow?: boolean;
  locale?: string;
}

/**
 * Generate Next.js Metadata object from SEO props
 *
 * Use this function in your page.tsx or layout.tsx files:
 * export const metadata = generateMetadata({ title: "...", description: "..." });
 */
export function generateMetadata({
  title,
  titleAr,
  description,
  descriptionAr,
  keywords = [],
  ogImage = '/og-image.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonical,
  noindex = false,
  nofollow = false,
  locale = 'en',
}: SEOMetaProps): Metadata {
  // Select appropriate content based on locale
  const pageTitle = locale === 'ar' && titleAr ? titleAr : title;
  const pageDescription = locale === 'ar' && descriptionAr ? descriptionAr : description;

  return {
    title: pageTitle,
    description: pageDescription,
    keywords: keywords.join(', '),
    alternates: canonical ? { canonical } : undefined,
    robots: {
      index: !noindex,
      follow: !nofollow,
    },
    openGraph: {
      type: ogType,
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
      locale: locale === 'ar' ? 'ar_SA' : 'en_US',
    },
    twitter: {
      card: twitterCard,
      title: pageTitle,
      description: pageDescription,
      images: [ogImage],
    },
  };
}

/**
 * Default SEO metadata for the entire app
 */
export const defaultMetadata: Metadata = generateMetadata({
  title: 'Accounting SaaS - Modern Cloud Accounting Solution',
  titleAr: 'محاسبة ساس - حل محاسبي سحابي حديث',
  description:
    'Professional cloud-based accounting software for small and medium businesses. Manage invoices, expenses, payroll, and more.',
  descriptionAr:
    'برنامج محاسبي سحابي احترافي للشركات الصغيرة والمتوسطة. إدارة الفواتير والمصروفات والرواتب والمزيد.',
  keywords: [
    'accounting software',
    'cloud accounting',
    'invoice management',
    'expense tracking',
    'financial reports',
    'business accounting',
    'برنامج محاسبة',
    'محاسبة سحابية',
    'إدارة الفواتير',
    'تتبع المصروفات',
  ],
  ogImage: '/og-image.png',
});

/**
 * Helper function to generate page-specific metadata
 */
export function createPageMetadata(
  props: Omit<SEOMetaProps, 'ogImage' | 'ogType' | 'twitterCard'>
): Metadata {
  return generateMetadata({
    ...props,
    ogImage: '/og-image.png',
    ogType: 'website',
    twitterCard: 'summary_large_image',
  });
}

/**
 * Helper function to generate article metadata
 */
export function createArticleMetadata(
  props: Omit<SEOMetaProps, 'ogType' | 'twitterCard'>
): Metadata {
  return generateMetadata({
    ...props,
    ogType: 'article',
    twitterCard: 'summary_large_image',
  });
}
