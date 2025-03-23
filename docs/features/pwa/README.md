# Progressive Web App (PWA) Implementation Guide

This guide explains how to add Progressive Web App (PWA) functionality to the Next.js Better Auth project, enabling offline capabilities, installability, and an app-like experience for users.

## Available Documentation

- [Implementation Example](./implementation-example.md) - Step-by-step guide to implement PWA in this project
- [iOS App Store Guide](./ios-app-store-guide.md) - How to package your PWA for the iOS App Store
- [PWABuilder iOS Guide](./pwabuilder-ios-guide.md) - Detailed guide for using PWABuilder to package and submit your PWA to the iOS App Store

## What is a PWA?

A Progressive Web App (PWA) provides an app-like experience in a web application, allowing:

- **Offline functionality** - Works without an internet connection
- **Installability** - Can be added to home screen
- **Background synchronization** - Updates data when reconnected
- **Push notifications** - Engages users with timely updates
- **App-like interface** - Full-screen mode without browser UI

## Implementation Steps

### 1. Install Required Dependencies

First, we need to add the necessary dependencies to the project:

```bash
bun add next-pwa
```

If you're using workbox for more advanced service worker customization:

```bash
bun add workbox-window workbox-core workbox-routing workbox-strategies workbox-precaching
```

### 2. Create a Web App Manifest

The Web App Manifest is a JSON file that provides information about your web application to the browser.

Create a file named `manifest.json` in the `public` directory:

```json
{
  "name": "Next.js Better Auth",
  "short_name": "BetterAuth",
  "description": "Next.js authentication application with Drizzle ORM and Turso database",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### 3. Create App Icons

Create icons for your PWA in the `public/icons` directory:

- `icon-192x192.png` (192×192 pixels)
- `icon-512x512.png` (512×512 pixels)

You can generate these from your app logo using tools like [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator).

### 4. Configure next-pwa

Update your `next.config.ts` file to include the PWA configuration:

```typescript
const withPWA = require("next-pwa")({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  // ... your existing Next.js config
};

module.exports = withPWA(nextConfig);
```

### 5. Update the Layout Component

Add the manifest link and theme color meta tags to your root layout file (`app/layout.tsx`):

```tsx
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <meta name="application-name" content="Next.js Better Auth" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="BetterAuth" />
        <meta name="description" content="Next.js authentication application with Drizzle ORM and Turso" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#000000" />

        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 6. Create a Custom Service Worker (Optional)

For more advanced scenarios, you can create a custom service worker in `public/sw.js`:

```javascript
self.addEventListener('install', (event) => {
  console.log('Service worker installed');
});

self.addEventListener('activate', (event) => {
  console.log('Service worker activated');
});

// Basic offline fallback
const FALLBACK_HTML = '/offline.html';

self.addEventListener('fetch', (event) => {
  event.respondWith(
    fetch(event.request)
      .catch(() => {
        // Return the offline page for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match(FALLBACK_HTML);
        }
        // Just fail for other requests
        return new Response('Network error', {
          status: 408,
          headers: { 'Content-Type': 'text/plain' },
        });
      })
  );
});
```

### 7. Create an Offline Page

Create a simple offline page at `public/offline.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Offline - Next.js Better Auth</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem;
      text-align: center;
    }
    h1 {
      font-size: 2rem;
    }
  </style>
</head>
<body>
  <h1>You're offline</h1>
  <p>Please check your internet connection and try again.</p>
</body>
</html>
```

## Testing PWA Functionality

To test your PWA implementation:

1. Build and start the production server:
   ```bash
   bun run build
   bun run start
   ```

2. Open Chrome DevTools, go to the "Application" tab
3. Look for the "Manifest" and "Service Workers" sections
4. Verify the manifest is loaded correctly
5. Check if the service worker is registered

## Implementing Offline Data Storage

For an authentication app, you might want to implement offline data storage to allow users to access certain features without an internet connection.

### Using IndexedDB

```typescript
// lib/idb.ts
export async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('betterAuthDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = () => {
      const db = request.result;

      // Create stores for offline data
      if (!db.objectStoreNames.contains('userProfile')) {
        db.createObjectStore('userProfile', { keyPath: 'id' });
      }

      // Add more stores as needed
    };
  });
}

// Example: Saving user profile for offline access
export async function saveUserProfile(profile) {
  const db = await openDB();
  const tx = db.transaction('userProfile', 'readwrite');
  const store = tx.objectStore('userProfile');
  store.put(profile);
  return tx.complete;
}

// Example: Reading user profile offline
export async function getUserProfile(id) {
  const db = await openDB();
  const tx = db.transaction('userProfile', 'readonly');
  const store = tx.objectStore('userProfile');
  return store.get(id);
}
```

## Advanced PWA Features

### Background Sync

For features like queuing form submissions when offline:

```typescript
// Register sync when a form submission fails
async function submitFormWithSync(data) {
  try {
    // Try to submit the form normally
    await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  } catch (error) {
    // If it fails, store the data and register for sync
    await saveToIndexedDB('pendingSubmissions', data);

    // Register for background sync
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('submit-form');
    }
  }
}
```

In your service worker:

```javascript
// sw.js
self.addEventListener('sync', (event) => {
  if (event.tag === 'submit-form') {
    event.waitUntil(syncFormData());
  }
});

async function syncFormData() {
  // Get pending submissions from IndexedDB
  const pendingSubmissions = await getPendingSubmissionsFromIDB();

  // Try to submit them
  for (const submission of pendingSubmissions) {
    try {
      await fetch('/api/submit', {
        method: 'POST',
        body: JSON.stringify(submission),
      });

      // Remove from IndexedDB if successful
      await removeFromIndexedDB('pendingSubmissions', submission.id);
    } catch (error) {
      // If still offline, this will be tried again next time
      return Promise.reject(new Error('Sync failed, will retry'));
    }
  }
}
```

### Push Notifications

To add push notifications to your PWA:

1. Add VAPID keys to your environment variables:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key
VAPID_PRIVATE_KEY=your_private_key
```

2. Subscribe users to push notifications:

```typescript
// client-side
async function subscribeToPushNotifications() {
  const registration = await navigator.serviceWorker.ready;

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  });

  // Send subscription to server
  await fetch('/api/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription }),
  });
}

// Helper function to convert base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
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
```

3. Handle push events in your service worker:

```javascript
// sw.js
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();

    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: '/icons/icon-192x192.png',
        data: data.url,
      })
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.notification.data) {
    event.waitUntil(
      clients.openWindow(event.notification.data)
    );
  }
});
```

## Considerations for Authentication Apps

When implementing PWA features in an authentication app, consider these security implications:

1. **Offline Storage Security**: Be careful about what user data you store offline
2. **Credential Management**: Consider using the Credential Management API for secure login storage
3. **Token Refresh**: Implement secure token refresh mechanisms for offline-to-online transitions
4. **Sensitive Operations**: Restrict sensitive operations to online-only mode

## Troubleshooting Common Issues

### Service Worker Not Registering

1. Ensure your service worker file is in the correct location
2. Check that you're using HTTPS (required for service workers)
3. Verify the `scope` parameter if you're using a custom path

### Manifest Not Being Detected

1. Ensure the manifest path is correct
2. Validate your manifest JSON using a tool like [PWA Builder](https://www.pwabuilder.com/)
3. Check for MIME type issues on your server

### Caching Strategy Issues

1. Review your caching strategy to ensure it's appropriate for your content
2. Be careful not to over-cache dynamic content
3. Implement versioning in your cache names

## Resources

- [Next-PWA Documentation](https://github.com/shadowwalker/next-pwa)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Web App Manifest Specification](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Google's PWA Checklist](https://web.dev/pwa-checklist/)
