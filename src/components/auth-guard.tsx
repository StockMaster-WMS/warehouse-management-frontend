"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  canAccessPath,
  getUserRoles,
} from "@/lib/access-control";
import { getToken, hasUsableAccessToken } from "@/lib/auth-token";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";

function subscribeToAuthChanges(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("auth-token-changed", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("auth-token-changed", onStoreChange);
  };
}

function getAuthSnapshot() {
  return hasUsableAccessToken(getToken());
}

export function AuthGuard({ 
  children, 
  initialHasToken = false 
}: { 
  children: React.ReactNode; 
  initialHasToken?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  
  const hasToken = useSyncExternalStore(
    subscribeToAuthChanges,
    getAuthSnapshot,
    () => initialHasToken
  );

  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useGetCurrentUserQuery(undefined, {
    skip: !hasToken,
  });

  const userRoles = getUserRoles(user?.roles);
  const canAccessCurrentPath = canAccessPath(pathname, userRoles);
  const canAccessDashboard = canAccessPath("/dashboard", userRoles);

  useEffect(() => {
    if (!hasToken) {
      router.replace("/login");
      return;
    }

    if (
      user &&
      !canAccessCurrentPath &&
      canAccessDashboard &&
      pathname !== "/dashboard"
    ) {
      router.replace("/dashboard");
    }
  }, [
    canAccessCurrentPath,
    canAccessDashboard,
    hasToken,
    pathname,
    router,
    user,
  ]);

  // Loading state (only show if we have token but don't have user data yet)
  if (hasToken && (isUserLoading || isUserFetching || !user)) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background">
        <div
          aria-label="Đang kiểm tra phiên đăng nhập"
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
      </main>
    );
  }

  // Redirect to login handled by useEffect and middleware, but safe fallback
  if (!hasToken) {
    return null;
  }

  // Permission denied state
  if (!canAccessCurrentPath) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            Không có quyền truy cập
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Vai trò hiện tại của bạn không được phép mở trang này.
          </p>
          {canAccessDashboard ? (
            <Link
              href="/dashboard"
              className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Về tổng quan
            </Link>
          ) : null}
        </div>
      </main>
    );
  }

  return children;
}
