import { defineConfig } from "drizzle-kit";

if (typeof EdgeRuntime !== "string") {
    require("dotenv").config();
}

// Determine if running in Netlify
const isNetlify = process.env.NETLIFY_DEPLOYMENT === 'true' || process.env.NEXT_PUBLIC_NETLIFY === 'true';

// Default database URL - fallback to local DB for development
const defaultDbUrl = isNetlify
    ? "libsql://demo-db.turso.io" // Dummy URL for Netlify, should be replaced in env settings
    : "file:local.db";  // Local file for development

// Use environment variables or defaults
const dbUrl = process.env.TURSO_URL || defaultDbUrl;
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

export default defineConfig({
    out: "./db/migrations",
    schema: "./db",
    dialect: "turso",
    dbCredentials: {
        url: dbUrl,
        authToken: authToken,
    },
    // Enable verbose logging in development
    verbose: process.env.NODE_ENV !== 'production',
    // Use strict mode for better error detection
    strict: true,
});
