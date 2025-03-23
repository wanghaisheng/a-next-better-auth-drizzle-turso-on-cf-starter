import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';
import withPWA from 'next-pwa';

// Import the setupDevPlatform function only in development
if (process.env.NODE_ENV === "development") {
  const { setupDevPlatform } = require("@cloudflare/next-on-pages/next-dev");
  setupDevPlatform().catch(console.error);
}

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    // Ignore ESLint errors during production build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Ignore TypeScript errors during production build
    ignoreBuildErrors: true,
  },
  // Use standalone output
  output: 'standalone',
  // External packages - moved to correct config property
  serverExternalPackages: ['better-auth'],
  // Image configuration
  images: {
    unoptimized: true, // Disable image optimization for static exports
    domains: ['same-assets.com', 'images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // Additional deployment settings
  env: {
    NETLIFY_DEPLOYMENT: process.env.NEXT_PUBLIC_NETLIFY ? 'true' : 'false',
  },
};

const withNextIntl = createNextIntlPlugin();

// Apply both plugins
const configWithIntl = withNextIntl(nextConfig);

// Apply PWA configuration
const configWithPWA = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})(configWithIntl);

export default configWithPWA;
