# 部署流程指南

本指南详细说明如何将项目部署到Cloudflare Pages，并配置所需的环境变量和绑定，确保认证系统和数据库在生产环境中正常运行。

## 部署概述

本项目专为Cloudflare Pages环境优化，使用以下技术栈：

- **Next.js**: 使用Edge Runtime模式
- **Turso数据库**: 边缘SQL数据库服务
- **better-auth**: 认证框架
- **Resend**: 电子邮件服务

完整的部署流程包括：准备环境、构建应用、配置Cloudflare Pages和设置数据库连接。

## 准备工作

### 1. 获取必要的账户和API密钥

在开始部署之前，确保你已经准备好：

1. **Cloudflare账户**: 用于Pages部署
2. **Turso账户**: 用于数据库服务
3. **Resend账户**: 用于发送认证邮件（可选，也可使用其他邮件服务）

### 2. 安装必要的CLI工具

```bash
# 安装Cloudflare Wrangler
npm install -g wrangler

# 安装Turso CLI (如果需要)
curl -sSfL https://get.turso.tech/install.sh | bash
# 或者使用npm
npm install -g turso
```

### 3. 准备环境变量

创建一个`.env.production`文件（本地使用，不要提交到代码库）：

```bash
# 数据库连接信息
TURSO_URL=libsql://your-db-name.turso.io
TURSO_AUTH_TOKEN=your-turso-token

# 认证相关
BETTER_AUTH_EMAIL=no-reply@yourdomain.com
VERIFY_EMAIL=true  # 生产环境通常需要验证邮件

# 邮件服务
RESEND_API_KEY=your-resend-api-key

# 应用URL (部署后自动设置，但可以预先配置)
# BETTER_AUTH_URL 会自动使用 CF_PAGES_URL 或 VERCEL_URL
```

## 构建与部署步骤

### 1. 本地测试构建

在提交到生产环境之前，先在本地测试构建过程：

```bash
# 从项目根目录运行
npm run pages:build

# 本地预览构建结果
npm run preview
```

这将使用`@cloudflare/next-on-pages`将应用构建为Cloudflare Pages兼容格式，并在本地启动一个预览服务器。

### 2. 准备Turso数据库

如果尚未设置生产数据库，请按照以下步骤操作：

```bash
# 登录Turso
turso auth login

# 创建生产数据库
turso db create your-production-db

# 为数据库创建访问令牌
turso db tokens create your-production-db
```

记录下数据库URL和令牌，稍后将添加到Cloudflare Pages环境变量中。

### 3. 应用数据库迁移

直接对生产数据库应用迁移：

```bash
# 确保环境变量已正确设置
TURSO_URL=libsql://your-production-db.turso.io TURSO_AUTH_TOKEN=your-token npx drizzle-kit migrate:sqlite
```

或者，也可以在部署后通过手动触发特定的API端点来运行迁移。

### 4. 使用Wrangler部署到Cloudflare Pages

```bash
# 构建并部署
npm run deploy
```

这个命令会执行以下操作：
1. 使用`@cloudflare/next-on-pages`构建应用
2. 使用Wrangler将构建结果部署到Cloudflare Pages

## Cloudflare Pages配置

### 1. 环境变量设置

部署后，在Cloudflare Dashboard中配置环境变量：

1. 登录Cloudflare Dashboard
2. 进入Pages项目
3. 点击"Settings" > "Environment variables"
4. 添加以下变量：
   - `TURSO_URL`: Turso数据库URL
   - `TURSO_AUTH_TOKEN`: Turso认证令牌
   - `RESEND_API_KEY`: Resend API密钥
   - `BETTER_AUTH_EMAIL`: 用于发送认证邮件的邮箱地址
   - `VERIFY_EMAIL`: 是否验证邮箱（通常设为true）

### 2. 构建设置

确保构建命令已正确配置：

- **Build command**: `npm run pages:build`
- **Build output directory**: `.vercel/output/static`

这些设置通常在`wrangler.jsonc`文件中定义，但也可以在Dashboard中手动调整。

### 3. 域名设置

1. 在Cloudflare Pages的"Custom domains"部分设置自定义域名
2. 如果使用自定义域名，请确保更新环境变量：
   - `BETTER_AUTH_URL`: 应设置为你的自定义域名(https://your-domain.com)

## 多环境部署

Cloudflare Pages支持预览和生产分支，可以设置不同的环境配置：

### 1. 生产环境 (main/master分支)

配置主分支使用生产环境变量：
- 生产数据库连接
- 正式邮件发送设置
- 完整的验证流程

### 2. 预览环境 (其他分支)

为开发/测试分支配置不同的环境变量：
- 测试数据库连接
- 测试邮件设置(可以禁用真实邮件发送)
- 可以禁用邮箱验证简化测试(`VERIFY_EMAIL=false`)

## 部署后任务

### 1. 验证部署

检查以下功能确保部署成功：

- 页面加载和静态资产
- 用户注册和登录
- 数据库连接
- 邮件发送功能

### 2. 监控与日志

1. 在Cloudflare Dashboard中查看应用日志
2. 监控应用性能和错误
3. 使用Cloudflare Analytics跟踪流量和性能指标

### 3. 设置持续部署

为简化后续部署，设置GitHub Actions或其他CI/CD工具：

```yaml
# .github/workflows/deploy.yml 示例
name: Deploy to Cloudflare Pages

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 19
      - name: Install dependencies
        run: npm ci
      - name: Build
        run: npm run pages:build
      - name: Deploy
        run: npx wrangler pages deploy .vercel/output/static
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
```

## 常见部署问题与解决方案

### 1. 构建错误

**问题**: `@cloudflare/next-on-pages`构建失败

**解决方案**:
- 检查Next.js版本兼容性
- 确保项目中没有使用不兼容的Node.js APIs
- 查看构建日志找出具体错误

### 2. 数据库连接问题

**问题**: 应用无法连接到Turso数据库

**解决方案**:
- 验证环境变量是否正确设置
- 检查Turso令牌权限
- 确认IP访问控制设置

### 3. 邮件发送失败

**问题**: 认证邮件未发送

**解决方案**:
- 验证Resend API密钥
- 检查认证配置
- 在日志中查找邮件发送错误

### 4. 资源限制问题

**问题**: 遇到Cloudflare Workers资源限制

**解决方案**:
- 优化代码减少CPU使用
- 考虑升级Cloudflare计划
- 使用分布式存储处理大型资产

## 更新部署

当需要更新已部署的应用时：

1. 提交代码更改到版本控制系统
2. 如果配置了CI/CD，更改会自动部署
3. 或者手动运行部署命令:
   ```bash
   npm run deploy
   ```

4. 对于数据库架构更改，确保在部署前/后应用迁移

## 备份与恢复

### 1. 数据库备份

定期备份Turso数据库：

```bash
# 使用Turso CLI导出数据库
turso db dump your-production-db > backup-$(date +%Y%m%d).sql
```

### 2. 环境变量备份

保存Cloudflare Pages环境变量配置的副本，可以使用：

```bash
# 使用Wrangler获取环境变量
wrangler pages project get-vars --project-name your-project-name
```

## 附录: wrangler.jsonc配置

以下是项目中`wrangler.jsonc`的完整配置示例：

```jsonc
{
  "buildCommand": "npm run pages:build",
  "installCommand": "npm install",
  "routes": [
    {
      "pattern": "/api/*",
      "script": "index.js"
    },
    {
      "pattern": "/*",
      "staticPath": "/"
    }
  ],
  "rules": [
    {
      "type": "ESModule"
    }
  ],
  "compatibility_date": "2023-10-30",
  "compatibility_flags": [
    "nodejs_compat"
  ],
  "command-preview": [
    "wrangler",
    "pages",
    "dev",
    ".vercel/output/static",
    "--compatibility-date=2023-10-30",
    "--compatibility-flag=nodejs_compat"
  ],
  "debug-service-binding": {
    "apps": "apps",
    "auth": "auth",
    "sst": "sst"
  }
}
```

通过遵循本指南，你应该能够成功将Next.js认证应用部署到Cloudflare Pages，并确保所有组件（数据库、认证、邮件服务）正常工作。
