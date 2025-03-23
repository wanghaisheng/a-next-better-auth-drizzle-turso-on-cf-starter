"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { Loader2, X } from "lucide-react";
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
import Image from "next/image";
import { signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useTranslations } from 'next-intl';
// Import component styles
import styles from '../src/components.module.css';

export type SignUpFormProps = ComponentPropsWithoutRef<"div">;

export function SignUpForm({ className, ...props }: SignUpFormProps) {
    const t = useTranslations('auth');
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [passwordConfirmation, setPasswordConfirmation] = useState("");
    const [image, setImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className, styles.flexCol, styles.gap4)} {...props}>
            <Card className={styles.card}>
                <CardHeader className={styles.cardHeader}>
                    <CardTitle className={`text-2xl ${styles.cardTitle}`}>{t('signup.title')}</CardTitle>
                    <CardDescription className={styles.cardDescription}>
                        {t('signup.description', { fallback: "Enter your information to create an account" })}
                    </CardDescription>
                </CardHeader>
                <CardContent className={styles.cardContent}>
                    <form className={styles.flexCol}>
                        <div className={`flex flex-col gap-6 ${styles.flexCol} ${styles.gap4}`}>
                            <div className={`grid grid-cols-2 gap-4`}>
                                <div className={`grid gap-2 ${styles.formGroup}`}>
                                    <Label htmlFor="first-name" className={styles.label}>
                                        {t('signup.firstNameLabel', { fallback: "First name" })}
                                    </Label>
                                    <Input
                                        id="first-name"
                                        placeholder="John"
                                        required
                                        onChange={(e) => {
                                            setFirstName(e.target.value);
                                            setError("");
                                        }}
                                        value={firstName}
                                        className={styles.input}
                                    />
                                </div>
                                <div className={`grid gap-2 ${styles.formGroup}`}>
                                    <Label htmlFor="last-name" className={styles.label}>
                                        {t('signup.lastNameLabel', { fallback: "Last name" })}
                                    </Label>
                                    <Input
                                        id="last-name"
                                        placeholder="Doe"
                                        required
                                        onChange={(e) => {
                                            setLastName(e.target.value);
                                            setError("");
                                        }}
                                        value={lastName}
                                        className={styles.input}
                                    />
                                </div>
                            </div>

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
                                <Label htmlFor="password" className={styles.label}>{t('password')}</Label>
                                <PasswordInput
                                    id="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    autoComplete="new-password"
                                    placeholder={t('password')}
                                    className={styles.input}
                                />
                            </div>

                            <div className={`grid gap-2 ${styles.formGroup}`}>
                                <Label htmlFor="password-confirmation" className={styles.label}>
                                    {t('signup.confirmPasswordLabel', { fallback: "Confirm Password" })}
                                </Label>
                                <PasswordInput
                                    id="password-confirmation"
                                    value={passwordConfirmation}
                                    onChange={(e) => {
                                        setPasswordConfirmation(e.target.value);
                                        setError("");
                                    }}
                                    autoComplete="new-password"
                                    placeholder={t('signup.confirmPasswordLabel', { fallback: "Confirm Password" })}
                                    className={styles.input}
                                />
                            </div>

                            <div className={`grid gap-2 ${styles.formGroup}`}>
                                <Label htmlFor="image" className={styles.label}>
                                    {t('signup.profileImageLabel', { fallback: "Profile Image (optional)" })}
                                </Label>
                                <div className={`flex items-end gap-4 ${styles.flexRow}`}>
                                    {imagePreview && (
                                        <div className="relative w-16 h-16 rounded-sm overflow-hidden">
                                            <Image
                                                src={imagePreview}
                                                alt="Profile preview"
                                                layout="fill"
                                                objectFit="cover"
                                            />
                                        </div>
                                    )}
                                    <div className={`flex items-center gap-2 w-full ${styles.flexRow}`}>
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className={`w-full ${styles.input}`}
                                        />
                                        {imagePreview && (
                                            <X
                                                className="cursor-pointer"
                                                onClick={() => {
                                                    setImage(null);
                                                    setImagePreview(null);
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
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
                                    if (password !== passwordConfirmation) {
                                        setError(
                                            t('signup.passwordMismatch', { fallback: "Please ensure your password and confirm password match." }),
                                        );
                                        return;
                                    }

                                    await signUp.email({
                                        email,
                                        password,
                                        name: `${firstName} ${lastName}`,
                                        image: image
                                            ? await convertImageToBase64(image)
                                            : "",
                                        callbackURL: "/dashboard",
                                        fetchOptions: {
                                            onResponse: () => {
                                                setLoading(false);
                                            },
                                            onRequest: () => {
                                                setLoading(true);
                                                setError("");
                                            },
                                            onError: (ctx) => {
                                                setError(ctx.error.message);
                                                setLoading(false);
                                            },
                                            onSuccess: async () => {
                                                router.push("/dashboard");
                                            },
                                        },
                                    });
                                }}
                            >
                                {loading ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    t('signup.submitButton')
                                )}
                            </Button>
                        </div>
                        <div className={`mt-4 text-center text-sm ${styles.textCenter} ${styles.mt4}`}>
                            {t('signup.haveAccount', { fallback: "Already have an account?" })}{" "}
                            <Link
                                href="/login"
                                className={`underline underline-offset-4 ${styles.link}`}
                            >
                                {t('login.title')}
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
                .input {
                    width: 100%;
                    padding: 8px 12px;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    font-size: 16px;
                }
                .grid {
                    display: grid;
                }
                .grid-cols-2 {
                    grid-template-columns: repeat(2, minmax(0, 1fr));
                }
                .gap-4 {
                    gap: 16px;
                }
            `}</style>
        </div>
    );
}

async function convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
