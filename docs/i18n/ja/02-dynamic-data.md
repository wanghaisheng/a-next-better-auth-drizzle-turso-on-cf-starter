# 多言語動的データ処理

このガイドでは、Next.jsアプリケーションにおける多言語動的データの処理戦略について説明し、データベース設計、コンテンツの取得、および複数言語でのコンテンツ表示に焦点を当てます。

## 翻訳可能なコンテンツの種類

多言語アプリケーションには、主に2種類のコンテンツがあります：

1. **静的UIラベル** - 翻訳ファイル（JSON）を通じて管理されるインターフェーステキスト
2. **動的データ** - データベースに保存されるユーザー生成コンテンツとアプリケーションデータ

このガイドでは、2番目のタイプに焦点を当てます：複数の言語で動的データを保存、取得、表示する方法です。

## データベース設計戦略

多言語コンテンツをデータベースに保存するための主な3つのアプローチがあります：

### 1. マルチカラム戦略

各言語に対して別々のカラムを作成します：

```typescript
// Drizzle ORMの例
export const product = sqliteTable("product", {
  id: text("id").primaryKey(),
  imageUrl: text("image_url"),
  price: real("price"),
  // 多言語フィールド
  nameEn: text("name_en").notNull(),
  nameZh: text("name_zh"),
  nameJa: text("name_ja"),
  descriptionEn: text("description_en").notNull(),
  descriptionZh: text("description_zh"),
  descriptionJa: text("description_ja"),
  // メタデータ
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

**長所**：
- シンプルなクエリ
- SEO最適化コンテンツに適している
- 明確なスキーマ

**短所**：
- 新しい言語のためにスキーマ変更が必要
- 言語が増えるとカラムが増加

### 2. JSONフィールド戦略

翻訳をJSONフィールドに保存します：

```typescript
// データベースモデル
export const article = sqliteTable("article", {
  id: text("id").primaryKey(),
  // 翻訳用のJSONフィールド
  title: text("title", { mode: "json" }).notNull(), // {"en": "Title", "zh": "标题", "ja": "タイトル"}
  content: text("content", { mode: "json" }).notNull(),
  // その他のフィールド
  authorId: text("author_id").notNull(),
  publishedAt: integer("published_at", { mode: "timestamp" }),
});
```

**長所**：
- 柔軟なスキーマ
- 新しい言語のための変更が不要
- コンパクトな設計

**短所**：
- より複雑なクエリ
- 一部のデータベースではJSONサポートが限られている

### 3. 関連テーブル戦略

専用の翻訳テーブルを作成します：

```typescript
// メインテーブル
export const category = sqliteTable("category", {
  id: text("id").primaryKey(),
  code: text("code").notNull().unique(),
  // 翻訳不要のフィールド
  iconUrl: text("icon_url"),
  sortOrder: integer("sort_order").notNull(),
});

// 翻訳テーブル
export const categoryTranslation = sqliteTable("category_translation", {
  id: text("id").primaryKey(),
  categoryId: text("category_id").notNull()
    .references(() => category.id, { onDelete: "cascade" }),
  locale: text("locale").notNull(), // 'en', 'zh', 'ja'
  name: text("name").notNull(),
  description: text("description"),
  // 複合ユニーク制約
  // カテゴリごとに言語ごとに1つの翻訳
}, (