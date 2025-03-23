import { ForgotPasswordForm } from "@/components/forgot-password-form";

export default function ForgoPasswordPage() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <ForgotPasswordForm enabled={!!process.env.RESEND_API_KEY} />
            </div>
        </div>
    );
}
