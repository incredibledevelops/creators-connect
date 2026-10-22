import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";

export const metadata = { title: "Log in · Creators Connect" };

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-ink p-12 relative overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-brand-600/40 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-mint-600/30 rounded-full blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-mint-500 grid place-items-center text-white font-display font-extrabold">
            C
          </span>
          <span className="font-display font-extrabold text-white text-lg">Creators Connect</span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-3xl font-extrabold text-white leading-tight">
            Welcome back to
            <br />
            your studio.
          </h2>
          <p className="mt-4 text-slate-400 max-w-sm">
            Pick up the conversation, approve a cut, or reschedule tomorrow's drop.
          </p>
        </div>
        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Creators Connect
        </p>
      </div>

      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Log in to your account
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Good to see you again. Let's get creating.
          </p>
          <div className="mt-7">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}