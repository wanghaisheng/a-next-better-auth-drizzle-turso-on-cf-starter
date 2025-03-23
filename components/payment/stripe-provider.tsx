"use client";

import { ReactNode, useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/payment/payment-utils";

/**
 * Stripe provider component
 * Wraps children with Stripe Elements provider for payment functionality
 */
export default function StripeProvider({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  // Get the Stripe instance
  const stripePromise = getStripe();

  // Use useEffect to ensure code only runs on client
  useEffect(() => {
    setMounted(true);
  }, []);

  // Only render on client side to prevent hydration mismatch
  if (!mounted) {
    return <>{children}</>; // Return children without Stripe Elements
  }

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
