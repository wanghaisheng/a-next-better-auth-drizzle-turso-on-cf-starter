"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Checkbox } from "@/components/ui/checkbox";
import { useTranslations } from 'next-intl';
import { Link } from '@/src/i18n/navigation';
// Import component styles
import styles from '../src/components.module.css';

import { signIn } from "@/lib/auth-client";

export type LoginFormProps = ComponentPropsWithoutRef<"div">;

export function LoginForm({ className, ...props }: LoginFormProps) {
    const t = useTranslations('auth');
    const tErrors = useTranslations('errors');

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    return (
        <div className={cn("flex flex-col gap-6", className, styles.flexCol, styles.gap4)} {...props}>
            <Card className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                    <CardTitle className={`text-2xl ${styles.cardTitle}`}>{t('login.title')}</CardTitle>
                    <CardDescription className={styles.cardDescription}>
                        {t('enterEmailToLogin')}
                    </CardDescription>
                </CardHeader>
                <CardContent className={styles.cardContent}>
                    <form className={styles.flexCol}>
                        <div className={`flex flex-col gap-6 ${styles.flexCol} ${styles.gap4}`}>
                            <div className={`grid gap-2 ${styles.formGroup}`}>
                                <Label htmlFor="email" className={styles.label}>{t('email')}</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="m@example.com"
                                    required
                                    onChange={(e) => {
                                        setEmail(e.target.value);
                                        setError("");
                                    }}
                                    value={email}
                                    className={styles.input}
                                />
                            </div>
                            <div className={`grid gap-2 ${styles.formGroup}`}>
                                <div className={`flex items-center ${styles.flexRow} ${styles.justifyBetween}`}>
                                    <Label htmlFor="password" className={styles.label}>{t('password')}</Label>
                                    <Link
                                        href="/forgot-password"
                                        className={`ml-auto inline-block text-sm underline-offset-4 hover:underline ${styles.link}`}
                                    >
                                        {t('forgotPassword')}
                                    </Link>
                                </div>
                                <PasswordInput
                                    id="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    autoComplete="password"
                                    placeholder={t('password')}
                                    className={styles.input}
                                />
                            </div>
                            <div className={`flex items-center space-x-2 ${styles.flexRow} ${styles.itemsCenter}`}>
                                <Checkbox
                                    id="remember"
                                    checked={rememberMe}
                                    onCheckedChange={(checked) =>
                                        setRememberMe(checked as boolean)
                                    }
                                />
                                <Label htmlFor="remember" className={styles.label}>{t('rememberMe')}</Label>
                            </div>
                            {error && (
                                <div className="text-sm text-red-500">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className={`w-full ${styles.button}`}
                                disabled={loading}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    await signIn.email(
                                        {
                                            email: email,
                                            password: password,
                                            callbackURL: "/dashboard",
                                            rememberMe,
                                        },
                                        {
                                            onRequest: () => {
                                                setLoading(true);
                                                setError("");
                                            },
                                            onResponse: () => {
                                                setLoading(false);
                                            },
                                            onError: (ctx) => {
                                                setError(ctx.error.message);
                                                setLoading(false);
                                            },
                                        },
                                    );
                                }}
                            >
                                {loading ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    t('login.submitButton')
                                )}
                            </Button>
                        </div>
                        <div className={`mt-4 text-center text-sm ${styles.textCenter} ${styles.mt4}`}>
                            {t('dontHaveAccount')}{" "}
                            <Link
                                href="/sign-up"
                                className={`underline underline-offset-4 ${styles.link}`}
                            >
                                {t('signup.title')}
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Fallback styling in case CSS modules don't load */}
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
                    color: #666;
                    font-size: 14px;
                    margin-bottom: 16px;
                }
                form {
                    display: flex;
                    flex-direction: column;
                    gap: 16px;
                }
                .formGroup {
                    margin-bottom: 16px;
                }
                button {
                    background-color: #000;
                    color: white;
                    border: none;
                    border-radius: 6px;
                    padding: 10px 16px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    width: 100%;
                }
                button:disabled {
                    background-color: #999;
                }
                a {
                    color: #0070f3;
                    text-decoration: none;
                }
                a:hover {
                    text-decoration: underline;
                }
            `}</style>
        </div>
    );
}
