import { NextResponse } from "next/server";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const token = body?.refresh_token;
  if (!token) return NextResponse.json({ detail: "Missing token" }, { status: 400 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: "cc_refresh",
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}