
const rawBase =
  (typeof process.env.NEXT_PUBLIC_API_BASE === "string" && process.env.NEXT_PUBLIC_API_BASE.trim()) ||
  (typeof process.env.NEXT_PUBLIC_API_BASE_URL === "string" && process.env.NEXT_PUBLIC_API_BASE_URL.trim()) ||
  "";

function normalizeApiBase(raw: string): string {
  if (!raw) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        "[constants] Đặt NEXT_PUBLIC_API_BASE hoặc NEXT_PUBLIC_API_BASE_URL (URL backend đầy đủ).",
      );
    }
    return "/api";
  }
  const t = raw.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(t)) {
    return t;
  }
  try {
    const u = new URL(t);
    const path = (u.pathname || "/").replace(/\/$/, "") || "/";
    if (path === "/") {
      return `${u.origin}/api`;
    }
    return t;
  } catch {
    return t;
  }
}

export const API_BASE_URL = normalizeApiBase(rawBase);
