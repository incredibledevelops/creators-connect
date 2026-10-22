import SignupForm from "@/components/auth/SignupForm";
import Link from "next/link";

export const metadata = { title: "Start free trial · Creators Connect" };

export default function SignupPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="flex items-center justify-center p-6 sm:p-10 order-2 lg:order-1">
        <div className="w-full max-w-md">
          <span className="inline-flex items-center gap-2 rounded-full bg-mint-50 border border-mint-200 px-3 py-1.5 text-xs font-bold text-mint-700">
            <span className="w-1.5 h-1.5 rounded-full bg-mint-500" /> 14 days free · No card required
          </span>
          <h1 className="mt-5 font-display text-2xl sm:text-3xl font-extrabold text-ink tracking-tight">
            Create your studio
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            You'll connect your Google Drive right after this step.
          </p>
          <div className="mt-7">
            <SignupForm />
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-col justify-between bg-ink p-12 relative overflow-hidden order-1 lg:order-2">
        <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-brand-600/40 rounded-full blur-3xl" />
        <div className="absolute top-10 -left-24 w-72 h-72 bg-mint-600/30 rounded-full blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-mint-500 grid place-items-center text-white font-display font-extrabold">
            C
          </span>
          <span className="font-display font-extrabold text-white text-lg">Creators Connect</span>
        </Link>
        <div className="relative">
          <h2 className="font-display text-3xl font-extrabold text-white leading-tight">
            Your files.
            <br />
            Your Drive.
            <br />
            <span className="text-mint-400">Always.</span>
          </h2>
          <ul className="mt-8 space-y-4">
            {[
              "We only store links and permissions — never a copy of your files.",
              "Revoke access from your Google account at any time.",
              "Cancel your subscription and keep every project intact.",
            ].map((text) => (
              <li key={text} className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="w-6 h-6 rounded-lg bg-white/10 grid place-items-center text-mint-400 shrink-0 mt-0.5">
                  ✓
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">
          © {new Date().getFullYear()} Creators Connect
        </p>
      </div>
    </div>
  );
}