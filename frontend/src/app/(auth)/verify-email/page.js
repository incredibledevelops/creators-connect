import VerifyEmailPanel from "@/components/auth/VerifyEmailPanel";
import { Suspense } from "react";

export const metadata = { title: "Verify email · Creators Connect" };

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
          <VerifyEmailPanel />
        </Suspense>
      </div>
    </div>
  );
}