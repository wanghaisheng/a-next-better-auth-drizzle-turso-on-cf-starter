import { ReactNode } from 'react';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { notFound } from 'next/navigation';
import { routing } from '@/src/i18n/routing';
import { setRequestLocale } from 'next-intl/server';

interface RootLayoutProps {
  children: ReactNode;
  params: {
    locale: string;
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: RootLayoutProps) {
  // Destructure the locale to avoid nextjs warning
  const locale = await Promise.resolve(params.locale);
  
  // Validate that the incoming locale is valid
  if (!hasLocale(routing.locales, await Promise.resolve(locale))) {
    notFound();
  }

  // Enable static rendering with explicit locale
  await setRequestLocale(locale);

  // Explicitly load messages to ensure consistency between server and client
  const messages = await import(`../../messages/${locale}.json`)
    .then(module => module.default)
    .catch(() => {
      console.error(`Could not load messages for locale: ${locale}`);
      // Fallback to default locale if messages can't be loaded
      return import(`../../messages/${routing.defaultLocale}.json`).then(module => module.default);
    });

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}

// Generate metadata
export async function generateMetadata({ params }: { params: { locale: string } }) {
  // Destructure the locale to avoid nextjs warning
  const locale = await Promise.resolve(params.locale);

  // Set the locale for metadata
  await setRequestLocale(locale);

  return {
    title: {
      template: '%s | Next Better Auth',
      default: 'Next Better Auth',
    },
    description: 'A Next.js authentication system with Drizzle ORM, Turso DB, and multi-language support',
  };
}
