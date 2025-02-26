"use client";

import { useState, type ComponentPropsWithoutRef } from "react";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { client } from "@/lib/auth-client";

export interface ForgotPasswordFormProps
    extends ComponentPropsWithoutRef<"div"> {
    enabled?: boolean;
}

export function ForgotPasswordForm({
    className,
    enabled = false,
    ...props
}: ForgotPasswordFormProps) {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [isSubmitted, setIsSubmitted] = useState(false);

    if (!enabled) {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            Password Reset Unavailable
                        </CardTitle>
                        <CardDescription>
                            Password reset functionality is not configured
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                This application has not been configured to send
                                password reset emails yet. Please contact the
                                administrators if you need to restore access to
                                your account.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" className="w-full" asChild>
                            <Link href="/login">Back to Login</Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className={cn("flex flex-col gap-6", className)} {...props}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-2xl">
                            Check your email
                        </CardTitle>
                        <CardDescription>
                            We&apos;ve sent a password reset link to your email.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Alert>
                            <CheckCircle2 className="h-4 w-4" />
                            <AlertDescription>
                                If you don&apos;t see the email, check your spam
                                folder.
                            </AlertDescription>
                        </Alert>
                    </CardContent>
                    <CardFooter>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => setIsSubmitted(false)}
                        >
                            Try again
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email below to reset your password
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="flex flex-col gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
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
                                />
                            </div>

                            {error && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}

                            <Button
                                type="submit"
                                className="w-full"
                                disabled={loading}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    setLoading(true);
                                    setError("");

                                    try {
                                        await client.forgetPassword({
                                            email,
                                            redirectTo: "/reset-password",
                                        });
                                        setIsSubmitted(true);
                                    } catch (err) {
                                        console.error(err);
                                        setError(
                                            "An error occurred. Please try again.",
                                        );
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                            >
                                {loading ? (
                                    <Loader2
                                        size={16}
                                        className="animate-spin"
                                    />
                                ) : (
                                    "Send reset link"
                                )}
                            </Button>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Remembered your password?{" "}
                            <Link
                                href="/login"
                                className="underline underline-offset-4"
                            >
                                Login
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
