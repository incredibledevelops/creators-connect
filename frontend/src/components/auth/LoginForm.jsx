"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/lib/toast";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const toast = useToast();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      toast.show("Welcome back!");
      router.replace(params.get("next") || "/dashboard");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

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
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-semibold text-ink">Password</label>
          <Link href="/forgot-password" className="text-xs font-semibold text-brand-600 hover:text-brand-700">
            Forgot?
          </Link>
        </div>
        <Input
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full" size="lg">
        {loading ? "Logging in…" : "Log in"}
      </Button>
      <p className="text-center text-sm text-slate-500 pt-2">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-brand-600 hover:text-brand-700">
          Start your free trial
        </Link>
      </p>
    </form>
  );
}