import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales } from '@/i18n-config';
export * from '@/src/i18n/navigation';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
