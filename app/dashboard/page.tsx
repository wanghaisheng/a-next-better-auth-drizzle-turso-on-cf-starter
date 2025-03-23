"use client";

import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="mb-4 text-2xl font-bold">Dashboard Demo</h1>
          <p className="mb-4 text-sm text-gray-600 dark:text-gray-300">
            This is a demo dashboard page. In a production environment, this would require authentication
            and would display user-specific data from a database.
          </p>

          <div className="mb-6 mt-6 rounded-md bg-amber-50 p-4 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
            <h3 className="font-medium">Database Configuration Required</h3>
            <p className="mt-2 text-sm">
              A proper Turso database configuration is required for authentication features to work.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t pt-4 text-sm">
            <div className="font-medium text-gray-500 dark:text-gray-400">Email:</div>
            <div>demo@example.com</div>

            <div className="font-medium text-gray-500 dark:text-gray-400">Status:</div>
            <div className="text-amber-600 dark:text-amber-400">Demo Mode</div>

            <div className="font-medium text-gray-500 dark:text-gray-400">Created:</div>
            <div>{new Date().toLocaleDateString()}</div>
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
        .rounded-xl {
          border-radius: 0.75rem;
        }
        .border {
          border-width: 1px;
          border-style: solid;
        }
        .shadow-sm {
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .font-bold {
          font-weight: 700;
        }
        .text-2xl {
          font-size: 1.5rem;
          line-height: 2rem;
        }
        .mb-4 {
          margin-bottom: 1rem;
        }
        .text-sm {
          font-size: 0.875rem;
          line-height: 1.25rem;
        }
        .mt-6 {
          margin-top: 1.5rem;
        }
        .mb-6 {
          margin-bottom: 1.5rem;
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
        .border-t {
          border-top-width: 1px;
        }
        .pt-4 {
          padding-top: 1rem;
        }
        .rounded-md {
          border-radius: 0.375rem;
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
        @media (prefers-color-scheme: dark) {
          .dark\:bg-amber-950 {
            background-color: #451a03;
          }
          .dark\:text-amber-300 {
            color: #fcd34d;
          }
          .dark\:bg-gray-900 {
            background-color: #111827;
          }
          .dark\:border-gray-800 {
            border-color: #1f2937;
          }
          .dark\:text-gray-300 {
            color: #d1d5db;
          }
          .dark\:text-gray-400 {
            color: #9ca3af;
          }
        }
      `}</style>
    </div>
  );
}
