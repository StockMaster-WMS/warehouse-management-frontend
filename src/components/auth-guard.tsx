"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  canAccessPath,
  getUserRoles,
} from "@/lib/access-control";
import {
  clearAccessToken,
  hasExplicitLogoutSnapshot,
  hasClientAccessTokenSnapshot,
  setAccessToken,
  subscribeToAccessTokenChanges,
} from "@/lib/auth-token";
import {
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
} from "@/store/services/auth.service";

export function AuthGuard({ 
  children, 
  initialHasSession = false 
}: { 
  children: React.ReactNode; 
  initialHasSession?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const refreshAttempted = useRef(false);
  
  const hasAccessToken = useSyncExternalStore(
    subscribeToAccessTokenChanges,
    hasClientAccessTokenSnapshot,
    () => false
  );
  const [refreshToken, { isLoading: isRefreshing }] = useRefreshTokenMutation();

  const {
    data: user,
    isLoading: isUserLoading,
    isFetching: isUserFetching,
  } = useGetCurrentUserQuery(undefined, {
    skip: !hasAccessToken,
  });

  const userRoles = getUserRoles(user?.roles);
  const canAccessCurrentPath = canAccessPath(pathname, userRoles);
  const canAccessDashboard = canAccessPath("/dashboard", userRoles);

  useEffect(() => {
    if (!hasAccessToken) {
      if (hasExplicitLogoutSnapshot()) {
        router.replace("/login");
        return;
      }

      if (refreshAttempted.current) return;

      refreshAttempted.current = true;
      let cancelled = false;

      refreshToken()
        .unwrap()
        .then((res) => {
          if (cancelled) return;
          const token = setAccessToken(res.accessToken);
          if (!token) {
            clearAccessToken();
            router.replace("/login");
          }
        })
        .catch(() => {
          if (cancelled) return;
          clearAccessToken();
          router.replace("/login");
        });

      return () => {
        cancelled = true;
      };
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
    hasAccessToken,
    pathname,
    refreshToken,
    router,
    user,
  ]);

  // Loading state while refreshing access token or loading the current user.
  if (!hasAccessToken || isRefreshing || isUserLoading || isUserFetching || !user) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background">
        <div
          aria-label={
            initialHasSession
              ? "Đang làm mới phiên đăng nhập"
              : "Đang kiểm tra phiên đăng nhập"
          }
          className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
      </main>
    );
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
