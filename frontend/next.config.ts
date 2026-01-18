/**
 * next.config
 *
 * @fileoverview TypeScript module
 * @author Frontend Team
 * @created 2026-01-17
 * @updated 2026-01-17
 */
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Import environment validation - will exit if env vars are missing
import "./env.config";

const withNextIntl = createNextIntlPlugin("./lib/i18n.ts");

// Import bundle analyzer conditionally
const withBundleAnalyzer = require("@next/bundle-analyzer")({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    // Require all environment variables to be set - no fallbacks to prevent accidents
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (() => {
        throw new Error(
          "NEXT_PUBLIC_API_URL is required. Set it in .env.local or your deployment environment."
        );
      })(),
    NEXT_PUBLIC_APP_URL:
      process.env.NEXT_PUBLIC_APP_URL ||
      (() => {
        throw new Error(
          "NEXT_PUBLIC_APP_URL is required. Set it in .env.local or your deployment environment."
        );
      })(),
  },
  // Add trailing slash handling for consistent URLs
  trailingSlash: false,

  // Optimize images
  images: {
    domains: ["gbbmicjucestjpxtkjyp.supabase.co"],
    unoptimized: false,
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  // Enable strict mode for better error detection
  reactStrictMode: true,

  // Performance optimizations
  compress: true,
  poweredByHeader: false,

  // Compiler options for performance
  compiler: {
    // Remove console.log in production
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Experimental features for performance
  experimental: {
    // Optimize CSS imports
    optimizeCss: true,
    // Optimize package imports
    optimizePackageImports: ["lucide-react", "recharts", "framer-motion", "date-fns"],
  },

  // Webpack configuration for code splitting
  webpack: (config, { isServer }) => {
    // Improve chunk splitting for better caching
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /node_modules/,
              name: "vendors",
              priority: 10,
              reuseExistingChunk: true,
            },
            // Separate charts chunk (lazy loaded)
            charts: {
              test: /node_modules\/recharts/,
              name: "charts",
              priority: 20,
              reuseExistingChunk: true,
            },
            // Separate UI library chunks
            ui: {
              test: /node_modules\/@radix-ui/,
              name: "ui",
              priority: 15,
              reuseExistingChunk: true,
            },
          },
        },
      };
    }

    return config;
  },

  // Configure headers for security AND performance
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevent clickjacking attacks
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Performance: Enable compression hint
          {
            key: "Accept-Encoding",
            value: "gzip, deflate, br",
          },
          // Performance: Cache static assets
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
          // Content Security Policy - prevent XSS attacks
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "img-src 'self' data: blob: https://*.supabase.co https://*.railway.app;",
              "font-src 'self' data:;",
              "connect-src 'self' https://*.supabase.co https://*.railway.app ws://localhost:* ws://*.railway.app;",
              "frame-ancestors 'none';",
              "base-uri 'self';",
              "form-action 'self';",
            ].join(" "),
          },
          // Permissions Policy - restrict browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS - enforce HTTPS (only enable in production)
          ...(process.env.NODE_ENV === "production"
            ? [
                {
                  key: "Strict-Transport-Security",
                  value: "max-age=31536000; includeSubDomains",
                },
              ]
            : []),
        ],
      },
    ];
  },
};

export default withNextIntl(withBundleAnalyzer(nextConfig));
