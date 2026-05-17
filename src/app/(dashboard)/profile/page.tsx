"use client";

import { useMemo, useRef } from "react";
import {
  Activity,
  AlertCircle,
  RefreshCw,
  Shield,
  UserCog,
  Save,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

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
import { Input } from "@/components/ui/input";
import { getRoleLabel, getUserRoles } from "@/lib/access-control";
import { apiErrMessage } from "@/types/api";
import { useGetCurrentUserQuery, useUpdateProfileMutation } from "@/store/services/auth.service";

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
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const profileFormRef = useRef<HTMLFormElement>(null);

  const roles = useMemo(() => getUserRoles(user?.roles), [user?.roles]);
  const displayName = user?.fullName || user?.name?.trim() || user?.username?.trim() || "Người dùng";

  const handleUpdate = async () => {
    const formData = new FormData(profileFormRef.current ?? undefined);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();

    if (!name.trim() || !email.trim()) {
      toast.error("Vui lòng điền đầy đủ họ tên và email");
      return;
    }
    try {
      await updateProfile({ name, email }).unwrap();
      toast.success("Cập nhật hồ sơ thành công!");
      refetch();
    } catch (err) {
      toast.error(apiErrMessage(err, "Cập nhật thất bại"));
    }
  };

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
              <RefreshCw className="mr-2 size-4" />
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
        description="Quản lý thông tin tài khoản và quyền hạn của bạn."
        actions={
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw className={isFetching ? "mr-2 size-4 animate-spin" : "mr-2 size-4"} />
            Làm mới
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="size-5 text-primary" />
              Thông tin tài khoản
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin hiển thị và email liên lạc của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form ref={profileFormRef} className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-primary text-3xl font-bold text-white shadow-lg">
                {initials(displayName)}
              </div>

              <div className="min-w-0 flex-1 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label htmlFor="profile-username" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username (Không thể đổi)</label>
                    <Input id="profile-username" value={user.username} disabled className="bg-zinc-50 font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile-user-id" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mã người dùng</label>
                    <Input id="profile-user-id" value={user.id} disabled className="bg-zinc-50 font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Họ và tên</label>
                    <Input 
                      id="profile-name"
                      name="name"
                      defaultValue={user.fullName || user.name || ""}
                      placeholder="Nhập họ tên đầy đủ"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="profile-email" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                    <Input 
                      id="profile-email"
                      name="email"
                      type="email"
                      defaultValue={user.email || ""}
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    type="button"
                    onClick={handleUpdate} 
                    disabled={isUpdating}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isUpdating ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Save className="mr-2 size-4" />}
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="size-5 text-primary" />
              Quyền truy cập
            </CardTitle>
            <CardDescription>
              Các vai trò được gán cho tài khoản của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Vai trò hiện tại
              </p>
              <div className="flex flex-wrap gap-2">
                {roles.length ? (
                  roles.map((role) => (
                    <Badge key={role} className="rounded-lg bg-primary/10 text-primary hover:bg-primary/15 border-primary/20 dark:bg-primary/15 dark:text-primary dark:border-primary/30">
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

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/50">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Activity className="size-4 text-emerald-500" />
                Trạng thái phiên
              </div>
              <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                Đang hoạt động
              </p>
              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                Bạn đang sử dụng quyền hạn của {getRoleLabel(user.roles)}. Mọi hành động sẽ được ghi lại trong nhật ký hệ thống.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
