# Tailwind CSS 配置与更新指南

## 当前配置概述

本项目使用 Tailwind CSS 作为主要样式解决方案，结合 shadcn/ui 组件库提供了一套一致的设计系统。以下是当前配置的主要特点：

### 配置文件

项目中的 Tailwind 配置位于 `tailwind.config.ts` 文件中，使用 TypeScript 进行类型安全的配置。关键配置包括：

- 主题扩展（颜色、字体、间距等）
- 暗色模式配置
- 插件配置（动画、表单等）

### 核心依赖

```json
"dependencies": {
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1",
  "tailwind-merge": "^3.0.2",
  "tailwindcss-animate": "^1.0.7"
}
```

- **class-variance-authority**: 用于创建UI组件变体
- **clsx** 和 **tailwind-merge**: 用于组合和处理类名
- **tailwindcss-animate**: 提供动画支持

## 组件样式系统

本项目使用一个工具函数 `cn` (位于 `/lib/utils.ts`) 来处理类名组合：

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

这个函数结合了 `clsx` 和 `tailwind-merge` 的功能，允许你：

1. 动态组合类名
2. 解决Tailwind类名冲突
3. 有条件地应用样式

## 主题与设计令牌

项目使用 shadcn/ui 的设计令牌系统，主要由CSS变量定义，这些变量在 globals.css 中定义：

- `--background`、`--foreground` 等基础颜色
- `--card`、`--popover` 等组件颜色
- `--primary`、`--secondary` 等语义颜色
- `--radius` 等形状变量

## 如何更新和扩展 Tailwind 配置

### 1. 添加新的颜色

在 `tailwind.config.ts` 中添加新的颜色变量：

```typescript
// tailwind.config.ts
export default {
  theme: {
    extend: {
      colors: {
        // 添加新颜色
        'brand-blue': {
          '50': '#e6f0ff',
          '100': '#b3d1ff',
          '200': '#80b3ff',
          '300': '#4d94ff',
          '400': '#1a75ff',
          '500': '#0066ff',  // 基础色
          '600': '#0052cc',
          '700': '#003d99',
          '800': '#002966',
          '900': '#001433',
        },
      },
    },
  },
}
```

然后在CSS变量中添加相应的设计令牌（在 `globals.css` 中）：

```css
:root {
  /* 现有变量 */

  /* 新增的设计令牌 */
  --brand: 217 100% 50%;
}

.dark {
  /* 现有变量 */

  /* 暗色模式下的新令牌 */
  --brand: 217 100% 60%;
}
```

### 2. 添加新的字体

如果需要添加新字体，请按照以下步骤进行：

1. 在 `app/layout.tsx` 中导入字体：

```typescript
import { Inter, Roboto_Mono } from "next/font/google";

// 定义字体
const inter = Inter({ subsets: ["latin"] });
const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-roboto-mono"
});

// 在布局组件中应用
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.className} ${robotoMono.variable}`}>
      {/* ... */}
    </html>
  );
}
```

2. 在 `tailwind.config.ts` 中添加字体配置：

```typescript
export default {
  theme: {
    extend: {
      fontFamily: {
        mono: ["var(--font-roboto-mono)"],
        // 或直接使用字体名称
        display: ["Oswald", "sans-serif"],
      },
    },
  },
}
```

### 3. 添加自定义插件

如果需要添加自定义的 Tailwind 插件：

1. 安装插件：

```bash
bun add -D @tailwindcss/typography
```

2. 在配置中添加：

```typescript
import typography from "@tailwindcss/typography";

export default {
  // 其他配置
  plugins: [
    typography,
    // 其他插件
  ],
}
```

### 4. 自定义组件变体

使用 `class-variance-authority` 为组件创建变体：

```typescript
// components/ui/badge.tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
        // 添加新变体
        brand: "bg-brand-blue-500 text-white",
      },
      size: {
        default: "h-6",
        sm: "h-5",
        lg: "h-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
```

## 暗色模式处理

项目使用 `next-themes` 实现暗色模式：

1. 主题提供者组件位于 `components/theme-provider.tsx`
2. 切换组件位于 `components/ui/mode-toggle.tsx`

### 为组件添加暗色模式支持

在设计组件时，可以直接在类名中添加暗色模式修饰符：

```jsx
<div className="bg-white dark:bg-slate-800 text-black dark:text-white">
  暗色模式自适应内容
</div>
```

## 工作流最佳实践

### 1. 使用实用优先的方法

- 首先使用内联Tailwind类
- 当组件复杂度增加时，提取为抽象组件
- 使用 `cn()` 函数组合类名

### 2. 组件设计系统

为保持一致性，请遵循以下规则：

- 使用 shadcn/ui 提供的组件作为基础
- 对于全新的UI组件，首先考虑是否可以基于现有组件扩展
- 组件应支持通过 className 属性自定义样式
- 使用 `VariantProps` 类型确保类型安全

### 3. 响应式设计

项目使用Tailwind的响应式前缀实现响应式设计：

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 内容将从单列变为多列 */}
</div>
```

默认断点配置：
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

## 常见问题与解决方案

### 样式冲突

如果遇到样式冲突，请确保：

1. 使用 `cn()` 函数合并类名
2. 检查类的应用顺序（后面的类会覆盖前面的）
3. 使用 `@apply` 指令时要小心，避免创建难以维护的抽象

### 性能优化

为减小生产构建大小：

1. 在 `tailwind.config.ts` 中设置 `purge` 配置：

```typescript
export default {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // 其他配置
}
```

2. 避免动态拼接类名：

```jsx
// 不推荐
<div className={`text-${size}`}>

// 推荐
<div className={size === 'large' ? 'text-lg' : 'text-base'}>
```

### 工具集成

- **VS Code**: 安装 Tailwind CSS IntelliSense 插件获得自动完成支持
- **ESLint**: 考虑添加 eslint-plugin-tailwindcss 以强制执行最佳实践

## 更新 Tailwind CSS

要更新 Tailwind CSS 版本，请执行以下操作：

```bash
bun update tailwindcss postcss autoprefixer
```

更新后检查配置文件是否需要调整，特别是主要版本升级可能引入的变化。

## 自定义工具类

如果需要创建自定义工具类，可以在 `globals.css` 中使用 `@layer` 指令：

```css
@layer utilities {
  .text-balance {
    text-wrap: balance;
  }

  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
}
```

这样可以在不扩展 Tailwind 配置的情况下添加实用工具类。
