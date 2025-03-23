# iOS In-App Purchase Implementation Guide

This guide explains how to implement iOS native in-app purchases in your Next.js PWA application when packaged for the App Store using PWABuilder.

## Overview

When publishing a PWA to the Apple App Store using PWABuilder, you need to implement native in-app purchases instead of web-based payment methods to comply with Apple's guidelines. This guide provides a comprehensive approach to implementing StoreKit integration for in-app purchases.

## Prerequisites

1. A Next.js application (this project)
2. An Apple Developer account ($99/year)
3. PWABuilder for packaging your PWA as an iOS app
4. App Store Connect setup with in-app purchase products configured

## Implementation Steps

### 1. Set Up Your App in App Store Connect

1. Register your app in App Store Connect
2. Configure in-app purchase products:
   - Go to your app in App Store Connect
   - Navigate to "Features" > "In-App Purchases"
   - Add your products (consumables, non-consumables, subscriptions)
   - Fill in all required information including pricing, descriptions, etc.

### 2. Implement StoreKit Integration

We've created utility functions to interact with StoreKit when your app is running as a PWA on iOS:

```typescript
// lib/payment/in-app-purchase.ts
```

This file contains:
- Functions to detect iOS PWA environment
- StoreKit initialization
- Product fetching
- Purchase processing
- Receipt verification
- Purchase restoration

### 3. Create In-App Purchase Button Component

We've implemented a button component that handles in-app purchases:

```typescript
// components/payment/in-app-purchase-button.tsx
```

This component:
- Checks if the environment supports in-app purchases
- Fetches product details
- Handles the purchase flow
- Provides success/error callbacks

### 4. Integrate with Checkout Flow

Update your checkout flow to include in-app purchases when running as an iOS PWA:

1. Modify your checkout component to detect iOS PWA environment
2. Show appropriate payment options based on the environment
3. Handle purchase completion and verification

### 5. Test In-App Purchases

We've created a test page to help you test in-app purchases during development:

```
/[locale]/in-app-purchase
```

This page allows you to:
- View available products
- Test purchases in a development environment
- Restore previous purchases
- See environment information

## PWABuilder Configuration

When packaging your PWA with PWABuilder for iOS, you need to configure it to support in-app purchases:

1. In PWABuilder, select your PWA and choose iOS packaging
2. Enable the "In-App Purchase" capability
3. Configure your Apple Developer Team ID and Bundle Identifier
4. Make sure your app's `Info.plist` includes the necessary StoreKit configurations

## Server-Side Receipt Validation

For production use, you should implement server-side receipt validation:

1. Create an API endpoint to receive purchase receipts
2. Verify receipts with Apple's App Store server
3. Update user entitlements based on verified purchases

Example server endpoint (not implemented in this demo):

```typescript
// app/api/verify-receipt/route.ts
async function POST(request) {
  const { receipt } = await request.json();
  
  // Send receipt to Apple's verification server
  const response = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
    method: 'POST',
    body: JSON.stringify({
      'receipt-data': receipt,
      'password': process.env.APP_STORE_SHARED_SECRET
    })
  });
  
  const result = await response.json();
  
  // Process verification result
  // Update user entitlements in your database
  
  return Response.json({ success: true });
}
```

## Testing in Development

During development, our implementation provides a simulated environment:

1. The `isIOSPWA()` function detects if the app is running as a PWA on iOS
2. The `isStoreKitAvailable()` function checks for StoreKit availability
3. Mock implementations simulate the purchase flow for testing

To test in a real environment:

1. Package your PWA using PWABuilder
2. Install the resulting iOS app on a test device
3. Use Apple's sandbox environment for test purchases

## Troubleshooting

- **StoreKit not available**: Make sure your app is properly configured in PWABuilder with the in-app purchase capability
- **Products not loading**: Verify your product IDs match those in App Store Connect
- **Purchases failing**: Check your receipt validation implementation and Apple Developer account status
- **App rejection**: Ensure you're not offering alternative payment methods that bypass Apple's in-app purchase system

## Resources

- [Apple StoreKit Documentation](https://developer.apple.com/documentation/storekit)
- [PWABuilder iOS Documentation](https://docs.pwabuilder.com/#/builder/ios)
- [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [In-App Purchase Programming Guide](https://developer.apple.com/library/archive/documentation/NetworkingInternet/Conceptual/StoreKitGuide/Introduction.html)

## Conclusion

Implementing iOS native in-app purchases is essential for publishing your PWA to the App Store. By following this guide, you can create a seamless purchase experience that complies with Apple's guidelines while maintaining your PWA's functionality.