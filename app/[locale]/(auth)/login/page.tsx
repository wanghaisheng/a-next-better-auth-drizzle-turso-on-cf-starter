import { LoginForm } from "@/components/login-form";
import { getTranslations } from "next-intl/server";
import { setRequestLocale } from "next-intl/server";

export default async function LoginPage({ params }: { params: { locale: string } }) {
    // Enable static rendering with explicit locale
    await setRequestLocale(params.locale);

    // Get translations using getTranslations instead of useTranslations
    const t = await getTranslations("auth");

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <LoginForm />
            </div>
        </div>
    );
}

export async function generateMetadata({ params }: { params: { locale: string } }) {
    // Set locale for metadata generation
    await setRequestLocale(params.locale);

    // Use a static title instead of translations for build compatibility
    return {
        title: "Login",
    };
}
