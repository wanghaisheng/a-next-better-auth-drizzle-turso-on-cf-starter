"use client";

import Image from "next/image";
import Link from "next/link";

export default function Home() {
    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <div className="flex justify-center w-full">
                    <Image
                        className="dark:invert"
                        src="/next.svg"
                        alt="Next.js logo"
                        width={180}
                        height={38}
                        priority
                    />
                </div>

                <h1 className="text-3xl font-bold text-center sm:text-left">Next.js Better Auth Demo</h1>

                <div className="max-w-2xl text-center sm:text-left">
                    <p className="mb-4">
                        This project demonstrates a comprehensive Next.js application with multiple features:
                    </p>

                    <ul className="list-disc list-inside mb-6 space-y-2">
                        <li><strong>Authentication System</strong> - Email/password auth with verification</li>
                        <li><strong>Internationalization</strong> - Multi-language support (EN, ZH, JA)</li>
                        <li><strong>Progressive Web App</strong> - Offline capabilities & installability</li>
                        <li><strong>Apple Pay Integration</strong> - Secure payment processing</li>
                    </ul>
                </div>

                <div className="flex gap-4 items-center flex-col sm:flex-row">
                    <Link
                        href="/en"
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="dark:invert"
                        >
                            <circle cx="12" cy="12" r="10"></circle>
                            <path d="m12 2 3.38 3.38a9.9 9.9 0 0 1 5.24 5.24L22 12l-1.76 1.76a10 10 0 0 1-5.24 5.24L12 22l-3.38-1.76a9.9 9.9 0 0 1-5.24-5.24L2 12l1.76-1.76a10 10 0 0 1 5.24-5.24L12 2Z"></path>
                        </svg>
                        Try Internationalization
                    </Link>

                    <Link
                        href="/checkout"
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="dark:invert"
                        >
                            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path>
                            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path>
                            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path>
                        </svg>
                        Try Apple Pay Demo
                    </Link>
                </div>
            </main>

            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://github.com/wanghaisheng/next-better-auth-drizzle-turso-on-cf"
                    target="_blank"
                    rel="noopener noreferrer"
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
                        <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
                        <path d="M9 18c-4.51 2-5-2-7-2" />
                    </svg>
                    GitHub Repository
                </a>

                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://nextjs.org/docs"
                    target="_blank"
                    rel="noopener noreferrer"
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
                        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                    </svg>
                    Documentation
                </a>
            </footer>

            {/* Fallback styling */}
            <style jsx>{`
                /* Base styles */
                .grid {
                    display: grid;
                }
                .flex {
                    display: flex;
                }
                .flex-col {
                    flex-direction: column;
                }
                .items-center {
                    align-items: center;
                }
                .justify-center {
                    justify-content: center;
                }
                .justify-items-center {
                    justify-items: center;
                }
                .gap-4 {
                    gap: 1rem;
                }
                .gap-6 {
                    gap: 1.5rem;
                }
                .gap-8 {
                    gap: 2rem;
                }
                .gap-16 {
                    gap: 4rem;
                }
                .p-8 {
                    padding: 2rem;
                }
                .pb-20 {
                    padding-bottom: 5rem;
                }
                .min-h-screen {
                    min-height: 100vh;
                }

                /* Typography */
                .text-3xl {
                    font-size: 1.875rem;
                    line-height: 2.25rem;
                }
                .font-bold {
                    font-weight: 700;
                }
                .text-center {
                    text-align: center;
                }
                .mb-4 {
                    margin-bottom: 1rem;
                }
                .mb-6 {
                    margin-bottom: 1.5rem;
                }

                /* List */
                .list-disc {
                    list-style-type: disc;
                }
                .list-inside {
                    list-style-position: inside;
                }
                .space-y-2 > * + * {
                    margin-top: 0.5rem;
                }

                /* Link styles */
                .rounded-full {
                    border-radius: 9999px;
                }
                .border {
                    border-width: 1px;
                }
                .border-solid {
                    border-style: solid;
                }
                .border-transparent {
                    border-color: transparent;
                }
                .transition-colors {
                    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke;
                    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
                    transition-duration: 150ms;
                }
                .bg-foreground {
                    background-color: #000;
                }
                .text-background {
                    color: #fff;
                }

                /* Media query for small screens */
                @media (min-width: 640px) {
                    .sm\\:p-20 {
                        padding: 5rem;
                    }
                    .sm\\:text-left {
                        text-align: left;
                    }
                    .sm\\:items-start {
                        align-items: flex-start;
                    }
                    .sm\\:flex-row {
                        flex-direction: row;
                    }
                    .sm\\:text-base {
                        font-size: 1rem;
                        line-height: 1.5rem;
                    }
                    .sm\\:h-12 {
                        height: 3rem;
                    }
                    .sm\\:px-5 {
                        padding-left: 1.25rem;
                        padding-right: 1.25rem;
                    }
                }

                /* Dark mode styles */
                @media (prefers-color-scheme: dark) {
                    .dark\\:invert {
                        filter: invert(1);
                    }
                    .dark\\:hover\\:bg-\\[\\#ccc\\]:hover {
                        background-color: #ccc;
                    }
                }
            `}</style>
        </div>
    );
}
