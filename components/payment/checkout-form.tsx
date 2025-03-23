"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ApplePayButton from "./apple-pay-button";
import { Button } from "@/components/ui/button";
import { defaultProduct, formatCurrency } from "@/lib/payment/payment-utils";

/**
 * Checkout form component with Apple Pay integration
 */
export default function CheckoutForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Use the default product for demonstration
  const product = defaultProduct;

  // Set mounted state after component mounts on client
  useEffect(() => {
    setMounted(true);
  }, []);

  /**
   * Handle successful payment
   */
  const handlePaymentSuccess = async (paymentMethod: any) => {
    setLoading(true);
    try {
      console.log("Payment successful with method:", paymentMethod);
      // Redirect to success page
      router.push("/checkout/success");
    } catch (err) {
      setError("An error occurred after payment. Please contact support.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle payment error
   */
  const handlePaymentError = (error: Error) => {
    setError(error.message || "Payment failed. Please try again.");
    setLoading(false);
  };

  // Only render on client side to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
        <div className="mb-6">
          <h2 className="text-xl font-semibold">
            {product.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {formatCurrency(product.price, product.currency)}
          </p>
          <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
            {product.description}
          </p>
        </div>
        <div className="space-y-4">
          <div className="w-full h-12"></div>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                Loading payment options...
              </span>
            </div>
          </div>
          <Button
            className="w-full"
            disabled={true}
          >
            Loading...
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
      <div className="mb-6">
        <h2 className="text-xl font-semibold">
          {product.name}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {formatCurrency(product.price, product.currency)}
        </p>
        <p className="text-sm mt-2 text-gray-500 dark:text-gray-400">
          {product.description}
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
