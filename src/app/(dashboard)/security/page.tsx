"use client";

import { useState } from "react";
import { AlertCircle, Lock, Loader2, RefreshCw, ShieldCheck, Unlock, Users } from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ALL_ROLES, getRoleLabel, getUserRoles } from "@/lib/access-control";
import { cn } from "@/lib/utils";
import { apiErrMessage } from "@/types/api";
import type { ManagedUser, ManagedUserStatus } from "@/types/user-management";
import {
  useGetUsersQuery,
  useUpdateUserStatusMutation,
} from "@/store/services/user-management.service";

const PAGE_SIZE = 20;

function userStatus(user: ManagedUser): ManagedUserStatus {
  if (user.status) return user.status;
  return user.isActive === false ? "DISABLED" : "ACTIVE";
}

function statusLabel(status: ManagedUserStatus) {
  if (status === "LOCKED") return "Đã khóa";
  if (status === "DISABLED") return "Vô hiệu";
  return "Hoạt động";
}

function statusClass(status: ManagedUserStatus) {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-900/50";
  }
  if (status === "LOCKED") {
    return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-900/50";
  }
  return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-300 dark:border-rose-900/50";
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

export default function SecurityPage() {
  const [page, setPage] = useState(0);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState<ManagedUserStatus | "">("");

  const { data, isLoading, isFetching, error, refetch } = useGetUsersQuery({
    page,
    size: PAGE_SIZE,
    keyword,
    role,
    status,
  });
  const [updateStatus, { isLoading: isUpdating }] = useUpdateUserStatusMutation();

  const users = data?.data?.content ?? [];
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;
  const activeCount = users.filter((user) => userStatus(user) === "ACTIVE").length;
  const lockedCount = users.filter((user) => {
    const s = userStatus(user);
    return s === "LOCKED" || s === "DISABLED";
  }).length;
  const adminCount = users.filter((user) => getUserRoles(user.roles).includes("ADMIN")).length;

  async function handleToggleStatus(user: ManagedUser) {
    const current = userStatus(user);
    const nextStatus = current === "ACTIVE" ? "LOCKED" : "ACTIVE";
    try {
      await updateStatus({ id: user.id, status: nextStatus }).unwrap();
      toast.success(`Đã chuyển trạng thái sang ${statusLabel(nextStatus)}`);
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể cập nhật trạng thái tài khoản."));
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Bảo mật & Phân quyền"
        description="Quản lý người dùng, vai trò và trạng thái truy cập hệ thống."
        actions={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={cn("mr-2 h-4 w-4", isFetching && "animate-spin")} />
            Làm mới
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 md:gap-6">
        <StatCard label="Tổng user hệ thống" value={totalElements.toLocaleString("vi-VN")} icon={Users} showAccentBar={false} />
        <StatCard label="Đang hoạt động" value={activeCount.toLocaleString("vi-VN")} icon={ShieldCheck} iconClassName="text-emerald-500" description="Dựa trên danh sách trang này" showAccentBar={false} />
        <StatCard label="Quản trị viên" value={adminCount.toLocaleString("vi-VN")} icon={ShieldCheck} iconClassName="text-indigo-500" description="Dựa trên danh sách trang này" showAccentBar={false} />
        <StatCard label="Đã khóa / Vô hiệu" value={lockedCount.toLocaleString("vi-VN")} icon={Lock} iconClassName="text-rose-500" description="Dựa trên danh sách trang này" showAccentBar={false} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <SearchToolbar
          noContainer
          placeholder="Tìm theo username, email, họ tên..."
          value={keyword}
          onValueChange={(value) => {
            setKeyword(value);
            setPage(0);
          }}
          right={
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={role || "all"}
                onValueChange={(value) => {
                  const next = value ?? "all";
                  setRole(next === "all" ? "" : next);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-10 w-44 rounded-xl border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Vai trò" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  {ALL_ROLES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {getRoleLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={status || "all"}
                onValueChange={(value) => {
                  const next = value ?? "all";
                  setStatus(next === "all" ? "" : (next as ManagedUserStatus));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-10 w-40 rounded-xl border-slate-200 dark:border-slate-700">
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                  <SelectItem value="LOCKED">Đã khóa</SelectItem>
                  <SelectItem value="DISABLED">Vô hiệu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tài khoản</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Vai trò</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Đăng nhập cuối</TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, row) => (
                  <TableRow key={`user-skeleton-${row}`}>
                    {Array.from({ length: 5 }).map((__, col) => (
                      <TableCell key={`${row}-${col}`} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Chưa tải được danh sách người dùng"
                      description={apiErrMessage(error, "Frontend đã có contract /users, backend có thể chưa triển khai endpoint quản lý user.")}
                      action={<Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>}
                      className="py-12"
                    />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="Chưa có người dùng"
                      description="Danh sách sẽ hiển thị khi backend trả dữ liệu quản lý user."
                      className="py-12"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const statusValue = userStatus(user);
                  const roles = getUserRoles(user.roles);
                  return (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell className="px-4 py-3">
                        <div className="text-sm font-semibold text-foreground">{user.name || user.username}</div>
                        <div className="mt-1 font-mono text-xs text-muted-foreground">{user.username} · {user.email || "Chưa có email"}</div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex flex-wrap gap-1.5">
                          {roles.length ? roles.map((item) => (
                            <Badge key={item} variant="secondary" className="rounded-lg">
                              {getRoleLabel(item)}
                            </Badge>
                          )) : (
                            <Badge variant="destructive" className="rounded-lg">Chưa phân quyền</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span className={cn("inline-flex rounded-lg border px-2 py-1 text-xs font-semibold", statusClass(statusValue))}>
                          {statusLabel(statusValue)}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(user.lastLoginAt)}
                      </TableCell>
                          <TableCell className="px-4 py-3 text-right">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "w-32 justify-center transition-all font-semibold",
                            statusValue === "ACTIVE" 
                              ? "border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900/50"
                              : "border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:border-emerald-900/50 bg-emerald-50/50"
                          )}
                          disabled={isUpdating}
                          onClick={() => handleToggleStatus(user)}
                        >
                          {isUpdating ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : statusValue !== "ACTIVE" ? (
                            <Unlock className="mr-2 h-4 w-4" />
                          ) : (
                            <Lock className="mr-2 h-4 w-4" />
                          )}
                          {statusValue !== "ACTIVE" ? "Kích hoạt lại" : "Khóa tài khoản"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <PaginationFooter
          itemLabel="người dùng"
          rowsCount={users.length}
          page={page}
          totalElements={totalElements}
          totalPages={totalPages}
          pageSize={PAGE_SIZE}
          canGoPrev={page > 0}
          canGoNext={totalPages > 0 && page < totalPages - 1}
          isLoading={isLoading}
          isError={Boolean(error)}
          isFetching={isFetching}
          onPrevPage={() => setPage((value) => Math.max(0, value - 1))}
          onNextPage={() => setPage((value) => value + 1)}
        />
      </div>

      <div className="rounded-2xl border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
        Contract backend đề xuất: GET /users, PUT /users/:id/roles, POST /users/:id/lock, POST /users/:id/unlock.
      </div>
    </div>
  );
}
