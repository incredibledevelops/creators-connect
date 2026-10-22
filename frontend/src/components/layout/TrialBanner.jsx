"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function TrialBanner() {
  const { user } = useAuth();
  const sub = user?.subscription;
  if (!sub) return null;

  if (sub.status === "expired") {
    return (
      <div className="bg-rose-600 text-white text-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <p className="font-semibold">Your trial or subscription has ended.</p>
          <Link href="/billing" className="px-4 py-2 rounded-lg bg-white text-rose-700 text-xs font-bold">
            Renew now
          </Link>
        </div>
      </div>
    );
  }

  if (sub.status === "trialing" && sub.trial_ends_at) {
    const days = Math.max(0, Math.ceil((new Date(sub.trial_ends_at) - new Date()) / (1000 * 60 * 60 * 24)));
    
    // Only show if 3 days or less remain
    if (days > 3) return null;
    
    return (
      <div className="bg-amber-500 text-white text-sm">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
          <p className="font-semibold">
            {days === 0 ? "Your trial ends today." : `Your trial ends in ${days} day${days > 1 ? "s" : ""}.`}
          </p>
          <Link href="/billing" className="px-4 py-2 rounded-lg bg-white text-amber-700 text-xs font-bold">
            Add payment method
          </Link>
        </div>
      </div>
    );
  }
  
  return null;
}