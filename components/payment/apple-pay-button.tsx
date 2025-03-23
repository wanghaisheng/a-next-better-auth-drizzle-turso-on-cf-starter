"use client";

import { useEffect, useState } from "react";
import { useStripe, PaymentRequestButtonElement } from "@stripe/react-stripe-js";
import { PaymentRequest, StripePaymentRequestButtonElementOptions } from "@stripe/stripe-js";

interface ApplePayButtonProps {
  amount: number;
  currency: string;
  label: string;
  onSuccess: (paymentResult: any) => void;
  onError: (error: Error) => void;
}

/**
 * Apple Pay button component using Stripe's Payment Request Button
 */
export default function ApplePayButton({
  amount,
  currency,
  label,
  onSuccess,
  onError,
}: ApplePayButtonProps) {
  const stripe = useStripe();
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [mounted, setMounted] = useState(false);

  // Use useEffect to ensure code only runs on client
  useEffect(() => {
    setMounted(true);

    if (!stripe) return;

    // Create a payment request for Apple Pay
    const pr = stripe.paymentRequest({
      country: "US", // Change according to your location or make it configurable
      currency: currency.toLowerCase(),
      total: {
        label,
        amount,
      },
      requestPayerName: true,
      requestPayerEmail: true,
      requestShipping: false,
      merchantCapabilities: ['supports3DS'],
      supportedNetworks: ['mastercard', 'visa', 'amex', 'discover', 'jcb'], // Added JCB for Japanese market
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
        // Call the payment API to process the payment
        const response = await fetch("/api/payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paymentMethodId: e.paymentMethod.id,
            amount,
            currency,
          }),
        });

        const result = await response.json();

        if (result.success) {
          e.complete("success");
          onSuccess(e.paymentMethod);
        } else {
          e.complete("fail");
          onError(new Error(result.error || "Payment failed"));
        }
      } catch (error) {
        e.complete("fail");
        onError(error instanceof Error ? error : new Error("Unknown error"));
      }
    });
  }, [stripe, amount, currency, label, onSuccess, onError]);

  // Only render on client side to prevent hydration mismatch
  if (!mounted) {
    return null;
  }

  // Don't render anything if Apple Pay is not available
  if (!paymentRequest) {
    return null;
  }

  // Styles for the Apple Pay button
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
