"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

export default function VerifyEmailPanel() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [state, setState] = useState({ status: "loading", message: "" });

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!token) {
        setState({ status: "error", message: "Missing verification token." });
        return;
      }
      try {
        await api.post("/auth/verify-email", { token });
        if (!cancel) setState({ status: "success", message: "Email verified. Welcome aboard!" });
      } catch (e) {
        if (!cancel) setState({ status: "error", message: e.message });
      }
    })();
    return () => {
      cancel = true;
    };
  }, [token]);

  return (
    <div className="text-center">
      {state.status === "loading" && (
        <div className="flex items-center justify-center gap-2 text-slate-500">
          <span className="w-4 h-4 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
          Verifying…
        </div>
      )}
      {state.status === "success" && (
        <div className="fade-in">
          <div className="w-16 h-16 rounded-2xl bg-mint-100 text-mint-600 grid place-items-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="m5 13 4 4L19 7" />
            </svg>
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">Email verified</h1>
          <p className="mt-2 text-slate-600">{state.message}</p>
          <button
            onClick={() => router.push("/dashboard")}
            className="mt-6 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold"
          >
            Go to dashboard
          </button>
        </div>
      )}
      {state.status === "error" && (
        <div className="fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 grid place-items-center mx-auto">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" />
            </svg>
          </div>
          <h1 className="mt-5 font-display text-2xl font-extrabold text-ink">Verification issue</h1>
          <p className="mt-2 text-slate-600">{state.message}</p>
          <Link href="/login" className="mt-6 inline-block px-5 py-2.5 rounded-xl bg-ink text-white font-semibold">
            Back to login
          </Link>
        </div>
      )}
    </div>
  );
}