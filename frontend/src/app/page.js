"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function LandingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-mint-500 grid place-items-center text-white font-display font-extrabold shadow-soft">
              C
            </span>
            <span className="font-display font-extrabold text-[17px] text-ink tracking-tight">
              Creators Connect
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="hidden sm:inline-flex px-4 py-2 text-sm font-semibold text-slate-600 hover:text-ink transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-soft transition"
            >
              Start free trial
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden">
        <div className="absolute -top-32 -right-24 w-[440px] h-[440px] bg-brand-300/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-52 -left-32 w-[400px] h-[400px] bg-mint-300/40 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-20 lg:pt-24 lg:pb-28 grid lg:grid-cols-2 gap-14 items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-mint-500 animate-pulse" />
              14-day free trial · No card required
            </span>
            <h1 className="mt-6 font-display text-[2.4rem] leading-[1.06] sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-ink">
              Where creators
              <br className="hidden sm:block" />
              <span className="bg-gradient-to-r from-brand-600 via-brand-500 to-mint-500 bg-clip-text text-transparent">
                build together
              </span>
            </h1>
            <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-xl leading-relaxed">
              Chat with your team, share projects for feedback, and schedule posts across every
              platform — all in one calm workspace. Your files stay safely in{" "}
              <span className="font-semibold text-ink">your own Google Drive</span>.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold shadow-soft transition"
              >
                Start your 14-day trial
              </Link>
              <Link
                href="#features"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-ink font-semibold shadow-sm transition"
              >
                Explore features
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-6 bg-gradient-to-tr from-brand-400/30 to-mint-400/30 rounded-[2.5rem] blur-2xl" />
            <div className="relative bg-white rounded-3xl border border-slate-200 shadow-soft p-5 sm:p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span className="w-2.5 h-2.5 rounded-full bg-mint-400" />
                </div>
                <span className="text-[11px] font-semibold text-slate-400 tracking-wide">
                  STUDIO · AUTUMN DROP
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2.5">
                <div className="rounded-xl bg-brand-50 p-3">
                  <p className="text-[10px] font-semibold text-brand-700/70 uppercase tracking-wide">
                    Projects
                  </p>
                  <p className="font-display text-xl font-extrabold text-brand-700 mt-0.5">12</p>
                </div>
                <div className="rounded-xl bg-mint-50 p-3">
                  <p className="text-[10px] font-semibold text-mint-700/70 uppercase tracking-wide">
                    Scheduled
                  </p>
                  <p className="font-display text-xl font-extrabold text-mint-700 mt-0.5">28</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                    Team
                  </p>
                  <p className="font-display text-xl font-extrabold text-ink mt-0.5">7</p>
                </div>
              </div>
              <div className="mt-4 space-y-2.5">
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-orange-400 grid place-items-center text-white text-[10px] font-bold shrink-0">
                    IG
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink truncate">
                      Reel · “Behind the shoot”
                    </p>
                    <p className="text-[11px] text-slate-500">Today · 6:30 PM</p>
                  </div>
                  <span className="text-[10px] font-bold text-mint-700 bg-mint-100 px-2 py-1 rounded-md">
                    READY
                  </span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                  <span className="w-8 h-8 rounded-lg bg-ink grid place-items-center text-white text-[10px] font-bold shrink-0">
                    TT
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-ink truncate">
                      TikTok · Product teaser
                    </p>
                    <p className="text-[11px] text-slate-500">Tomorrow · 11:00 AM</p>
                  </div>
                  <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-1 rounded-md">
                    REVIEW
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-20 bg-white border-y border-slate-200/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold tracking-[0.16em] text-brand-600 uppercase">
              Everything in one place
            </span>
            <h2 className="mt-3 font-display text-3xl sm:text-4xl font-extrabold text-ink tracking-tight">
              A studio built for collaboration
            </h2>
            <p className="mt-3 text-slate-600">
              Stop juggling five apps and three group chats. Creators Connect brings your people,
              projects and posts together.
            </p>
          </div>
          <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-slate-200 p-6 hover:border-brand-300 hover:shadow-card transition bg-white"
              >
                <div className={`w-11 h-11 rounded-xl ${f.bg} ${f.iconColor} grid place-items-center`}>
                  {f.icon}
                </div>
                <h3 className="mt-4 font-display font-bold text-ink">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-mint-500 grid place-items-center text-white font-display font-extrabold text-sm">
              C
            </span>
            <span className="font-display font-extrabold text-ink">Creators Connect</span>
          </div>
          <p className="text-xs text-slate-400">© {new Date().getFullYear()} Creators Connect</p>
        </div>
      </footer>
    </div>
  );
}

const FEATURES = [
  {
    title: "Real-time chat",
    description: "DMs and project rooms with threads, reactions and file previews.",
    bg: "bg-brand-50",
    iconColor: "text-brand-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h8M8 8h8M8 16h5M21 12a9 9 0 1 1-3.6-7.2L21 4v8Z" />
      </svg>
    ),
  },
  {
    title: "Shared project boards",
    description: "Publish drafts, collect time-stamped comments, and approve final cuts.",
    bg: "bg-mint-50",
    iconColor: "text-mint-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />
      </svg>
    ),
  },
  {
    title: "Post scheduler",
    description: "Queue content for Instagram, TikTok, YouTube and X from one calendar.",
    bg: "bg-amber-50",
    iconColor: "text-amber-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3M4 11h16M5 21h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1Z" />
      </svg>
    ),
  },
  {
    title: "Google Drive native",
    description: "Connect your Drive once. We store links, versions and permissions — never files.",
    bg: "bg-sky-50",
    iconColor: "text-sky-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 0 1-.8-7.9A5.5 5.5 0 0 1 17 7.5a4.5 4.5 0 0 1 .5 9H7Z" />
      </svg>
    ),
  },
  {
    title: "Roles & invites",
    description: "Invite editors, clients and collaborators with granular access.",
    bg: "bg-violet-50",
    iconColor: "text-violet-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM8 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 0c-1.6 0-3 1-3 2.5S14.4 21 16 21s3-1 3-2.5S17.6 13 16 13Z" />
      </svg>
    ),
  },
  {
    title: "Insights & approvals",
    description: "See what shipped, what's stuck in review, and how your posts performed.",
    bg: "bg-rose-50",
    iconColor: "text-rose-600",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.9" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16M8 15l3.5-4L15 14l4-6" />
      </svg>
    ),
  },
];