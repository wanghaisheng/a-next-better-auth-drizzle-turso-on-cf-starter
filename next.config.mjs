import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure static assets are properly handled with i18n routes
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  
  // Configure i18n to use the App Router pattern
  i18n: undefined, // Remove this if it exists - App Router uses a different approach
  
  // Make sure images can be loaded from the correct paths
  images: {
    unoptimized: process.env.NODE_ENV !== 'production',
    remotePatterns: [
      // Add any remote image sources if needed
    ],
  },
  
  // Ensure public assets are accessible
  publicRuntimeConfig: {
    basePath: '',
  },
};

export default withNextIntl(nextConfig);