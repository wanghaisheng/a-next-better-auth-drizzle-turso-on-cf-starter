import { defineConfig } from "drizzle-kit";

if (typeof EdgeRuntime !== "string") {
    require("dotenv").config();
}

export default defineConfig({
    out: "./db/migrations",
    schema: "./db",
    dialect: "turso",
    dbCredentials: {
        url: process.env.TURSO_URL || "file:local.db",
        authToken: process.env.TURSO_AUTH_TOKEN || undefined,
    },
});
