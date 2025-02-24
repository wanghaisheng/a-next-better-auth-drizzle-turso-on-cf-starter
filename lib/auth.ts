import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { account, db, session, user, verification } from "../db";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: { account, session, user, verification },
    }),
    emailAndPassword: {
        enabled: true, // Enables email/password auth out of the box
    },
});

export const baseURL =
    process.env.NODE_ENV === "development"
        ? process.env.BETTER_AUTH_URL || "http://localhost:3000"
        : process.env.BETTER_AUTH_URL ||
          process.env.CF_PAGES_URL ||
          process.env.VERCEL_URL ||
          process.env.NEXT_PUBLIC_APP_URL;
