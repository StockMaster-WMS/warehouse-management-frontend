"use client";

import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  canAccessPath,
  getDefaultPathForRoles,
  getUserRoles,
} from "@/lib/access-control";
import { scheduleAccessTokenRefresh } from "@/lib/axios-instance";
import {
  clearAccessToken,
  clearExplicitLogout,
  hasExplicitLogoutSnapshot,
  hasClientAccessTokenSnapshot,
  setAccessToken,
  subscribeToAccessTokenChanges,
} from "@/lib/auth-token";
import {
  useGetCurrentUserQuery,
  useRefreshTokenMutation,
} from "@/store/services/auth.service";

function errorStatus(error: unknown): string | number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as { status?: unknown }).status;
  return typeof status === "string" || typeof status === "number" ? status : undefined;
}

function isUnauthorizedError(error: unknown): boolean {
  const status = errorStatus(error);
  return status === 401 || status === "401";
}

function isRefreshDeniedError(error: unknown): boolean {
  const status = errorStatus(error);
  return status === 401 || status === "401" || status === 403 || status === "403";
}

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
    error: userError,
  } = useGetCurrentUserQuery(undefined, {
    skip: !hasAccessToken,
  });

  const userRoles = getUserRoles(user?.roles);
  const canAccessCurrentPath = canAccessPath(pathname, userRoles);
  const defaultAllowedPath = getDefaultPathForRoles(userRoles);

  const tryRefreshSession = useCallback(() => {
    if (refreshAttempted.current) return;

    refreshAttempted.current = true;
    refreshToken()
      .unwrap()
      .then((res) => {
        const token = setAccessToken(res.accessToken);
        scheduleAccessTokenRefresh(res.accessTokenExpiresIn);
        if (!token) {
          clearAccessToken();
          replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        }
      })
      .catch((error) => {
        clearAccessToken();
        if (isRefreshDeniedError(error)) {
          clearExplicitLogout();
          replace("/login?reason=session-expired");
          return;
        }
        clearExplicitLogout();
        refreshAttempted.current = false;
        replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      });
  }, [pathname, refreshToken, replace]);

  useEffect(() => {
    if (hasAccessToken && isUserError && !user) {
      if (!isUnauthorizedError(userError)) {
        return;
      }

      clearExplicitLogout();
      clearAccessToken();
      refreshAttempted.current = false;
      tryRefreshSession();
      return;
    }

    if (!hasAccessToken) {
      if (hasExplicitLogoutSnapshot()) {
        replace("/login");
        return;
      }

      tryRefreshSession();
      return;
    }

    if (
      user &&
      !canAccessCurrentPath &&
      defaultAllowedPath &&
      pathname !== defaultAllowedPath
    ) {
      replace(defaultAllowedPath);
    }
  }, [
    canAccessCurrentPath,
    defaultAllowedPath,
    hasAccessToken,
    isUserError,
    pathname,
    replace,
    tryRefreshSession,
    user,
    userError,
  ]);

  if (!hasAccessToken && hasExplicitLogoutSnapshot()) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background">
        <div
          aria-label="Đang chuyển về đăng nhập"
          className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
      </main>
    );
  }

  if (hasAccessToken && isUserError && !isUnauthorizedError(userError)) {
    return (
      <main className="flex min-h-svh w-full items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-lg border border-border bg-card p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-foreground">
            Không thể tải phiên người dùng
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Tài khoản hiện tại không có quyền gọi thông tin phiên hoặc dữ liệu bị giới hạn theo vai trò.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
          >
            Đăng nhập lại
          </Link>
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
          className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
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
          {defaultAllowedPath ? (
            <Link
              href={defaultAllowedPath}
              className="mt-4 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              Về màn hình làm việc
            </Link>
          ) : null}
        </div>
      </main>
    );
  }

  return children;
}
