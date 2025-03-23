# 性能优化建议

本文档提供了针对项目各方面的性能优化建议，帮助你的应用在Cloudflare Pages环境中达到最佳性能表现。

## 目录
1. [Next.js应用优化](#nextjs应用优化)
2. [Cloudflare环境优化](#cloudflare环境优化)
3. [数据库性能优化](#数据库性能优化)
4. [认证系统优化](#认证系统优化)
5. [前端优化技巧](#前端优化技巧)
6. [监控与性能分析](#监控与性能分析)

## Next.js应用优化

### 路由和页面加载优化

1. **启用路由预取**

   Next.js默认启用了路由预取，确保在`next.config.ts`中不要禁用它：

   ```typescript
   // next.config.ts
   const nextConfig = {
     // 确保没有以下设置
     // reactStrictMode: false,
     // experimental: { disableOptimizedLoading: true }
   };
   ```

2. **组件级代码分割**

   使用动态导入减小初始包大小：

   ```typescript
   import dynamic from 'next/dynamic';

   // 动态导入重量级组件
   const HeavyComponent = dynamic(() => import('@/components/heavy-component'), {
     loading: () => <p>Loading...</p>,
     ssr: false, // 如果不需要SSR可以禁用
   });
   ```

3. **优化页面路由**

   将重量级功能分散到不同路由：

   ```
   app/
     (marketing)/     # 营销页面组
       page.tsx       # 首页
       about/page.tsx # 关于页面
     (auth)/          # 认证页面组
       login/page.tsx
       signup/page.tsx
     (dashboard)/     # 仪表板组 (需要认证)
       page.tsx
       settings/page.tsx
   ```

### 数据获取优化

1. **使用React Query或SWR缓存数据**

   添加SWR进行数据获取和缓存：

   ```bash
   bun add swr
   ```

   创建可重用的数据hook：

   ```typescript
   // hooks/use-user.ts
   import useSWR from 'swr';

   const fetcher = (...args) => fetch(...args).then(res => res.json());

   export function useUser() {
     const { data, error, isLoading, mutate } = useSWR('/api/auth/session', fetcher, {
       revalidateOnFocus: false,
       dedupingInterval: 60000, // 1分钟内不重复请求
     });

     return {
       user: data?.user,
       isLoading,
       isError: error,
       mutate,
     };
   }
   ```

2. **优化服务器组件**

   在服务器组件中使用并行数据获取：

   ```typescript
   // app/dashboard/page.tsx
   import { Suspense } from 'react';
   import { auth } from '@/lib/auth';

   export default async function DashboardPage() {
     // 获取会话
     const sessionPromise = auth.getSession();

     // 并行获取其他数据
     const dashboardDataPromise = fetch('/api/dashboard-data');

     // 等待所有数据
     const [session, dashboardResponse] = await Promise.all([
       sessionPromise,
       dashboardDataPromise
     ]);

     const dashboardData = await dashboardResponse.json();

     // 渲染...
   }
   ```

3. **数据流式传输**

   对于大型数据集，使用流式传输：

   ```tsx
   // app/large-data/page.tsx
   import { Suspense } from 'react';
   import { DataTable } from '@/components/data-table';
   import { LoadingSkeleton } from '@/components/loading-skeleton';

   // 顶级页面组件
   export default function LargeDataPage() {
     return (
       <div>
         <h1>Large Data</h1>
         <Suspense fallback={<LoadingSkeleton />}>
           <DataTableWrapper />
         </Suspense>
       </div>
     );
   }

   // 封装异步数据获取的组件
   async function DataTableWrapper() {
     const data = await fetchLargeDataSet();
     return <DataTable data={data} />;
   }
   ```

### 构建优化

1. **优化构建输出**

   在`next.config.ts`中配置输出优化：

   ```typescript
   // next.config.ts
   const nextConfig = {
     output: 'standalone',
     poweredByHeader: false,
     compress: true,
   };
   ```

2. **使用Next.js内置图像优化**

   利用Next.js的Image组件优化图像：

   ```tsx
   import Image from 'next/image';

   export function OptimizedImage() {
     return (
       <Image
         src="/images/hero.jpg"
         width={800}
         height={600}
         alt="Hero image"
         priority={true}  // 关键图像预加载
         quality={85}     // 优化质量
       />
     );
   }
   ```

### 性能监控

1. **启用Web Vitals监控**

   ```typescript
   // app/layout.tsx
   export function reportWebVitals(metric) {
     console.log(metric);

     // 发送到分析服务
     if (process.env.NODE_ENV === 'production') {
       // 发送指标到您的分析服务
     }
   }
   ```

## Cloudflare环境优化

### Worker优化

1. **优化边缘函数**

   减少API路由中的CPU密集型操作：

   ```typescript
   // 避免在API中进行计算密集型操作
   export async function GET() {
     // 不要: 大量循环或计算
     // for (let i = 0; i < 1000000; i++) { ... }

     // 推荐: 简化逻辑，使用数据库查询
     const result = await db.query.items.findMany();
     return Response.json(result);
   }
   ```

2. **缓存API响应**

   使用Cloudflare缓存API响应：

   ```typescript
   // app/api/cached-data/route.ts
   export async function GET() {
     const data = await fetchData();

     return new Response(JSON.stringify(data), {
       headers: {
         'Content-Type': 'application/json',
         'Cache-Control': 'public, max-age=60, s-maxage=300', // 边缘缓存5分钟
       },
     });
   }
   ```

3. **限制Worker内存使用**

   优化大型对象和数组的处理：

   ```typescript
   // 处理大型数据集
   export async function POST(request: Request) {
     const data = await request.json();

     // 批量处理而不是一次性处理
     const results = [];
     const batchSize = 100;

     for (let i = 0; i < data.length; i += batchSize) {
       const batch = data.slice(i, i + batchSize);
       const batchResults = await processBatch(batch);
       results.push(...batchResults);
     }

     return Response.json(results);
   }
   ```

### Cloudflare KV和Bindings

1. **使用KV存储会话状态**

   配置KV命名空间：

   ```bash
   # wrangler.toml
   kv_namespaces = [
     { binding = "SESSIONS", id = "xxxx" }
   ]
   ```

   使用KV存储会话：

   ```typescript
   // 在API中使用KV
   export async function GET(request: Request, { env }) {
     const sessionId = getCookie(request, 'session_id');

     if (sessionId) {
       const session = await env.SESSIONS.get(sessionId, { type: 'json' });
       // ...
     }
   }
   ```

2. **使用Cloudflare D1或Turso替代KV**

   对于需要关系型数据的场景，使用Turso：

   ```typescript
   // 优化查询
   const user = await db.query.user.findFirst({
     where: eq(user.id, userId),
     // 只选择需要的字段
     columns: {
       id: true,
       name: true,
       email: true,
     },
   });
   ```

### 资源优化

1. **启用Cloudflare的自动优化**

   在Pages配置中启用自动优化：
   - Minify HTML/CSS/JS
   - Image Optimization
   - Compression

2. **配置缓存策略**

   在`_headers`文件中配置缓存：

   ```
   # public/_headers
   /assets/*
     Cache-Control: public, max-age=31536000, immutable

   /api/*
     Cache-Control: public, max-age=60, s-maxage=300
   ```

## 数据库性能优化

### Turso查询优化

1. **优化表结构和索引**

   在Drizzle架构中添加索引：

   ```typescript
   // db/auth.ts
   export const user = sqliteTable("user", {
     // 字段...
     email: text("email").notNull().unique(),
   }, (table) => ({
     // 添加索引
     emailIdx: index("email_idx").on(table.email),
   }));
   ```

2. **使用选择性查询**

   仅查询需要的字段：

   ```typescript
   // 替代 db.select().from(user)
   const users = await db.select({
     id: user.id,
     name: user.name,
     email: user.email,
   }).from(user).where(eq(user.emailVerified, true));
   ```

3. **批量操作优化**

   使用批量插入而不是多次单独插入：

   ```typescript
   // 不要: 多次单独插入
   // for (const item of items) {
   //   await db.insert(table).values(item);
   // }

   // 推荐: 批量插入
   await db.insert(table).values(items);
   ```

4. **使用事务**

   对于多步操作使用事务：

   ```typescript
   // 使用事务保证一致性
   await db.transaction(async (tx) => {
     // 执行多个相关操作
     const user = await tx.insert(userTable).values(userData).returning().get();
     await tx.insert(profileTable).values({ userId: user.id, ...profileData });
   });
   ```

### 连接池和缓存

1. **实现简单的数据缓存**

   使用内存缓存减少数据库查询：

   ```typescript
   // lib/cache.ts
   const cache = new Map<string, { value: any, expires: number }>();

   export function getCached<T>(key: string): T | null {
     const item = cache.get(key);
     if (!item) return null;

     if (item.expires < Date.now()) {
       cache.delete(key);
       return null;
     }

     return item.value as T;
   }

   export function setCached(key: string, value: any, ttlSeconds = 60) {
     cache.set(key, {
       value,
       expires: Date.now() + ttlSeconds * 1000
     });
   }
   ```

   在API中使用缓存：

   ```typescript
   export async function GET() {
     const cacheKey = 'dashboard-stats';
     const cached = getCached(cacheKey);

     if (cached) {
       return Response.json(cached);
     }

     const data = await fetchDashboardStats();
     setCached(cacheKey, data, 300); // 缓存5分钟

     return Response.json(data);
   }
   ```

2. **数据库查询结果缓存**

   针对频繁的相同查询实现结果缓存：

   ```typescript
   // db/cached-queries.ts
   import { getCached, setCached } from '@/lib/cache';
   import { db } from './index';
   import { user } from './auth';
   import { eq } from 'drizzle-orm';

   export async function getUserById(id: string) {
     const cacheKey = `user:${id}`;
     const cached = getCached(cacheKey);

     if (cached) {
       return cached;
     }

     const result = await db.query.user.findFirst({
       where: eq(user.id, id),
     });

     if (result) {
       setCached(cacheKey, result, 60); // 缓存1分钟
     }

     return result;
   }
   ```

## 认证系统优化

### 密码哈希优化

1. **平衡安全性和性能**

   调整PBKDF2迭代次数：

   ```typescript
   // lib/auth-hasher.ts
   // 针对Cloudflare Workers环境优化的哈希迭代次数
   const PBKDF2_ITERATIONS = 10000; // 在边缘环境中这是一个合理的值

   export async function hash(password: string): Promise<string> {
     // 实现...
     const derivedKey = await webcrypto.subtle.deriveBits(
       {
         name: "PBKDF2",
         salt,
         iterations: PBKDF2_ITERATIONS,
         hash: "SHA-256",
       },
       importedKey,
       256
     );
     // ...
   }
   ```

2. **会话令牌验证优化**

   减少每个请求的数据库查询：

   ```typescript
   // 在auth配置中优化会话处理
   export const auth = betterAuth({
     // 其他配置...
     session: {
       // 较长的过期时间减少刷新频率
       expiresIn: 14 * 24 * 60 * 60, // 14天
       // 验证策略
       strategy: "database",
       // 10分钟内同一会话不重复验证
       refreshTokenWindow: 10 * 60,
     }
   });
   ```

### 认证流程优化

1. **延迟邮件验证**

   在开发环境禁用邮件验证以加快测试：

   ```typescript
   // lib/auth.ts
   export const auth = betterAuth({
     // 其他配置...
     emailAndPassword: {
       enabled: true,
       // 在开发环境禁用邮件验证
       requireEmailVerification: process.env.NODE_ENV === 'production' && !(process.env.VERIFY_EMAIL === "false"),
     }
   });
   ```

2. **减少认证中间件开销**

   优化会话验证路径：

   ```typescript
   // middleware.ts
   export function middleware(request: NextRequest) {
     // 静态资源和公共API不需要验证
     if (
       request.nextUrl.pathname.startsWith('/_next') ||
       request.nextUrl.pathname.startsWith('/public') ||
       request.nextUrl.pathname.startsWith('/api/public')
     ) {
       return NextResponse.next();
     }

     // 仅对需要认证的路径应用认证逻辑
     // ...认证逻辑
   }
   ```

## 前端优化技巧

### 组件优化

1. **使用React.memo减少不必要的重渲染**

   ```typescript
   // components/user-card.tsx
   import { memo } from 'react';

   interface UserCardProps {
     name: string;
     email: string;
   }

   const UserCard = memo(function UserCard({ name, email }: UserCardProps) {
     return (
       <div className="card">
         <h3>{name}</h3>
         <p>{email}</p>
       </div>
     );
   });

   export default UserCard;
   ```

2. **使用useMemo和useCallback**

   ```typescript
   // 组件中使用useMemo缓存计算结果
   function DashboardComponent({ items }) {
     // 缓存计算结果
     const totalValue = useMemo(() => {
       return items.reduce((sum, item) => sum + item.value, 0);
     }, [items]);

     // 缓存回调函数
     const handleItemClick = useCallback((id) => {
       console.log(`Clicked item ${id}`);
     }, []);

     return (
       <div>
         <h2>Total: {totalValue}</h2>
         {items.map(item => (
           <button key={item.id} onClick={() => handleItemClick(item.id)}>
             {item.name}
           </button>
         ))}
       </div>
     );
   }
   ```

3. **虚拟化长列表**

   使用react-window处理长列表：

   ```bash
   bun add react-window
   ```

   ```tsx
   // components/user-list.tsx
   import { FixedSizeList } from 'react-window';

   function UserList({ users }) {
     const Row = ({ index, style }) => (
       <div style={style} className="user-item">
         {users[index].name}
       </div>
     );

     return (
       <FixedSizeList
         height={400}
         width="100%"
         itemCount={users.length}
         itemSize={50}
       >
         {Row}
       </FixedSizeList>
     );
   }
   ```

### CSS与JS优化

1. **优化Tailwind配置**

   减小Tailwind CSS大小：

   ```typescript
   // tailwind.config.ts
   module.exports = {
     // 仅生成用到的类
     content: [
       './app/**/*.{js,ts,jsx,tsx}',
       './components/**/*.{js,ts,jsx,tsx}',
     ],
     // 禁用不使用的核心插件
     corePlugins: {
       float: false, // 例如，如果不使用float
       clear: false,
       // 其他未使用的插件...
     }
   };
   ```

2. **懒加载JS**

   使用懒加载减少初始JS体积：

   ```typescript
   // app/layout.tsx

   // 不要: 直接在布局中导入所有JS
   // import { initAnalytics } from '@/lib/analytics';

   // 推荐: 延迟加载非关键JS
   export default function RootLayout({ children }) {
     useEffect(() => {
       // 延迟加载分析脚本
       const loadAnalytics = async () => {
         const { initAnalytics } = await import('@/lib/analytics');
         initAnalytics();
       };

       // 页面加载后再初始化分析
       if (typeof window !== 'undefined') {
         // 使用requestIdleCallback在浏览器空闲时执行
         if ('requestIdleCallback' in window) {
           (window as any).requestIdleCallback(loadAnalytics);
         } else {
           setTimeout(loadAnalytics, 2000);
         }
       }
     }, []);

     return <html lang="en">{children}</html>;
   }
   ```

3. **资源预加载**

   对关键资源使用预加载：

   ```tsx
   // app/layout.tsx
   import { ReactNode } from 'react';

   export default function RootLayout({ children }: { children: ReactNode }) {
     return (
       <html lang="en">
         <head>
           {/* 预加载关键字体 */}
           <link
             rel="preload"
             href="/fonts/inter-var.woff2"
             as="font"
             type="font/woff2"
             crossOrigin="anonymous"
           />
           {/* 预连接到API域 */}
           <link rel="preconnect" href="https://api.example.com" />
         </head>
         <body>{children}</body>
       </html>
     );
   }
   ```

## 监控与性能分析

### 监控实现

1. **实现基本性能监控**

   ```typescript
   // lib/monitoring.ts
   export function capturePerformanceMetrics() {
     if (typeof window !== 'undefined' && 'performance' in window) {
       const perfData = window.performance.timing;
       const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
       const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
       const tcpTime = perfData.connectEnd - perfData.connectStart;
       const ttfb = perfData.responseStart - perfData.requestStart;

       console.log({
         pageLoadTime,
         dnsTime,
         tcpTime,
         ttfb
       });

       // 发送到分析服务
       // ...
     }
   }
   ```

2. **使用Cloudflare Analytics**

   在Cloudflare控制面板中启用Web Analytics，并在项目中添加跟踪代码。

### 性能分析工具

1. **Lighthouse集成**

   在CI流程中添加Lighthouse检查：

   ```yaml
   # .github/workflows/lighthouse.yml
   name: Lighthouse Audit

   on:
     push:
       branches: [main]

   jobs:
     lighthouse:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Setup Node
           uses: actions/setup-node@v3
           with:
             node-version: '18'
         - name: Install dependencies
           run: npm ci
         - name: Build
           run: npm run build
         - name: Start server
           run: npm run start & npx wait-on http://localhost:3000
         - name: Run Lighthouse
           uses: treosh/lighthouse-ci-action@v9
           with:
             urls: |
               http://localhost:3000
               http://localhost:3000/login
             uploadArtifacts: true
             temporaryPublicStorage: true
   ```

2. **自定义性能预算**

   创建性能预算配置：

   ```json
   // lighthouserc.json
   {
     "ci": {
       "collect": {
         "settings": {
           "preset": "desktop"
         }
       },
       "assert": {
         "assertions": {
           "categories:performance": ["error", {"minScore": 0.8}],
           "first-contentful-paint": ["error", {"maxNumericValue": 2000}],
           "interactive": ["error", {"maxNumericValue": 3500}],
           "max-potential-fid": ["error", {"maxNumericValue": 100}]
         }
       }
     }
   }
   ```

通过应用这些优化建议，你的应用应该能够在Cloudflare Pages环境中实现更好的性能，提供更快的加载时间和更流畅的用户体验。记住，性能优化是一个持续的过程，应该定期评估和改进应用的性能。
