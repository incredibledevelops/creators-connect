"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";

export default function SignupForm() {
  const router = useRouter();
  const toast = useToast();
  const { signup } = useAuth();
  const [form, setForm] = useState({ full_name: "", email: "", password: "", agree: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.agree) return setError("Please accept the terms to continue.");
    setLoading(true);
    try {
      await signup(form.full_name, form.email, form.password);
      toast.show("Trial started — 14 days of Pro access unlocked 🎉");
      router.replace("/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Input
        label="Full name"
        placeholder="Amara Okafor"
        value={form.full_name}
        onChange={(e) => setForm({ ...form, full_name: e.target.value })}
        required
      />
      <Input
        label="Work email"
        type="email"
        placeholder="you@studio.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="At least 8 characters"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        minLength={8}
      />
      <label className="flex items-start gap-2.5 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={form.agree}
          onChange={(e) => setForm({ ...form, agree: e.target.checked })}
          className="mt-0.5 w-4 h-4 rounded border-slate-300 text-brand-600 focus:ring-brand-400"
        />
        <span>
          I agree to the{" "}
          <Link href="#" className="font-semibold text-brand-600">Terms</Link> and{" "}
          <Link href="#" className="font-semibold text-brand-600">Privacy Policy</Link>.
        </span>
      </label>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Creating your studio…" : "Start my 14-day trial"}
      </Button>
      <p className="text-center text-sm text-slate-500 pt-2">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand-600 hover:text-brand-700">
          Log in
        </Link>
      </p>
    </form>
  );
}