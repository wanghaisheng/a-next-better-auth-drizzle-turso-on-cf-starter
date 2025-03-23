// Import directly from next-intl
import { Link, useRouter, usePathname } from 'next-intl';
import { locales, defaultLocale } from './routing';

// Re-export the components
export { Link, useRouter, usePathname };

// Create a redirect function
export function redirect(path: string, locale?: string) {
  const targetLocale = locale || defaultLocale;
  return `/${targetLocale}${path.startsWith('/') ? path : `/${path}`}`;
}
