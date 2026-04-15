"use client";

import { useMemo } from "react";
import {
  Activity,
  AlertCircle,
  Mail,
  RefreshCw,
  Shield,
  User,
  UserCog,
} from "lucide-react";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getRoleLabel, getUserRoles } from "@/lib/access-control";
import { apiErrMessage } from "@/types/api";
import { useGetCurrentUserQuery } from "@/store/services/auth.service";

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "US";
}

export default function ProfilePage() {
  const { data: user, isLoading, isFetching, error, refetch } = useGetCurrentUserQuery();

  const displayName = user?.name?.trim() || user?.username?.trim() || "Người dùng";
  const roles = useMemo(() => getUserRoles(user?.roles), [user?.roles]);

  if (isLoading) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <Skeleton className="h-20 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <PageHeader
          title="Trang cá nhân"
          description="Thông tin tài khoản đăng nhập hiện tại."
        />
        <EmptyState
          icon={AlertCircle}
          title="Không tải được thông tin cá nhân"
          description={apiErrMessage(error, "Phiên đăng nhập có thể đã hết hạn hoặc API hồ sơ chưa sẵn sàng.")}
          action={
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Tải lại
            </Button>
          }
          className="rounded-2xl border border-border bg-card py-14"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Trang cá nhân"
        description="Thông tin tài khoản được lấy trực tiếp từ phiên đăng nhập."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "mr-2 h-4 w-4 animate-spin" : "mr-2 h-4 w-4"} />
            Làm mới
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Hồ sơ tài khoản
            </CardTitle>
            <CardDescription>
              Dữ liệu này phản ánh response hiện tại của endpoint xác thực.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground shadow-sm">
                {initials(displayName)}
              </div>

              <div className="min-w-0 flex-1 space-y-4">
                <div>
                  <h2 className="wrap-break-word text-2xl font-bold tracking-tight text-foreground">
                    {displayName}
                  </h2>
                  <p className="mt-1 font-mono text-sm text-muted-foreground">
                    {user.username || "Chưa có username"}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                    <p className="wrap-break-word text-sm font-semibold text-foreground">
                      {user.email || "Chưa cập nhật"}
                    </p>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/40 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      <User className="h-4 w-4" />
                      Mã người dùng
                    </div>
                    <p className="wrap-break-word font-mono text-sm font-semibold text-foreground">
                      {user.id}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
                  Chưa thấy endpoint cập nhật hồ sơ trong frontend service hiện tại, nên trang này không hiển thị form lưu giả.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Quyền truy cập
            </CardTitle>
            <CardDescription>
              Vai trò quyết định menu và route được phép mở.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Vai trò
              </p>
              <div className="flex flex-wrap gap-2">
                {roles.length ? (
                  roles.map((role) => (
                    <Badge key={role} className="rounded-lg">
                      {getRoleLabel(role)}
                    </Badge>
                  ))
                ) : (
                  <Badge variant="destructive" className="rounded-lg">
                    Chưa phân quyền
                  </Badge>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Activity className="h-4 w-4" />
                Trạng thái phiên
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Đang đăng nhập
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Access token được giữ trong bộ nhớ client, refresh token do backend quản lý bằng cookie HttpOnly.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
