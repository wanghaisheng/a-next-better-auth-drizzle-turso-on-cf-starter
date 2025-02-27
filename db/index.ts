import { drizzle } from "drizzle-orm/libsql";

if (typeof EdgeRuntime !== "string") {
    require("dotenv").config();
}

export const db = drizzle({
    connection: {
        url: process.env.TURSO_URL || "file:local.db",
        authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    },
});

export * from "./auth";
