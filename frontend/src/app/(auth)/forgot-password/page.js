import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Link from "next/link";

export const metadata = { title: "Forgot password · Creators Connect" };

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center gap-2.5 mb-8">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-mint-500 grid place-items-center text-white font-display font-extrabold">
            C
          </span>
          <span className="font-display font-extrabold text-ink text-lg">Creators Connect</span>
        </Link>
        <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
          Forgot your password?
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Enter your email and we'll send you a reset link.
        </p>
        <div className="mt-7">
          <ForgotPasswordForm />
        </div>
      </div>
    </div>
  );
}