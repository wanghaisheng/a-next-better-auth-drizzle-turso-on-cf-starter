"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
  const [userEmail] = useState("demo@example.com");

  // Try to get translations, fallback gracefully if not available
  let t;
  try {
    t = useTranslations('dashboard');
  } catch (e) {
    // Fallback translations
    t = (key: string, options?: { fallback: string }) => {
      const fallbacks: Record<string, string> = {
        'title': 'Dashboard',
        'welcome': 'Welcome to your dashboard',
        'emailVerified': 'Email verified',
        'emailNotVerified': 'Email not verified',
        'emailStatus': 'Email status',
        'verifyEmailButton': 'Verify email',
        'error.title': 'Dashboard Error',
        'error.message': 'Unable to load dashboard data.'
      };
      return options?.fallback || fallbacks[key] || key;
    };
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-white p-6 shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{t('title', { fallback: 'Dashboard' })}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t('welcome', { fallback: 'Welcome to your dashboard' })}
            </p>
          </div>

          <div className="space-y-4">
            <div className="rounded-md bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
              <p className="text-sm">
                Note: This is a demo dashboard. In a production environment, this would display user-specific data from a database.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
              <div className="font-medium text-gray-500 dark:text-gray-400">Email:</div>
              <div>{userEmail}</div>

              <div className="font-medium text-gray-500 dark:text-gray-400">Status:</div>
              <div className="text-amber-600 dark:text-amber-400">
                {t('emailNotVerified', { fallback: 'Email not verified' })}
              </div>

              <div className="font-medium text-gray-500 dark:text-gray-400">Created:</div>
              <div>{new Date().toLocaleDateString()}</div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </div>

      {/* Fallback styling */}
      <style jsx>{`
        .flex {
          display: flex;
        }
        .min-h-screen {
          min-height: 100vh;
        }
        .w-full {
          width: 100%;
        }
        .max-w-md {
          max-width: 28rem;
        }
        .items-center {
          align-items: center;
        }
        .justify-center {
          justify-content: center;
        }
        .justify-end {
          justify-content: flex-end;
        }
        .p-6 {
          padding: 1.5rem;
        }
        .rounded-xl {
          border-radius: 0.75rem;
        }
        .rounded-md {
          border-radius: 0.375rem;
        }
        .border {
          border-width: 1px;
        }
        .border-t {
          border-top-width: 1px;
        }
        .bg-white {
          background-color: white;
        }
        .shadow-md {
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
        }
        .mb-6 {
          margin-bottom: 1.5rem;
        }
        .text-2xl {
          font-size: 1.5rem;
          line-height: 2rem;
        }
        .font-bold {
          font-weight: 700;
        }
        .text-sm {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .text-gray-600 {
          color: #4b5563;
        }
        .space-y-4 > * + * {
          margin-top: 1rem;
        }
        .bg-amber-50 {
          background-color: #fffbeb;
        }
        .p-4 {
          padding: 1rem;
        }
        .text-amber-800 {
          color: #92400e;
        }
        .grid {
          display: grid;
        }
        .grid-cols-2 {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        .gap-4 {
          gap: 1rem;
        }
        .pt-4 {
          padding-top: 1rem;
        }
        .font-medium {
          font-weight: 500;
        }
        .text-gray-500 {
          color: #6b7280;
        }
        .text-amber-600 {
          color: #d97706;
        }
        .mt-6 {
          margin-top: 1.5rem;
        }
        .px-4 {
          padding-left: 1rem;
          padding-right: 1rem;
        }
        .py-2 {
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
        .text-gray-700 {
          color: #374151;
        }

        @media (min-width: 768px) {
          .md\\:p-10 {
            padding: 2.5rem;
          }
        }

        @media (prefers-color-scheme: dark) {
          .dark\\:border-gray-800 {
            border-color: #1f2937;
          }
          .dark\\:bg-gray-900 {
            background-color: #111827;
          }
          .dark\\:text-gray-400 {
            color: #9ca3af;
          }
          .dark\\:bg-amber-900\\/30 {
            background-color: rgba(120, 53, 15, 0.3);
          }
          .dark\\:text-amber-500 {
            color: #f59e0b;
          }
          .dark\\:text-amber-400 {
            color: #fbbf24;
          }
          .dark\\:border-gray-700 {
            border-color: #374151;
          }
          .dark\\:bg-gray-800 {
            background-color: #1f2937;
          }
          .dark\\:text-gray-300 {
            color: #d1d5db;
          }
        }
      `}</style>
    </div>
  );
}
