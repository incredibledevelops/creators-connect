"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import DriveStatusCard from "@/components/drive/DriveStatusCard";
import FileBrowser from "@/components/drive/FileBrowser";
import UploadButton from "@/components/drive/UploadButton";
import { useToast } from "@/lib/toast";

export default function DrivePage() {
  const toast = useToast();
  const [status, setStatus] = useState(null);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, f] = await Promise.all([
        api.get("/drive/status"),
        api.get("/drive/files").catch(() => ({ files: [] })),
      ]);
      setStatus(s);
      setFiles(f.files || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connect = async () => {
    try {
      const res = await api.get("/drive/connect");
      window.open(res.authorization_url, "_blank", "noopener,noreferrer,width=600,height=700");
      toast.show("Complete the Google authorization in the popup.");
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const disconnect = async () => {
    if (!confirm("Disconnect Google Drive? Scheduled media will stop syncing.")) return;
    try {
      await api.post("/drive/disconnect", {});
      toast.show("Drive disconnected.");
      load();
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  const onUploaded = (file) => {
    setFiles((prev) => [file, ...prev]);
    toast.show("Uploaded to Drive.");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Google Drive</h1>
        <p className="text-slate-500 text-sm mt-1">
          Your files live in your Drive. We only keep links, versions and permissions.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
        <div className="lg:col-span-2">
          <DriveStatusCard status={status} onConnect={connect} onDisconnect={disconnect} />
        </div>
        <div className="rounded-2xl bg-gradient-to-br from-mint-600 to-mint-800 p-6 text-white shadow-soft relative overflow-hidden">
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="relative">
            <h3 className="font-display font-extrabold text-lg leading-tight">Privacy by design</h3>
            <p className="mt-2 text-sm text-mint-100 leading-relaxed">
              We never copy, cache or host your media. Files stream directly from your Drive with
              permission scopes you control.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-display font-bold text-ink">Files</h2>
            <p className="text-xs text-slate-500 mt-0.5">Stored in your Creators Connect folder.</p>
          </div>
          {status?.connected && <UploadButton onUploaded={onUploaded} />}
        </div>
        <FileBrowser files={files} loading={loading} connected={!!status?.connected} />
      </div>
    </div>
  );
}