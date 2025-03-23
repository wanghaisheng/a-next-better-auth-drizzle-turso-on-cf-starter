import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { pushSubscriptions } from '@/db/auth';
import { eq } from 'drizzle-orm';

// You would need to install web-push package
// npm install web-push
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
  try {
    const { title, body, url } = await request.json();

    if (!title || !body) {
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

    // Get all subscriptions
    const subscriptions = await db
      .select()
      .from(pushSubscriptions);

    if (!subscriptions.length) {
      return NextResponse.json(
        { error: 'No subscriptions found' },
        { status: 404 }
      );
    }

    // Send notification to all subscribed devices
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