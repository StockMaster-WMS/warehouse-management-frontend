"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Activity,
  AlertCircle,
  Mail,
  RefreshCw,
  Shield,
  User,
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

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (user) {
      setName(user.fullName || user.name || "");
      setEmail(user.email || "");
    }
  }, [user]);

  const roles = useMemo(() => getUserRoles(user?.roles), [user?.roles]);
  const displayName = user?.fullName || user?.name?.trim() || user?.username?.trim() || "Người dùng";

  const handleUpdate = async () => {
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
        description="Quản lý thông tin tài khoản và quyền hạn của bạn."
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
              <UserCog className="h-5 w-5 text-indigo-600" />
              Thông tin tài khoản
            </CardTitle>
            <CardDescription>
              Cập nhật thông tin hiển thị và email liên lạc của bạn.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-3xl font-bold text-white shadow-lg">
                {initials(displayName)}
              </div>

              <div className="min-w-0 flex-1 space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Username (Không thể đổi)</label>
                    <Input value={user.username} disabled className="bg-slate-50 font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mã người dùng</label>
                    <Input value={user.id} disabled className="bg-slate-50 font-mono text-sm" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Họ và tên</label>
                    <Input 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="Nhập họ tên đầy đủ"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email</label>
                    <Input 
                      type="email"
                      value={email} 
                      onChange={(e) => setEmail(e.target.value)} 
                      placeholder="user@example.com"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button 
                    onClick={handleUpdate} 
                    disabled={isUpdating}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    {isUpdating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-indigo-600" />
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
                    <Badge key={role} className="rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900">
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

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                <Activity className="h-4 w-4 text-emerald-500" />
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
