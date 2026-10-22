"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatGHS, formatDate } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u, p] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/admin/payments"),
      ]);
      setStats(s);
      setUsers(u.users || []);
      setPayments(p.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (user?.role !== "admin") {
    return <div className="text-rose-600 p-8">Access Denied. Admins only.</div>;
  }

  const suspend = async (id) => {
    if (!confirm("Suspend this user? They will lose access immediately.")) return;
    try {
      await api.patch(`/admin/users/${id}/suspend`);
      load();
    } catch (e) {
      alert(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Platform overview and user management.</p>
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Users</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-ink">{stats.users.total}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <p className="text-xs font-semibold text-slate-500 uppercase">Active Subs</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-mint-600">{stats.users.active}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <p className="text-xs font-semibold text-slate-500 uppercase">On Trial</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-amber-500">{stats.users.trialing}</p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card">
            <p className="text-xs font-semibold text-slate-500 uppercase">Total Revenue</p>
            <p className="mt-2 font-display text-3xl font-extrabold text-brand-600">{formatGHS(stats.revenue.total_ghs)}</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card overflow-hidden">
        <div className="p-5 border-b border-slate-100">
          <h2 className="font-display font-bold text-ink">Recent Users</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-semibold text-ink">{u.full_name}</td>
                  <td className="px-5 py-3 text-slate-500">{u.email}</td>
                  <td className="px-5 py-3 uppercase font-bold text-xs">{u.subscription?.plan}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                      u.subscription?.status === 'active' ? 'bg-mint-100 text-mint-700' :
                      u.subscription?.status === 'trialing' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {u.subscription?.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(u.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    <button onClick={() => suspend(u.id)} className="text-rose-600 font-bold hover:underline">
                      Suspend
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}