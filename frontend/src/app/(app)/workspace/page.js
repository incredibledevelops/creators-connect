"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import SeatBar from "@/components/workspace/SeatBar";
import MemberTable from "@/components/workspace/MemberTable";
import InviteDialog from "@/components/workspace/InviteDialog";
import { useToast } from "@/lib/toast";

export default function WorkspacePage() {
  const toast = useToast();
  const [workspace, setWorkspace] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/workspace");
      setWorkspace(res.workspace);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (!confirm("Remove this member?")) return;
    try {
      await api.del(`/workspace/members/${id}`);
      toast.show("Member removed.");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">
            {workspace?.name || "Workspace"}
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Manage your team and seats across the studio.
          </p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold shadow-soft transition"
        >
          + Invite by Email
        </button>
      </div>

      {!loading && workspace && (
        <SeatBar used={workspace.seats_used} limit={workspace.seat_limit} />
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <MemberTable
          owner={workspace?.owner}
          members={workspace?.members || []}
          loading={loading}
          onRemove={remove}
        />
      </div>

      <InviteDialog
        open={open}
        onClose={() => setOpen(false)}
        onInvited={() => {
          setOpen(false);
          load();
        }}
      />
    </div>
  );
}