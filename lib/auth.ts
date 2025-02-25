import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactResetPasswordEmail } from "./email/rest-password";
import { resend } from "./email/resend";
import { account, db, session, user, verification } from "../db";

const from = process.env.BETTER_AUTH_EMAIL || "delivered@resend.dev";

export const auth = betterAuth({
    database: drizzleAdapter(db, {
        provider: "sqlite",
        schema: { account, session, user, verification },
    }),
    emailAndPassword: {
        enabled: true, // Enables email/password auth out of the box
        emailAndPassword: {
            enabled: true,
            async sendResetPassword({ user, url }) {
                await resend.emails.send({
                    from,
                    to: user.email,
                    subject: "Reset your password",
                    react: reactResetPasswordEmail({
                        username: user.email,
                        resetLink: url,
                    }),
                });
            },
        },
    },
    emailVerification: {
        async sendVerificationEmail({ user, url }) {
            const res = await resend.emails.send({
                from,
                to: user.email,
                subject: "Verify your email address",
                html: `<a href="${url}">Verify your email address</a>`,
            });
            console.log(res, user.email);
        },
    },
});

export const baseURL =
    process.env.NODE_ENV === "development"
        ? process.env.BETTER_AUTH_URL || "http://localhost:3000"
        : process.env.BETTER_AUTH_URL ||
          process.env.CF_PAGES_URL ||
          process.env.VERCEL_URL ||
          process.env.NEXT_PUBLIC_APP_URL;
