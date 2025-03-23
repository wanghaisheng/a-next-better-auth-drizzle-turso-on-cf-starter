import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";

if (typeof EdgeRuntime !== "string") {
    require("dotenv").config();
}

// Determine if running in Edge Runtime or not
const isEdgeRuntime = typeof EdgeRuntime === "string";

// Determine if running in Netlify
const isNetlify = process.env.NETLIFY_DEPLOYMENT === 'true' || process.env.NEXT_PUBLIC_NETLIFY === 'true';

// Default database URL - fallback to local DB for development
const defaultDbUrl = isNetlify
    ? "libsql://demo-db.turso.io" // Dummy URL for Netlify, should be replaced in env settings
    : "file:local.db";  // Local file for development

// Log database connection details in development for debugging
if (process.env.NODE_ENV !== 'production') {
    console.log('📊 Database configuration:');
    console.log(`- isEdgeRuntime: ${isEdgeRuntime}`);
    console.log(`- isNetlify: ${isNetlify}`);
    console.log(`- Using URL: ${process.env.TURSO_URL || defaultDbUrl}`);
    console.log(`- Auth token present: ${!!process.env.TURSO_AUTH_TOKEN}`);
}

try {
    // Create the appropriate database client based on environment
    const client = createClient({
        // For edge runtime or Netlify, we must use a Turso remote database
        // For development, we can use a local SQLite file
        url: isEdgeRuntime || isNetlify
            ? (process.env.TURSO_URL || defaultDbUrl)
            : (process.env.TURSO_URL || defaultDbUrl),
        authToken: process.env.TURSO_AUTH_TOKEN,
    });

    // Create a configurable drizzle instance with error handling
    export const db = drizzle(client, {
        // Add logging in development
        logger: process.env.NODE_ENV !== 'production',
    });

    // Try to connect to the database and log the result
    if (process.env.NODE_ENV !== 'production') {
        client.execute('SELECT 1')
            .then(() => console.log('✅ Connected to database successfully'))
            .catch(err => console.error('❌ Database connection failed:', err));
    }
} catch (error) {
    console.error('❌ Failed to initialize database client:', error);

    // Create a fallback mock DB for development if real connection fails
    // This allows the app to start even with DB issues
    const mockClient = {
        execute: async () => ({ rows: [] }),
    };
    // @ts-ignore - This is a fallback implementation
    export const db = {
        query: () => ({ all: async () => [] }),
        select: () => ({ all: async () => [] }),
        insert: () => ({ values: () => ({ run: async () => ({}) }) }),
        delete: () => ({ where: () => ({ run: async () => ({}) }) }),
    };

    console.log('⚠️ Using mock database client as fallback');
}

export * from "./auth";
