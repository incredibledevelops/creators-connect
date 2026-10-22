"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import StatCard from "@/components/dashboard/StatCard";
import ActivityFeed from "@/components/dashboard/ActivityFeed";
import UpcomingPosts from "@/components/dashboard/UpcomingPosts";

export default function DashboardPage() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const [s, a] = await Promise.all([
          api.get("/dashboard/summary"),
          api.get("/dashboard/activity?limit=8"),
        ]);
        if (!cancel) {
          setSummary(s);
          setActivity(a.activity || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancel) setLoading(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, []);

  const firstName = (user?.full_name || "").split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-[26px] font-extrabold text-ink tracking-tight">
            Good morning, {firstName} 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Here's what's happening across your studio today.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/scheduler"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-soft transition"
          >
            Schedule post
          </Link>
          <Link
            href="/projects"
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-ink text-sm font-semibold transition"
          >
            New project
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-2xl bg-white border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard label="Shared projects" value={summary?.stats?.projects ?? 0} accent="brand" />
          <StatCard
            label="Scheduled posts"
            value={summary?.stats?.scheduled_posts ?? 0}
            accent="mint"
          />
          <StatCard
            label="Upcoming posts"
            value={summary?.stats?.upcoming_posts ?? 0}
            accent="amber"
          />
          <StatCard
            label="Collaborators"
            value={summary?.stats?.collaborators ?? 1}
            accent="violet"
          />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2">
          <UpcomingPosts posts={summary?.upcoming || []} />
        </div>
        <ActivityFeed items={activity} />
      </div>
    </div>
  );
}