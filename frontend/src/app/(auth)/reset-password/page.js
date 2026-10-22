import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import { Suspense } from "react";

export const metadata = { title: "Reset password · Creators Connect" };

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Set a new password
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Choose a strong password you haven't used before.
        </p>
        <div className="mt-7">
          <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}