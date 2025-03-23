\"use client";

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