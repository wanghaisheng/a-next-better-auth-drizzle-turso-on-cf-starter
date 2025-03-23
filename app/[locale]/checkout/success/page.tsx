import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";

/**
 * Payment success page
 * Displayed after a successful payment
 */
export default function SuccessPage({ params }: { params: { locale: string } }) {
  // Enable static rendering with explicit locale
  setRequestLocale(params.locale);
  
  const t = useTranslations('checkout.success');

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
        <h1 className="text-2xl font-bold mb-2">{t('title', { defaultValue: 'Payment Successful!' })}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('thankYouMessage', { defaultValue: 'Thank you for your purchase. Your transaction has been completed successfully.' })}
        </p>
        <div className="space-y-4">
          <Link href="/">
            <Button className="w-full">{t('returnHome', { defaultValue: 'Return to Home' })}</Button>
          </Link>
          <Link href="/checkout">
            <Button variant="outline" className="w-full">{t('backToCheckout', { defaultValue: 'Back to Checkout' })}</Button>
          </Link>
        </div>
        <div className="mt-6 text-sm text-gray-500">
          {t('demoNotice', { defaultValue: 'This is a demo. No actual payment was processed.' })}
        </div>
      </div>
    </div>
  );
}

// Generate static params for all supported locales
export function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ja' }, { locale: 'zh' }];
}