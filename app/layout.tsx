import { ThemeProvider } from "@/components/theme-provider";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { GlobalNav } from "@/components/global-nav";
import Script from "next/script";

export const metadata: Metadata = {
  title: "Next.js Better Auth",
  description: "Next.js authentication application with Drizzle ORM and Turso database",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BetterAuth",
  },
  formatDetection: {
    telephone: false,
  },
};

// Move themeColor to viewport as per Next.js recommendation
export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

import './globals.css'; // Import CSS directly instead of using link tags

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
                {/* Remove the manual CSS links */}
            </head>
            <body className="antialiased bg-background text-foreground">
                {/* Remove the inject-styles script if it's not needed */}
                
                <ThemeProvider
                    attribute="class"
                    defaultTheme="system"
                    enableSystem
                    disableTransitionOnChange
                >
                    <GlobalNav />
                    <div className="pt-14">
                        {children}
                    </div>
                </ThemeProvider>
            </body>
        </html>
    );
}
