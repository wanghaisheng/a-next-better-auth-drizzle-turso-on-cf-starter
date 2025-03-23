"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PWAInstallButton } from "./pwa-install-button";
import { useEffect, useState } from "react";
import { useTranslations } from 'next-intl';
// Import component styles
import styles from '../src/components.module.css';

export function GlobalNav() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  // Try to get translations, fallback gracefully if not available
  let t;
  try {
    t = useTranslations('nav');
  } catch (e) {
    // Fallback translations
    t = (key, options) => {
      const fallbacks = {
        'home': 'Home',
        'dashboard': 'Dashboard',
        'login': 'Login',
        'signup': 'Sign up',
        'applePayCheckout': 'Apple Pay'
      };
      return options?.fallback || fallbacks[key] || key;
    };
  }

  // Use useEffect to ensure client-side only rendering for certain components
  useEffect(() => {
    setMounted(true);
  }, []);

  const isHomePage = pathname === "/";
  const isCheckoutPage = pathname?.startsWith("/checkout");
  const isI18nPage = pathname?.match(/^\/(en|zh|ja)/);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-2 bg-white/80 dark:bg-black/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="text-sm font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          {t('home', { fallback: 'Home' })}
        </Link>

        {!isHomePage && (
          <>
            <span className="text-gray-300 dark:text-gray-700">/</span>

            {isCheckoutPage && (
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                {t('applePayCheckout', { fallback: 'Apple Pay Demo' })}
              </span>
            )}

            {isI18nPage && (
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                i18n Demo
              </span>
            )}
          </>
        )}
      </div>

      <div className="flex items-center gap-3">
        {!isI18nPage && (
          <Link
            href="/en"
            className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            i18n Demo
          </Link>
        )}

        {!isCheckoutPage && (
          <Link
            href="/checkout"
            className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
          >
            {t('applePayCheckout', { fallback: 'Apple Pay' })}
          </Link>
        )}

        {/* Only render PWAInstallButton on client side */}
        {mounted && <PWAInstallButton />}
      </div>

      {/* Fallback styles for navigation */}
      <style jsx>{`
        nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 50;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.5rem 1rem;
          background-color: rgba(255, 255, 255, 0.8);
          backdrop-filter: blur(8px);
          border-bottom: 1px solid #e5e7eb;
        }

        .dark nav {
          background-color: rgba(0, 0, 0, 0.8);
          border-bottom-color: #1f2937;
        }

        a {
          font-size: 0.875rem;
          font-weight: 500;
          color: inherit;
          text-decoration: none;
          transition: color 0.15s ease;
        }

        a:hover {
          color: #2563eb;
        }

        .dark a:hover {
          color: #60a5fa;
        }

        .rounded-button {
          font-size: 0.75rem;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          background-color: #f3f4f6;
          transition: background-color 0.15s ease;
        }

        .rounded-button:hover {
          background-color: #e5e7eb;
        }

        .dark .rounded-button {
          background-color: #1f2937;
        }

        .dark .rounded-button:hover {
          background-color: #374151;
        }

        .flex {
          display: flex;
        }

        .items-center {
          align-items: center;
        }

        .gap-2 {
          gap: 0.5rem;
        }

        .gap-3 {
          gap: 0.75rem;
        }
      `}</style>
    </nav>
  );
}
