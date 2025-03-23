import { ModeToggle } from "@/components/ui/mode-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { setRequestLocale } from "next-intl/server";

export default async function AuthLayout({
    children,
    params
}: Readonly<{
    children: React.ReactNode;
    params: { locale: string };
}>) {
    // Enable static rendering with explicit locale
    await setRequestLocale(params.locale);

    return (
        <>
            <header className="fixed top-0 right-0 w-full flex flex-row items-end justify-end p-4 space-x-2">
                <LanguageSwitcher />
                <ModeToggle />
            </header>
            <main className="flex flex-col">{children}</main>
        </>
    );
}
