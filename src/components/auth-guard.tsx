"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  canAccessPath,
  getUserRoles,
} from "@/lib/access-control";
import {
  clearAccessToken,
  clearExplicitLogout,
  hasExplicitLogoutSnapshot,
  hasClientAccessTokenSnapshot,
  markExplicitLogout,
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
  const { replace } = useRouter();
  const pathname = usePathname();
  const refreshAttempted = useRef(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [retryNonce, setRetryNonce] = useState(0);
  
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
    isError: isUserError,
    refetch: refetchUser,
  } = useGetCurrentUserQuery(undefined, {
    skip: !hasAccessToken,
  });

  const userRoles = getUserRoles(user?.roles);
  const canAccessCurrentPath = canAccessPath(pathname, userRoles);
  const canAccessDashboard = canAccessPath("/dashboard", userRoles);

  useEffect(() => {
    if (hasAccessToken && isUserError && !user) {
      markExplicitLogout();
      clearAccessToken();
    }
  }, [hasAccessToken, isUserError, user]);

  useEffect(() => {
    if (!hasAccessToken) {
      if (hasExplicitLogoutSnapshot()) {
        replace("/login");
        return;
      }

      if (refreshAttempted.current) return;

      refreshAttempted.current = true;
      let cancelled = false;

      refreshToken()
        .unwrap()
        .then((res) => {
          if (cancelled) return;
          setAuthError(null);
          const token = setAccessToken(res.accessToken);
          if (!token) {
            markExplicitLogout();
            clearAccessToken();
            replace("/login");
          }
        })
        .catch(() => {
          if (cancelled) return;
          markExplicitLogout();
          clearAccessToken();
          setAuthError("Không kết nối được backend để làm mới phiên đăng nhập.");
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
      replace("/dashboard");
    }
  }, [
    canAccessCurrentPath,
    canAccessDashboard,
    hasAccessToken,
    pathname,
    refreshToken,
    retryNonce,
    replace,
    user,
  ]);

  if (authError || (hasAccessToken && isUserError && !user)) {
    const message =
      authError ?? "Không kết nối được backend để tải thông tin người dùng.";

    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            Không thể kết nối backend
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Kiểm tra backend tại <span className="font-mono">http://localhost:9000</span>
            , sau đó thử lại.
          </p>
          <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Button
              type="button"
              onClick={() => {
                clearExplicitLogout();
                refreshAttempted.current = false;
                setAuthError(null);
                if (hasAccessToken) {
                  refetchUser();
                }
                setRetryNonce((value) => value + 1);
              }}
            >
              Thử lại
            </Button>
            <Button
              render={<Link href="/login" />}
              nativeButton={false}
              variant="outline"
              onClick={() => {
                markExplicitLogout();
                clearAccessToken();
              }}
            >
              Về đăng nhập
            </Button>
          </div>
        </div>
      </main>
    );
  }

  if (!hasAccessToken && hasExplicitLogoutSnapshot()) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            Phiên đăng nhập đã hết hạn
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Token cũ không còn hợp lệ. Vui lòng đăng nhập lại để tiếp tục.
          </p>
          <Button
            render={<Link href="/login" />}
            nativeButton={false}
            className="mt-5"
          >
            Về đăng nhập
          </Button>
        </div>
      </main>
    );
  }

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
