import { createNavigation } from 'next-intl/navigation';
import { defineRouting } from 'next-intl/routing';

export const locales = ['en', 'zh', 'ja'] as const;
export const defaultLocale = 'en' as const;

// Define routing configuration using the new API
export const routing = defineRouting({
  locales,
  defaultLocale,
  pathnames: {
    '/': '/',
    '/login': {
      en: '/login',
      zh: '/login',
      ja: '/login',
    },
    '/checkout': {
      en: '/checkout',
      zh: '/checkout',
      ja: '/checkout',
    }
  }
});

// Create navigation utilities using the new API
export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
