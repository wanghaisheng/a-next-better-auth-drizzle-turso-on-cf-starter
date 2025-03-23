"use client";

import { useState } from "react";
import { AlertCircle, Loader2, LogOut } from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { signOut, client } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
// Import component styles
import styles from '../../src/components.module.css';

interface VerifyEmailCardProps {
    email: string;
}

export function VerifyEmailCard({ email }: VerifyEmailCardProps) {
    const t = useTranslations("dashboard");
    const tAuth = useTranslations("auth");
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    return (
        <Card className={styles.card}>
            <CardHeader className={styles.cardHeader}>
                <CardTitle className={styles.cardTitle}>{tAuth("verifyEmailRequired", { fallback: "Email Verification Required" })}</CardTitle>
                <CardDescription className={styles.cardDescription}>
                    {tAuth("verifyEmailDescription", { fallback: "Please verify your email address to access the dashboard" })}
                </CardDescription>
            </CardHeader>
            <CardContent className={`flex flex-col gap-6 ${styles.cardContent} ${styles.flexCol}`}>
                <Alert className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {tAuth("checkInboxForVerification", { fallback: "Check your inbox for a verification email. You'll need to verify your email address before you can access this page." })}
                    </AlertDescription>
                </Alert>

                {emailSent && (
                    <Alert className="border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-400">
                        <AlertDescription>
                            {t("emailSent", { fallback: "Verification email sent successfully!" })}
                        </AlertDescription>
                    </Alert>
                )}

                <div className="flex flex-col">
                    <p className="text-sm text-muted-foreground mb-4">
                        Email address: <strong>{email}</strong>
                    </p>

                    <Button
                        variant="secondary"
                        className={styles.button}
                        disabled={isResending}
                        onClick={async () => {
                            await client.sendVerificationEmail(
                                { email },
                                {
                                    onRequest() {
                                        setIsResending(true);
                                        setEmailSent(false);
                                    },
                                    onError(context) {
                                        console.error(context.error.message);
                                        setIsResending(false);
                                    },
                                    onSuccess() {
                                        console.log(
                                            "Verification email sent successfully"
                                        );
                                        setIsResending(false);
                                        setEmailSent(true);
                                    },
                                }
                            );
                        }}
                    >
                        {isResending ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            tAuth("resendVerificationEmail", { fallback: "Resend Verification Email" })
                        )}
                    </Button>
                </div>
            </CardContent>
            <CardFooter className={`flex justify-end ${styles.flexRow} ${styles.justifyBetween}`}>
                <Button
                    variant="outline"
                    className={`gap-2 ${styles.button}`}
                    disabled={isSigningOut}
                    onClick={async () => {
                        setIsSigningOut(true);
                        await signOut({
                            fetchOptions: {
                                onSuccess() {
                                    router.push("/login");
                                },
                            },
                        });
                        setIsSigningOut(false);
                    }}
                >
                    {isSigningOut ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        <>
                            <LogOut size={16} />
                            {tAuth("logout")}
                        </>
                    )}
                </Button>
            </CardFooter>

            {/* Fallback styling */}
            <style jsx>{`
                .card {
                    background-color: white;
                    border-radius: 12px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    padding: 20px;
                    margin-bottom: 20px;
                    border: 1px solid #eaeaea;
                }
                .cardTitle {
                    font-size: 24px;
                    font-weight: 600;
                    margin-bottom: 8px;
                }
                .cardDescription {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 16px;
                }
                .alert {
                    display: flex;
                    align-items: flex-start;
                    padding: 12px;
                    border-radius: 6px;
                    border-width: 1px;
                    gap: 8px;
                }
                .border-amber-200 {
                    border-color: #fde68a;
                }
                .bg-amber-50 {
                    background-color: #fffbeb;
                }
                .text-amber-700 {
                    color: #b45309;
                }
                .dark .border-amber-900 {
                    border-color: #78350f;
                }
                .dark .bg-amber-950 {
                    background-color: #451a03;
                }
                .dark .text-amber-400 {
                    color: #fbbf24;
                }
                .border-green-200 {
                    border-color: #a7f3d0;
                }
                .bg-green-50 {
                    background-color: #ecfdf5;
                }
                .text-green-700 {
                    color: #047857;
                }
                .dark .border-green-900 {
                    border-color: #064e3b;
                }
                .dark .bg-green-950 {
                    background-color: #022c22;
                }
                .dark .text-green-400 {
                    color: #34d399;
                }
                .mb-4 {
                    margin-bottom: 1rem;
                }
                .text-sm {
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                }
                .text-muted-foreground {
                    color: #6b7280;
                }
                .flex {
                    display: flex;
                }
                .flex-col {
                    flex-direction: column;
                }
                .gap-6 {
                    gap: 1.5rem;
                }
                .justify-end {
                    justify-content: flex-end;
                }
                button {
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                button[variant="secondary"] {
                    background-color: #f3f4f6;
                    color: #374151;
                    border: 1px solid #e5e7eb;
                }
                button[variant="secondary"]:hover {
                    background-color: #e5e7eb;
                }
                button[variant="outline"] {
                    background-color: transparent;
                    color: #374151;
                    border: 1px solid #e5e7eb;
                }
                button[variant="outline"]:hover {
                    background-color: #f3f4f6;
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
            `}</style>
        </Card>
    );
}
