"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

interface DashboardStubProps {
    user: User;
}

export function DashboardStub({ user }: DashboardStubProps) {
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-2xl">Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-lg">
                    Welcome, <span className="font-medium">{user.name}</span>!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                    {user.email}
                </p>
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
