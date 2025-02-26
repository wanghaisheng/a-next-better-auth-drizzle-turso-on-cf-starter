"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface VerifyEmailCardProps {
    email: string;
}

export function VerifyEmailCard({ email }: VerifyEmailCardProps) {
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [isResending, setIsResending] = useState(false);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Email Verification Required</CardTitle>
                <CardDescription>
                    Please verify your email address to access the dashboard
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Check your inbox for a verification email. You&apos;ll
                        need to verify your email address before you can access
                        this page.
                    </AlertDescription>
                </Alert>
                <Button
                    variant="secondary"
                    disabled={isResending}
                    onClick={async () => {
                        await client.sendVerificationEmail(
                            { email },
                            {
                                onRequest() {
                                    setIsResending(true);
                                },
                                onError(context) {
                                    console.error(context.error.message);
                                    setIsResending(false);
                                },
                                onSuccess() {
                                    console.log(
                                        "Verification email sent successfully",
                                    );
                                    setIsResending(false);
                                },
                            },
                        );
                    }}
                >
                    {isResending ? (
                        <Loader2 size={16} className="animate-spin" />
                    ) : (
                        "Resend Verification Email"
                    )}
                </Button>
            </CardContent>
            <CardFooter className="flex justify-end">
                <Button
                    variant="outline"
                    className="gap-2"
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
                            Sign Out
                        </>
                    )}
                </Button>
            </CardFooter>
        </Card>
    );
}
