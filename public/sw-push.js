// This file contains the push notification event handlers for the service worker

// Handle incoming push events
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
      includeUncontrolled: true
    }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      let matchingClient = null;
      
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // If we find a match, focus it
        if (client.url === urlToOpen) {
          matchingClient = client;
          break;
        }
      }
      
      // If we found a matching client, focus it
      if (matchingClient) {
        return matchingClient.focus();
      }
      
      // Otherwise open a new window/tab
      return clients.openWindow(urlToOpen);
    });
    
    event.waitUntil(promiseChain);
  }
});

// Handle notification close events (optional)
self.addEventListener('notificationclose', (event) => {
  // You can track when users dismiss notifications here
  console.log('User dismissed notification');
});