const AUTH_TOKEN_CHANGED_EVENT = "auth-token-changed";
const AUTH_EXPLICIT_LOGOUT_KEY = "auth-explicit-logout";

let accessToken = "";

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

function emitAccessTokenChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_TOKEN_CHANGED_EVENT));
}

export function getAccessToken(): string {
  return accessToken;
}

export function setAccessToken(token: string | null | undefined): string {
  accessToken = normalizeAccessToken(token);
  if (accessToken && typeof window !== "undefined") {
    window.sessionStorage.removeItem(AUTH_EXPLICIT_LOGOUT_KEY);
  }
  emitAccessTokenChange();
  return accessToken;
}

export function clearAccessToken() {
  accessToken = "";
  emitAccessTokenChange();
}

export function subscribeToAccessTokenChanges(onStoreChange: () => void) {
  window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, onStoreChange);

  return () => {
    window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, onStoreChange);
  };
}

export function hasClientAccessTokenSnapshot() {
  return hasUsableAccessToken(accessToken);
}

export function markExplicitLogout() {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(AUTH_EXPLICIT_LOGOUT_KEY, "1");
}

export function hasExplicitLogoutSnapshot() {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(AUTH_EXPLICIT_LOGOUT_KEY) === "1";
}

export const saveToken = setAccessToken;
export const getToken = getAccessToken;
export const clearToken = clearAccessToken;
