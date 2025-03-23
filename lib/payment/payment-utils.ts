"use client";

import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

/**
 * Get the Stripe instance (cached)
 */
export const getStripe = () => {
  if (!stripePromise && typeof window !== 'undefined') {
    const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
    if (!key) {
      console.warn('Stripe publishable key is not set in environment variables');
    }
    stripePromise = loadStripe(key || '');
  }
  return stripePromise;
};

/**
 * Format currency amount from cents to readable format
 */
export const formatCurrency = (amount: number, currency: string = "USD") => {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch (error) {
    console.error('Error formatting currency:', error);
    return `${(amount / 100).toFixed(2)} ${currency}`;
  }
};

/**
 * Check if Apple Pay is supported in the current browser/device
 */
export const isApplePaySupported = async (): Promise<boolean> => {
  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') return false;

    // Check if Apple Pay is available in this browser
    if (!window.ApplePaySession) return false;

    // Check if the device/browser can make Apple Pay payments
    return ApplePaySession.canMakePayments();
  } catch (error) {
    console.error('Error checking Apple Pay support:', error);
    return false;
  }
};

/**
 * Default product for demonstration purposes
 */
export const defaultProduct = {
  id: "premium-subscription",
  name: "Premium Subscription",
  price: 1999, // $19.99 in cents
  currency: "USD",
  description: "Access to all premium features for one month",
};

/**
 * Interface for payment result
 */
export interface PaymentResult {
  success: boolean;
  error?: string;
  paymentIntent?: any;
}
