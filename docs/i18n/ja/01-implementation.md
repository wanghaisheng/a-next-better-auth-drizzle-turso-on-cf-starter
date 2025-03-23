# 国際化（i18n）実装ガイド

このドキュメントでは、`next-intl`を使用したNext.js Better Authプロジェクトにおける国際化（i18n）の実装について説明します。

## 概要

私たちは以下を提供する包括的な国際化ソリューションを実装しました：

1. URLパスベースのロケールルーティング（例：`/en/login`、`/zh/login`、`/ja/login`）
2. 言語検出と切り替え
3. UIテキストの翻訳
4. ローカライズされたメタデータによる適切なSEOサポート
5. 静的レンダリングの最適化

## 実装の詳細

### 技術スタック

- **next-intl**: Next.js用のメインi18nライブラリ
- **App Router**: ロケールベースのルーティングを持つNext.js App Router

### ディレクトリ構造

```
messages/
  en.json      # 英語の翻訳
  zh.json      # 中国語の翻訳
  ja.json      # 日本語の翻訳
src/
  i18n/
    request.ts       # リクエスト固有のi18n設定
    routing.ts       # ルーティング設定
    navigation.ts    # ナビゲーションユーティリティ
  middleware.ts      # 言語検出ミドルウェア
app/
  [locale]/          # 動的ロケールセグメント
    layout.tsx       # i18n設定を含むルートレイアウト
    page.tsx         # ホームページ
    (auth)/          # 認証ルートグループ
      login/
      sign-up/
      forgot-password/
      reset-password/
    dashboard/       # ダッシュボードページ
```

### コアコンポーネント

#### 1. ロケール設定

`src/i18n/routing.ts`ファイルはサポートされるロケールを定義します：

```typescript
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
    '/checkout': {
      en: '/checkout',
      zh: '/checkout',
      ja: '/checkout',
    }
  }
});
```

#### 2. ロケール検出のためのミドルウェア

`middleware.ts`ファイルは以下を処理します：
- ブラウザ設定に基づく自動ロケール検出
- ローカライズされたルートへのリダイレクト
- 欠落しているロケールの処理

```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './src/i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|.*\\..*).*)'];
};
```

#### 3. 翻訳リソース

翻訳メッセージは`messages/`ディレクトリのJSONファイルに保存されます：

```javascript
// messages/ja.json の例
{
  "common": {
    "welcome": "アプリケーションへようこそ",
    "language": "言語",
    // ...
  },
  "auth": {
    "login": "ログイン",
    "signup": "サインアップ",
    // ...
  }
}
```

他のサポートされている言語（en.json、zh.json）にも同様のファイルが存在します。

#### 4. 言語スイッチャー

`LanguageSwitcher`コンポーネントにより、ユーザーは現在のパスを保持したまま、サイトの言語を変更できます。

#### 5. 静的レンダリングサポート

`setRequestLocale`関数は、適切なi18nサポートを持つ静的レンダリングを有効にするために、レイアウトとページコンポーネントで使用されます：

```typescript
export default function Page({ params }: { params: { locale: string } }) {
  // 静的レンダリングを有効にする
  setRequestLocale(params.locale);
  
  return (
    <div>
      <h1><FormattedMessage id="page.title" /></h1>
      {/* ... */}
    </div>
  );
}
```

## ハイドレーションの問題を回避する

Next.jsのi18n実装では、サーバーサイドレンダリングとクライアントサイドレンダリングの間でハイドレーションの不一致が発生する可能性があります。これらの問題を回避するためのベストプラクティスを以下に示します：

### 1. 適切なルートレイアウト設定

ルートレイアウトでは、常にロケールを明示的に検証し、メッセージを渡すように設定してください：

```tsx
// app/[locale]/layout.tsx
export default async function RootLayout({
  children,
  params
}) {
  const locale = await Promise.resolve(params.locale);
  
  // ロケールがサポートされていることを検証
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // 静的レンダリングを有効にする
  await setRequestLocale(locale);

  // メッセージを明示的に読み込む
  const messages = await import(`../../messages/${locale}.json`)
    .then(module => module.default)
    .catch(() => {
      console.error(`Could not load messages for locale: ${locale}`);
      // メッセージが読み込めない場合はデフォルトロケールにフォールバック
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

### 2. 一貫したメッセージ読み込み

エラーとフォールバックを処理する堅牢なメッセージ読み込みユーティリティを作成してください：

```tsx
// lib/get-messages.ts
export async function getMessages(locale: string) {
  try {
    // リクエストされたロケールのメッセージを読み込む
    return (await import(`../messages/${locale}.json`)).default;
  } catch (error) {
    console.error(`Could not load messages for locale: ${locale}`, error);

    // デフォルトロケールにフォールバック
    try {
      return (await import(`../messages/${routing.defaultLocale}.json`)).default;
    } catch (fallbackError) {
      console.error(`Failed to load fallback messages`, fallbackError);
      // 最後の手段として空のオブジェクトを返す
      return {};
    }
  }
}
```

### 3. クライアントコンポーネントのベストプラクティス

i18nを使用するクライアントコンポーネントの場合：

#### コンポーネント内で静的データを定義する

```tsx
'use client';

// 一貫性を確保するためにコンポーネント内で静的データを定義
const localeNames = {
  en: 'English',
  zh: '中文',
  ja: '日本語',
};

export function LanguageSwitcher() {
  // ...コンポーネントロジック
}
```

#### 初期レンダリング中に変数入力を避ける

```tsx
'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';

export function DynamicContent() {
  const t = useTranslations('content');
  const [data, setData] = useState(null);
  
  // 初期レンダリング後にのみデータを読み込む
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  // データがない場合はプレースホルダーを表示
  if (!data) return <div>{t('loading')}</div>;
  
  return <div>{t('dynamicContent', { value: data.value })}</div>;
}
```

## 一般的な問題とトラブルシューティング

### 1. ハイドレーションエラー

**症状**: コンソールに「Text content did not match」または「Hydration failed」エラーが表示される。

**解決策**:
- `suppressHydrationWarning`属性をHTMLタグに追加する
- 日付や時間などの非決定論的な値の使用を避ける
- クライアントコンポーネントで`useEffect`を使用して動的コンテンツを読み込む

### 2. 欠落している翻訳

**症状**: 一部のテキストが翻訳されず、キーがそのまま表示される。

**解決策**:
- すべてのロケールファイルに同じキーセットがあることを確認する
- 翻訳キーの大文字と小文字、スペースを確認する
- デフォルト値を提供する: `t('key', 'Default text')`

### 3. ルーティングの問題

**症状**: ロケールが正しく処理されない、または404エラーが発生する。

**解決策**:
- ミドルウェアの設定を確認する
- `matcher`設定が正しいことを確認する
- `Link`コンポーネントを使用する際に`locale`プロパティを正しく設定する

## 新しい言語の追加

新しい言語を追加するには：

1. `src/i18n/routing.ts`にロケールコードを追加する
2. `messages/`ディレクトリに新しい翻訳ファイルを作成する
3. 言語スイッチャーコンポーネントの`localeNames`を更新する

## パフォーマンス最適化

国際化実装のパフォーマンスを最適化するためのヒント：

1. **静的レンダリングを使用する**: `setRequestLocale`を使用して静的レンダリングを有効にする
2. **翻訳の分割**: 大きな翻訳ファイルを機能別に分割する
3. **必要なときだけクライアントコンポーネントを使用する**: 可能な限りサーバーコンポーネントを使用する
4. **キャッシュを活用する**: 翻訳データの取得をキャッシュする