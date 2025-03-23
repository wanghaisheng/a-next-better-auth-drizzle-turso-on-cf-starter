# 推送通知实现指南

本文档详细介绍了如何在Next.js Better Auth项目中实现推送通知功能，使应用能够在用户不活跃时发送重要更新，提高用户参与度。

## 实现概述

推送通知功能由以下几个部分组成：

1. **数据库表** - 存储用户的推送通知订阅信息
2. **API端点** - 处理订阅管理和发送通知
3. **客户端组件** - 提供用户界面让用户订阅/取消订阅通知
4. **Service Worker** - 处理推送事件并显示通知

## 前置条件

要实现推送通知，你需要：

1. 生成VAPID密钥对（用于Web Push协议的安全验证）
2. 安装必要的依赖
3. 配置环境变量

### 生成VAPID密钥

我们提供了一个脚本来生成VAPID密钥对：

```bash
node scripts/generate-vapid-keys.js
```

运行此脚本后，你将获得一对公钥和私钥。将它们添加到你的环境变量中：

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=你的公钥
VAPID_PRIVATE_KEY=你的私钥
```

### 安装依赖

```bash
npm install web-push @types/web-push --save
```

## 数据库配置

我们在`db/auth.ts`中添加了一个新表来存储推送通知订阅：

```typescript
// Push notification subscriptions table
export const pushSubscriptions = sqliteTable("push_subscription", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    endpoint: text("endpoint").notNull(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});
```

## API端点

### 订阅管理API

我们创建了一个API端点来处理订阅和取消订阅请求：

`app/api/push/subscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/auth';

// 处理订阅请求
export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 将订阅信息存储到数据库
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to save subscription' },
      { status: 500 }
    );
  }
}

// 处理取消订阅请求
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint, userId } = await request.json();

    if (!endpoint || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 从数据库中删除订阅信息
    await db
      .delete(pushSubscriptions)
      .where({
        userId,
        endpoint,
      });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing push subscription:', error);
    return NextResponse.json(
      { error: 'Failed to remove subscription' },
      { status: 500 }
    );
  }
}
```

### 发送通知API

我们创建了一个API端点来发送推送通知：

`app/api/push/send/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/auth';
import { eq } from 'drizzle-orm';
import webPush from 'web-push';

// 设置VAPID详情 - 这些应该存储在环境变量中
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:example@yourdomain.com', // 更改为你的邮箱
    vapidPublicKey,
    vapidPrivateKey
  );
}

// 向特定用户发送推送通知
export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // 检查VAPID密钥是否配置
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'Push notification configuration is missing' },
        { status: 500 }
      );
    }

    // 获取该用户的所有订阅
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.userId, userId));

    if (!subscriptions.length) {
      return NextResponse.json(
        { error: 'No subscriptions found for this user' },
        { status: 404 }
      );
    }

    // 向用户的所有设备发送通知
    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        };

        const payload = JSON.stringify({
          title,
          body,
          url: url || '/',
          timestamp: new Date().getTime(),
        });

        return webPush.sendNotification(pushSubscription, payload);
      })
    );

    // 检查失败情况
    const failures = results.filter((result) => result.status === 'rejected');
    
    if (failures.length) {
      console.error('Some push notifications failed to send:', failures);
    }

    return NextResponse.json({
      success: true,
      sent: results.length - failures.length,
      failed: failures.length,
    });
  } catch (error) {
    console.error('Error sending push notification:', error);
    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}

// 向所有用户发送推送通知
export async function PUT(request: NextRequest) {
  // 实现类似于POST方法，但向所有订阅用户发送通知
  // ...
}
```

## 客户端组件

我们创建了一个推送通知按钮组件，让用户可以订阅或取消订阅通知：

`components/push-notification-button.tsx`

```tsx
"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from 'better-auth/client';
import { Bell, BellOff } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

export function PushNotificationButton() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    // 检查是否支持推送通知
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }

    // 检查当前订阅状态
    const checkSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        const existingSubscription = await registration.pushManager.getSubscription();
        setSubscription(existingSubscription);
      } catch (error) {
        console.error('Error checking push subscription:', error);
      }
    };

    checkSubscription();
  }, []);

  const handleSubscribe = async () => {
    if (!user?.id) {
      console.error('User must be logged in to subscribe to notifications');
      return;
    }

    try {
      setIsSubscribing(true);
      const registration = await navigator.serviceWorker.ready;

      // 从环境变量获取VAPID公钥
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key is not configured');
        return;
      }

      // 订阅推送通知
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // 将订阅信息发送到服务器
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: newSubscription,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save subscription on server');
      }

      setSubscription(newSubscription);
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  const handleUnsubscribe = async () => {
    if (!subscription || !user?.id) return;

    try {
      setIsSubscribing(true);

      // 从推送管理器取消订阅
      await subscription.unsubscribe();

      // 从服务器删除订阅
      const response = await fetch('/api/push/subscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
          userId: user.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      setSubscription(null);
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
    } finally {
      setIsSubscribing(false);
    }
  };

  if (!isSupported) {
    return null; // 如果不支持推送通知，不显示按钮
  }

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={subscription ? handleUnsubscribe : handleSubscribe}
      disabled={isSubscribing || !user}
      title={subscription ? 'Unsubscribe from notifications' : 'Subscribe to notifications'}
    >
      {subscription ? <BellOff size={16} /> : <Bell size={16} />}
    </Button>
  );
}
```

## Service Worker 配置

我们创建了一个专门处理推送通知的Service Worker文件：

`public/sw-push.js`

```javascript
// 处理推送事件
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    // 解析通知数据
    const data = event.data.json();
    
    // 显示通知
    const promiseChain = self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: