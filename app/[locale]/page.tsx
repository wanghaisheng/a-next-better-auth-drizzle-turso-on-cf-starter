import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/src/i18n/routing"; // Update this import to use the correct path
import { LanguageSwitcher } from "@/components/language-switcher";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { setRequestLocale } from "next-intl/server";

// This function handles the async locale setup
export async function generateMetadata({ params }: { params: { locale: string } }) {
  // Access locale directly without destructuring
  await setRequestLocale(params.locale);
  return {};
}

// The main component is not async, so it can use hooks
export default function Home({ params }: { params: { locale: string } }) {
    // Use translations
    const t = useTranslations("common");

    return (
        <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <header className="fixed top-0 right-0 w-full flex flex-row items-end justify-end p-4 space-x-2">
                <LanguageSwitcher />
                <ModeToggle />
            </header>
            <main className="flex flex-col gap-8 row-start-2 items-center sm:items-start">
                <Image
                    className="dark:invert"
                    src="/next.svg"
                    alt="Next.js logo"
                    width={180}
                    height={38}
                    priority
                />
                <h1 className="text-3xl font-bold">{t("welcome")}</h1>
                <ol className="list-inside list-decimal text-sm text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
                    <li className="mb-2">
                        {t("getStartedByEditing")}{" "}
                        <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-semibold">
                            app/[locale]/page.tsx
                        </code>
                    </li>
                    <li>{t("saveAndSeeChanges")}</li>
                </ol>

                <div className="flex gap-4 items-center flex-col sm:flex-row">
                    <Link
                        href="/login"
                        className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5"
                    >
                        {t("loginNow")}
                    </Link>
                    <Link
                        href="/sign-up"
                        className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:min-w-44"
                    >
                        {t("createAccount")}
                    </Link>
                </div>
            </main>
            <footer className="row-start-3 flex gap-6 flex-wrap items-center justify-center">
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Image
                        aria-hidden
                        src="/file.svg"
                        alt="File icon"
                        width={16}
                        height={16}
                    />
                    {t("learn")}
                </a>
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Image
                        aria-hidden
                        src="/window.svg"
                        alt="Window icon"
                        width={16}
                        height={16}
                    />
                    {t("examples")}
                </a>
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <Image
                        aria-hidden
                        src="/globe.svg"
                        alt="Globe icon"
                        width={16}
                        height={16}
                    />
                    {t("goToNextjs")}
                </a>
            </footer>
        </div>
    );
}
