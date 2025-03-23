# Internationalization (i18n) Implementation Guide

This document describes the implementation of internationalization (i18n) in the Next.js Better Auth project using `next-intl`.

## Overview

We've implemented a comprehensive internationalization solution that provides:

1. URL path-based locale routing (e.g., `/en/login`, `/zh/login`)
2. Language detection and switching
3. Translation of UI text
4. Proper SEO support with localized metadata
5. Static rendering optimization

## Implementation Details

### Technology Stack

- **next-intl**: Main i18n library for Next.js
- **App Router**: Next.js App Router with locale-based routing
- **Negotiator**: For browser language detection

### Directory Structure

```
messages/
  en.json      # English translations
  zh.json      # Chinese translations
  ja.json      # Japanese translations
src/
  i18n/
    request.ts       # Request-specific i18n configuration
    routing.ts       # Routing configuration
    navigation.ts    # Navigation utilities
  middleware.ts      # Language detection middleware
app/
  [locale]/          # Dynamic locale segment
    layout.tsx       # Root layout with i18n setup
    page.tsx         # Home page
    (auth)/          # Auth route group
      login/
      sign-up/
      forgot-password/
      reset-password/
    dashboard/       # Dashboard page
```

### Core Components

#### 1. Locale Configuration

The `src/i18n/routing.ts` file defines supported locales:

```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh', 'ja'],
  defaultLocale: 'en'
});
```

#### 2. Middleware for Locale Detection

The `src/middleware.ts` file handles:
- Automatic locale detection based on browser settings
- Redirects to localized routes
- Handling of missing locales

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|static|.*\\..*).*)'];
}
```

#### 3. Translation Resources

Translation messages are stored in JSON files in the `messages/` directory:

```javascript
// messages/en.json example
{
  "common": {
    "welcome": "Welcome to our application",
    "language": "Language",
    // ...
  },
  "auth": {
    "login": "Log in",
    "signup": "Sign up",
    // ...
  }
}
```

Similar files exist for other supported languages (zh.json, ja.json).

#### 4. Language Switcher Component

A `LanguageSwitcher` component allows users to change the site language while preserving the current path:

```tsx
'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/src/i18n/navigation';
import { routing } from '@/src/i18n/routing';

// Define locale names directly in component to ensure consistency
const localeNames: Record<string, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(newLocale: string) {
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <Globe className="h-4 w-4" />
          <span>{localeNames[locale as string] || locale}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            onClick={() => handleChange(l)}
          >
            {localeNames[l] || l}
            {l === locale && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

#### 5. Root Layout with i18n Support

```tsx
// app/[locale]/layout.tsx
export default async function RootLayout({
  children,
  params
}) {
  const { locale } = params;

  // Validate locale is supported
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Explicitly load messages
  const messages = await getMessages(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

#### 6. Translation Message Loading

We've implemented robust message loading that gracefully handles errors:

```typescript
// lib/get-messages.ts
import { routing } from '@/src/i18n/routing';

export async function getMessages(locale: string) {
  try {
    // Try to load messages for the requested locale
    return (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Could not load messages for locale: ${locale}`, error);

    // Fall back to default locale
    try {
      return (await import(`../messages/${routing.defaultLocale}.json`)).default;
    } catch (fallbackError) {
      console.error(`Failed to load fallback messages`, fallbackError);
      // Return empty object as last resort
      return {};
    }
  }
}
```

## Adding New Languages

To add a new language to the application:

1. Add the locale code to the `locales` array in `src/i18n/routing.ts`
2. Create a new translation file in the `messages/` directory
3. Add language name to the `localeNames` map in the `LanguageSwitcher` component

## Usage in Components

### Server Components

```typescript
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

export default function Page({ params }: { params: { locale: string } }) {
  // Enable static rendering
  setRequestLocale(params.locale);

  const t = useTranslations("namespace");

  return <h1>{t("key")}</h1>;
}
```

### Client Components

```typescript
"use client";
import { useTranslations } from "next-intl";

export function Component() {
  const t = useTranslations("namespace");

  return <button>{t("button.label")}</button>;
}
```

### Navigation

For navigation between pages, use the provided `Link` component from our navigation utilities:

```typescript
import { Link } from "@/src/i18n/navigation";

<Link href="/dashboard">Dashboard</Link>
```

This handles preserving the current locale in the URL.

## Metadata and SEO

For proper SEO support, use the `generateMetadata` function in your pages:

```typescript
export function generateMetadata({ params }: { params: { locale: string } }) {
  // Set locale for metadata generation
  setRequestLocale(params.locale);

  const t = useTranslations('common');

  return {
    title: t('pageTitle'),
    description: t('pageDescription'),
  };
}
```

## Static Rendering Considerations

For optimal performance with internationalization, we use static rendering with the `generateStaticParams` function:

```typescript
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

This pre-renders pages for all supported locales at build time.

## Common Issues and Solutions

For troubleshooting hydration issues and other common problems, refer to the [Hydration Troubleshooting Guide](./03-hydration.md).
