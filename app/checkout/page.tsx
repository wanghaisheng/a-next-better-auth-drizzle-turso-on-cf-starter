import StripeProvider from "@/components/payment/stripe-provider";
import CheckoutForm from "@/components/payment/checkout-form";
import Link from "next/link";

/**
 * Checkout page component
 * Displays the checkout form with Apple Pay integration
 */
export default function CheckoutPage() {
  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Checkout</h1>
        <Link
          href="/"
          className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m12 19-7-7 7-7"/>
            <path d="M19 12H5"/>
          </svg>
          Back to Home
        </Link>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        Complete your purchase to get access to premium features.
      </p>

      <StripeProvider>
        <CheckoutForm />
      </StripeProvider>

      <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-2">
          This is a demonstration of Apple Pay integration. No actual charges will be made.
        </p>
        <p>
          For testing, use Apple Pay on a compatible device or simulator.
        </p>
      </div>
    </div>
  );
}
