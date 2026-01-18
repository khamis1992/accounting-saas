/**
 * SEO Meta Tags Component
 *
 * Provides comprehensive SEO meta tags for all pages.
 * Includes Open Graph, Twitter Cards, and structured data.
 */

'use client';

import { Helmet } from 'react-helmet-async';
import { useTranslations } from 'next-intl';

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
  structuredData?: Record<string, unknown>;
}

/**
 * SEO Meta Tags Component
 *
 * Automatically adds proper meta tags based on current locale.
 * Includes Open Graph tags for social media sharing.
 */
export function SEOMeta({
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
  structuredData,
}: SEOMetaProps) {
  const t = useTranslations();
  const locale = t('locale') || 'en';

  // Select appropriate content based on locale
  const pageTitle = locale === 'ar' && titleAr ? titleAr : title;
  const pageDescription = locale === 'ar' && descriptionAr ? descriptionAr : description;

  // Build meta tags
  const metaTags = [
    // Basic SEO
    { name: 'description', content: pageDescription },
    { name: 'keywords', content: keywords.join(', ') },

    // Open Graph / Facebook
    { property: 'og:type', content: ogType },
    { property: 'og:title', content: pageTitle },
    { property: 'og:description', content: pageDescription },
    { property: 'og:image', content: ogImage },
    { property: 'og:locale', content: locale === 'ar' ? 'ar_SA' : 'en_US' },

    // Twitter
    { name: 'twitter:card', content: twitterCard },
    { name: 'twitter:title', content: pageTitle },
    { name: 'twitter:description', content: pageDescription },
    { name: 'twitter:image', content: ogImage },

    // Robots
    { name: 'robots', content: `${noindex ? 'noindex' : 'index'}, ${nofollow ? 'nofollow' : 'follow'}` },
  ];

  // Add canonical if provided
  const linkTags = canonical
    ? [{ rel: 'canonical', href: canonical }]
    : [];

  return (
    <Helmet>
      <title>{pageTitle}</title>
      {metaTags.map((tag, i) => {
        const key = Object.keys(tag).find(k => k in tag);
        const content = tag[key as keyof typeof tag];
        return key === 'property' ? (
          <meta key={i} property={content as string} content={tag.content as string} />
        ) : (
          <meta key={i} name={content as string} content={tag.content as string} />
        );
      })}
      {linkTags.map((tag, i) => (
        <link key={i} rel={tag.rel} href={tag.href} />
      ))}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

/**
 * Default SEO meta tags for the entire app
 */
export function DefaultSEOMeta() {
  return (
    <SEOMeta
      title="Accounting SaaS - Modern Cloud Accounting Solution"
      titleAr="محاسبة ساس - حل محاسبي سحابي حديث"
      description="Professional cloud-based accounting software for small and medium businesses. Manage invoices, expenses, payroll, and more."
      descriptionAr="برنامج محاسبي سحابي احترافي للشركات الصغيرة والمتوسطة. إدارة الفواتير والمصروفات والرواتب والمزيد."
      keywords={[
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
      ]}
      ogImage="/og-image.png"
    />
  );
}

/**
 * Page-specific SEO meta tags
 */
export function PageSEOMeta(props: Omit<SEOMetaProps, 'ogImage' | 'ogType' | 'twitterCard'>) {
  return <SEOMeta {...props} ogImage="/og-image.png" ogType="website" twitterCard="summary_large_image" />;
}

/**
 * Article SEO meta tags for blog/news
 */
export function ArticleSEOMeta(props: Omit<SEOMetaProps, 'ogType' | 'twitterCard'>) {
  return <SEOMeta {...props} ogType="article" twitterCard="summary_large_image" />;
}
