# Avoiding Hydration Issues with Next.js Internationalization

This guide outlines best practices to prevent React hydration mismatches when implementing internationalization (i18n) in Next.js applications using the App Router and `next-intl`.

## Common Hydration Issues

Hydration errors occur when the HTML produced during server-side rendering doesn't match what React expects to render on the client side. With i18n, several factors can contribute to these mismatches:

1. Inconsistent locale detection between server and client
2. Different message loading strategies
3. Non-deterministic or variable inputs
4. Improper client/server component boundaries

## Best Practices

### 1. Proper Root Layout Configuration

Always configure your root layout to explicitly validate locales and pass messages:

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

### 2. Consistent Message Loading

Create a robust message loading utility that handles errors and fallbacks:

```tsx
// lib/get-messages.ts
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

### 3. Client Component Best Practices

For client components that use i18n:

#### Define Static Data Inside Components

```tsx
'use client';

// Define static data inside the component to ensure consistency
const localeNames = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

export function LanguageSwitcher() {
  // ...component logic
}
```

#### Avoid Variable Inputs During Initial Render

```tsx
'use client';

function MyComponent() {
  // ❌ BAD: This causes hydration mismatch
  const randomId = Math.random();

  // ✅ GOOD: Use useState + useEffect for variable data
  const [id, setId] = useState('initial');

  useEffect(() => {
    // Only update after hydration is complete
    setId(Math.random().toString());
  }, []);

  return <div>ID: {id}</div>;
}
```

### 4. Proper Usage of `setRequestLocale`

Always call `setRequestLocale` in every page and layout component that uses i18n:

```tsx
// app/[locale]/some-page.tsx
export default function Page({ params }) {
  // Call this before any hooks that use i18n
  setRequestLocale(params.locale);

  // Now safe to use i18n hooks
  const t = useTranslations('namespace');

  return <div>{t('key')}</div>;
}
```

### 5. Avoid Mixing Server and Client State

Ensure data used for rendering is consistent:

```tsx
// server component
export default async function Page({ params }) {
  setRequestLocale(params.locale);

  // Fetch data once on the server
  const data = await fetchData();

  // Pass to client component
  return <ClientComponent initialData={data} />;
}

// client component
'use client';
function ClientComponent({ initialData }) {
  // Use server-provided data for initial render
  const [data, setData] = useState(initialData);

  // Optional: update later
  useEffect(() => {
    // This won't cause hydration issues
    async function refreshData() {
      const fresh = await fetchData();
      setData(fresh);
    }
  }, []);
}
```

## Troubleshooting Hydration Issues

If you encounter hydration issues despite following these practices:

1. **Temporary Diagnosis**: Add `suppressHydrationWarning` to the HTML element to see the rendered content
2. **Compare HTML**: Use browser dev tools to compare server-rendered HTML with client HTML
3. **Check for Dynamic Content**: Look for anything that might differ between server and client
4. **Verify Static Parameters**: Ensure `generateStaticParams` correctly lists all locales
5. **Console Logging**: Add logging to check values at both server and client render phases

## Common Edge Cases to Watch For

1. **Date/Time Formatting**: These may render differently on server vs. client
2. **Browser-specific APIs**: Ensure these are only used in client components
3. **Third-party Libraries**: Some libraries may behave differently in server vs. client environments
4. **CSS-in-JS**: Some CSS-in-JS libraries might cause hydration issues

By following these practices, you can build robust internationalized applications without encountering hydration errors.
