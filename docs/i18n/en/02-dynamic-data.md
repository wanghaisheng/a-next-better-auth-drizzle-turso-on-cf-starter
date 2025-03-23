# Multilingual Dynamic Data Handling

This guide covers strategies for handling multilingual dynamic data in your Next.js application, focusing on database design, retrieval, and display of content in multiple languages.

## Types of Translatable Content

In a multilingual application, there are two main types of content:

1. **Static UI Labels** - Interface text managed through translation files (JSON)
2. **Dynamic Data** - User-generated content and application data stored in databases

This guide focuses on the second type: storing, retrieving, and displaying dynamic data in multiple languages.

## Database Design Strategies

There are three main approaches to storing multilingual content in databases:

### 1. Multi-Column Strategy

Create separate columns for each language:

```typescript
// Drizzle ORM example
export const product = sqliteTable("product", {
  id: text("id").primaryKey(),
  imageUrl: text("image_url"),
  price: real("price"),
  // Multilingual fields
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  nameJa: text("name_ja"),
  descriptionEn: text("description_en").notNull(),
  descriptionZh: text("description_zh"),
  descriptionJa: text("description_ja"),
  // Metadata
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

**Pros**:
- Simple querying
- Good for SEO-optimized content
- Clear schema

**Cons**:
- Schema changes needed for new languages
- Column growth with more languages

### 2. JSON Field Strategy

Store translations in a JSON field:

```typescript
// Database model
export const article = sqliteTable("article", {
  id: text("id").primaryKey(),
  // JSON fields for translations
  title: text("title", { mode: "json" }).notNull(), // {"en": "Title", "zh": "标题"}
  content: text("content", { mode: "json" }).notNull(),
  // Other fields
  authorId: text("author_id").notNull(),
  publishedAt: integer("published_at", { mode: "timestamp" }),
});
```

**Pros**:
- Flexible schema
- No changes needed for new languages
- Compact design

**Cons**:
- More complex queries
- Some databases have limited JSON support

### 3. Related Table Strategy

Create a dedicated translations table:

```typescript
// Main table
export const category = sqliteTable("category", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  // Non-translatable fields
  iconUrl: text("icon_url"),
  sortOrder: integer("sort_order").notNull(),
});

// Translation table
export const categoryTranslation = sqliteTable("category_translation", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").notNull()
    .references(() => category.id, { onDelete: "cascade" }),
  locale: text("locale").notNull(), // 'en', 'zh', 'ja'
  name: text("name").notNull(),
  description: text("description"),
  // Compound unique constraint
  // One translation per category per language
}, (table) => ({
  uniqueIdx: uniqueIndex("cat_trans_unique_idx").on(table.categoryId, table.locale),
}));
```

**Pros**:
- Fully normalized database design
- No schema changes for new languages
- Efficient filtering by language

**Cons**:
- Joins needed for queries
- More complex setup

## Choosing a Strategy

Select a strategy based on your requirements:

1. **Multi-Column Strategy** is best for:
   - Fixed number of languages
   - Frequent filtering/sorting by language
   - SEO requirements for all content

2. **JSON Strategy** is best for:
   - Flexible language support
   - Simpler schema management
   - Single-language retrieval per request

3. **Related Table Strategy** is best for:
   - Fully normalized database design
   - Content that doesn't need all languages translated
   - Complex language-specific filtering

## Fallback Mechanism

Implement a fallback system to handle missing translations:

```typescript
// Helper function example
export function getTranslatedField<T>(
  entity: { [key: string]: any },
  fieldName: string,
  locale: string,
  defaultLocale: string = 'en'
): T | null {
  // Multi-column strategy
  if (`${fieldName}${locale.toUpperCase()}` in entity) {
    return entity[`${fieldName}${locale.toUpperCase()}`] || entity[`${fieldName}${defaultLocale.toUpperCase()}`];
  }

  // JSON strategy
  if (typeof entity[fieldName] === 'object') {
    return entity[fieldName][locale] || entity[fieldName][defaultLocale] || null;
  }

  // Related table strategy handled at query time

  return null;
}
```

## Implementation Examples

### Multi-Column Retrieval Example

```typescript
// app/[locale]/products/[id]/page.tsx
import { db } from '@/db';
import { product } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function ProductPage({ params }: { params: { id: string, locale: string } }) {
  // Set request locale for i18n
  setRequestLocale(params.locale);

  const { id, locale } = params;
  const t = useTranslations('products');

  // Fetch the product
  const [productData] = await db
    .select()
    .from(product)
    .where(eq(product.id, id));

  if (!productData) {
    notFound();
  }

  // Get the field based on locale with fallback
  const nameField = `name${locale.charAt(0).toUpperCase() + locale.slice(1)}`;
  const descField = `description${locale.charAt(0).toUpperCase() + locale.slice(1)}`;

  // Fallback to English if translation doesn't exist
  const name = productData[nameField] || productData.nameEn;
  const description = productData[descField] || productData.descriptionEn;

  return (
    <div>
      <h1>{name}</h1>
      <p>{description}</p>
      <p>{t('price')}: ${productData.price}</p>
    </div>
  );
}
```

### JSON Field Retrieval Example

```typescript
// app/[locale]/articles/[id]/page.tsx
import { db } from '@/db';
import { article } from '@/db/schema';
import { eq } from 'drizzle-orm';

export default async function ArticlePage({ params }: { params: { id: string, locale: string } }) {
  // Set request locale for i18n
  setRequestLocale(params.locale);

  const { id, locale } = params;

  // Fetch the article
  const [articleData] = await db
    .select()
    .from(article)
    .where(eq(article.id, id));

  if (!articleData) {
    notFound();
  }

  // Get the appropriate translation with fallback
  const title = articleData.title[locale] || articleData.title['en'];
  const content = articleData.content[locale] || articleData.content['en'];

  return (
    <div>
      <h1>{title}</h1>
      <div dangerouslySetInnerHTML={{ __html: content }} />
      <p>Published: {new Date(articleData.publishedAt).toLocaleDateString()}</p>
    </div>
  );
}
```

### Related Table Retrieval Example

```typescript
// app/[locale]/categories/[code]/page.tsx
import { db } from '@/db';
import { category, categoryTranslation } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export default async function CategoryPage({ params }: { params: { code: string, locale: string } }) {
  // Set request locale for i18n
  setRequestLocale(params.locale);

  const { code, locale } = params;

  // Try to get category with translation in requested locale
  let result = await db
    .select({
      id: category.id,
      code: category.code,
      icon: category.iconUrl,
      name: categoryTranslation.name,
      description: categoryTranslation.description,
    })
    .from(category)
    .leftJoin(
      categoryTranslation,
      and(
        eq(category.id, categoryTranslation.categoryId),
        eq(categoryTranslation.locale, locale)
      )
    )
    .where(eq(category.code, code));

  // If translation not found, fall back to English
  if (!result[0]?.name && locale !== 'en') {
    result = await db
      .select({
        id: category.id,
        code: category.code,
        icon: category.iconUrl,
        name: categoryTranslation.name,
        description: categoryTranslation.description,
      })
      .from(category)
      .leftJoin(
        categoryTranslation,
        and(
          eq(category.id, categoryTranslation.categoryId),
          eq(categoryTranslation.locale, 'en')
        )
      )
      .where(eq(category.code, code));
  }

  if (!result[0]) {
    notFound();
  }

  return (
    <div>
      <h1>{result[0].name}</h1>
      <p>{result[0].description}</p>
    </div>
  );
}
```

## Working with Select Lists and Enums

### Option 1: Database-Stored Options

```typescript
// Database schema
export const gender = sqliteTable("gender", {
  code: text("code").primaryKey(), // 'male', 'female', 'other'
});

export const genderTranslation = sqliteTable("gender_translation", {
  id: text("id").primaryKey(),
  genderCode: text("gender_code").notNull()
    .references(() => gender.code, { onDelete: "cascade" }),
  locale: text("locale").notNull(),
  label: text("label").notNull(),
}, (table) => ({
  uniqueIdx: uniqueIndex("gender_trans_unique_idx").on(table.genderCode, table.locale),
}));

// API endpoint for retrieving translated options
// app/api/options/genders/route.ts
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'en';

  const genders = await db
    .select({
      code: gender.code,
      label: genderTranslation.label,
    })
    .from(gender)
    .leftJoin(
      genderTranslation,
      and(
        eq(gender.code, genderTranslation.genderCode),
        eq(genderTranslation.locale, locale)
      )
    );

  return Response.json(genders);
}
```

### Option 2: Using Translation Files

For simpler options, use translation files:

```json
// messages/en.json
{
  "gender": {
    "label": "Gender",
    "options": {
      "male": "Male",
      "female": "Female",
      "other": "Other"
    }
  }
}
```

```tsx
// components/gender-select.tsx
'use client';

import { useTranslations } from 'next-intl';

export function GenderSelect({ value, onChange }) {
  const t = useTranslations('gender');
  const options = ['male', 'female', 'other'];

  return (
    <div>
      <label>{t('label')}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{t('pleaseSelect')}</option>
        {options.map((key) => (
          <option key={key} value={key}>
            {t(`options.${key}`)}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## User-Generated Multilingual Content

For content created by users in multiple languages:

### Multilingual Editor Component

```tsx
// components/multilingual-editor.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function MultilingualEditor({
  values = {},
  onChange,
  label,
  required = false,
}) {
  const t = useTranslations('common');
  const [activeLocale, setActiveLocale] = useState('en');

  // Supported languages
  const locales = ['en', 'zh', 'ja'];
  const localeNames = {
    en: 'English',
    zh: '中文',
    ja: '日本語',
  };

  function handleChange(locale, value) {
    onChange({
      ...values,
      [locale]: value
    });
  }

  return (
    <div className="space-y-2">
      <label className="font-medium">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>

      <Tabs value={activeLocale} onValueChange={setActiveLocale}>
        <TabsList>
          {locales.map(locale => (
            <TabsTrigger key={locale} value={locale}>
              {localeNames[locale]}
            </TabsTrigger>
          ))}
        </TabsList>

        {locales.map(locale => (
          <TabsContent key={locale} value={locale}>
            <textarea
              value={values[locale] || ''}
              onChange={(e) => handleChange(locale, e.target.value)}
              className="w-full min-h-[150px] rounded border p-2"
              placeholder={t('enterTextIn', { language: localeNames[locale] })}
            />

            {required && locale === 'en' && !values['en'] && (
              <p className="text-sm text-red-500 mt-1">
                {t('primaryLanguageRequired')}
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

### Using the Multilingual Editor

```tsx
// app/[locale]/admin/products/new/page.tsx
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { MultilingualEditor } from '@/components/multilingual-editor';

export default function NewProductPage() {
  const t = useTranslations('products');

  const [formData, setFormData] = useState({
    names: { en: '' },
    descriptions: { en: '' },
    price: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    // Submit to API...
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <MultilingualEditor
        label={t('productName')}
        values={formData.names}
        onChange={(names) => setFormData({ ...formData, names })}
        required
      />

      <MultilingualEditor
        label={t('productDescription')}
        values={formData.descriptions}
        onChange={(descriptions) => setFormData({ ...formData, descriptions })}
      />

      <div>
        <label>{t('price')}</label>
        <input
          type="number"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        />
      </div>

      <button type="submit">{t('save')}</button>
    </form>
  );
}
```

## Performance Considerations

### Caching Translated Content

```typescript
// lib/cache.ts
const CACHE_TTL = 60 * 60 * 1000; // 1 hour
const cache = new Map<string, { data: any, expires: number }>();

export function getCached<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;
  if (item.expires < Date.now()) {
    cache.delete(key);
    return null;
  }
  return item.data as T;
}

export function setCached<T>(key: string, data: T, ttl = CACHE_TTL): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  });
}

// Usage in API
export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'en';

  const cacheKey = `countries:${locale}`;
  const cached = getCached(cacheKey);
  if (cached) return Response.json(cached);

  // Database query...
  const data = await fetchData();

  setCached(cacheKey, data);
  return Response.json(data);
}
```

### Database Indexing

Proper indexing is crucial for multilingual data:

```typescript
// Example indexes for translation tables
export const productTranslation = sqliteTable("product_translation", {
  // Fields...
}, (table) => ({
  // Index for querying by product and locale
  productLocaleIdx: index("product_locale_idx").on(table.productId, table.locale),
  // Full-text search index if supported
  nameSearchIdx: index("name_search_idx").on(table.name),
}));
```

### Loading Translations on Demand

For large applications, load translations by module:

```typescript
// lib/load-module-translations.ts
const loadedModules: Record<string, Record<string, any>> = {};

export async function loadTranslation(locale: string, module: string) {
  const cacheKey = `${locale}:${module}`;

  if (!loadedModules[cacheKey]) {
    const translation = await import(`../messages/${locale}/${module}.json`);
    loadedModules[cacheKey] = translation.default;
  }

  return loadedModules[cacheKey];
}
```

By implementing these strategies, you can effectively manage multilingual dynamic data in your Next.js application, providing a seamless experience for users across different languages.
