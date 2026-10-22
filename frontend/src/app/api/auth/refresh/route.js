import { NextResponse } from "next/server";

export async function POST(request) {
  const refresh = request.cookies.get("cc_refresh")?.value;
  if (!refresh) return NextResponse.json({ detail: "No refresh cookie" }, { status: 401 });

  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  const resp = await fetch(`${base}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refresh }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const res = NextResponse.json(data, { status: resp.status });
    res.cookies.set({ name: "cc_refresh", value: "", path: "/", maxAge: 0 });
    return res;
  }

  const res = NextResponse.json(data);
  if (data.refresh_token) {
    res.cookies.set({
      name: "cc_refresh",
      value: data.refresh_token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  return res;
}