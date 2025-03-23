# API文档与使用示例

本文档详细说明项目中可用的API端点、数据结构、认证机制以及如何在前端和后端使用这些API。

## API概述

本项目使用Next.js App Router提供以下API功能：

1. **认证API**: 基于better-auth实现的用户认证功能
2. **用户API**: 用户信息管理
3. **其他业务API**: 根据应用需求提供的业务功能

所有API端点都位于`/app/api`目录下，遵循RESTful设计原则。

## API路径结构

```
/api
  /auth           # 认证相关API (由better-auth提供)
    /[...all]     # 认证API路由处理
  /hello          # 示例API端点
  /users          # 用户相关API(可扩展)
  /...            # 其他业务API
```

## 认证API

项目使用better-auth提供标准的认证API。所有相关端点都由better-auth自动处理，位于`/api/auth/[...all]`路由下。

### 主要认证端点

| 端点 | 方法 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| `/api/auth/login` | POST | 用户登录 | `{ email, password }` | `{ user, session }` |
| `/api/auth/register` | POST | 用户注册 | `{ name, email, password }` | `{ user, session }` |
| `/api/auth/logout` | POST | 用户登出 | 无 | `{ success: true }` |
| `/api/auth/verify-email` | GET | 验证邮箱 | 查询参数: token | 重定向或错误 |
| `/api/auth/forgot-password` | POST | 忘记密码 | `{ email }` | `{ success: true }` |
| `/api/auth/reset-password` | POST | 重置密码 | `{ token, password }` | `{ success: true }` |
| `/api/auth/session` | GET | 获取当前会话 | 无 | `{ user, session }` 或 `null` |

### 认证API使用示例

#### 用户注册

```typescript
// 前端代码示例
async function registerUser(userData: {
  name: string;
  email: string;
  password: string;
}) {
  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}
```

#### 用户登录

```typescript
// 前端代码示例
async function loginUser(credentials: { email: string; password: string }) {
  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}
```

#### 获取当前会话

```typescript
// 前端代码示例
async function getCurrentSession() {
  const response = await fetch('/api/auth/session');

  if (!response.ok) {
    return null;
  }

  return response.json();
}
```

#### 使用客户端API辅助函数

项目中包含了一些客户端API辅助函数，位于`/lib/auth-client.ts`：

```typescript
// 客户端API辅助函数使用示例
import { signUp, signIn, signOut, getSession } from '@/lib/auth-client';

// 注册
await signUp({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secure-password'
});

// 登录
await signIn({
  email: 'john@example.com',
  password: 'secure-password'
});

// 获取会话
const session = await getSession();

// 登出
await signOut();
```

## 扩展API开发

### 创建新API端点

例如，创建用户个人资料API：

```typescript
// app/api/users/profile/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/auth';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: '未认证' },
      { status: 401 }
    );
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  if (!userData) {
    return NextResponse.json(
      { error: '用户不存在' },
      { status: 404 }
    );
  }

  // 排除敏感字段
  const { password, ...safeUserData } = userData;

  return NextResponse.json({ user: safeUserData });
}

export async function PATCH(request: Request) {
  const session = await auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: '未认证' },
      { status: 401 }
    );
  }

  const data = await request.json();

  // 验证数据...

  // 更新用户数据
  await db
    .update(user)
    .set({
      name: data.name,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  return NextResponse.json({ success: true });
}
```

### API中间件

你可以创建中间件来处理认证、日志、错误处理等通用功能：

```typescript
// middleware.ts (项目根目录)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 请求日志
  console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}`);

  // 继续处理请求
  return NextResponse.next();
}

// 仅匹配API路由
export const config = {
  matcher: '/api/:path*',
};
```

## 数据处理与验证

### 1. 请求验证

推荐使用zod等库对API请求进行验证：

```typescript
// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { z } from 'zod';

const userUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  bio: z.string().max(500).optional(),
});

export async function PATCH(request: Request) {
  try {
    const data = await request.json();

    // 验证请求数据
    const validatedData = userUpdateSchema.parse(data);

    // 处理更新...

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '无效数据', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: '处理请求时出错' },
      { status: 500 }
    );
  }
}
```

### 2. 响应格式

建议使用一致的响应格式：

```typescript
// 成功响应
{
  "data": { ... },  // 响应数据
  "meta": { ... }   // 可选的元数据(分页信息等)
}

// 错误响应
{
  "error": "错误消息",
  "details": [ ... ] // 可选的详细错误信息
}
```

## API安全性

### 1. 认证与授权

在所有需要认证的API中使用以下模式：

```typescript
import { auth } from '@/lib/auth';

export async function GET() {
  const session = await auth.getSession();

  if (!session) {
    return NextResponse.json(
      { error: '未认证' },
      { status: 401 }
    );
  }

  // 授权检查示例
  if (session.user.role !== 'admin') {
    return NextResponse.json(
      { error: '无权限访问' },
      { status: 403 }
    );
  }

  // 处理请求...
}
```

### 2. CORS设置

如果需要跨域访问API，配置CORS：

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // 设置CORS头部
  response.headers.set('Access-Control-Allow-Origin', 'https://yourdomain.com');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
```

### 3. 速率限制

考虑为敏感API添加速率限制：

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 简单的内存速率限制器(生产环境应使用Redis等分布式存储)
const rateLimits = new Map<string, { count: number, timestamp: number }>();

export function middleware(request: NextRequest) {
  // 提取客户端IP
  const ip = request.ip || 'unknown';

  // 检查是否超出限制
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分钟窗口
  const maxLimit = 60; // 每分钟最多60个请求

  const currentLimit = rateLimits.get(ip) || { count: 0, timestamp: now };

  // 如果时间窗口已过期，重置计数
  if (now - currentLimit.timestamp > windowMs) {
    currentLimit.count = 0;
    currentLimit.timestamp = now;
  }

  currentLimit.count++;
  rateLimits.set(ip, currentLimit);

  // 如果超出限制，返回429错误
  if (currentLimit.count > maxLimit) {
    return NextResponse.json(
      { error: '请求过于频繁，请稍后再试' },
      { status: 429 }
    );
  }

  return NextResponse.next();
}

export const config = {
  // 仅匹配敏感API，如登录注册
  matcher: ['/api/auth/login', '/api/auth/register'],
};
```

## API测试

### 1. 使用Postman/Insomnia

你可以创建一个Postman/Insomnia集合来测试API：

```json
{
  "info": {
    "name": "Auth API Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Register User",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/register",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"name\": \"Test User\",\n  \"email\": \"test@example.com\",\n  \"password\": \"Password123!\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        }
      }
    },
    {
      "name": "Login User",
      "request": {
        "method": "POST",
        "url": "{{baseUrl}}/api/auth/login",
        "body": {
          "mode": "raw",
          "raw": "{\n  \"email\": \"test@example.com\",\n  \"password\": \"Password123!\"\n}",
          "options": {
            "raw": {
              "language": "json"
            }
          }
        }
      }
    }
  ]
}
```

### 2. 编写API测试

你可以使用Jest和Supertest编写API测试：

```typescript
// tests/api/auth.test.ts
import { createServer } from 'http';
import { apiResolver } from 'next/dist/server/api-utils/node';
import request from 'supertest';
import registerHandler from '@/app/api/auth/register/route';

describe('Auth API', () => {
  let server;

  beforeAll(() => {
    const requestHandler = (req, res) => {
      return apiResolver(
        req,
        res,
        undefined,
        registerHandler,
        {},
        false
      );
    };

    server = createServer(requestHandler);
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should register a new user', async () => {
    const res = await request(server)
      .post('/api/auth/register')
      .send({
        name: 'Test User',
        email: 'test@example.com',
        password: 'Password123!'
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('test@example.com');
  });
});
```

## API集成与使用模式

### 1. 服务端组件中使用API

在服务端组件中，可以直接使用数据库查询，无需通过API：

```typescript
// app/dashboard/page.tsx
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { user } from '@/db/auth';
import { eq } from 'drizzle-orm';

export default async function DashboardPage() {
  const session = await auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const userData = await db.query.user.findFirst({
    where: eq(user.id, session.user.id),
  });

  return (
    <div>
      <h1>欢迎, {userData.name}</h1>
      {/* 其他仪表板内容 */}
    </div>
  );
}
```

### 2. 客户端组件中使用API

在客户端组件中，通过fetch调用API：

```tsx
// components/profile-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ProfileForm({ user }) {
  const [name, setName] = useState(user.name);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error('更新失败');
      }

      router.refresh(); // 刷新页面数据
    } catch (error) {
      console.error('更新个人资料出错:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>
        姓名:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </label>
      <button type="submit" disabled={isLoading}>
        {isLoading ? '保存中...' : '保存更改'}
      </button>
    </form>
  );
}
```

### 3. 使用SWR进行数据获取

可以使用SWR提高数据获取体验：

```tsx
// 安装SWR: npm install swr

// hooks/use-user.js
import useSWR from 'swr';

const fetcher = (...args) => fetch(...args).then(res => res.json());

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR('/api/auth/session', fetcher);

  return {
    user: data?.user,
    isLoading,
    isError: error,
    mutate,
  };
}

// 在组件中使用
import { useUser } from '@/hooks/use-user';

function ProfileComponent() {
  const { user, isLoading, isError } = useUser();

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error loading user</div>;
  if (!user) return <div>Not logged in</div>;

  return <div>Hello, {user.name}</div>;
}
```

## API文档自动生成

考虑使用Swagger/OpenAPI为你的API生成文档：

1. 安装Swagger UI：`npm install swagger-ui-react swagger-ui-css`
2. 创建OpenAPI定义文件：`public/openapi.json`
3. 创建API文档页面：

```tsx
// app/api-docs/page.tsx
'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-css/swagger-ui.css';

export default function ApiDocsPage() {
  return <SwaggerUI url="/openapi.json" />;
}
```

## API版本控制

对于需要长期维护的API，考虑实现版本控制：

```
/api/v1/users  # 版本1
/api/v2/users  # 版本2
```

```typescript
// app/api/v1/users/route.ts
export async function GET() {
  // 版本1实现
}

// app/api/v2/users/route.ts
export async function GET() {
  // 版本2实现
}
```

通过遵循这些API开发实践，你可以构建一个强大、安全且易于维护的API层，实现前后端之间的高效通信。
