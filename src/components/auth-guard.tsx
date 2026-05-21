"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  canAccessPath,
  getDefaultPathForRoles,
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

function isRefreshDeniedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const status = (error as { status?: unknown }).status;
  return status === 400 || status === 401 || status === 403;
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
  } = useGetCurrentUserQuery(undefined, {
    skip: !hasAccessToken,
  });

  const userRoles = getUserRoles(user?.roles);
  const canAccessCurrentPath = canAccessPath(pathname, userRoles);
  const defaultAllowedPath = getDefaultPathForRoles(userRoles);

  useEffect(() => {
    if (hasAccessToken && isUserError && !user) {
      clearExplicitLogout();
      clearAccessToken();
      refreshAttempted.current = false;
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
          const token = setAccessToken(res.accessToken);
          if (!token) {
            markExplicitLogout();
            clearAccessToken();
            replace("/login");
          }
        })
        .catch((error) => {
          if (cancelled) return;
          clearAccessToken();
          if (isRefreshDeniedError(error)) {
            markExplicitLogout();
            replace("/login");
            return;
          }
          clearExplicitLogout();
          replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        });

      return () => {
        cancelled = true;
      };
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
    pathname,
    refreshToken,
    replace,
    user,
  ]);

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
