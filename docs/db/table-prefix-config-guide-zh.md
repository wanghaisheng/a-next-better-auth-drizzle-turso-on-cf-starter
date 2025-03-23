# 数据库表名前缀配置指南

本文档详细说明如何配置数据库表名以使用项目前缀，这对于在共享数据库或多项目环境中工作特别有用。通过使用前缀，可以避免表名冲突并更容易识别属于特定项目的表。

## 目录
1. [配置概述](#配置概述)
2. [基础实现](#基础实现)
3. [Drizzle ORM配置](#drizzle-orm配置)
4. [匹配现有表结构](#匹配现有表结构)
5. [迁移步骤](#迁移步骤)
6. [最佳实践](#最佳实践)

## 配置概述

项目使用环境变量来确定表名前缀。具体来说，我们使用`.env`文件中的`PROJECT_NAME`变量来自动为所有表名添加前缀。例如，如果`PROJECT_NAME=example`，则表`user`将变为`example_user`。

## 基础实现

### 1. 设置环境变量

首先，在`.env`文件中添加项目名称：

```bash
# .env
PROJECT_NAME=example
TURSO_URL=libsql://your-database-url
TURSO_AUTH_TOKEN=your-token
# 其他环境变量...
```

确保将此环境变量添加到所有环境中（开发、测试、生产）。

### 2. 创建表名生成函数

创建一个工具函数来生成带前缀的表名：

```typescript
// db/utils.ts
export function getTableName(baseName: string): string {
  const prefix = process.env.PROJECT_NAME || '';
  return prefix ? `${prefix}_${baseName}` : baseName;
}
```

## Drizzle ORM配置

### 1. 修改数据库架构定义

更新`db/auth.ts`文件，使用表名生成函数：

```typescript
// db/auth.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { getTableName } from "./utils";

// 用户表 - 使用前缀
export const user = sqliteTable(getTableName("user"), {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// 会话表 - 使用前缀
export const session = sqliteTable(getTableName("session"), {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

// 账户表 - 使用前缀
export const account = sqliteTable(getTableName("account"), {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  // 其他字段...
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// 验证表 - 使用前缀
export const verification = sqliteTable(getTableName("verification"), {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
```

### 2. 更新better-auth配置

修改`lib/auth.ts`中的配置，确保better-auth知道如何处理带前缀的表名：

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { account, db, session, user, verification } from "../db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { account, session, user, verification },
    // 无需特殊配置，Drizzle会使用sqliteTable中定义的表名
  }),
  // 其他配置...
});
```

## 匹配现有表结构

如果你需要连接到具有现有表结构的数据库，并且这些表已经有前缀，你可以直接使用这些名称：

```typescript
// db/auth.ts - 直接匹配现有表名
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

const tablePrefix = "example_"; // 已确定的前缀

export const user = sqliteTable(`${tablePrefix}user`, {
  // 表字段...
});

export const session = sqliteTable(`${tablePrefix}session`, {
  // 表字段...
});

// 其他表...
```

## 迁移步骤

如果你正在向现有项目添加表名前缀，请按照以下步骤进行迁移：

### 1. 创建新的迁移文件

使用Drizzle Kit生成包含表名更改的迁移文件：

```bash
# 更新环境变量后生成迁移
PROJECT_NAME=example npx drizzle-kit generate:sqlite
```

这将在`db/migrations`目录中创建新的迁移文件。

### 2. 审查迁移脚本

检查生成的迁移文件，确保其中包含：
- 创建新的前缀表
- 将数据从旧表复制到新表
- 删除旧表（如果需要）

你可能需要手动调整迁移脚本，特别是对于数据复制部分：

```sql
-- 示例迁移脚本修改 (db/migrations/xxxx_add_prefixes.sql)
-- 1. 创建新表
CREATE TABLE "example_user" (
  -- 列定义...
);

-- 2. 复制数据
INSERT INTO "example_user"
SELECT * FROM "user";

-- 3. 删除旧表（谨慎操作！）
DROP TABLE "user";

-- 对其他表重复相同操作...
```

### 3. 应用迁移

执行迁移将更改应用到数据库：

```bash
# 本地开发环境
npx drizzle-kit migrate:sqlite

# 生产环境 (确保设置了正确的环境变量)
TURSO_URL=your-prod-url TURSO_AUTH_TOKEN=your-token npx drizzle-kit migrate:sqlite
```

### 4. 更新代码引用

确保代码中的所有查询都使用新的表引用。由于我们在ORM层面处理前缀，大多数代码不需要更改，但任何硬编码SQL查询需要更新。

## 最佳实践

### 1. 在本地开发环境使用相同前缀

即使在本地开发环境，也应使用相同的表名前缀策略，以确保开发与生产环境一致：

```bash
# .env.local
PROJECT_NAME=example
# 其他本地环境变量...
```

### 2. 在持续集成中包括前缀

确保CI/CD流程和测试环境也设置了正确的`PROJECT_NAME`变量：

```yaml
# GitHub Actions 示例
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # ...
      - name: Run tests
        env:
          PROJECT_NAME: example_test
          # 其他环境变量...
        run: npm test
```

### 3. 处理多环境场景

对于多环境部署，可以考虑在前缀中包含环境标识：

```bash
# 开发环境
PROJECT_NAME=example_dev

# 测试环境
PROJECT_NAME=example_test

# 生产环境
PROJECT_NAME=example
```

### 4. 记录表名映射

为了便于参考，可以在项目文档中维护一个表名映射：

| 基础表名 | 带前缀表名 (example) | 用途 |
|---------|-----------------|------|
| user | example_user | 存储用户基本信息 |
| session | example_session | 管理用户会话 |
| account | example_account | 管理认证账户 |
| verification | example_verification | 存储验证令牌 |
| profile | example_profile | 用户个人资料 (如果添加) |

通过遵循本指南，你可以为数据库表名添加项目前缀，使你的数据库架构更有组织性，并避免在共享数据库环境中的表名冲突。此配置对于多租户应用或需要在同一数据库中支持多个相关项目的情况特别有用。
