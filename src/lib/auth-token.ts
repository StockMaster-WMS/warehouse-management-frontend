export function normalizeAccessToken(token: string | null | undefined): string {
  const trimmed = token?.trim() ?? "";

  if (!trimmed || trimmed === "undefined" || trimmed === "null") {
    return "";
  }

  return trimmed.replace(/^Bearer\s+/i, "");
}

export function hasUsableAccessToken(token: string | null | undefined): boolean {
  return normalizeAccessToken(token).length > 0;
}

/**
 * Persistence: We use BOTH localStorage (for SPA/Client state) 
 * and Cookies (for Next.js Middleware/Server Components).
 */
export function saveToken(token: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeAccessToken(token);
  localStorage.setItem("accessToken", normalized);
  // Set cookie for Next.js Middleware (exp: 1 hour)
  document.cookie = `accessToken=${normalized}; path=/; max-age=3600; SameSite=Lax`;
}

export function getToken(): string {
  if (typeof window === "undefined") return "";
  
  // 1. Try cookie (Middleware sync)
  const match = document.cookie.match(/(^| )accessToken=([^;]+)/);
  if (match) return match[2];

  // 2. Fallback to localStorage
  return localStorage.getItem("accessToken") || "";
}

export function clearToken() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  document.cookie = "accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
}
