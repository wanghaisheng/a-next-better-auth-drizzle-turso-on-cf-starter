# Internationalization (i18n) Implementation

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

#### 4. Language Switcher

A `LanguageSwitcher` component allows users to change the site language while preserving the current path.

#### 5. Static Rendering Support

The `setRequestLocale` function is used in layout and page components to enable static rendering with proper i18n support:

```typescript
export default function Page({ params }: { params: { locale: string } }) {
  // Enable static rendering
  setRequestLocale(params.locale);

  // Use i18n hooks
  const t = useTranslations("namespace");

  // ...
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

For navigation between pages, use the provided `Link` component:

```typescript
import { Link } from "@/src/i18n/navigation";

<Link href="/dashboard">Dashboard</Link>
```

This handles preserving the current locale in the URL.

## SEO Considerations

- Each page has `lang` attribute set correctly on the `<html>` element
- Metadata can be generated with proper localization
- Search engines can index each language version separately
