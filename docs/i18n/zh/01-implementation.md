# 多语言支持实现指南

本文档详细介绍如何在项目中实现多语言支持，包括安装必要的依赖、配置国际化框架、管理翻译资源以及实现语言切换功能。通过这些步骤，你可以使应用支持多种语言，提升全球用户的使用体验。

## 目录

1. [技术选型与概述](#技术选型与概述)
2. [基础安装与配置](#基础安装与配置)
3. [翻译资源管理](#翻译资源管理)
4. [实现语言切换](#实现语言切换)
5. [服务器组件的国际化](#服务器组件的国际化)
6. [客户端组件的国际化](#客户端组件的国际化)
7. [日期、数字和货币的本地化](#日期数字和货币的本地化)
8. [最佳实践与性能优化](#最佳实践与性能优化)

## 技术选型与概述

本项目使用 [next-intl](https://next-intl-docs.vercel.app/) 作为主要的国际化解决方案，它专为 Next.js 应用设计，提供了对 App Router 的完整支持，以及服务器组件和客户端组件的统一 API。

主要优势：

- 与 Next.js App Router 深度集成
- 支持服务器组件和客户端组件
- 自动路由国际化
- 高性能，支持按需加载翻译
- TypeScript 支持，提供类型安全
- 支持复数、日期、数字和货币格式化

## 基础安装与配置

### 1. 安装依赖

首先，安装必要的依赖：

```bash
bun add next-intl
```

### 2. 项目结构调整

为支持国际化路由，需要调整项目结构。创建一个专门的国际化目录结构：

```
app/
  [locale]/       # 动态语言段路径
    (auth)/       # 路由组保持不变
      login/
      sign-up/
    dashboard/
    page.tsx      # 首页
  api/            # API 路由（不受语言参数影响）
messages/         # 翻译资源文件
  en.json         # 英文翻译
  zh.json         # 中文翻译
  ja.json         # 日文翻译
  # 其他语言...
middleware.ts     # 国际化中间件
i18n-config.ts    # 国际化配置
```

### 3. 创建国际化配置文件

创建 `i18n-config.ts` 文件：

```typescript
// i18n-config.ts
export const defaultLocale = 'en';

export const locales = ['en', 'zh', 'ja'] as const;

export type Locale = (typeof locales)[number];

export function isValidLocale(locale: string): locale is Locale {
  return locales.includes(locale as Locale);
}

// 语言标签映射到语言名称
export const localeNames: Record<Locale, string> = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

// 可选：定义语言方向（用于RTL语言如阿拉伯语）
export const localeDirections: Record<Locale, 'ltr' | 'rtl'> = {
  en: 'ltr',
  zh: 'ltr',
  ja: 'ltr',
  // 如添加阿拉伯语: ar: 'rtl'
};
```

### 4. 设置国际化中间件

创建或更新 `middleware.ts` 文件：

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './i18n-config';

// 创建国际化中间件
export default createMiddleware({
  // 支持的语言列表
  locales,
  // 默认语言
  defaultLocale,
  // 可选：如果路径中没有语言标识，使用此函数确定默认语言
  localeDetection: true,
  // 可选：如果你想在cookie中存储语言偏好
  localePrefix: 'as-needed',
});

// 中间件只应用于包含语言标识的路由，而不是API或其他特殊路由
export const config = {
  // 匹配所有路径，除了 /api/、/_next/、/public/ 和静态文件
  matcher: ['/((?!api|_next|.*\\..*).*)']
};
```

### 5. 创建翻译文件

在 `messages` 目录中创建基本的翻译文件：

```json
// messages/en.json
{
  "common": {
    "welcome": "Welcome to our application",
    "language": "Language",
    "theme": "Theme",
    "dark": "Dark",
    "light": "Light",
    "system": "System"
  },
  "auth": {
    "login": "Log in",
    "signup": "Sign up",
    "logout": "Log out",
    "email": "Email",
    "password": "Password",
    "forgotPassword": "Forgot password?",
    "resetPassword": "Reset password",
    "verifyEmail": "Verify email"
  },
  "dashboard": {
    "title": "Dashboard",
    "welcome": "Welcome, {name}",
    "stats": "Your stats"
  },
  "errors": {
    "required": "{field} is required",
    "invalidEmail": "Invalid email address",
    "passwordLength": "Password must be at least {length} characters"
  }
}
```

```json
// messages/zh.json
{
  "common": {
    "welcome": "欢迎使用我们的应用",
    "language": "语言",
    "theme": "主题",
    "dark": "深色",
    "light": "浅色",
    "system": "系统默认"
  },
  "auth": {
    "login": "登录",
    "signup": "注册",
    "logout": "退出登录",
    "email": "电子邮箱",
    "password": "密码",
    "forgotPassword": "忘记密码？",
    "resetPassword": "重置密码",
    "verifyEmail": "验证邮箱"
  },
  "dashboard": {
    "title": "控制面板",
    "welcome": "欢迎，{name}",
    "stats": "你的统计数据"
  },
  "errors": {
    "required": "{field}为必填项",
    "invalidEmail": "无效的电子邮箱地址",
    "passwordLength": "密码长度必须至少为{length}个字符"
  }
}
```

### 6. 配置根布局

更新应用根布局以支持不同语言：

```tsx
// app/[locale]/layout.tsx
import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { Locale, localeDirections } from '@/i18n-config';
import { getMessages } from '@/lib/get-messages';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

interface RootLayoutProps {
  children: ReactNode;
  params: {
    locale: Locale;
  };
}

export default async function RootLayout({
  children,
  params: { locale },
}: RootLayoutProps) {
  const messages = await getMessages(locale);

  // 获取文档方向（用于RTL语言）
  const direction = localeDirections[locale];

  return (
    <html lang={locale} dir={direction}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        <body className={inter.className}>{children}</body>
      </NextIntlClientProvider>
    </html>
  );
}

// 生成元数据
export function generateMetadata({ params: { locale } }: RootLayoutProps) {
  return {
    title: {
      template: '%s | My App',
      default: 'My App',
    },
    description: 'A multi-language application built with Next.js',
  };
}
```

### 7. 创建翻译加载器函数

创建 `lib/get-messages.ts` 文件：

```typescript
// lib/get-messages.ts
import { Locale } from '@/i18n-config';

// 从消息文件中加载翻译
export async function getMessages(locale: Locale) {
  return (await import(`../messages/${locale}.json`)).default;
}
```

## 翻译资源管理

高效的翻译资源管理对于支持多语言至关重要。本节介绍如何组织、优化和维护翻译资源。

### 1. 结构化翻译文件

建议将翻译按功能模块分组，便于管理和更新：

```json
// 模块化的翻译文件结构示例
{
  "common": { /* 通用元素 */ },
  "auth": { /* 认证相关 */ },
  "dashboard": { /* 控制面板 */ },
  "profile": { /* 用户资料 */ },
  "notification": { /* 通知 */ },
  "errors": { /* 错误消息 */ }
}
```

对于大型应用，也可以进一步拆分翻译文件：

```
messages/
  en/
    common.json
    auth.json
    dashboard.json
  zh/
    common.json
    auth.json
    dashboard.json
```

在这种情况下，需要修改消息加载逻辑：

```typescript
// lib/get-messages.ts
import { Locale } from '@/i18n-config';

export async function getMessages(locale: Locale) {
  const modules = [
    'common',
    'auth',
    'dashboard',
    // 添加其他模块
  ];

  // 加载所有模块并合并
  const messages = {};

  for (const module of modules) {
    const moduleMessages = (await import(`../messages/${locale}/${module}.json`)).default;
    Object.assign(messages, { [module]: moduleMessages });
  }

  return messages;
}
```

### 2. 使用 JSON 模式进行类型检查

为翻译文件创建 JSON 模式，确保所有语言包含相同的翻译键：

```json
// messages/schema.json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["common", "auth", "dashboard", "errors"],
  "properties": {
    "common": {
      "type": "object",
      "required": ["welcome", "language", "theme", "dark", "light", "system"],
      "properties": {
        "welcome": { "type": "string" },
        "language": { "type": "string" },
        "theme": { "type": "string" },
        "dark": { "type": "string" },
        "light": { "type": "string" },
        "system": { "type": "string" }
      }
    },
    // 其他部分...
  }
}
```

在 VS Code 中，可以通过在设置中添加以下配置来启用模式验证：

```json
// .vscode/settings.json
{
  "json.schemas": [
    {
      "fileMatch": ["messages/*.json"],
      "url": "./messages/schema.json"
    }
  ]
}
```

### 3. 生成翻译键类型

为了提供类型安全，可以从翻译文件生成 TypeScript 类型：

```typescript
// scripts/generate-translation-types.ts
import fs from 'fs';
import path from 'path';

// 从消息文件生成类型定义
function generateTypes() {
  const messagesPath = path.resolve('./messages/en.json');
  const messages = JSON.parse(fs.readFileSync(messagesPath, 'utf8'));

  // 递归生成类型
  function generateTypeForObject(obj: any, prefix: string = ''): string {
    const lines: string[] = [];

    Object.entries(obj).forEach(([key, value]) => {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null) {
        // 嵌套对象
        lines.push(generateTypeForObject(value, fullKey));
      } else {
        // 叶子节点，考虑插值参数
        const hasParams = typeof value === 'string' && value.includes('{');
        if (hasParams) {
          // 提取参数名称
          const paramMatches = (value as string).match(/{([^}]+)}/g);
          const params = paramMatches
            ? paramMatches.map(match => match.slice(1, -1))
            : [];

          // 如果有参数，创建带参数的类型
          if (params.length > 0) {
            const paramsType = params
              .map(param => `${param}: string | number`)
              .join(', ');
            lines.push(`"${fullKey}": (params: { ${paramsType} }) => string;`);
          } else {
            lines.push(`"${fullKey}": string;`);
          }
        } else {
          lines.push(`"${fullKey}": string;`);
        }
      }
    });

    return lines.join('\n');
  }

  const content = `
// 由脚本自动生成，不要手动修改
declare namespace I18n {
  interface Messages {
${generateTypeForObject(messages, '')}
  }
}

export default I18n;
`;

  fs.writeFileSync('./types/i18n.d.ts', content);
  console.log('Translation types generated successfully');
}

generateTypes();
```

添加 npm 脚本：

```json
"scripts": {
  // 其他脚本...
  "generate-i18n-types": "tsx scripts/generate-translation-types.ts"
}
```

### 4. 处理复数形式和格式

next-intl 支持复数和格式化，可以这样在翻译文件中使用：

```json
// 复数形式
"itemCount": {
  "one": "You have {count} item",
  "other": "You have {count} items"
},

// 日期格式
"lastLogin": "Last login: {date, date, ::yyyyMMdd}",

// 货币格式
"price": "Price: {amount, number, ::currency/USD}"
```

## 实现语言切换

本节介绍如何实现语言切换功能，包括UI组件和导航逻辑。

### 1. 创建通用链接工具

首先，创建一个工具函数来生成带有语言参数的链接：

```typescript
// lib/navigation.ts
import { createSharedPathnamesNavigation } from 'next-intl/navigation';
import { locales } from '@/i18n-config';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({ locales });
```

### 2. 语言切换组件

创建一个语言切换组件：

```tsx
// components/language-switcher.tsx
'use client';

import { useTransitions, useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/lib/navigation';
import { locales, localeNames, Locale } from '@/i18n-config';
import { useState } from 'react';
import { Check, ChevronDown, Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { isLoading } = useTransitions();

  function handleChange(newLocale: Locale) {
    setOpen(false);
    router.replace(pathname, { locale: newLocale });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={isLoading}
        className="flex items-center gap-1 px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-expanded={open}
      >
        <Globe className="h-4 w-4" />
        <span>{localeNames[locale as Locale]}</span>
        <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-40 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 divide-y divide-gray-100 dark:divide-gray-700 z-50">
          <div className="py-1">
            {locales.map((l) => (
              <button
                key={l}
                onClick={() => handleChange(l)}
                className={`
                  ${l === locale ? 'bg-gray-100 dark:bg-gray-700' : ''}
                  w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-between
                `}
              >
                {localeNames[l]}
                {l === locale && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

### 3. 集成到导航栏

将语言切换器集成到导航栏：

```tsx
// components/navbar.tsx
import { LanguageSwitcher } from './language-switcher';
import { Link } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

export function Navbar() {
  const t = useTranslations('common');

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center">
              {/* 应用 Logo */}
              <span className="font-medium">My App</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            {/* 其他导航项... */}
          </div>
        </div>
      </div>
    </nav>
  );
}
```

### 4. 语言自动检测

要基于用户浏览器首选语言自动设置语言，可以在中间件中增强国际化配置：

```typescript
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from './i18n-config';
import Negotiator from 'negotiator';
import { NextRequest } from 'next/server';

function getLocaleFromHeaders(request: NextRequest) {
  // 创建一个模拟的 headers 对象，因为 Negotiator 需要 headers.get 方法
  const headers = {
    'accept-language': request.headers.get('accept-language') || '',
  };

  // 使用 Negotiator 协商语言
  const languages = new Negotiator({ headers }).languages();

  // 找到支持的第一个语言
  const locale = languages.find((lang) =>
    locales.includes(lang as any)
  );

  return locale || defaultLocale;
}

export default createMiddleware({
  locales,
  defaultLocale,
  // 自定义语言检测
  localeDetection: (request) => {
    const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
    return cookieLocale || getLocaleFromHeaders(request);
  },
});

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'],
};
```

注意：需要安装 `negotiator` 包并添加类型声明：

```bash
bun add negotiator
bun add -d @types/negotiator
```

## 服务器组件的国际化

Next.js 的 App Router 架构中，大多数组件默认是服务器组件。本节介绍如何在服务器组件中实现国际化。

### 1. 使用 `useTranslations` 钩子

在服务器组件中，你可以使用 `useTranslations` 钩子获取翻译：

```tsx
// app/[locale]/page.tsx
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const t = useTranslations('common');

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-bold">{t('welcome')}</h1>
      {/* 其他内容... */}
    </div>
  );
}
```

### 2. 动态值和复数

处理带参数的翻译和复数形式：

```tsx
// app/[locale]/dashboard/page.tsx
import { useTranslations } from 'next-intl';
import { auth } from '@/lib/auth';

export default async function DashboardPage() {
  const t = useTranslations('dashboard');
  const session = await auth.getSession();
  const userName = session?.user?.name || 'Guest';

  const stats = {
    itemCount: 5,
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">{t('title')}</h1>

      {/* 带参数的翻译 */}
      <p className="mb-4">{t('welcome', { name: userName })}</p>

      {/* 使用复数 */}
      <p>{t('itemCount', { count: stats.itemCount })}</p>
    </div>
  );
}
```

### 3. 动态元数据

使用翻译生成动态元数据：

```tsx
// app/[locale]/dashboard/page.tsx
import { useTranslations } from 'next-intl';

// 为页面生成元数据
export function generateMetadata({ params: { locale } }) {
  // 你可以直接使用 useTranslations，
  // 不需要构建复杂的非标准页面架构
  const t = useTranslations('dashboard');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function DashboardPage() {
  // 页面内容...
}
```

### 4. 翻译路由级别文本

要在 `/not-found` 或 `/error` 路由中使用翻译：

```tsx
// app/[locale]/not-found.tsx
import { useTranslations } from 'next-intl';
import { Link } from '@/lib/navigation';

export default function NotFound() {
  const t = useTranslations('errors');

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-4">{t('notFoundTitle')}</h1>
      <p className="mb-8">{t('notFoundDescription')}</p>
      <Link href="/" className="text-blue-600 underline hover:text-blue-800">
        {t('backToHome')}
      </Link>
    </div>
  );
}
```

## 客户端组件的国际化

对于需要客户端交互的组件，我们可以在客户端使用国际化功能。本节介绍客户端组件的国际化技术。

### 1. 基本用法

在客户端组件中使用 `useTranslations` 钩子：

```tsx
// components/login-form.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function LoginForm() {
  const t = useTranslations('auth');
  const tErrors = useTranslations('errors');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function validateForm() {
    if (!email) {
      return tErrors('required', { field: t('email') });
    }
    if (!password) {
      return tErrors('required', { field: t('password') });
    }
    return null;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const error = validateForm();
    if (error) {
      // 处理错误...
      return;
    }
    // 提交登录...
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium">{t('email')}</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">{t('password')}</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        />
      </div>

      <div className="text-right">
        <a href="#" className="text-sm text-blue-600 hover:underline">
          {t('forgotPassword')}
        </a>
      </div>

      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        {t('login')}
      </button>
    </form>
  );
}
```

### 2. 处理动态内容

处理带格式的动态内容：

```tsx
// components/profile-stats.tsx
'use client';

import { useTranslations, useFormatter } from 'next-intl';

interface ProfileStatsProps {
  joinDate: Date;
  lastLogin: Date;
  postCount: number;
}

export function ProfileStats({ joinDate, lastLogin, postCount }: ProfileStatsProps) {
  const t = useTranslations('profile');
  const format = useFormatter();

  return (
    <div className="space-y-2">
      <p>{t('memberSince', {
        date: format.dateTime(joinDate, { dateStyle: 'long' })
      })}</p>

      <p>{t('lastSeen', {
        date: format.relativeTime(lastLogin, new Date())
      })}</p>

      <p>{t('postCount', { count: postCount })}</p>
    </div>
  );
}
```

### 3. 使用 `useFormatter` 钩子

`useFormatter` 钩子提供了格式化数字、日期和列表的函数：

```tsx
// components/price-display.tsx
'use client';

import { useFormatter } from 'next-intl';

interface PriceDisplayProps {
  amount: number;
  currency: string;
}

export function PriceDisplay({ amount, currency }: PriceDisplayProps) {
  const format = useFormatter();

  return (
    <span className="font-medium">
      {format.number(amount, {
        style: 'currency',
        currency,
      })}
    </span>
  );
}
```

### 4. 客户端导航与语言切换

使用 `useRouter` 和 `usePathname` 钩子来实现客户端导航，同时保留当前语言：

```tsx
// components/navigation-menu.tsx
'use client';

import { usePathname, useRouter } from '@/lib/navigation';
import { useTranslations } from 'next-intl';

export function NavigationMenu() {
  const t = useTranslations('navigation');
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { key: 'home', path: '/', label: t('home') },
    { key: 'dashboard', path: '/dashboard', label: t('dashboard') },
    { key: 'profile', path: '/profile', label: t('profile') },
    { key: 'settings', path: '/settings', label: t('settings') },
  ];

  return (
    <nav className="space-x-4">
      {menuItems.map((item) => (
        <button
          key={item.key}
          onClick={() => router.push(item.path)}
          className={`px-3 py-2 rounded-md ${
            pathname === item.path
              ? 'bg-blue-100 text-blue-800'
              : 'hover:bg-gray-100'
          }`}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
```
