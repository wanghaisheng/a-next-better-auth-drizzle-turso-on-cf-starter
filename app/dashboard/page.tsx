import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardStub } from "@/components/dashboard/dashboard-stub";
import { VerifyEmailCard } from "@/components/dashboard/verify-email-card";

export const runtime = "edge";

export default async function DashboardPage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    if (process.env.VERIFY_EMAIL !== "false" && !session.user.emailVerified) {
        return (
            <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-sm">
                    <VerifyEmailCard email={session.user.email} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <DashboardStub user={session.user} />
            </div>
        </div>
    );
}
