"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";
import SocialConnections from "@/components/settings/SocialConnections";

function SettingsInner() {
  const { user, refreshMe } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const params = useSearchParams();
  
  // Prevents the toast from firing multiple times
  const hasHandledRedirect = useRef(false);

  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    handle: user?.handle || "",
    bio: user?.bio || "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const driveConnected = params.get("drive") === "connected";
    const socialConnected = params.get("connected");

    if ((driveConnected || socialConnected) && !hasHandledRedirect.current) {
      hasHandledRedirect.current = true;

      // Show the appropriate toast message
      if (driveConnected) {
        toast.show("Google Drive connected.");
      } else if (socialConnected) {
        toast.show(`${socialConnected.toUpperCase()} connected successfully!`);
      }

      refreshMe();
      
      // Clean the URL so refreshing doesn't trigger it again
      router.replace("/settings", { scroll: false });
    }
  }, [params, toast, refreshMe, router]);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.patch("/users/me", form);
      toast.show("Profile saved.");
      await refreshMe();
    } catch (e) {
      toast.show(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    try {
      await api.upload("/users/me/avatar", fd);
      toast.show("Avatar updated.");
      await refreshMe();
    } catch (err) {
      toast.show(err.message, "error");
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Manage your profile and connections.</p>
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-card">
        <h2 className="font-display font-bold text-ink">Profile</h2>
        <div className="mt-5 flex items-center gap-4">
          <img
            className="w-16 h-16 rounded-2xl object-cover bg-slate-100"
            src={user?.avatar_url || `https://i.pravatar.cc/160?u=${user?.id}`}
            alt=""
          />
          <div>
            <label className="inline-block px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-ink cursor-pointer">
              Change photo
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
            </label>
            <p className="text-[11px] text-slate-400 mt-1.5">JPG or PNG · max 2 MB</p>
          </div>
        </div>

        <form onSubmit={save} className="mt-5 grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Full name</label>
            <input
              type="text"
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-ink mb-1.5">Handle</label>
            <input
              type="text"
              value={form.handle}
              onChange={(e) => setForm({ ...form, handle: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-100"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-semibold text-ink mb-1.5">Bio</label>
            <textarea
              rows={3}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-400 focus:ring-4 focus:ring-brand-100 resize-none"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-soft disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
          </div>
        </form>
      </div>

      {/* Social Connections Card */}
      <SocialConnections />

    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500 p-8">Loading…</p>}>
      <SettingsInner />
    </Suspense>
  );
}