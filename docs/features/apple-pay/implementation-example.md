# Apple Pay Implementation Example

This document provides a concise implementation example for integrating Apple Pay into the Next.js Better Auth project. The example uses Stripe as the payment processor and includes all necessary components.

## Directory Structure

```
├── app/
│   ├── api/
│   │   └── payment/
│   │       └── route.ts           # Payment processing API endpoint
│   └── checkout/
│       ├── page.tsx               # Checkout page
│       └── success/
│           └── page.tsx           # Payment success page
├── components/
│   └── payment/
│       ├── apple-pay-button.tsx   # Apple Pay button component
│       ├── checkout-form.tsx      # Checkout form component
│       └── stripe-provider.tsx    # Stripe provider component
└── lib/
    └── payment/
        └── payment-utils.ts       # Payment utility functions
```

## 1. Environment Setup

Add these variables to your `.env.local` file:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_SECRET_KEY=sk_test_your_key
NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID=merchant.your.identifier
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

## 2. Install Dependencies

```bash
bun add stripe @stripe/stripe-js @stripe/react-stripe-js
```

## 3. Stripe Provider

```tsx
// components/payment/stripe-provider.tsx
"use client";

import { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function StripeProvider({ children }: { children: ReactNode }) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
```

## 4. Apple Pay Button

```tsx
// components/payment/apple-pay-button.tsx
"use client";

import { useEffect, useState } from "react";
import { useStripe, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { PaymentRequest } from "@stripe/stripe-js";

interface ApplePayButtonProps {
  amount: number;
  currency: string;
  label: string;
  onSuccess: (paymentMethod: any) => void;
  onError: (error: Error) => void;
}

export default function ApplePayButton({
  amount,
  currency,
  label,
  onSuccess,
  onError,
}: ApplePayButtonProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);

  useEffect(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "US",
      currency: currency.toLowerCase(),
      total: {
        label,
        amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: false,
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['mastercard', 'visa', 'amex', 'discover'],
    });

    // Check if Apple Pay is available
    pr.canMakePayment().then((result) => {
      if (result && result.applePay) {
        setPaymentRequest(pr);
      }
    });

    // Handle payment method
    pr.on("paymentmethod", async (event) => {
      try {
        // Call your API to process payment
        const response = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethodId: event.paymentMethod.id,
            amount,
            currency,
          }),
        });

        const result = await response.json();

        if (result.success) {
          event.complete("success");
          onSuccess(event.paymentMethod);
        } else {
          event.complete("fail");
          onError(new Error(result.error || "Payment failed"));
        }
      } catch (error) {
        event.complete("fail");
        onError(error instanceof Error ? error : new Error("Unknown error"));
      }
    });
  }, [stripe, amount, currency, label, onSuccess, onError]);

  if (!paymentRequest) {
    return null; // Don't render anything if Apple Pay is not available
  }

  return (
    <PaymentRequestButtonElement
      options={{
        paymentRequest,
        style: {
          paymentRequestButton: {
            type: "buy",
            theme: "dark",
            height: "48px",
          },
        },
      }}
    />
  );
}
```

## 5. Checkout Form

```tsx
// components/payment/checkout-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ApplePayButton from "./apple-pay-button";
import { Button } from "@/components/ui/button";

export default function CheckoutForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Example product data
  const product = {
    name: "Premium Subscription",
    price: 1999, // $19.99 in cents
    currency: "USD",
  };

  const handlePaymentSuccess = async (paymentMethod: any) => {
    setLoading(true);
    try {
      console.log("Payment successful with method:", paymentMethod);
      router.push("/checkout/success");
    } catch (err) {
      setError("An error occurred after payment. Please contact support.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentError = (error: Error) => {
    setError(error.message || "Payment failed. Please try again.");
    setLoading(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          {product.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          ${(product.price / 100).toFixed(2)} {product.currency}
        </p>
      </div>

      <div className="space-y-4">
        {/* Apple Pay Button */}
        <div className="w-full">
          <ApplePayButton
            amount={product.price}
            currency={product.currency}
            label={product.name}
            onSuccess={handlePaymentSuccess}
            onError={handlePaymentError}
          />
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
              Or pay with card
            </span>
          </div>
        </div>

        {/* Regular Card Payment Button */}
        <Button
          className="w-full"
          disabled={loading}
          onClick={() => router.push("/checkout/card-payment")}
        >
          Pay with Card
        </Button>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 text-sm mt-2">{error}</div>
        )}
      </div>
    </div>
  );
}
```

## 6. Checkout Page

```tsx
// app/checkout/page.tsx
import StripeProvider from "@/components/payment/stripe-provider";
import CheckoutForm from "@/components/payment/checkout-form";

export const metadata = {
  title: "Checkout | Next.js Better Auth",
};

export default function CheckoutPage() {
  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <StripeProvider>
        <CheckoutForm />
      </StripeProvider>
    </div>
  );
}
```

## 7. Success Page

```tsx
// app/checkout/success/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Payment Success | Next.js Better Auth",
};

export default function SuccessPage() {
  return (
    <div className="container max-w-md mx-auto py-8 px-4 text-center">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-500 dark:text-green-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Thank you for your purchase. Your transaction has been completed successfully.
        </p>
        <Link href="/dashboard">
          <Button>Return to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
```

## 8. Payment API Endpoint

```tsx
// app/api/payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

// Initialize Stripe with secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export async function POST(request: NextRequest) {
  try {
    const { paymentMethodId, amount, currency } = await request.json();

    // Create a payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      payment_method: paymentMethodId,
      confirm: true,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success`,
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error("Payment processing error:", error);

    const stripeError = error as Stripe.StripeError;
    return NextResponse.json(
      {
        success: false,
        error: stripeError.message || "Payment processing failed"
      },
      { status: 400 }
    );
  }
}
```

## 9. Payment Utilities

```typescript
// lib/payment/payment-utils.ts
import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  }
  return stripePromise;
};

export const formatCurrency = (amount: number, currency: string = "USD") => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
};

export const isApplePaySupported = async (): Promise<boolean> => {
  // Check if we're in a browser environment
  if (typeof window === "undefined") return false;

  // Check if Apple Pay is available in this browser
  if (!window.ApplePaySession) return false;

  // Check if the device/browser can make Apple Pay payments
  return ApplePaySession.canMakePayments();
};
```

## 10. Required Domain Verification

Place the Apple Pay verification file at the correct location:

```bash
mkdir -p next-better-auth-drizzle-turso-on-cf/public/.well-known
# Copy your verification file (received from Apple)
cp apple-developer-merchantid-domain-association next-better-auth-drizzle-turso-on-cf/public/.well-known/
```

## Testing

For testing, use Stripe's test cards with Apple Pay:

1. In development, use ngrok for HTTPS:
   ```bash
   ngrok http 3000
   ```

2. Update your Apple Developer account with the ngrok domain

3. Use these test cards in Apple Pay:
   - Visa: 4242 4242 4242 4242
   - Mastercard: 5555 5555 5555 4444
   - Amex: 3782 822463 10005

## Implementation Notes

1. This example assumes you have the shadcn/ui components installed (`Button` component)
2. Always test thoroughly on real devices before going live
3. For production, ensure your domain verification is updated for your actual domain
4. Consider implementing proper error handling and logging
