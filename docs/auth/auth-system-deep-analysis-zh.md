# 认证系统深入解析

本文档深入解析项目中使用的认证系统，详细介绍better-auth库的工作原理、数据模型、密码哈希实现和安全最佳实践，帮助开发者理解和扩展认证功能。

## 认证架构概述

本项目使用better-auth库构建完整的认证系统，该系统：

1. 基于会话(Session)的身份验证
2. 支持电子邮件/密码认证方式
3. 包含邮箱验证和密码重置功能
4. 使用自定义密码哈希以优化性能
5. 集成Turso数据库存储用户数据

整体认证流程围绕以下核心概念：

- **用户账户**: 表示系统中的用户实体
- **会话**: 跟踪用户的登录状态
- **验证**: 处理电子邮件验证和密码重置
- **账户提供者**: 管理不同的身份验证方法(目前为电子邮件/密码)

## 认证系统初始化

项目的认证系统在`lib/auth.ts`中初始化：

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { resend } from "./email/resend";
import { hash, verify } from "./auth-hasher";
import { account, db, session, user, verification } from "../db";

const from = process.env.BETTER_AUTH_EMAIL || "delivered@resend.dev";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: { account, session, user, verification },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: !(process.env.VERIFY_EMAIL === "false"),
    async sendResetPassword({ user, url }) {
      await resend.emails.send({
        from,
        to: user.email,
        subject: "Reset your password",
        text: `Hey ${user.name}, here is your password reset link: ${url}`,
      });
    },
    // 自定义哈希函数
    password: { hash, verify },
  },
  emailVerification: {
    async sendVerificationEmail({ user, url }) {
      await resend.emails.send({
        from,
        to: user.email,
        subject: "Verify your email address",
        text: `Hey ${user.name}, verify your email address, please: ${url}`,
      });
    },
  },
});

export const baseURL =
  process.env.NODE_ENV === "development"
    ? process.env.BETTER_AUTH_URL || "http://localhost:3000"
    : process.env.BETTER_AUTH_URL ||
      process.env.CF_PAGES_URL ||
      process.env.VERCEL_URL ||
      process.env.NEXT_PUBLIC_APP_URL;
```

## 数据库架构

认证系统使用四个主要数据表，在`db/auth.ts`中定义：

```typescript
// db/auth.ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// 用户表 - 存储用户基本信息
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// 会话表 - 管理用户登录状态
export const session = sqliteTable("session", {
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

// 账户表 - 管理认证提供者账户
export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", {
    mode: "timestamp",
  }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", {
    mode: "timestamp",
  }),
  scope: text("scope"),
  password: text("password"),  // 存储密码哈希
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// 验证表 - 处理邮箱验证和密码重置令牌
export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }),
  updatedAt: integer("updated_at", { mode: "timestamp" }),
});
```

## 密码哈希实现

项目使用自定义密码哈希实现，优化为在边缘环境中运行，位于`lib/auth-hasher.ts`中：

```typescript
// lib/auth-hasher.ts (简化版)
import { webcrypto } from "crypto";

// 针对边缘环境优化的PBKDF2哈希实现
export async function hash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // 生成随机盐值
  const salt = webcrypto.getRandomValues(new Uint8Array(16));

  // 导入密钥
  const importedKey = await webcrypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );

  // 使用PBKDF2派生密钥
  const derivedKey = await webcrypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt,
      iterations: 10000, // 迭代次数平衡安全性和性能
      hash: "SHA-256",
    },
    importedKey,
    256
  );

  // 合并盐值和派生密钥
  const combined = new Uint8Array(salt.length + derivedKey.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(derivedKey), salt.length);

  // 转为Base64编码
  return btoa(String.fromCharCode(...combined));
}

// 验证密码
export async function verify(password: string, hash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // 解码哈希字符串
    const combined = Uint8Array.from(atob(hash), c => c.charCodeAt(0));

    // 提取盐值
    const salt = combined.slice(0, 16);

    // 导入密钥
    const importedKey = await webcrypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );

    // 使用相同参数派生密钥
    const derivedKey = await webcrypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt,
        iterations: 10000,
        hash: "SHA-256",
      },
      importedKey,
      256
    );

    // 提取存储的哈希部分
    const storedHash = combined.slice(16);

    // 比较派生密钥和存储的哈希
    const newHash = new Uint8Array(derivedKey);

    if (storedHash.length !== newHash.length) {
      return false;
    }

    // 时间恒定比较
    let diff = 0;
    for (let i = 0; i < storedHash.length; i++) {
      diff |= storedHash[i] ^ newHash[i];
    }

    return diff === 0;
  } catch (error) {
    console.error("Password verification error:", error);
    return false;
  }
}
```

## 客户端集成

为了方便在客户端组件中使用认证功能，项目提供了简化的客户端API，位于`lib/auth-client.ts`：

```typescript
// lib/auth-client.ts
export async function signUp(data: any) {
  return fetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

export async function signIn(data: any) {
  return fetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(data),
  }).then((res) => res.json());
}

export async function signOut() {
  return fetch("/api/auth/logout", { method: "POST" }).then((res) => res.json());
}

export async function getSession() {
  return fetch("/api/auth/session").then((res) => res.json());
}
```

## 认证流程详解

### 1. 注册流程

1. 用户提交注册表单(姓名、电子邮件、密码)
2. 客户端发送POST请求到`/api/auth/register`
3. better-auth处理此请求，执行以下操作：
   - 检查邮箱是否已注册
   - 使用自定义hash函数创建密码哈希
   - 创建新的用户记录
   - 创建与该用户关联的账户记录(provider: email)
   - 如启用邮箱验证，发送验证邮件
   - 创建用户会话并返回会话令牌

### 2. 登录流程

1. 用户提交登录表单(电子邮件、密码)
2. 客户端发送POST请求到`/api/auth/login`
3. better-auth处理此请求，执行以下操作：
   - 查找匹配电子邮件的用户
   - 获取该用户的email提供者账户
   - 使用`verify`函数验证密码
   - 如密码正确，创建新会话
   - 返回用户信息和会话令牌

### 3. 邮箱验证流程

1. 用户注册后，系统发送验证邮件
2. 邮件包含唯一验证URL(包含验证令牌)
3. 用户点击链接，访问`/api/auth/verify-email?token=xxx`
4. better-auth验证令牌，并更新用户邮箱验证状态
5. 用户被重定向到指定页面(通常是登录页或仪表板)

### 4. 密码重置流程

1. 用户在忘记密码页面提交邮箱
2. 系统发送重置密码邮件(包含令牌)
3. 用户点击邮件中的链接，访问重置密码页面
4. 用户输入新密码并提交
5. 系统验证令牌，并使用`hash`函数更新密码

## 会话管理

better-auth实现的会话管理功能：

1. **会话创建**: 登录或注册成功后创建新会话
2. **会话存储**: 会话信息存储在数据库，会话令牌通过Cookie发送到客户端
3. **会话验证**: 每次请求自动验证会话令牌
4. **会话刷新**: 长期会话自动刷新有效期
5. **会话注销**: 用户登出时清除会话

### 会话访问

在服务器组件中访问会话：

```typescript
import { auth } from "@/lib/auth";

export default async function ServerComponent() {
  const session = await auth.getSession();

  if (session) {
    // 用户已登录
    return <div>Hello, {session.user.name}</div>;
  } else {
    // 未登录
    return <div>Please log in</div>;
  }
}
```

在客户端组件中访问会话：

```typescript
"use client";
import { useState, useEffect } from "react";
import { getSession } from "@/lib/auth-client";

export default function ClientComponent() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSession().then((data) => {
      setSession(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (session) {
    return <div>Hello, {session.user.name}</div>;
  } else {
    return <div>Please log in</div>;
  }
}
```

## 自定义认证体验

### 1. 修改验证邮件模板

项目包含React Email模板用于邮件发送：

```tsx
// lib/email/verify-email.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from "@react-email/components";
import { Tailwind } from "@react-email/tailwind";

export interface VerifyEmailProps {
  username: string;
  verificationLink: string;
}

export function reactVerifyEmailEmail({
  username,
  verificationLink,
}: VerifyEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Verify your email address</Preview>
      <Tailwind>
        <Body className="bg-white font-sans">
          <Container className="mx-auto p-4 max-w-xl">
            <Heading className="text-xl font-bold text-center my-6">
              Email Verification
            </Heading>
            <Text>Hello {username},</Text>
            <Text>
              Thank you for registering. Please verify your email address by
              clicking the button below:
            </Text>
            <div className="text-center my-8">
              <Link
                href={verificationLink}
                className="bg-blue-500 text-white px-6 py-3 rounded-md font-medium no-underline inline-block"
              >
                Verify Email
              </Link>
            </div>
            <Text className="text-sm text-gray-500">
              If you did not request this email, you can safely ignore it.
            </Text>
            <Text className="text-sm text-gray-500 mt-6">
              If the button doesn&apos;t work, copy and paste this link:
            </Text>
            <Text className="text-xs text-gray-500 break-all">
              {verificationLink}
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
```

要使用此模板，取消`lib/auth.ts`中相关代码的注释：

```typescript
// lib/auth.ts
import { reactVerifyEmailEmail } from "./email/verify-email";

// 在配置中:
emailVerification: {
  async sendVerificationEmail({ user, url }) {
    await resend.emails.send({
      from,
      to: user.email,
      subject: "Verify your email address",
      text: `Hey ${user.name}, verify your email address, please: ${url}`,
      // 启用React邮件模板
      react: reactVerifyEmailEmail({
        username: user.name,
        verificationLink: url,
      }),
    });
  },
},
```

### 2. 自定义重定向行为

注册或登录后的重定向行为可以通过表单中的回调参数自定义：

```tsx
// 添加到Login/Register表单中
import { useSearchParams } from "next/navigation";

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  async function handleSubmit(e) {
    e.preventDefault();
    // ...登录逻辑

    // 成功后重定向
    router.push(callbackUrl);
  }

  // 渲染表单...
}
```

### 3. 添加自定义字段

如需扩展用户模型添加自定义字段：

1. 修改`db/auth.ts`中的用户表定义：

```typescript
export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull(),
  image: text("image"),
  // 添加自定义字段
  role: text("role").default("user"),
  phoneNumber: text("phone_number"),
  // 时间戳
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

2. 创建迁移并应用：

```bash
npx drizzle-kit generate:sqlite
npx drizzle-kit migrate:sqlite
```

3. 扩展注册表单以收集附加信息：

```tsx
// 在注册表单中添加字段
<div className="grid gap-2">
  <Label htmlFor="phone">Phone Number</Label>
  <Input
    id="phone"
    type="tel"
    value={phone}
    onChange={(e) => setPhone(e.target.value)}
  />
</div>
```

4. 更新注册处理逻辑，在用户创建后更新这些字段

## 安全最佳实践

### 1. 密码策略

实施强密码策略：

```typescript
// 在客户端验证密码强度
function validatePassword(password: string): string | null {
  if (password.length < 8) {
    return "Password must be at least 8 characters";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    return "Password must contain at least one special character";
  }

  return null; // 密码有效
}
```

### 2. 防止暴力攻击

添加登录尝试限制：

```typescript
// 在中间件中实现
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 简单的内存计数器(生产环境应使用Redis等持久化存储)
const loginAttempts = new Map<string, { count: number, lockedUntil?: number }>();

export function middleware(request: NextRequest) {
  // 仅应用于登录路由
  if (request.nextUrl.pathname === "/api/auth/login" && request.method === "POST") {
    const ip = request.ip || "unknown";
    const now = Date.now();
    const attempt = loginAttempts.get(ip) || { count: 0 };

    // 检查是否被锁定
    if (attempt.lockedUntil && attempt.lockedUntil > now) {
      const waitMinutes = Math.ceil((attempt.lockedUntil - now) / 60000);
      return NextResponse.json(
        {
          error: `Too many login attempts. Please try again in ${waitMinutes} minutes.`,
        },
        { status: 429 }
      );
    }

    // 更新尝试次数
    attempt.count = (attempt.count || 0) + 1;

    // 5次失败后锁定30分钟
    if (attempt.count >= 5) {
      attempt.lockedUntil = now + 30 * 60 * 1000; // 30分钟
      attempt.count = 0;
    }

    loginAttempts.set(ip, attempt);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/login"],
};
```

### 3. 安全的Cookie设置

确保Cookie设置合理：

```typescript
// 在auth配置中添加Cookie选项
export const auth = betterAuth({
  // 其他配置...

  // 会话配置
  session: {
    // 长期存在的会话(30天)
    expiresIn: 30 * 24 * 60 * 60,
    // Cookie设置
    cookie: {
      name: "auth_session",
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      // 用于生产环境的特定域名
      domain: process.env.NODE_ENV === "production"
        ? process.env.COOKIE_DOMAIN
        : undefined,
    }
  }
});
```

### 4. 会话管理

实施强会话管理：

- 限制每用户活跃会话数
- 提供查看和管理活跃会话的界面
- 支持可疑活动检测

```typescript
// 添加用户会话管理端点
// app/api/auth/sessions/route.ts
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/db";
import { session } from "@/db/auth";
import { eq } from "drizzle-orm";

// 获取当前用户的所有会话
export async function GET() {
  const currentSession = await auth.getSession();

  if (!currentSession) {
    return NextResponse.json({ error: "未认证" }, { status: 401 });
  }

  const sessions = await db.select()
    .from(session)
    .where(eq(session.userId, currentSession.user.id));

  // 移除敏感信息
  const safeSessions = sessions.map(s => ({
    id: s.id,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    userAgent: s.userAgent,
    ipAddress: s.ipAddress,
    isCurrent: s.id === currentSession.id
  }));

  return NextResponse.json({ sessions: safeSessions });
}

// 删除特定会话(登出)
export async function DELETE(request: Request) {
  const currentSession = await auth.getSession();

  if (!currentSession) {
    return NextResponse.json({ error: "未认证" }, { status: 401 });
  }

  const { id } = await request.json();

  // 仅允许用户删除自己的会话
  const sessionToDelete = await db.query.session.findFirst({
    where: eq(session.id, id)
  });

  if (!sessionToDelete || sessionToDelete.userId !== currentSession.user.id) {
    return NextResponse.json({ error: "未授权" }, { status: 403 });
  }

  // 删除会话
  await db.delete(session).where(eq(session.id, id));

  return NextResponse.json({ success: true });
}
```

## 认证系统扩展

### 1. 添加社交登录

better-auth支持添加OAuth提供者，例如添加GitHub登录：

```typescript
// 安装必要的包
// npm install @auth/core

// 修改auth.ts配置
import { GitHub } from "@auth/core/providers/github";

export const auth = betterAuth({
  // 现有配置...

  // 添加OAuth提供者
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
});
```

### 2. 角色和权限系统

扩展用户模型添加角色字段，并实现权限检查：

```typescript
// 扩展用户模型
// db/auth.ts
export enum UserRole {
  USER = "user",
  ADMIN = "admin",
}

export const user = sqliteTable("user", {
  // 现有字段...
  role: text("role").$type<UserRole>().default(UserRole.USER),
});

// 创建权限中间件
// lib/auth-guards.ts
import { auth } from "./auth";
import { UserRole } from "@/db/auth";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";

export async function roleGuard(request: NextRequest, requiredRole: UserRole) {
  const session = await auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (session.user.role !== requiredRole) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
}

// 在路由中使用
// middleware.ts
import { roleGuard } from "@/lib/auth-guards";
import { UserRole } from "@/db/auth";

export async function middleware(request: NextRequest) {
  // 仅对管理员路由应用权限检查
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return roleGuard(request, UserRole.ADMIN);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
```

### 3. 多因素认证(MFA)

实现基于TOTP的多因素认证：

```typescript
// 安装必要的包
// npm install otpauth qrcode

// 创建MFA实用函数
// lib/mfa.ts
import { createHmac, randomBytes } from "crypto";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";

// 创建TOTP密钥
export function generateTOTPSecret(email: string) {
  const secret = randomBytes(20).toString("hex");
  const totp = new OTPAuth.TOTP({
    issuer: "YourApp",
    label: email,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  return {
    secret,
    uri: totp.toString(),
  };
}

// 生成QR码
export async function generateQRCode(uri: string) {
  return QRCode.toDataURL(uri);
}

// 验证TOTP令牌
export function verifyTOTP(secret: string, token: string) {
  const totp = new OTPAuth.TOTP({
    issuer: "YourApp",
    label: "User",
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret,
  });

  // Delta表示时间偏差容忍度
  return totp.validate({ token, window: 1 }) !== null;
}
```

通过深入理解认证系统的实现细节，你可以根据项目需求进行定制和扩展，保持系统的安全性和灵活性。无论是添加新的认证方法、增强安全措施，还是实现高级功能如多因素认证、权限管理，都可以在现有框架的基础上进行构建。
