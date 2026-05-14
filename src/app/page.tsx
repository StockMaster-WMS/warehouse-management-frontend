import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AUTH_SESSION_COOKIE_NAMES = ["refreshToken", "accessToken"] as const;

export default async function Home() {
  const cookieStore = await cookies();
  const hasSession = AUTH_SESSION_COOKIE_NAMES.some((name) =>
    cookieStore.has(name)
  );

  redirect(hasSession ? "/dashboard" : "/login");
}
