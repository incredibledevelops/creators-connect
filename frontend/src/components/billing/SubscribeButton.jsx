"use client";

import Button from "@/components/ui/Button";

export default function SubscribeButton({ onClick, loading, label = "Subscribe" }) {
  return (
    <Button onClick={onClick} disabled={loading} className="w-full">
      {loading ? "Redirecting…" : label}
    </Button>
  );
}