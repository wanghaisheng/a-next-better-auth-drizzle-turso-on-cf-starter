# iOS In-App Purchase Integration Guide for PWA

This guide provides a comprehensive approach to implementing iOS native in-app purchases in your Next.js PWA when packaged for the App Store using PWABuilder. It covers detection of the PWA environment, StoreKit integration, purchase flow, and receipt validation.

## Overview

When publishing a PWA to the Apple App Store using PWABuilder, you must implement native in-app purchases instead of web-based payment methods to comply with Apple's guidelines. This guide explains how to integrate with Apple's StoreKit framework to enable in-app purchases in your PWA.

## Prerequisites

1. **A fully functional PWA** with:
   - Valid web app manifest
   - Service worker for offline functionality
   - Responsive design that works well on iOS devices

2. **An Apple Developer Account** ($99/year)
   - Register at [developer.apple.com](https://developer.apple.com)

3. **PWABuilder** for packaging your PWA as an iOS app
   - Visit [PWABuilder.com](https://www.pwabuilder.com/)

4. **App Store Connect** setup with in-app purchase products configured
   - Create your app in App Store Connect
   - Configure in-app purchase products

## Implementation Steps

### 1. Configure PWABuilder for In-App Purchases

When packaging your PWA with PWABuilder for iOS, you need to enable in-app purchase capabilities:

1. Visit [PWABuilder.com](https://www.pwabuilder.com/) and enter your PWA's URL
2. Select the iOS platform for packaging
3. In the advanced options, enable the "In-App Purchase Capability"
4. Configure your Apple Developer Team ID and Bundle Identifier
5. Generate and download the iOS package

### 2. Set Up Products in App Store Connect

1. Log in to [App Store Connect](https://appstoreconnect.apple.com/)
2. Navigate to your app > Features > In-App Purchases
3. Add your products with the following information:
   - Product ID (e.g., `com.yourcompany.app.product1`)
   - Product type (consumable, non-consumable, subscription)
   - Reference name (for your internal use)
   - Price tier
   - Display name
   - Description
   - Review information

### 3. Implement StoreKit Detection in Your PWA

Create utility functions to detect when your app is running as a PWA on iOS with StoreKit available:

```typescript
// lib/payment/in-app-purchase.ts

/**
 * Check if the app is running as a PWA on iOS
 */
export const isIOSPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if running in standalone mode (PWA installed)
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                      (window.navigator as any).standalone === true;
  
  // Check if running on iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
  
  return isStandalone && isIOS;
};

/**
 * Check if StoreKit is available
 * This will only work when the app is properly configured as a PWA and running on iOS
 */
export const isStoreKitAvailable = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Check if the app is running as a PWA on iOS
  if (!isIOSPWA()) return false;
  
  // Check if StoreKit API is available through the webkit message handlers
  return (
    typeof (window as any).webkit !== 'undefined' &&
    typeof (window as any).webkit.messageHandlers !== 'undefined' &&
    typeof (window as any).webkit.messageHandlers.storeKit !== 'undefined'
  );
};
```

### 4. Implement StoreKit Bridge Functions

Create functions to communicate with the native StoreKit framework through the JavaScript bridge:

```typescript
// lib/payment/in-app-purchase.ts

// Product interface
export interface IAPProduct {
  id: string;
  name: string;
  description: string;
  price: number; // Price in local currency
  priceFormatted: string; // Formatted price string
  type: string; // 'consumable', 'non-consumable', 'auto-renewable-subscription', etc.
  currency: string;
}

// Purchase result interface
export interface IAPPurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  receipt?: string;
  error?: string;
}

/**
 * Initialize StoreKit
 */
export const initializeStoreKit = async (): Promise<boolean> => {
  if (!isStoreKitAvailable()) return false;
  
  try {
    // Call the native StoreKit initialization method
    return new Promise((resolve) => {
      window.storeKitInitCallback = (result: string) => {
        const success = JSON.parse(result).success;
        resolve(success);
        delete window.storeKitInitCallback;
      };
      
      (window as any).webkit.messageHandlers.storeKit.postMessage({
        action: 'initialize',
        callback: 'storeKitInitCallback'
      });
    });
  } catch (error) {
    console.error('Failed to initialize StoreKit:', error);
    return false;
  }
};

/**
 * Fetch available products from the App Store
 */
export const fetchProducts = async (productIds: string[]): Promise<IAPProduct[]> => {
  if (!isStoreKitAvailable()) return [];
  
  try {
    return new Promise((resolve) => {
      window.storeKitProductsCallback = (products: string) => {
        resolve(JSON.parse(products));
        delete window.storeKitProductsCallback;
      };
      
      (window as any).webkit.messageHandlers.storeKit.postMessage({
        action: 'getProducts',
        productIds: productIds,
        callback: 'storeKitProductsCallback'
      });
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
};

/**
 * Purchase a product
 */
export const purchaseProduct = async (productId: string): Promise<IAPPurchaseResult> => {
  if (!isStoreKitAvailable()) {
    return {
      success: false,
      error: 'StoreKit is not available'
    };
  }
  
  try {
    return new Promise((resolve) => {
      window.storeKitPurchaseCallback = (result: string) => {
        resolve(JSON.parse(result));
        delete window.storeKitPurchaseCallback;
      };
      
      (window as any).webkit.messageHandlers.storeKit.postMessage({
        action: 'purchaseProduct',
        productId: productId,
        callback: 'storeKitPurchaseCallback'
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during purchase'
    };
  }
};

/**
 * Restore previous purchases
 */
export const restorePurchases = async (): Promise<IAPPurchaseResult[]> => {
  if (!isStoreKitAvailable()) return [];
  
  try {
    return new Promise((resolve) => {
      window.storeKitRestoreCallback = (results: string) => {
        resolve(JSON.parse(results));
        delete window.storeKitRestoreCallback;
      };
      
      (window as any).webkit.messageHandlers.storeKit.postMessage({
        action: 'restorePurchases',
        callback: 'storeKitRestoreCallback'
      });
    });
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return [];
  }
};
```

### 5. Create In-App Purchase Button Component

Implement a React component that handles in-app purchases:

```typescript
// components/payment/in-app-purchase-button.tsx

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  isIOSPWA,
  isStoreKitAvailable,
  initializeStoreKit,
  fetchProducts,
  purchaseProduct,
  IAPProduct,
  IAPPurchaseResult
} from "@/lib/payment/in-app-purchase";

interface InAppPurchaseButtonProps {
  productId: string;
  fallbackLabel?: string;
  onSuccess: (purchaseResult: IAPPurchaseResult) => void;
  onError: (error: Error) => void;
}

export default function InAppPurchaseButton({
  productId,
  fallbackLabel = "Buy Now",
  onSuccess,
  onError,
}: InAppPurchaseButtonProps) {
  const [loading, setLoading] = useState(false);
  const [product, setProduct] = useState<IAPProduct | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Check if StoreKit is available and fetch product details
  useEffect(() => {
    setMounted(true);
    
    const checkAvailability = async () => {
      try {
        // Check if running as PWA on iOS with StoreKit available
        const available = isIOSPWA() && isStoreKitAvailable();
        setIsAvailable(available);
        
        if (available) {
          // Initialize StoreKit
          await initializeStoreKit();
          
          // Fetch products
          const products = await fetchProducts([productId]);
          
          // Find the requested product
          if (products.length > 0) {
            setProduct(products[0]);
          }
        }
      } catch (error) {
        console.error("Error initializing in-app purchase:", error);
        setIsAvailable(false);
      }
    };
    
    checkAvailability();
  }, [productId]);

  // Handle purchase
  const handlePurchase = async () => {
    if (!isAvailable || !product) {
      onError(new Error("In-app purchase is not available"));
      return;
    }
    
    setLoading(true);
    
    try {
      // Initiate purchase
      const purchaseResult = await purchaseProduct(productId);
      
      if (purchaseResult.success) {
        onSuccess(purchaseResult);
      } else {
        onError(new Error(purchaseResult.error || "Purchase failed"));
      }
    } catch (error) {
      onError(error instanceof Error ? error : new Error("Unknown error during purchase"));
    } finally {
      setLoading(false);
    }
  };

  // Only render on client side to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // If StoreKit is not available, don't render anything
  if (!isAvailable) {
    return null;
  }

  return (
    <Button
      className="w-full"
      disabled={loading || !product}
      onClick={handlePurchase}
    >
      {loading ? "Processing..." : product ? `Buy ${product.name} (${product.priceFormatted})` : fallbackLabel}
    </Button>
  );
}
```

### 6. Implement Server-Side Receipt Validation

Create an API endpoint to verify purchase receipts with Apple's servers:

```typescript
// app/api/verify-receipt/route.ts

import { NextResponse } from 'next/server';

// Apple's production and sandbox verification URLs
const APPLE_PRODUCTION_URL = 'https://buy.itunes.apple.com/verifyReceipt';
const APPLE_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt';

export async function POST(request: Request) {
  try {
    const { receipt } = await request.json();
    
    if (!receipt) {
      return NextResponse.json({ success: false, error: 'Receipt data is required' }, { status: 400 });
    }
    
    // First try production environment
    let verificationResult = await verifyWithApple(receipt, APPLE_PRODUCTION_URL);
    
    // If status is 21007, it's a sandbox receipt, so try sandbox environment
    if (verificationResult.status === 21007) {
      verificationResult = await verifyWithApple(receipt, APPLE_SANDBOX_URL);
    }
    
    // Check if verification was successful
    if (verificationResult.status === 0) {
      // Process the receipt data and update user entitlements in your database
      // This depends on your specific application logic
      
      return NextResponse.json({ 
        success: true, 
        data: {
          latestReceiptInfo: verificationResult.latest_receipt_info,
          receipt: verificationResult.receipt
        }
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: `Receipt verification failed with status: ${verificationResult.status}` 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error verifying receipt:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'An error occurred during receipt verification' 
    }, { status: 500 });
  }
}

async function verifyWithApple(receipt: string, url: string) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      'receipt-data': receipt,
      'password': process.env.APP_STORE_SHARED_SECRET, // Your App Store Connect shared secret
      'exclude-old-transactions': true
    })
  });
  
  return await response.json();
}
```

### 7. Integrate In-App Purchases into Your Checkout Flow

Update your checkout component to use in-app purchases when running as an iOS PWA:

```typescript
// components/payment/checkout-form.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import InAppPurchaseButton from "./in-app-purchase-button";
import ApplePayButton from "./apple-pay-button";
import { isIOSPWA, isStoreKitAvailable } from "@/lib/payment/in-app-purchase";

export default function CheckoutForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Example product data
  const product = {
    id: "com.example.premium_monthly",
    name: "Premium Subscription",
    price: 1999, // $19.99 in cents
    currency: "USD",
  };

  // Check if running on iOS PWA
  useEffect(() => {
    setMounted(true);
    setIsIOS(isIOSPWA());
  }, []);

  // Handle in-app purchase success
  const handleIAPSuccess = async (purchaseResult: any) => {
    setLoading(true);
    try {
      // Send the receipt to your server for verification
      const response = await fetch("/api/verify-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt: purchaseResult.receipt,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Navigate to success page
        router.push("/checkout/success");
      } else {
        setError("Failed to verify purchase. Please contact support.");
      }
    } catch (err) {
      setError("An error occurred after payment. Please contact support.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle in-app purchase error
  const handleIAPError = (error: Error) => {
    setError(error.message);
    setLoading(false);
  };

  // Handle Apple Pay success
  const handleApplePaySuccess = (paymentMethod: any) => {
    // Process regular Apple Pay payment
    router.push("/checkout/success");
  };

  // Only render on client side to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Checkout</h2>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="p-4 border rounded-md">
        <h3 className="font-medium">{product.name}</h3>
        <p className="text-gray-500">Access to all premium features</p>
        <p className="text-xl font-bold mt-2">
          ${(product.price / 100).toFixed(2)} {product.currency}
        </p>
      </div>
      
      <div className="space-y-4">
        {/* Show In-App Purchase button when running as iOS PWA */}
        {isIOS && isStoreKitAvailable() ? (
          <InAppPurchaseButton
            productId={product.id}
            onSuccess={handleIAPSuccess}
            onError={handleIAPError}
          />
        ) : (
          <>
            {/* Show Apple Pay button for regular web payment */}
            <ApplePayButton
              amount={product.price}
              currency={product.currency}
              label={product.name}
              onSuccess={handleApplePaySuccess}
              onError={(err) => setError(err.message)}
            />
            
            {/* Regular checkout button */}
            <Button 
              className="w-full" 
              disabled={loading}
              onClick={() => {
                // Handle regular payment flow
              }}
            >
              {loading ? "Processing..." : "Pay with Card"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
```

### 8. Create a Test Page for In-App Purchases

Create a dedicated page to test in-app purchases during development:

```typescript
// app/[locale]/in-app-purchase/page.tsx

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  isIOSPWA,
  isStoreKitAvailable,
  initializeStoreKit,
  fetchProducts,
  purchaseProduct,
  restorePurchases,
  IAPProduct,
  IAPPurchaseResult
} from "@/lib/payment/in-app-purchase";

export default function InAppPurchasePage() {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [purchaseResult, setPurchaseResult] = useState<IAPPurchaseResult | null>(null);
  const [restoredPurchases, setRestoredPurchases] = useState<IAPPurchaseResult[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Environment information
  const isIOS = isIOSPWA();
  const isStoreKit = isStoreKitAvailable();
  
  // Initialize StoreKit and fetch products
  useEffect(() => {
    const init = async () => {
      try {
        if (isIOS && isStoreKit) {
          setLoading(true);
          
          // Initialize StoreKit
          const initResult = await initializeStoreKit();
          setInitialized(initResult);
          
          if (initResult) {
            // Fetch products
            const productIds = [
              'com.example.premium_monthly',
              'com.example.premium_yearly',
              'com.example.coins_100'
            ];
            
            const fetchedProducts = await fetchProducts(productIds);
            setProducts(fetchedProducts);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to initialize');
      } finally {
        setLoading(false);
      }
    };
    
    init();
  }, [isIOS, isStoreKit]);
  
  // Handle purchase
  const handlePurchase = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      setPurchaseResult(null);
      
      const result = await purchaseProduct(productId);
      setPurchaseResult(result);
      
      if (result.success && result.receipt) {
        // In a real app, you would verify the receipt with your server
        console.log('Purchase successful, receipt:', result.receipt);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle restore purchases
  const handleRestore = async () => {
    try {
      setLoading(true);
      setError(null);
      setRestoredPurchases([]);
      
      const restored = await restorePurchases();
      setRestoredPurchases(restored);
      
      if (restored.length === 0) {
        setError('No purchases to restore');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restore purchases');
    } finally {
      setLoading(false);
    }
  };
  
  // If not running as iOS PWA, show information
  if (!isIOS) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">In-App Purchase Test</h1>
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md mb-4">
          This page is designed to test in-app purchases when running as a PWA on iOS.
          You are currently not running in an iOS PWA environment.
        </div>
        
        <div className="p-4 border rounded-md">
          <h2 className="font-medium mb-2">Environment Information</h2>
          <p><strong>iOS PWA:</strong> {isIOS ? 'Yes' : 'No'}</p>
          <p><strong>StoreKit Available:</strong> {isStoreKit ? 'Yes' : 'No'}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4">In-App Purchase Test</h1>
      
      {error && (
        <div className="p-4 bg-red-100 text-red-700 rounded-md mb-4">
          {error}
        </div>
      )}
      
      <div className="p-4 border rounded-md mb-6">
        <h2 className="font-medium mb-2">Environment Information</h2>
        <p><strong>iOS PWA:</strong> {isIOS ? 'Yes' : 'No'}</p>
        <p><strong>StoreKit Available:</strong> {isStoreKit ? 'Yes' : 'No'}</p>
        <p><strong>Initialized:</strong> {initialized ? 'Yes' : 'No'}</p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Available Products</h2>
        
        {loading && <p>Loading products...</p>}
        
        {products.length === 0 && !loading ? (
          <p>No products available</p>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="p-4 border rounded-md">
                <h3 className="font-medium">{product.name}</h3>
                <p className="text-sm text-gray-500">{product.description}</p>
                <p className="font-bold mt-1">{product.priceFormatted}</p>
                <Button
                  className="w-full mt-2"
                  disabled={loading}
                  onClick={() => handlePurchase(product.id)}
                >
                  {loading ? 'Processing...' : `Buy ${product.name}`}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Restore Purchases</h2>
        <Button
          className="w-full"
          variant="outline"
          disabled={loading}
          onClick={handleRestore}
        >
          {loading ? 'Processing...' : 'Restore Purchases'}
        </Button>
        
        {restoredPurchases.length > 0 && (
          <div className="mt-4">
            <h3 className="font-medium mb-2">Restored Purchases:</h3>
            <ul className="list-disc pl-5">
              {restoredPurchases.map((purchase, index) => (
                <li key={index}>
                  {purchase.productId} (Transaction: {purchase.transactionId})
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {purchaseResult && (
        <div className="p-4 border rounded-md">
          <h2 className="font-medium mb-2">Last Purchase Result</h2>
          <p><strong>Success:</strong> {purchaseResult.success ? 'Yes' : 'No'}</p>
          {purchaseResult.productId && (
            <p><strong>Product:</strong> {purchaseResult.productId}</p>
          )}
          {purchaseResult.transactionId && (
            <p><strong>Transaction:</strong> {purchaseResult.transactionId}</p>
          )}
          {purchaseResult.error && (
            <p><strong>Error:</strong> {purchaseResult.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

## Testing In-App Purchases

### Development Testing

During development, you can test in-app purchases using the following approaches:

1. **Mock Implementation**
   - The implementation provided in this guide includes mock functions that simulate the in-app purchase flow
   - This allows you to test the UI and flow without actual StoreKit integration

2. **Safari Web Inspector**
   - Use Safari's Web Inspector to debug your PWA when running on iOS
   - Connect your iOS device to a Mac and enable Web Inspector in Safari settings

3. **Test Page**
   - Use the test page we created (`/in-app-purchase`) to test the purchase flow
   - This page shows environment information and available products

### Testing in a Real Environment

To test with actual StoreKit integration:

1. **Package your PWA using PWABuilder**
   - Enable the In-App Purchase capability
   - Configure your Apple Developer Team ID and Bundle Identifier

2. **Install the resulting iOS app on a test device**
   - Use Xcode to install the app on your device
   - Or use TestFlight for wider testing

3. **Use Apple's Sandbox Environment**
   - Create sandbox test accounts in App Store Connect
   - Use these accounts to test purchases without actual charges

## Troubleshooting

### Common Issues

1. **StoreKit Not Available**
   - Ensure your app is properly packaged with PWABuilder
   - Verify the In-App Purchase capability is enabled
   - Check that you're running as an installed PWA, not
import