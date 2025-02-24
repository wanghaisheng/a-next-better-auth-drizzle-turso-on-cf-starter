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

export type SignUpFormProps = ComponentPropsWithoutRef<"div">;

export function SignUpForm({ className, ...props }: SignUpFormProps) {
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
        <div className={cn("flex flex-col gap-6", className)} {...props}>
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">Sign Up</CardTitle>
                    <CardDescription>
                        Enter your information to create an account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form>
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="first-name">
                                        First name
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
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="last-name">Last name</Label>
                                    <Input
                                        id="last-name"
                                        placeholder="Doe"
                                        required
                                        onChange={(e) => {
                                            setLastName(e.target.value);
                                            setError("");
                                        }}
                                        value={lastName}
                                    />
                                </div>
                            </div>

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

                            <div className="grid gap-2">
                                <Label htmlFor="password">Password</Label>
                                <PasswordInput
                                    id="password"
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError("");
                                    }}
                                    autoComplete="new-password"
                                    placeholder="Password"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password-confirmation">
                                    Confirm Password
                                </Label>
                                <PasswordInput
                                    id="password-confirmation"
                                    value={passwordConfirmation}
                                    onChange={(e) => {
                                        setPasswordConfirmation(e.target.value);
                                        setError("");
                                    }}
                                    autoComplete="new-password"
                                    placeholder="Confirm Password"
                                />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="image">
                                    Profile Image (optional)
                                </Label>
                                <div className="flex items-end gap-4">
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
                                    <div className="flex items-center gap-2 w-full">
                                        <Input
                                            id="image"
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageChange}
                                            className="w-full"
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
                                className="w-full"
                                disabled={loading}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    if (password !== passwordConfirmation) {
                                        setError(
                                            "Please ensure your password and confirm password match.",
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
                                    "Sign Up"
                                )}
                            </Button>
                        </div>
                        <div className="mt-4 text-center text-sm">
                            Already have an account?{" "}
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

async function convertImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
