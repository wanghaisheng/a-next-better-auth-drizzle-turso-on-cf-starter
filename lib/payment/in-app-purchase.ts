"use client";

/**
 * iOS In-App Purchase utilities for PWA
 * This file contains functions to interact with Apple's StoreKit for in-app purchases
 * when the app is running as a PWA on iOS devices
 */

// Product types based on Apple's StoreKit
export enum IAPProductType {
  CONSUMABLE = 'consumable',
  NON_CONSUMABLE = 'non-consumable',
  AUTO_RENEWABLE_SUBSCRIPTION = 'auto-renewable-subscription',
  NON_RENEWABLE_SUBSCRIPTION = 'non-renewable-subscription'
}

// Product interface
export interface IAPProduct {
  id: string;
  name: string;
  description: string;
  price: number; // Price in local currency
  priceFormatted: string; // Formatted price string
  type: IAPProductType;
  currency: string;
}

// Sample products for testing
export const sampleProducts: IAPProduct[] = [
  {
    id: 'com.example.premium_monthly',
    name: 'Premium Subscription (Monthly)',
    description: 'Access to all premium features for one month',
    price: 4.99,
    priceFormatted: '$4.99',
    type: IAPProductType.AUTO_RENEWABLE_SUBSCRIPTION,
    currency: 'USD'
  },
  {
    id: 'com.example.premium_yearly',
    name: 'Premium Subscription (Yearly)',
    description: 'Access to all premium features for one year (Save 16%)',
    price: 49.99,
    priceFormatted: '$49.99',
    type: IAPProductType.AUTO_RENEWABLE_SUBSCRIPTION,
    currency: 'USD'
  },
  {
    id: 'com.example.coins_100',
    name: '100 Coins',
    description: 'Purchase 100 coins to use in the app',
    price: 0.99,
    priceFormatted: '$0.99',
    type: IAPProductType.CONSUMABLE,
    currency: 'USD'
  }
];

// Purchase result interface
export interface IAPPurchaseResult {
  success: boolean;
  productId?: string;
  transactionId?: string;
  receipt?: string;
  error?: string;
}

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
  
  // Check if StoreKit API is available
  // Note: This is a mock check as actual StoreKit API would be injected by iOS when properly configured
  return typeof (window as any).storekit !== 'undefined';
};

/**
 * Initialize StoreKit
 * This is a mock implementation as actual initialization would depend on the PWA configuration
 */
export const initializeStoreKit = async (): Promise<boolean> => {
  try {
    // In a real implementation, this would initialize the StoreKit API
    // For now, we'll just simulate success/failure based on environment
    
    console.log('Initializing StoreKit...');
    
    // Simulate initialization delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // For testing purposes, we'll return true to simulate successful initialization
    return true;
  } catch (error) {
    console.error('Failed to initialize StoreKit:', error);
    return false;
  }
};

/**
 * Fetch available products from the App Store
 * This is a mock implementation that returns sample products
 */
export const fetchProducts = async (): Promise<IAPProduct[]> => {
  try {
    // In a real implementation, this would call StoreKit to fetch products
    // For now, we'll just return sample products
    
    console.log('Fetching products from App Store...');
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return sampleProducts;
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
};

/**
 * Purchase a product
 * This is a mock implementation that simulates a purchase flow
 */
export const purchaseProduct = async (productId: string): Promise<IAPPurchaseResult> => {
  try {
    // In a real implementation, this would call StoreKit to initiate a purchase
    console.log(`Initiating purchase for product: ${productId}`);
    
    // Simulate purchase process delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // For testing purposes, we'll simulate a successful purchase most of the time
    const isSuccessful = Math.random() > 0.2; // 80% success rate
    
    if (isSuccessful) {
      // Generate a mock transaction ID
      const transactionId = `mock_transaction_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Generate a mock receipt
      const receipt = btoa(JSON.stringify({
        productId,
        purchaseDate: new Date().toISOString(),
        transactionId
      }));
      
      return {
        success: true,
        productId,
        transactionId,
        receipt
      };
    } else {
      // Simulate a purchase failure
      return {
        success: false,
        productId,
        error: 'Purchase was cancelled by user.'
      };
    }
  } catch (error) {
    console.error('Purchase failed:', error);
    return {
      success: false,
      productId,
      error: error instanceof Error ? error.message : 'Unknown error during purchase'
    };
  }
};

/**
 * Verify a purchase receipt with the server
 * In a real implementation, this would send the receipt to your server for validation with Apple
 */
export const verifyPurchase = async (receipt: string): Promise<boolean> => {
  try {
    // In a real implementation, this would call your server to verify the receipt with Apple
    console.log('Verifying purchase receipt with server...');
    
    // Simulate server verification delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // For testing purposes, we'll always return true
    return true;
  } catch (error) {
    console.error('Failed to verify purchase:', error);
    return false;
  }
};

/**
 * Restore previous purchases
 * This is a mock implementation that simulates restoring purchases
 */
export const restorePurchases = async (): Promise<IAPPurchaseResult[]> => {
  try {
    // In a real implementation, this would call StoreKit to restore purchases
    console.log('Restoring previous purchases...');
    
    // Simulate restore process delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For testing purposes, we'll return a mock restored purchase
    return [
      {
        success: true,
        productId: 'com.example.premium_yearly',
        transactionId: `restored_transaction_${Date.now()}`,
        receipt: btoa(JSON.stringify({
          productId: 'com.example.premium_yearly',
          purchaseDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
          transactionId: `original_transaction_${Date.now() - 30 * 24 * 60 * 60 * 1000}`
        }))
      }
    ];
  } catch (error) {
    console.error('Failed to restore purchases:', error);
    return [];
  }
};