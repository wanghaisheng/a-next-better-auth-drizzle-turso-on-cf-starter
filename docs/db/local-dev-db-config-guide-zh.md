# 本地开发数据库配置指南

本指南详细说明如何在开发环境中设置和使用本地SQLite数据库进行测试，避免依赖线上Turso服务。这对于快速开发、测试和调试非常有用。

## 概述

本项目在生产环境中使用Turso(LibSQL)作为数据库，但在开发环境中可以使用本地SQLite文件作为替代。项目的数据库连接配置已经包含了这种回退机制：

```typescript
// db/index.ts
export const db = drizzle({
  connection: {
    url: process.env.TURSO_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  },
});
```

当`TURSO_URL`环境变量未设置时，系统会默认使用本地的`local.db`文件。

## 设置步骤

### 1. 准备本地开发环境

确保你的开发环境已经设置好所有必要的依赖：

```bash
cd next-better-auth-drizzle-turso-on-cf
bun install
```

### 2. 配置环境变量

创建一个`.env.local`文件以设置本地开发环境变量：

```bash
# .env.local

# 项目名称（用于表名前缀）
PROJECT_NAME=myapp

# 不设置TURSO_URL，这样系统会使用本地数据库
# TURSO_URL=
# TURSO_AUTH_TOKEN=

# 其他必要的环境变量
BETTER_AUTH_URL=http://localhost:3000
VERIFY_EMAIL=false  # 开发中禁用邮件验证可简化测试
```

确保`.env.local`已添加到`.gitignore`中，避免意外提交敏感信息。

### 3. 创建本地数据库

在开发中使用本地SQLite数据库，你需要创建并初始化数据库文件：

```bash
# 创建空的SQLite数据库文件
touch local.db
```

### 4. 运行数据库迁移

使用Drizzle Kit应用数据库迁移，初始化本地数据库架构：

```bash
# 应用所有迁移到本地数据库
npx drizzle-kit migrate:sqlite
```

或者，你可以添加一个简化的npm脚本到`package.json`：

```json
"scripts": {
  // 现有脚本
  "db:migrate": "drizzle-kit migrate:sqlite",
  "db:generate": "drizzle-kit generate:sqlite",
  "db:studio": "drizzle-kit studio"
}
```

然后运行：

```bash
bun run db:migrate
```

### 5. 验证数据库结构

你可以使用Drizzle Studio查看和管理数据库内容：

```bash
bun run db:studio
```

这将启动一个本地Web界面，通常在`http://localhost:4983`，让你可以直观地查看和编辑数据库内容。

注意：如果配置了表名前缀，你会看到所有表名前都有`PROJECT_NAME`环境变量的值作为前缀，例如`myapp_user`而不是`user`。

## 开发测试数据

### 1. 添加测试数据

你可以创建一个脚本来填充开发数据库：

```typescript
// scripts/seed-dev-db.ts
import { db } from '../db';
import { user, account } from '../db/auth';
import { hash } from '../lib/auth-hasher';

async function seed() {
  console.log('🌱 开始填充开发数据库...');

  // 创建测试用户
  const testUser = await db.insert(user).values({
    id: 'test-user-id',
    name: '测试用户',
    email: 'test@example.com',
    emailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }).returning().get();

  console.log('👤 创建测试用户:', testUser.email);

  // 创建账户和密码
  const passwordHash = await hash('password123');
  await db.insert(account).values({
    id: 'test-account-id',
    accountId: 'email',
    providerId: 'email',
    userId: testUser.id,
    password: passwordHash,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log('🔑 添加测试账户密码');
  console.log('✅ 数据填充完成!');
}

seed().catch(error => {
  console.error('❌ 填充数据库时出错:', error);
  process.exit(1);
});
```

添加对应的NPM脚本：

```json
"scripts": {
  // 现有脚本
  "db:seed": "tsx scripts/seed-dev-db.ts"
}
```

然后运行：

```bash
bun run db:seed
```

### 2. 重置开发数据库

如果需要重置开发数据库，可以简单地删除数据库文件并重新创建：

```bash
rm local.db
touch local.db
bun run db:migrate
bun run db:seed   # 可选: 重新添加测试数据
```

也可以创建一个便捷脚本：

```json
"scripts": {
  // 现有脚本
  "db:reset": "rm -f local.db && touch local.db && bun run db:migrate"
}
```

## 使用表名前缀

如果你已经配置了表名前缀（通过`PROJECT_NAME`环境变量），所有数据库操作都会自动使用带前缀的表名。例如，如果`PROJECT_NAME=myapp`，则表将使用如下名称：

- `user` → `myapp_user`
- `session` → `myapp_session`
- `account` → `myapp_account`
- `verification` → `myapp_verification`

### 查看带前缀的表

使用SQLite命令行工具查看表结构：

```bash
sqlite3 local.db ".tables"
```

可能的输出：
```
myapp_account        myapp_session        myapp_user          myapp_verification
```

### 前缀在不同环境中的一致性

为了维持开发和生产环境的一致性，请确保在所有环境中使用相同的`PROJECT_NAME`：

1. 本地开发: `.env.local`中设置`PROJECT_NAME=myapp`
2. 测试环境: 测试配置中设置相同的`PROJECT_NAME`
3. 生产环境: 部署配置中设置相同的`PROJECT_NAME`

这样可以确保数据库架构在所有环境中保持一致。

## 调试数据库操作

如果需要调试数据库操作，可以在代码中添加日志：

```typescript
// 修改db/index.ts添加查询日志
import { drizzle } from "drizzle-orm/libsql";
import { SQLiteAsyncDialect } from "drizzle-orm/sqlite-core";

if (typeof EdgeRuntime !== "string") {
  require("dotenv").config();
}

// 添加查询日志记录器
const queryLogger = (query: string, params: unknown[]) => {
  if (process.env.NODE_ENV === 'development') {
    // 输出实际表名（带前缀）
    console.log('🔍 执行查询:', query);
    if (params.length) console.log('📋 参数:', params);
  }
};

export const db = drizzle({
  connection: {
    url: process.env.TURSO_URL || "file:local.db",
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  },
  logger: queryLogger
});

export * from "./auth";
```

这将帮助你看到实际执行的SQL查询，包括带前缀的表名。

## 在本地模拟生产环境数据库

如果你需要在本地使用Turso数据库（例如调试特定于Turso的问题），请确保也配置相同的表名前缀：

```bash
# .env.local (连接远程Turso但使用相同的表名前缀)
PROJECT_NAME=myapp
TURSO_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-token
```

### 创建Turso数据库并应用迁移

```bash
# 登录Turso
turso auth login

# 创建数据库
turso db create my-dev-db

# 获取连接详情并更新环境变量
turso db show my-dev-db
turso db tokens create my-dev-db

# 应用迁移 (确保PROJECT_NAME环境变量一致)
PROJECT_NAME=myapp TURSO_URL=libsql://your-db-url-here TURSO_AUTH_TOKEN=your-token npx drizzle-kit migrate:sqlite
```

## 常见问题与解决方案

### 表名前缀问题

**问题**: 迁移后数据库表没有预期的前缀

**解决方案**:
- 确认`.env.local`文件中正确设置了`PROJECT_NAME`变量
- 确认在运行迁移命令时环境变量被正确加载
- 在运行迁移命令前先重新生成迁移文件：`bun run db:generate`

### 数据库锁定错误

如果遇到"database is locked"错误，通常是因为多个连接尝试同时写入SQLite文件。解决方法：

1. 确保只有一个应用实例在运行
2. 关闭Drizzle Studio如果它正在运行
3. 重启开发服务器

### 迁移错误

如果遇到迁移错误，可以尝试从头开始：

```bash
bun run db:reset
```

如果错误与特定迁移相关，检查`db/migrations`目录中的迁移文件，确保它们按正确顺序应用。

### 数据类型不匹配

SQLite与Turso在某些数据类型处理上可能有细微差别。如果在切换环境时遇到类型问题：

1. 确保模型定义对两种数据库都兼容
2. 避免使用SQLite特有的功能
3. 在模型定义中明确指定数据类型模式（如timestamp的模式）

### 无法连接到本地数据库

如果应用无法连接到本地数据库：

1. 检查`local.db`文件是否存在且有适当的权限
2. 确认没有设置`TURSO_URL`环境变量，或它已明确设置为本地文件路径
3. 验证Drizzle配置中的路径是否正确

## 最佳实践

1. **始终使用迁移**：即使对开发数据库也使用迁移，而不是手动修改架构。

2. **版本控制迁移文件**：将迁移文件纳入版本控制，确保团队成员可以复制相同的数据库架构。

3. **使用模拟数据**：为测试创建一组一致的模拟数据，避免手动创建测试记录。

4. **分离配置**：使用环境变量区分开发、测试和生产环境的数据库配置，但保持表名前缀一致。

5. **定期备份**：即使是开发数据库，也要定期备份以避免丢失重要的测试数据。

通过遵循本指南，你应该能够在开发环境中高效地使用本地SQLite数据库进行应用开发和测试，同时保持与生产环境Turso数据库的兼容性，并正确应用表名前缀。
