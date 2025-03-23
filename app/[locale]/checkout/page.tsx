import StripeProvider from "@/components/payment/stripe-provider";
import CheckoutForm from "@/components/payment/checkout-form";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

/**
 * Checkout page component
 * Displays the checkout form with Apple Pay integration
 */
export default function CheckoutPage({ params }: { params: { locale: string } }) {
  // Enable static rendering with explicit locale
  setRequestLocale(params.locale);
  
  const t = useTranslations('checkout');

  return (
    <div className="container max-w-lg mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">{t('title', { defaultValue: 'Checkout' })}</h1>
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
          {t('backToHome', { defaultValue: 'Back to Home' })}
        </Link>
      </div>
      <p className="text-gray-600 dark:text-gray-400 mb-6">
        {t('description', { defaultValue: 'Complete your purchase to get access to premium features.' })}
      </p>

      <StripeProvider>
        <CheckoutForm />
      </StripeProvider>

      <div className="mt-8 text-sm text-gray-500 dark:text-gray-400">
        <p className="mb-2">
          {t('demoNotice', { defaultValue: 'This is a demonstration of Apple Pay integration. No actual charges will be made.' })}
        </p>
        <p>
          {t('testingInstructions', { defaultValue: 'For testing, use Apple Pay on a compatible device or simulator.' })}
        </p>
      </div>
    </div>
  );
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ja' }, { locale: 'zh' }];
}