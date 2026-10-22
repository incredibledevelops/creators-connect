"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

const PLATFORMS = [
  { id: "IG", slug: "instagram", name: "Instagram", color: "from-pink-500 to-orange-400", icon: "IG" },
  { id: "X", slug: "x", name: "X (Twitter)", color: "bg-slate-900", icon: "X" },
  { id: "TT", slug: "tiktok", name: "TikTok", color: "bg-ink", icon: "TT" },
  { id: "YT", slug: "youtube", name: "YouTube", color: "bg-red-500", icon: "YT" },
  { id: "FB", slug: "facebook", name: "Facebook", color: "bg-blue-600", icon: "FB" },
];

export default function SocialConnections() {
  const toast = useToast();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/accounts");
      setAccounts(res.accounts || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleConnect = async (platform) => {
    try {
      // Use platform.slug (e.g. "instagram") instead of platform.id (e.g. "IG")
      const res = await api.get(`/accounts/connect/${platform.slug}`);
      window.location.href = res.authorization_url;
    } catch (err) {
      toast.show(err.message, "error");
    }
  };

  const disconnect = async (platformId) => {
    if (!confirm("Disconnect this account? Scheduled posts will fail.")) return;
    try {
      // Disconnect expects the short ID (IG, X, etc) because that's how we save it in DB
      await api.del(`/accounts/${platformId}`);
      toast.show("Account disconnected.");
      load();
    } catch (err) {
      toast.show(err.message, "error");
    }
  };

  const getConnected = (platformId) => {
    return accounts.find((a) => a.platform === platformId);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-card">
      <div className="mb-5">
        <h2 className="font-display font-bold text-ink text-lg">Social Integrations</h2>
        <p className="text-sm text-slate-500 mt-1">Connect your accounts to enable direct publishing from the Scheduler.</p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {PLATFORMS.map((platform) => {
          const connected = getConnected(platform.id);
          return (
            <div key={platform.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className={`w-10 h-10 rounded-lg grid place-items-center text-white font-extrabold shadow-sm ${platform.color} ${platform.id === 'IG' ? 'bg-gradient-to-br' : ''}`}>
                  {platform.icon}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">{platform.name}</p>
                  {connected ? (
                    <p className="text-xs text-mint-600 font-medium truncate max-w-[120px]">@{connected.handle}</p>
                  ) : (
                    <p className="text-xs text-slate-400">Not connected</p>
                  )}
                </div>
              </div>
              
              {connected ? (
                <button
                  onClick={() => disconnect(platform.id)}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 border border-rose-200 rounded-lg hover:bg-rose-50 transition"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={() => handleConnect(platform)}
                  className="px-3 py-1.5 text-xs font-bold text-ink border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                >
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}