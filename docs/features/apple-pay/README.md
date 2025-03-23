# Apple Pay Integration Guide

This guide provides comprehensive instructions for integrating Apple Pay into the Next.js Better Auth project. Apple Pay allows users to make secure, frictionless payments using their Apple devices, enhancing the user experience and potentially increasing conversion rates.

## Prerequisites

Before implementing Apple Pay, ensure you have:

1. An Apple Developer account ($99/year)
2. A payment processor/gateway that supports Apple Pay (e.g., Stripe, Square, PayPal)
3. A domain verified with Apple
4. A merchant identifier from Apple
5. A valid SSL certificate for your domain (HTTPS is required)

## Setup Process

### 1. Register with Apple Pay

1. Sign in to your [Apple Developer account](https://developer.apple.com/account)
2. Navigate to "Certificates, Identifiers & Profiles"
3. Select "Identifiers" and add a new Merchant ID
4. Follow the steps to create a merchant identifier (typically starts with `merchant.`)
5. Complete the domain verification process

### 2. Set Up Your Payment Processor

For this guide, we'll use Stripe as an example, but similar concepts apply to other payment processors.

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Navigate to Dashboard > Settings > Payment methods
3. Enable Apple Pay
4. Add your Apple Pay merchant identifier
5. Note your API keys for later integration

### 3. Verify Your Domain with Apple

Apple requires domain verification to use Apple Pay on the web:

1. In your Apple Developer account, go to "Certificates, Identifiers & Profiles"
2. Select your merchant identifier
3. Click "Configure" next to "Apple Pay Merchant Domain"
4. Add your domain and download the verification file
5. Place this file at the web root of your domain (e.g., `/.well-known/apple-developer-merchantid-domain-association`)

### 4. Install Required Dependencies

```bash
bun add @stripe/stripe-js @stripe/react-stripe-js
```

## Implementation

### 1. Environment Variables Setup

Create or update your `.env.local` file with the following variables:

```
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key
STRIPE_SECRET_KEY=sk_test_your_secret_key
NEXT_PUBLIC_APPLE_PAY_MERCHANT_ID=merchant.your.identifier
```

Add these variables to your production environment as well.

### 2. Create Stripe Provider

First, let's create a provider component to initialize Stripe:

```tsx
// components/payment/stripe-provider.tsx
"use client";

import { ReactNode } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface StripeProviderProps {
  children: ReactNode;
}

export default function StripeProvider({ children }: StripeProviderProps) {
  return <Elements stripe={stripePromise}>{children}</Elements>;
}
```

### 3. Create Apple Pay Button Component

Now, let's create an Apple Pay button component:

```tsx
// components/payment/apple-pay-button.tsx
"use client";

import { useState } from "react";
import { useStripe, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { PaymentRequest, StripePaymentRequestButtonElementOptions } from "@stripe/stripe-js";

interface ApplePayButtonProps {
  amount: number;
  currency: string;
  label: string;
  onSuccess: (paymentResult: any) => void;
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

  useState(() => {
    if (!stripe) return;

    const pr = stripe.paymentRequest({
      country: "US", // Change according to your location
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

    // Check if the Payment Request is available (Apple Pay supported)
    pr.canMakePayment().then((result) => {
      if (result && result.applePay) {
        setPaymentRequest(pr);
      }
    });

    // Handle successful payments
    pr.on("paymentmethod", async (e) => {
      try {
        // Here, you would typically call your API to process the payment
        // const response = await fetch('/api/process-payment', {...});

        // For this example, we'll simulate a successful payment
        e.complete("success");
        onSuccess(e.paymentMethod);
      } catch (error) {
        e.complete("fail");
        onError(error as Error);
      }
    });
  }, [stripe, amount, currency, label, onSuccess, onError]);

  if (!paymentRequest) {
    return null; // Don't render anything if Apple Pay is not available
  }

  const options: StripePaymentRequestButtonElementOptions = {
    paymentRequest,
    style: {
      paymentRequestButton: {
        type: "buy", // or "default", "donate"
        theme: "dark", // or "light", "outline"
        height: "48px",
      },
    },
  };

  return <PaymentRequestButtonElement options={options} />;
}
```

### 4. Create Server API Endpoint for Payment Processing

Create an API endpoint to handle the payment on the server:

```tsx
// app/api/process-payment/route.ts
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-08-16", // Use the latest API version
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
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment/confirmation`,
    });

    return NextResponse.json({ success: true, paymentIntent });
  } catch (error) {
    const stripeError = error as Stripe.StripeError;
    return NextResponse.json(
      { success: false, error: stripeError.message },
      { status: 400 }
    );
  }
}
```

### 5. Integrate Apple Pay in a Checkout Page

Now, let's create a checkout page that uses our Apple Pay button:

```tsx
// app/checkout/page.tsx
import StripeProvider from "@/components/payment/stripe-provider";
import CheckoutForm from "@/components/payment/checkout-form";

export const metadata = {
  title: "Checkout | Next.js Better Auth",
};

export default function CheckoutPage() {
  return (
    <div className="container max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      <StripeProvider>
        <CheckoutForm />
      </StripeProvider>
    </div>
  );
}
```

### 6. Create a Checkout Form Component

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

  // Handle successful payment
  const handlePaymentSuccess = async (paymentMethod: any) => {
    setLoading(true);
    setError(null);

    try {
      // Process the payment on the server
      const response = await fetch("/api/process-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentMethodId: paymentMethod.id,
          amount: product.price,
          currency: product.currency.toLowerCase(),
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Redirect to success page
        router.push("/checkout/success");
      } else {
        setError(result.error || "Payment failed. Please try again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle payment errors
  const handlePaymentError = (error: Error) => {
    setError(error.message || "Payment failed. Please try again.");
    setLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">{product.name}</h2>
        <p className="text-gray-600">
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
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or pay with card</span>
          </div>
        </div>

        {/* Regular Checkout Button */}
        <Button
          className="w-full"
          disabled={loading}
          onClick={() => router.push("/checkout/card")}
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

### 7. Create Payment Success Page

```tsx
// app/checkout/success/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Payment Success | Next.js Better Auth",
};

export default function SuccessPage() {
  return (
    <div className="container max-w-md mx-auto py-8 text-center">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8 text-green-500"
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
        <p className="text-gray-600 mb-6">
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

## Testing Apple Pay

### In Development

1. Testing Apple Pay requires:
   - A real iOS device or macOS with Safari
   - An Apple Pay-enabled card added to Apple Wallet
   - A secure connection (HTTPS)

2. For local development, you can use:
   - ngrok to create a secure tunnel to your local server
   - Stripe's test mode and test cards

### Development Testing Steps

1. Start your development server:
   ```bash
   bun run dev
   ```

2. Create an HTTPS tunnel with ngrok:
   ```bash
   ngrok http 3000
   ```

3. Update your domain verification for the ngrok URL in your Apple Developer account

4. Open the ngrok URL on your iOS device or Mac with Safari

5. Test the Apple Pay flow with a test card in your Apple Wallet

### Production Testing

Before going live, test your Apple Pay implementation in a staging environment that mirrors your production setup as closely as possible.

## Troubleshooting

### Common Issues

1. **Apple Pay button doesn't appear**
   - Check that you're using HTTPS
   - Verify domain with Apple
   - Make sure you're testing on a supported device
   - Check browser console for errors

2. **"Apple Pay is not available" message**
   - Ensure the device has Apple Pay capability
   - Verify the user has set up Apple Pay with at least one card
   - Check that the merchant ID is correct

3. **Payment fails**
   - Check Stripe dashboard for error messages
   - Verify your API keys are correct
   - Ensure you're handling the payment process correctly on the server

4. **Domain verification issues**
   - Verify the domain verification file is accessible at the correct path
   - Ensure it's the exact file provided by Apple
   - Try re-downloading and re-uploading the verification file

## Best Practices

1. **Security**
   - Never handle card details directly; let Stripe and Apple Pay handle the sensitive information
   - Always use HTTPS
   - Validate all inputs server-side
   - Use environment variables for API keys

2. **User Experience**
   - Display clear pricing before showing the Apple Pay button
   - Show a fallback payment method for non-Apple Pay users
   - Display clear success/error messages
   - Consider Apple's Human Interface Guidelines for payment flows

3. **Testing**
   - Test on multiple devices (iPhone, iPad, Mac)
   - Test with different Apple Wallet cards
   - Test error scenarios (insufficient funds, declined transactions)
   - Have beta testers try the payment flow before release

## Advanced Topics

### 1. Recurring Payments

For subscription-based models, you can use Stripe's subscription API with Apple Pay as the payment method:

```typescript
// Example of setting up a subscription with Apple Pay
async function createSubscription(paymentMethodId: string, customerId: string) {
  const response = await fetch('/api/create-subscription', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      paymentMethodId,
      customerId,
      priceId: 'price_1234567890', // Your Stripe Price ID
    }),
  });

  return response.json();
}
```

### 2. Product Inventory Management

For e-commerce applications, integrate Apple Pay with inventory management:

```typescript
// Check inventory before completing Apple Pay transaction
async function checkInventoryAndProcess(productId: string, quantity: number, paymentMethodId: string) {
  const response = await fetch('/api/check-inventory-and-process', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      productId,
      quantity,
      paymentMethodId,
    }),
  });

  return response.json();
}
```

### 3. Shipping Information

If your products require shipping, configure Apple Pay to collect shipping information:

```typescript
const paymentRequest = stripe.paymentRequest({
  // ... other options
  requestShipping: true,
  shippingOptions: [
    {
      id: 'standard',
      label: 'Standard Shipping',
      detail: '3-5 business days',
      amount: 499,
    },
    {
      id: 'express',
      label: 'Express Shipping',
      detail: '1-2 business days',
      amount: 999,
    },
  ],
});

paymentRequest.on('shippingaddresschange', (ev) => {
  // Handle shipping address changes, e.g., calculate tax
  fetch('/api/calculate-tax', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address: ev.shippingAddress }),
  })
    .then(r => r.json())
    .then(response => {
      ev.updateWith({
        status: 'success',
        total: {
          label: 'Total',
          amount: response.total,
        },
        displayItems: response.items,
        shippingOptions: response.shippingOptions,
      });
    });
});
```

## Resources

- [Apple Pay Documentation](https://developer.apple.com/documentation/apple_pay_on_the_web)
- [Stripe Apple Pay Documentation](https://stripe.com/docs/apple-pay)
- [Apple Pay JS API](https://developer.apple.com/documentation/apple_pay_js_api)
- [Apple Pay Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/apple-pay)
- [Stripe React Components GitHub](https://github.com/stripe/react-stripe-js)

## Conclusion

Apple Pay integration enhances your Next.js Better Auth application by providing a seamless, secure payment option for users on Apple devices. By following this guide, you can implement Apple Pay with Stripe, handle payments securely, and provide a great user experience.

Remember to thoroughly test your implementation across different devices and scenarios before going live, and to follow best practices for security and user experience.
