import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "./login-form";

const AUTH_SESSION_COOKIE_NAMES = ["refreshToken", "accessToken"] as const;

function safeCallbackUrl(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/login")) {
    return "/dashboard";
  }

  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Promise<{ callbackUrl?: string | string[] }>;
}) {
  const [cookieStore, params] = await Promise.all([cookies(), searchParams]);
  const callbackUrl = Array.isArray(params?.callbackUrl)
    ? params?.callbackUrl[0]
    : params?.callbackUrl;
  const hasSession = AUTH_SESSION_COOKIE_NAMES.some((name) => cookieStore.has(name));

  if (hasSession) {
    redirect(safeCallbackUrl(callbackUrl));
  }

  return <LoginForm />;
}
