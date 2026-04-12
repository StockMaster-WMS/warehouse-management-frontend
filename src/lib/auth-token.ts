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
