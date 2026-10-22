"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import PlanCard from "@/components/billing/PlanCard";
import PaymentHistory from "@/components/billing/PaymentHistory";
import { useToast } from "@/lib/toast";

export default function BillingPage() {
  const toast = useToast();
  const [plans, setPlans] = useState([]);
  const [currency, setCurrency] = useState("GHS");
  const [sub, setSub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s, h] = await Promise.all([
        api.get("/payments/plans"),
        api.get("/payments/subscription"),
        api.get("/payments/history"),
      ]);
      setPlans(p.plans || []);
      setCurrency(p.currency || "GHS");
      setSub(s.subscription);
      setPayments(h.payments || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const subscribe = async (planId) => {
    try {
      const res = await api.post("/payments/initialize", { plan_id: planId });
      toast.show("Redirecting to Paystack…");
      window.location.href = res.authorization_url;
    } catch (e) {
      toast.show(e.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold text-ink tracking-tight">
          Billing & subscription
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          Manage your plan, payment method and invoices.
        </p>
      </div>

      {sub && (
        <div className="rounded-2xl bg-ink p-6 text-white shadow-soft relative overflow-hidden">
          <div className="absolute -top-20 -right-16 w-64 h-64 bg-brand-500/40 rounded-full blur-3xl" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="flex-1">
              <p className="text-[11px] font-bold tracking-[0.14em] text-mint-400 uppercase">
                Current plan · {sub.plan}
              </p>
              <h3 className="mt-1.5 font-display text-2xl font-extrabold">
                {sub.status === "trialing" ? "Free trial active" : sub.status}
              </h3>
              <p className="text-sm text-slate-400 mt-1.5">
                {sub.current_period_end
                  ? `Valid until ${new Date(sub.current_period_end).toLocaleDateString()}`
                  : sub.trial_ends_at
                  ? `Trial ends ${new Date(sub.trial_ends_at).toLocaleDateString()}`
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="font-display font-bold text-ink text-lg mb-3">Plans</h2>
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-5">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              currency={currency}
              current={sub?.plan === plan.id && sub?.status === "active"}
              onSubscribe={() => subscribe(plan.id)}
            />
          ))}
        </div>
      </div>

      <PaymentHistory payments={payments} loading={loading} currency={currency} />
    </div>
  );
}