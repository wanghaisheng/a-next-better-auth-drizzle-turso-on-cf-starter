# Internationalization (i18n) Documentation

This directory contains comprehensive documentation for the internationalization (i18n) implementation in the Next Better Auth project. Documentation is available in multiple languages.

## Documentation Structure

### English Documentation

- **[Implementation Guide](./en/01-implementation.md)** - Complete guide to the i18n implementation
- **[Dynamic Data Handling](./en/02-dynamic-data.md)** - How to handle multilingual database content
- **[Hydration Troubleshooting](./en/03-hydration.md)** - Guide to resolving React hydration issues with i18n

### Chinese Documentation (中文文档)

- **[多语言支持实现指南](./zh/01-implementation.md)** - 完整的多语言实现指南
- **[多语言动态数据处理指南](./zh/02-dynamic-data.md)** - 如何处理多语言数据库内容

### Japanese Documentation (日本語ドキュメント)

- **[国際化（i18n）実装ガイド](./ja/01-implementation.md)** - i18n実装の完全ガイド
- **[多言語動的データ処理](./ja/02-dynamic-data.md)** - 多言語データベースコンテンツの処理方法
- **[ハイドレーション問題の回避](./ja/03-hydration.md)** - i18nでのReactハイドレーション問題解決ガイド

## Key Components

Our i18n implementation consists of:

1. **Routing Configuration** - Path-based locale routing (`/en/login`, `/zh/login`)
2. **Language Detection** - Auto-detection based on browser preferences
3. **Language Switching** - UI component for changing languages
4. **Translation Management** - JSON-based message files
5. **Hydration Handling** - Techniques to avoid React hydration mismatches

## Adding New Languages

To add a new language:

1. Add the locale code to `src/i18n/routing.ts`
2. Create a new translation file in the `messages/` directory
3. Update `localeNames` in the language switcher component

## Documentation Standards

All documentation follows these standards:

- Includes code examples using current project patterns
- Avoids hydration issues by following recommended practices
- Maintains consistency with actual implementations
- Provides explanations for key technical decisions

## When to Use Which Guide

- **New to the project?** Start with the Implementation Guide
- **Working with database content?** Read the Dynamic Data Handling guide
- **Encountering hydration errors?** Check the Hydration Troubleshooting guide

For any questions or to suggest improvements to the documentation, please open an issue or pull request.
