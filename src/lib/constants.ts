/**
 * Base URL cho axios: luôn trỏ tới **gốc API** (đã gồm segment `/api` nếu gateway dùng `/api/...`).
 *
 * - `NEXT_PUBLIC_API_BASE` hoặc `NEXT_PUBLIC_API_BASE_URL`
 * - Nếu để `http://localhost:9000` (chỉ origin) → tự thêm `/api` để khớp `/api/purchase-orders`.
 * - Nếu để `/api` → dùng rewrite Next.js (next.config.js) tới gateway; path trong service **không** lặp `/api`.
 */
const rawBase =
  (typeof process.env.NEXT_PUBLIC_API_BASE === "string" && process.env.NEXT_PUBLIC_API_BASE.trim()) ||
  (typeof process.env.NEXT_PUBLIC_API_BASE_URL === "string" && process.env.NEXT_PUBLIC_API_BASE_URL.trim()) ||
  "";

function normalizeApiBase(raw: string): string {
  if (!raw) return "/api";
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
