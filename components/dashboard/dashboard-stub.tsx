"use client";

import { useState, useEffect } from "react";
import { Loader2, LogOut } from "lucide-react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { type User } from "better-auth";
import { useTranslations } from "next-intl";
import { useRouter } from "@/src/i18n/navigation";
// Import component styles
import styles from '../../src/components.module.css';

// Client-side only date component to prevent hydration mismatch
function ClientDate() {
    const [date, setDate] = useState<string>('');
    
    useEffect(() => {
        // Only set the date on the client side
        setDate(new Date().toLocaleDateString());
    }, []);
    
    return <>{date}</>;
}

interface DashboardStubProps {
    user: User;
}

export function DashboardStub({ user }: DashboardStubProps) {
    const t = useTranslations("dashboard");
    const tAuth = useTranslations("auth");
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

    return (
        <Card className={styles.card}>
            <CardHeader className={styles.cardHeader}>
                <CardTitle className={`text-2xl ${styles.cardTitle}`}>{t("title")}</CardTitle>
            </CardHeader>
            <CardContent className={styles.cardContent}>
                <p className={`text-lg ${styles.mb4}`}>
                    {t("welcome", { name: user.name || "User" })}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    {user.email}
                </p>

                {/* User profile stats */}
                <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <h3 className="font-medium mb-2">User Profile</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                            <span className="text-muted-foreground">Email Status:</span>
                        </div>
                        <div>
                            {user.emailVerified ? (
                                <span className="text-green-600 dark:text-green-400">{t("emailVerified")}</span>
                            ) : (
                                <span className="text-amber-600 dark:text-amber-400">{t("emailNotVerified")}</span>
                            )}
                        </div>
                        <div>
                            <span className="text-muted-foreground">Account Created:</span>
                        </div>
                        <div>
                            <ClientDate />
                        </div>
                    </div>
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
                    margin-bottom: 16px;
                }
                .text-lg {
                    font-size: 1.125rem;
                    line-height: 1.75rem;
                }
                .text-sm {
                    font-size: 0.875rem;
                    line-height: 1.25rem;
                }
                .mt-1 {
                    margin-top: 0.25rem;
                }
                .mt-6 {
                    margin-top: 1.5rem;
                }
                .mb-2 {
                    margin-bottom: 0.5rem;
                }
                .p-4 {
                    padding: 1rem;
                }
                .rounded-lg {
                    border-radius: 0.5rem;
                }
                .bg-gray-50 {
                    background-color: #f9fafb;
                }
                .dark .bg-gray-800 {
                    background-color: #1f2937;
                }
                .grid {
                    display: grid;
                }
                .grid-cols-2 {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .gap-2 {
                    gap: 0.5rem;
                }
                .text-green-600 {
                    color: #059669;
                }
                .dark .text-green-400 {
                    color: #34d399;
                }
                .text-amber-600 {
                    color: #d97706;
                }
                .dark .text-amber-400 {
                    color: #fbbf24;
                }
                .text-muted-foreground {
                    color: #6b7280;
                }
                button {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 500;
                    padding: 0.5rem 1rem;
                    border-radius: 0.375rem;
                    border: 1px solid #e5e7eb;
                    background-color: white;
                    color: #374151;
                    cursor: pointer;
                    transition: all 0.15s ease;
                }
                button:hover {
                    background-color: #f3f4f6;
                }
                button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                .flex {
                    display: flex;
                }
                .justify-end {
                    justify-content: flex-end;
                }
            `}</style>
        </Card>
    );
}
