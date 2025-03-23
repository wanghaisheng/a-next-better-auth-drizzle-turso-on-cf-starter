import { ModeToggle } from "@/components/ui/mode-toggle";

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <>
            <header className="fixed top-0 right-0 w-full flex flex-row items-end justify-end p-4">
                <ModeToggle />
            </header>
            <main className="flex flex-col">{children}</main>
        </>
    );
}
