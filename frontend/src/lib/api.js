"use client";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

let accessToken = null;
let onUnauthenticated = null;
let isRefreshing = false;
let queued = [];

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

export function setUnauthenticatedHandler(fn) {
  onUnauthenticated = fn;
}

async function refreshOnce() {
  if (isRefreshing) {
    return new Promise((resolve) => queued.push(resolve));
  }
  isRefreshing = true;
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST" });
    if (!res.ok) throw new Error("refresh failed");
    const data = await res.json();
    accessToken = data.access_token;
    queued.forEach((r) => r(accessToken));
    queued = [];
    return accessToken;
  } catch (e) {
    accessToken = null;
    queued.forEach((r) => r(null));
    queued = [];
    if (onUnauthenticated) onUnauthenticated();
    throw e;
  } finally {
    isRefreshing = false;
  }
}

async function request(method, path, body, isRetry = false) {
  const headers = {};
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !isRetry) {
    try {
      await refreshOnce();
      return request(method, path, body, true);
    } catch {
      throw new Error("Session expired. Please log in again.");
    }
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg = (data && (data.detail || data.message)) || `Request failed (${res.status})`;
    throw new Error(typeof msg === "string" ? msg : JSON.stringify(msg));
  }
  return data;
}

function safeJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}

export const api = {
  get: (p) => request("GET", p),
  post: (p, b) => request("POST", p, b),
  patch: (p, b) => request("PATCH", p, b),
  del: (p) => request("DELETE", p),
  upload: (p, formData) => request("POST", p, formData),
};