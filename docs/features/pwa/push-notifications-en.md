# Push Notifications Implementation Guide

This document details how to implement push notifications in the Next.js Better Auth project, allowing your application to send important updates to users even when they're not actively using the app.

## Implementation Overview

The push notification functionality consists of several components:

1. **Database Table** - Stores user push notification subscription information
2. **API Endpoints** - Handle subscription management and notification sending
3. **Client Components** - Provide UI for users to subscribe/unsubscribe from notifications
4. **Service Worker** - Processes push events and displays notifications

## Prerequisites

To implement push notifications, you need:

1. Generate VAPID key pair (for Web Push protocol security verification)
2. Install necessary dependencies
3. Configure environment variables

### Generating VAPID Keys

We provide a script to generate VAPID key pairs:

```bash
node scripts/generate-vapid-keys.js
```

After running this script, you'll get a public and private key pair. Add them to your environment variables:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

### Installing Dependencies

```bash
npm install web-push @types/web-push --save
```

## Database Configuration

We've added a new table in `db/auth.ts` to store push notification subscriptions:

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

## API Endpoints

### Subscription Management API

We've created an API endpoint to handle subscription and unsubscription requests:

`app/api/push/subscribe/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/auth';

// Handle subscription requests
export async function POST(request: NextRequest) {
  try {
    const { subscription, userId } = await request.json();

    if (!subscription || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Store the subscription in the database
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

// Handle unsubscribe requests
export async function DELETE(request: NextRequest) {
  try {
    const { endpoint, userId } = await request.json();

    if (!endpoint || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Remove the subscription from the database
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

### Notification Sending API

We've created an API endpoint to send push notifications:

`app/api/push/send/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/auth';
import { eq } from 'drizzle-orm';
import webPush from 'web-push';

// Set VAPID details - these should be stored in environment variables
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';

if (vapidPublicKey && vapidPrivateKey) {
  webPush.setVapidDetails(
    'mailto:example@yourdomain.com', // Change to your email
    vapidPublicKey,
    vapidPrivateKey
  );
}

// Send push notification to a specific user
export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url } = await request.json();

    if (!userId || !title || !body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Check if VAPID keys are configured
    if (!vapidPublicKey || !vapidPrivateKey) {
      return NextResponse.json(
        { error: 'Push notification configuration is missing' },
        { status: 500 }
      );
    }

    // Get all subscriptions for this user
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

    // Send notification to all user's devices
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

    // Check for failures
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

// Send push notification to all users
export async function PUT(request: NextRequest) {
  // Implementation similar to POST method, but sends to all subscribed users
  // ...
}
```

## Client Component

We've created a push notification button component that allows users to subscribe or unsubscribe from notifications:

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
    // Check if push notifications are supported
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setIsSupported(false);
      return;
    }

    // Check current subscription status
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

      // Get the VAPID public key from environment variable
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        console.error('VAPID public key is not configured');
        return;
      }

      // Subscribe to push notifications
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      // Send the subscription to the server
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

      // Unsubscribe from push manager
      await subscription.unsubscribe();

      // Remove subscription from server
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
    return null; // Don't show the button if push notifications aren't supported
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

## Service Worker Configuration

We've created a dedicated service worker file for handling push notifications:

`public/sw-push.js`

```javascript
// Handle push events
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    // Parse the notification data
    const data = event.data.json();
    
    // Show the notification
    const promiseChain = self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data: {
        url: data.url || '/',
        timestamp: data.timestamp || new Date().getTime()
      },
      actions: data.actions || [],
      vibrate: [100, 50, 100],
      requireInteraction: data.requireInteraction || false
    });
    
    event.waitUntil(promiseChain);
  } catch (error) {
    console.error('Error showing push notification:', error);
  }
});

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  // Close the notification
  event.notification.close();
  
  // Get the notification data
  const data = event.notification.data;
  
  // Handle action button clicks
  if (event.action) {
    console.log(`User clicked notification action: ${event.action}`);
    // You can handle specific actions here
  }
  
  // Open the target URL when notification is clicked
  if (data && data.url) {
    // Check if there's already a window/tab open with this URL
    const urlToOpen = new URL(data.url, self.location.origin).href;
    
    const promiseChain = clients.matchAll({
      type: 'window',