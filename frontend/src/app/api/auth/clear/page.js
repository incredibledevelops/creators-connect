import { NextResponse } from "next/server";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set({ name: "cc_refresh", value: "", path: "/", maxAge: 0 });
  return res;
}