"use client";

import { useState } from "react";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { useToast } from "@/lib/toast";

export default function ForgotPasswordForm() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
      toast.show("If that email exists, a reset link has been sent.");
    } catch (e) {
      toast.show(e.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="fade-in text-sm text-slate-600">
        <p>Check your inbox for a reset link. It expires in 30 minutes.</p>
        <Link href="/login" className="mt-4 inline-block font-semibold text-brand-600">
          ← Back to login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        placeholder="you@studio.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Sending…" : "Send reset link"}
      </Button>
      <p className="text-center text-sm text-slate-500 pt-2">
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          ← Back to login
        </Link>
      </p>
    </form>
  );
}