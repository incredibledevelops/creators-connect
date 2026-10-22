"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import CalendarStrip from "@/components/scheduler/CalendarStrip";
import QueueList from "@/components/scheduler/QueueList";
import ScheduleModal from "@/components/scheduler/ScheduleModal";
import { useToast } from "@/lib/toast";

export default function SchedulerPage() {
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/schedule?limit=200");
      setPosts(res.posts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const publishNow = async (id) => {
    try {
      await api.post(`/schedule/${id}/publish-now`, {});
      toast.show("Published!");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this scheduled post?")) return;
    try {
      await api.del(`/schedule/${id}`);
      toast.show("Deleted.");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Scheduler</h1>
          <p className="text-slate-500 text-sm mt-1">
            Plan, queue and publish across every platform from one calendar.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-soft transition"
        >
          + Schedule post
        </button>
      </div>

      <CalendarStrip posts={posts} />

      <QueueList posts={posts} loading={loading} onPublishNow={publishNow} onDelete={remove} />

      <ScheduleModal
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}