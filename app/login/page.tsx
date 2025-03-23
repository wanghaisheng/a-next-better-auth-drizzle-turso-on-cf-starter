"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      // For demo purposes, always show a helpful message
      setError("Note: This is a demo page. For full functionality, a proper database connection is required.");
    }, 1000);
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-md">
        <div className="rounded-xl border bg-white p-6 shadow-md dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6">
            <h2 className="text-2xl font-bold">Login</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Enter your email below to login to your account</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6 space-y-4">
              <div>
                <label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
                <input
                  id="email"
                  type="email"
                  className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="m@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
                  <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                    Forgot password?
                  </Link>
                </div>
                <input
                  id="password"
                  type="password"
                  className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-700 dark:bg-gray-800"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center">
                <input
                  id="remember"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-900/30 dark:text-amber-500">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="flex w-full items-center justify-center rounded-md bg-black py-2 text-sm font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>

            <div className="mt-4 text-center text-sm">
              Don't have an account?{" "}
              <Link href="/sign-up" className="text-blue-600 hover:underline dark:text-blue-400">
                Sign up
              </Link>
            </div>
          </form>
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
        .justify-between {
          justify-content: space-between;
        }
        .p-6 {
          padding: 1.5rem;
        }
        .rounded-xl {
          border-radius: 0.75rem;
        }
        .border {
          border-width: 1px;
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
        .mb-1 {
          margin-bottom: 0.25rem;
        }
        .block {
          display: block;
        }
        .font-medium {
          font-weight: 500;
        }
        .rounded-md {
          border-radius: 0.375rem;
        }
        .border-gray-300 {
          border-color: #d1d5db;
        }
        .p-2 {
          padding: 0.5rem;
        }
        .h-4 {
          height: 1rem;
        }
        .w-4 {
          width: 1rem;
        }
        .rounded {
          border-radius: 0.25rem;
        }
        .ml-2 {
          margin-left: 0.5rem;
        }
        .text-gray-700 {
          color: #374151;
        }
        .mb-4 {
          margin-bottom: 1rem;
        }
        .bg-amber-50 {
          background-color: #fffbeb;
        }
        .p-3 {
          padding: 0.75rem;
        }
        .text-amber-800 {
          color: #92400e;
        }
        .py-2 {
          padding-top: 0.5rem;
          padding-bottom: 0.5rem;
        }
        .bg-black {
          background-color: #000;
        }
        .text-white {
          color: #fff;
        }
        .mt-4 {
          margin-top: 1rem;
        }
        .text-center {
          text-align: center;
        }
        .text-blue-600 {
          color: #2563eb;
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
          .dark\\:border-gray-700 {
            border-color: #374151;
          }
          .dark\\:bg-gray-800 {
            background-color: #1f2937;
          }
          .dark\\:text-gray-300 {
            color: #d1d5db;
          }
          .dark\\:bg-amber-900\\/30 {
            background-color: rgba(120, 53, 15, 0.3);
          }
          .dark\\:text-amber-500 {
            color: #f59e0b;
          }
          .dark\\:bg-white {
            background-color: #fff;
          }
          .dark\\:text-black {
            color: #000;
          }
          .dark\\:text-blue-400 {
            color: #60a5fa;
          }
        }
      `}</style>
    </div>
  );
}
