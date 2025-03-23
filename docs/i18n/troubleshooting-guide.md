# Internationalization (i18n) Troubleshooting Guide

This guide addresses common issues encountered when implementing internationalization in Next.js applications using `next-intl`. Following these recommendations will help you avoid the most frequent problems.

## Common Issues and Solutions

### 1. Hydration Mismatches

**Symptoms:**
- Console errors like `Text content did not match` or `Hydration failed`
- UI flickering on page load
- Components rendering differently between server and client

**Solutions:**

#### Consistent Message Loading

Ensure messages are loaded consistently between server and client:

```tsx
// app/[locale]/layout.tsx
export default async function RootLayout({ children, params }) {
  const locale = await Promise.resolve(params.locale);
  
  // Validate locale is supported
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  await setRequestLocale(locale);

  // Explicitly load messages with error handling
  const messages = await import(`../../messages/${locale}.json`)
    .then(module => module.default)
    .catch(() => {
      console.error(`Could not load messages for locale: ${locale}`);
      return import(`../../messages/${routing.defaultLocale}.json`).then(module => module.default);
    });

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

#### Avoid Dynamic Content During Initial Render

For client components that display dynamic content:

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

export function DynamicContent() {
  const t = useTranslations('content');
  const [data, setData] = useState(null);
  
  // Only load data after initial render
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  // Show placeholder until data is loaded
  if (!data) return <div>{t('loading')}</div>;
  
  return <div>{t('dynamicContent', { value: data.value })}</div>;
}
```

### 2. Missing Translations

**Symptoms:**
- Keys appearing instead of translated text
- Fallback to default language unexpectedly
- Console warnings about missing translations

**Solutions:**

#### Consistent Key Structure

Ensure all translation files have the same key structure:

```json
// messages/en.json
{
  "common": {
    "welcome": "Welcome",
    "buttons": {
      "submit": "Submit"
    }
  }
}

// messages/ja.json
{
  "common": {
    "welcome": "ようこそ",
    "buttons": {
      "submit": "送信"
    }
  }
}
```

#### Use Default Values

Provide default values for translations:

```tsx
const t = useTranslations('common');

// With default value
<p>{t('missingKey', { defaultValue: 'Fallback text' })}</p>
```

#### Translation Validation

Implement a script to validate translation files for consistency:

```typescript
// scripts/validate-translations.ts
import fs from 'fs';
import path from 'path';

const messagesDir = path.join(process.cwd(), 'messages');
const defaultLocale = 'en';

// Load default locale messages as reference
const defaultMessages = JSON.parse(
  fs.readFileSync(path.join(messagesDir, `${defaultLocale}.json`), 'utf8')
);

// Get all locale files
const localeFiles = fs.readdirSync(messagesDir)
  .filter(file => file.endsWith('.json') && file !== `${defaultLocale}.json`);

// Check each locale file against default
localeFiles.forEach(file => {
  const locale = file.replace('.json', '');
  const messages = JSON.parse(
    fs.readFileSync(path.join(messagesDir, file), 'utf8')
  );
  
  // Function to recursively check keys
  function checkKeys(reference, target, path = '') {
    const missingKeys = [];
    
    Object.keys(reference).forEach(key => {
      const currentPath = path ? `${path}.${key}` : key;
      
      if (typeof reference[key] === 'object' && reference[key] !== null) {
        // Recursive check for nested objects
        if (!target[key] || typeof target[key] !== 'object') {
          missingKeys.push(currentPath);
        } else {
          missingKeys.push(...checkKeys(reference[key], target[key], currentPath));
        }
      } else if (target[key] === undefined) {
        missingKeys.push(currentPath);
      }
    });
    
    return missingKeys;
  }
  
  const missingKeys = checkKeys(defaultMessages, messages);
  
  if (missingKeys.length > 0) {
    console.warn(`Missing translations in ${locale}.json:`);
    missingKeys.forEach(key => console.warn(`  - ${key}`));
  } else {
    console.log(`✓ ${locale}.json has all required translations`);
  }
});
```

### 3. Routing and Navigation Issues

**Symptoms:**
- 404 errors when navigating between localized routes
- Incorrect locale in URL after navigation
- Loss of locale when navigating

**Solutions:**

#### Use Proper Navigation Components

Always use the `Link` component from `next-intl` for client-side navigation:

```tsx
import { Link } from '@/src/i18n/navigation';

// Correct usage
<Link href="/dashboard">Dashboard</Link>
```

#### Correct Middleware Configuration

Ensure your middleware is properly configured:

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Matcher ignoring static files and API routes
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

#### Proper Route Definition

Define all routes in your routing configuration:

```typescript
// src/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'zh', 'ja'],
  defaultLocale: 'en',
  pathnames: {
    '/': '/',
    '/login': {
      en: '/login',
      zh: '/login',
      ja: '/login',
    },
    '/dashboard': {
      en: '/dashboard',
      zh: '/dashboard',
      ja: '/dashboard',
    },
    // Define all routes used in your application
  }
});
```

### 4. Static vs. Dynamic Rendering

**Symptoms:**
- Inconsistent behavior between development and production
- SEO issues with localized content
- Slow initial page loads

**Solutions:**

#### Enable Static Rendering

Use `setRequestLocale` in all page and layout components:

```tsx
// app/[locale]/page.tsx
import { setRequestLocale } from 'next-intl/server';

export default function Page({ params }: { params: { locale: string } }) {
  // Enable static rendering
  setRequestLocale(params.locale);
  
  return (
    // Page content
  );
}
```

#### Generate Static Params

Implement `generateStaticParams` to pre-render all locale variants:

```tsx
// app/[locale]/layout.tsx
import { routing } from '@/src/i18n/routing';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
```

## Best Practices Checklist

Use this checklist to ensure your i18n implementation follows best practices:

- [ ] Use `next-intl` navigation utilities consistently
- [ ] Validate locales in layout components
- [ ] Handle message loading errors gracefully
- [ ] Use `suppressHydrationWarning` where appropriate
- [ ] Avoid dynamic content during initial render in client components
- [ ] Implement consistent key structure across all translation files
- [ ] Use `setRequestLocale` in all page and layout components
- [ ] Define all application routes in routing configuration
- [ ] Implement proper error boundaries for i18n-related errors
- [ ] Regularly validate translation files for consistency

## Advanced Troubleshooting

### Debug Mode

Enable debug mode to get more detailed information about i18n issues:

```tsx
// app/[locale]/layout.tsx
<NextIntlClientProvider 
  locale={locale} 
  messages={messages}
  debug={process.env.NODE_ENV === 'development'}
>
  {children}
</NextIntlClientProvider>
```

### Common Error Patterns

#### "Text content did not match" with Date/Time Values

This often occurs with date/time values that are rendered differently on server and client:

```tsx
// INCORRECT - Will cause hydration mismatch
const now = new Date();

// CORRECT - Use useNow hook in client components
import { useNow } from 'next-intl';
const now = useNow();

// CORRECT - For server components, use a fixed date or pass as prop
const fixedDate = new Date('2023-01-01T00:00:00Z');
```

#### "Hydration failed" with Conditional Rendering

Ensure conditional rendering is consistent between server and client:

```tsx
// INCORRECT - May cause hydration issues if user state differs
const isLoggedIn = checkUserLoggedIn();
{isLoggedIn && <LoggedInContent />}

// CORRECT - Use useEffect for client-side conditional rendering
const [isLoggedIn, setIsLoggedIn] = useState(false);
useEffect(() => {
  setIsLoggedIn(checkUserLoggedIn());
}, []);
```

## Conclusion

By following these guidelines and best practices, you can avoid most common i18n issues in Next.js applications. Remember that consistent message loading, proper navigation, and careful handling of dynamic content are key to a successful internationalization implementation.

If you encounter issues not covered in this guide, refer to the [next-intl documentation](https://next-intl-docs.vercel.app/) or open an issue in the project repository.