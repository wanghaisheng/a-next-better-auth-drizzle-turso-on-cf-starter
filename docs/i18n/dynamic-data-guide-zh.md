# 多语言动态数据处理指南

在多语言应用中，需要处理两种类型的可翻译内容：
1. **静态UI标签** - 通过翻译文件（如JSON）管理的界面文本
2. **动态数据** - 存储在数据库中的用户输入和应用数据

本文档重点介绍如何处理动态数据的国际化需求，并与数据库进行有效集成。

## 目录

1. [动态数据国际化策略](#动态数据国际化策略)
2. [数据库设计与多语言支持](#数据库设计与多语言支持)
3. [选项和枚举值的处理](#选项和枚举值的处理)
4. [用户生成内容的处理](#用户生成内容的处理)
5. [实际示例](#实际示例)
6. [性能优化考虑](#性能优化考虑)

## 动态数据国际化策略

处理动态数据的国际化主要有三种策略，默认情况使用多列存储策略：

### 1. 多列存储策略

对于必须以多语言存储的数据，为每种语言创建单独的列：

```typescript
// 数据库模型（以Drizzle为例）
export const product = sqliteTable("product", {
  id: text("id").primaryKey(),
  imageUrl: text("image_url"),
  price: real("price"),
  // 多语言字段
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  nameJa: text("name_ja"),
  descriptionEn: text("description_en").notNull(),
  descriptionZh: text("description_zh"),
  descriptionJa: text("description_ja"),
  // 元数据
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

**优点**：
- 查询简单高效
- 适合需要多语言SEO的内容

**缺点**：
- 随语言增加需要修改表结构
- 字段数量增长

### 2. JSON字段存储策略

使用JSON字段存储多语言内容：

```typescript
// 数据库模型
export const article = sqliteTable("article", {
  id: text("id").primaryKey(),
  // JSON字段存储翻译
  title: text("title", { mode: "json" }).notNull(), // {"en": "Title", "zh": "标题"}
  content: text("content", { mode: "json" }).notNull(),
  // 其他字段
  authorId: text("author_id").notNull(),
  publishedAt: integer("published_at", { mode: "timestamp" }),
});
```

**优点**：
- 表结构简洁
- 添加新语言不需要修改表结构

**缺点**：
- 查询复杂度增加
- 某些数据库可能不支持高效的JSON查询

### 3. 关联表策略

创建专门的翻译表，通过外键关联主实体：

```typescript
// 主表
export const category = sqliteTable("category", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  // 非语言相关字段
  iconUrl: text("icon_url"),
  sortOrder: integer("sort_order").notNull(),
});

// 翻译表
export const categoryTranslation = sqliteTable("category_translation", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").notNull()
    .references(() => category.id, { onDelete: "cascade" }),
  locale: text("locale").notNull(), // 'en', 'zh', 'ja'
  name: text("name").notNull(),
  description: text("description"),
  // 复合唯一约束
  // 每个类别的每种语言只能有一个翻译
}, (table) => ({
  uniqueIdx: uniqueIndex("cat_trans_unique_idx").on(table.categoryId, table.locale),
}));
```

**优点**：
- 结构清晰，符合关系数据库范式
- 支持无限语言而不需修改主表
- 可以高效查询特定语言的所有内容

**缺点**：
- 查询时需要联表
- 需要更多的外键约束和索引管理

## 数据库设计与多语言支持

### 选择正确的策略

以下是选择策略的指导原则：

1. **多列策略**适用于：
   - 支持的语言数量固定且有限
   - 需要频繁按不同语言过滤和排序的数据
   - 几乎所有记录都需要多语言支持

2. **JSON策略**适用于：
   - 需要灵活性，语言可能随时增减
   - 数据库支持JSON查询
   - 通常一次只检索一种语言的数据

3. **关联表策略**适用于：
   - 需要完全范式化设计
   - 不是所有记录都需要所有语言的翻译
   - 需要单独管理和更新翻译内容

### 默认语言和回退机制

无论采用哪种策略，都应实现默认语言和回退机制：

```typescript
// 辅助函数示例
export function getTranslatedField<T>(
  entity: { [key: string]: any },
  fieldName: string,
  locale: string,
  defaultLocale: string = 'en'
): T | null {
  // 多列策略
  if (`${fieldName}${locale.toUpperCase()}` in entity) {
    return entity[`${fieldName}${locale.toUpperCase()}`] || entity[`${fieldName}${defaultLocale.toUpperCase()}`];
  }

  // JSON策略
  if (typeof entity[fieldName] === 'object') {
    return entity[fieldName][locale] || entity[fieldName][defaultLocale] || null;
  }

  // 关联表策略由查询时处理

  return null;
}
```

## 选项和枚举值的处理

### 选项列表与下拉框

对于性别、国家、类别等选项列表，有两种主要处理方法：

#### 1. 代码+翻译分离

```typescript
// 数据库模型
export const gender = sqliteTable("gender", {
  code: text("code").primaryKey(), // 'male', 'female', 'other'
  // 可选：添加排序字段等
});

export const genderTranslation = sqliteTable("gender_translation", {
  id: text("id").primaryKey(),
  genderCode: text("gender_code").notNull()
    .references(() => gender.code, { onDelete: "cascade" }),
  locale: text("locale").notNull(),
  label: text("label").notNull(), // 'Male', '男性', etc.
}, (table) => ({
  uniqueIdx: uniqueIndex("gender_trans_unique_idx").on(table.genderCode, table.locale),
}));

// 用户表只存储代码
export const userProfile = sqliteTable("user_profile", {
  // ...其他字段
  genderCode: text("gender_code").references(() => gender.code),
});
```

前端实现：

```tsx
// components/gender-select.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

interface Gender {
  code: string;
  label: string;
}

interface GenderSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function GenderSelect({ value, onChange }: GenderSelectProps) {
  const [options, setOptions] = useState<Gender[]>([]);
  const t = useTranslations('common');

  useEffect(() => {
    // 从API获取翻译好的性别选项
    fetch('/api/options/genders')
      .then(res => res.json())
      .then(data => setOptions(data));
  }, []);

  if (options.length === 0) {
    return <div>{t('loading')}...</div>;
  }

  return (
    <div>
      <label className="block text-sm font-medium">{t('gender')}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
      >
        <option value="">{t('pleaseSelect')}</option>
        {options.map((option) => (
          <option key={option.code} value={option.code}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
```

API端点实现：

```typescript
// app/api/options/genders/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { gender, genderTranslation } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: Request) {
  const url = new URL(request.url);
  // 从查询参数或Cookie获取语言
  const locale = url.searchParams.get('locale') || 'en';

  // 查询特定语言的性别选项
  const genders = await db
    .select({
      code: gender.code,
      label: genderTranslation.label,
    })
    .from(gender)
    .leftJoin(
      genderTranslation,
      eq(gender.code, genderTranslation.genderCode)
    )
    .where(eq(genderTranslation.locale, locale));

  return NextResponse.json(genders);
}
```

#### 2. 使用翻译键策略

更简单的方法是在数据库中只存储键，然后在前端使用翻译文件处理：

```typescript
// 用户表
export const userProfile = sqliteTable("user_profile", {
  // ...其他字段
  genderKey: text("gender_key"), // 'male', 'female', 'other'
});
```

翻译文件包含选项映射：

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

// messages/zh.json
{
  "gender": {
    "label": "性别",
    "options": {
      "male": "男",
      "female": "女",
      "other": "其他"
    }
  }
}
```

组件实现：

```tsx
// components/gender-select.tsx
'use client';

import { useTranslations } from 'next-intl';

interface GenderSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export function GenderSelect({ value, onChange }: GenderSelectProps) {
  const t = useTranslations('gender');

  // 预定义的选项键
  const options = ['male', 'female', 'other'];

  return (
    <div>
      <label className="block text-sm font-medium">{t('label')}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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

## 用户生成内容的处理

### 多语言用户输入

对于博客文章、产品描述等用户生成内容，可提供多语言输入界面：

```tsx
// components/multi-language-editor.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Tab } from '@/components/ui/tab';
import { locales, localeNames, Locale } from '@/i18n-config';

interface MultiLanguageEditorProps {
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  label: string;
  required?: boolean;
}

export function MultiLanguageEditor({
  values = {},
  onChange,
  label,
  required = false,
}: MultiLanguageEditorProps) {
  const t = useTranslations('common');
  const [activeTab, setActiveTab] = useState<Locale>('en');

  function handleChange(locale: Locale, value: string) {
    onChange({
      ...values,
      [locale]: value,
    });
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="border rounded-md">
        <div className="flex border-b">
          {locales.map((locale) => (
            <Tab
              key={locale}
              active={activeTab === locale}
              onClick={() => setActiveTab(locale)}
            >
              {localeNames[locale]}
            </Tab>
          ))}
        </div>

        <div className="p-4">
          <textarea
            value={values[activeTab] || ''}
            onChange={(e) => handleChange(activeTab, e.target.value)}
            className="w-full min-h-[150px] rounded-md border-gray-300"
            placeholder={t('enterTextIn', { language: localeNames[activeTab] })}
          />

          {required && activeTab === 'en' && !values['en'] && (
            <p className="text-sm text-red-500 mt-1">
              {t('englishVersionRequired')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
```

使用示例：

```tsx
// 在表单中使用
const [productData, setProductData] = useState({
  names: { en: '', zh: '' },
  descriptions: { en: '', zh: '' },
});

return (
  <form>
    <MultiLanguageEditor
      label={t('productName')}
      values={productData.names}
      onChange={(names) => setProductData({ ...productData, names })}
      required
    />

    <MultiLanguageEditor
      label={t('productDescription')}
      values={productData.descriptions}
      onChange={(descriptions) => setProductData({ ...productData, descriptions })}
    />

    {/* 其他表单字段 */}
  </form>
);
```

### 自动翻译集成

对于用户生成内容，可以集成自动翻译功能：

```tsx
// components/multi-language-editor-with-translation.tsx
'use client';

import { MultiLanguageEditor } from './multi-language-editor';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { locales, Locale } from '@/i18n-config';

interface Props {
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  label: string;
}

export function MultiLanguageEditorWithTranslation(props: Props) {
  const t = useTranslations('common');
  const [translating, setTranslating] = useState(false);

  async function handleAutoTranslate() {
    const sourceLocale = 'en';
    const sourceText = props.values[sourceLocale];

    if (!sourceText) {
      alert(t('pleaseEnterSourceText'));
      return;
    }

    setTranslating(true);

    try {
      const translations = await Promise.all(
        locales
          .filter(locale => locale !== sourceLocale && !props.values[locale])
          .map(async (targetLocale) => {
            const response = await fetch('/api/translate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: sourceText,
                sourceLocale,
                targetLocale,
              }),
            });

            const data = await response.json();
            return { locale: targetLocale, text: data.translation };
          })
      );

      const newValues = { ...props.values };
      translations.forEach(({ locale, text }) => {
        newValues[locale] = text;
      });

      props.onChange(newValues);
    } catch (error) {
      console.error('Translation error:', error);
      alert(t('translationError'));
    } finally {
      setTranslating(false);
    }
  }

  return (
    <div className="space-y-2">
      <MultiLanguageEditor {...props} />

      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAutoTranslate}
          disabled={translating || !props.values['en']}
        >
          {translating ? t('translating') : t('autoTranslate')}
        </Button>
      </div>
    </div>
  );
}
```

## 实际示例

### 完整的多语言产品表单

以下是一个完整的多语言产品创建表单示例：

```tsx
// app/[locale]/admin/products/new/page.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { MultiLanguageEditor } from '@/components/multi-language-editor';
import { CategorySelect } from '@/components/category-select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/lib/navigation';

export default function NewProductPage() {
  const t = useTranslations('products');
  const router = useRouter();

  const [formData, setFormData] = useState({
    names: { en: '' },
    descriptions: { en: '' },
    price: '',
    categoryCode: '',
    sku: '',
  });

  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create product');
      }

      const product = await response.json();
      router.push(`/admin/products/${product.id}`);
    } catch (error) {
      console.error('Error creating product:', error);
      // 显示错误消息
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">{t('createNewProduct')}</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 多语言字段 */}
          <div className="md:col-span-2">
            <MultiLanguageEditor
              label={t('productName')}
              values={formData.names}
              onChange={(names) => setFormData({ ...formData, names })}
              required
            />
          </div>

          <div className="md:col-span-2">
            <MultiLanguageEditor
              label={t('productDescription')}
              values={formData.descriptions}
              onChange={(descriptions) => setFormData({ ...formData, descriptions })}
            />
          </div>

          {/* 非语言相关字段 */}
          <div>
            <label className="block text-sm font-medium">{t('price')}</label>
            <Input
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">{t('sku')}</label>
            <Input
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>

          <div>
            <CategorySelect
              value={formData.categoryCode}
              onChange={(categoryCode) => setFormData({ ...formData, categoryCode })}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="outline"
            className="mr-2"
            onClick={() => router.back()}
          >
            {t('cancel')}
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? t('saving') : t('save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
```

### 查询和显示多语言内容

```tsx
// app/[locale]/products/[id]/page.tsx
import { notFound } from 'next/navigation';
import { db } from '@/db';
import { product } from '@/db/schema';
import { eq } from 'drizzle-orm';

interface ProductPageProps {
  params: {
    id: string;
    locale: string;
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id, locale } = params;

  // 获取产品数据
  const [productData] = await db
    .select()
    .from(product)
    .where(eq(product.id, id));

  if (!productData) {
    notFound();
  }

  // 从JSON字段提取当前语言内容，回退到英文
  const productName = productData.name[locale] || productData.name['en'];
  const productDescription = productData.description[locale] || productData.description['en'];

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{productName}</h1>
      <div className="prose max-w-full">
        <p>{productDescription}</p>
      </div>
      <div className="mt-4 text-xl font-semibold">
        ${productData.price.toFixed(2)}
      </div>
    </div>
  );
}
```

## 性能优化考虑

### 缓存策略

对于频繁访问的多语言内容，特别是下拉选项和枚举值，实施缓存策略：

```typescript
// lib/cache.ts
const CACHE_TTL = 60 * 60 * 1000; // 1小时
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
```

在API中使用：

```typescript
// app/api/options/countries/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { getCached, setCached } from '@/lib/cache';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const locale = url.searchParams.get('locale') || 'en';

  const cacheKey = `countries:${locale}`;
  const cached = getCached(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  // 数据库查询...
  const countries = await fetchCountriesFromDb(locale);

  setCached(cacheKey, countries);
  return NextResponse.json(countries);
}
```

### 懒加载翻译数据

对于大型应用，可以按需加载特定模块的翻译：

```typescript
// lib/translations.ts
import { Locale } from '@/i18n-config';

const loadedModules: Record<string, Record<string, any>> = {};

export async function loadTranslation(locale: Locale, module: string) {
  const cacheKey = `${locale}:${module}`;

  if (!loadedModules[cacheKey]) {
    const translation = await import(`../messages/${locale}/${module}.json`);
    loadedModules[cacheKey] = translation.default;
  }

  return loadedModules[cacheKey];
}
```

### 索引优化

对多语言表和字段添加适当的索引：

```typescript
// 例如，为翻译表添加索引
export const productTranslation = sqliteTable("product_translation", {
  // 字段定义...
}, (table) => ({
  // 为查询创建索引
  productLocaleIdx: index("product_locale_idx").on(table.productId, table.locale),
  // 全文搜索索引（如果数据库支持）
  nameSearchIdx: index("name_search_idx").on(table.name),
}));
```

通过这些策略和实践，你可以有效地管理多语言应用中的动态数据，同时保持良好的性能和用户体验。根据你的具体需求，可以选择最适合的数据存储和访问模式。
