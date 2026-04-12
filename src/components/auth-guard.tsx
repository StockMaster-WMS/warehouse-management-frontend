"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import { hasUsableAccessToken } from "@/lib/auth-token";

function subscribeToAuthChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("auth-token-changed", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("auth-token-changed", onStoreChange);
  };
}

function getAuthSnapshot() {
  return hasUsableAccessToken(window.localStorage.getItem("accessToken"));
}

function getServerAuthSnapshot() {
  return false;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const hasToken = useSyncExternalStore(
    subscribeToAuthChanges,
    getAuthSnapshot,
    getServerAuthSnapshot,
  );

  useEffect(() => {
    if (!hasToken) {
      router.replace("/login");
    }
  }, [hasToken, router]);

  if (!hasToken) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background">
        <div
          aria-label="Đang kiểm tra phiên đăng nhập"
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
      </main>
    );
  }

  return children;
}
