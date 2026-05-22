"use client";

import { useMemo, useState } from "react";
import {
  AlertCircle,
  Edit,
  Eye,
  FileSpreadsheet,
  KeyRound,
  Lock,
  Loader2,
  Plus,
  RefreshCw,
  ShieldCheck,
  Unlock,
  Upload,
  Warehouse as WarehouseIcon,
  Users,
} from "lucide-react";
import { toast } from "sonner";

import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { TableRefreshButton } from "@/components/ui/table-refresh-button";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
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
import { useGetCurrentUserQuery } from "@/store/services/auth.service";
import type { UserRole } from "@/store/services/auth.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import {
  useCreateUserMutation,
  useGetUserDetailQuery,
  useGetUserRolesQuery,
  useGetUsersQuery,
  useGetUserStatisticsQuery,
  useImportUsersMutation,
  usePreviewImportUsersMutation,
  useResetUserPasswordMutation,
  useUpdateUserMutation,
  useUpdateUserStatusMutation,
} from "@/store/services/user-management.service";
import { apiErrMessage } from "@/types/api";
import type { ImportUsersPreviewResult, ManagedUser } from "@/types/user-management";

const PAGE_SIZE = 20;

type ActiveFilter = "" | "true" | "false";
type UserFormState = {
  username: string;
  email: string;
  fullName: string;
  password: string;
  roles: UserRole[];
  isActive: boolean;
  warehouseIds: string[];
};

const EMPTY_FORM: UserFormState = {
  username: "",
  email: "",
  fullName: "",
  password: "",
  roles: [],
  isActive: true,
  warehouseIds: [],
};

function displayName(user: ManagedUser) {
  return user.fullName?.trim() || user.name?.trim() || user.username;
}

function isActiveUser(user: ManagedUser) {
  if (typeof user.isActive === "boolean") return user.isActive;
  return user.status ? user.status === "ACTIVE" : true;
}

function formatDate(value?: string | null) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("vi-VN");
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function roleCodesFromOptions(roles?: Array<{ code: string }>): UserRole[] {
  const fromApi = roles
    ?.map((role) => role.code.replace(/^ROLE_/i, "") as UserRole)
    .filter((role): role is UserRole => ALL_ROLES.includes(role));
  return fromApi?.length ? fromApi : [...ALL_ROLES];
}

function validateUserForm(form: UserFormState, mode: "create" | "edit") {
  if (form.username.trim().length < 3 || form.username.trim().length > 50) {
    return "Username phải từ 3 đến 50 ký tự.";
  }
  if (!isValidEmail(form.email.trim())) return "Email không đúng định dạng.";
  if (!form.fullName.trim()) return "Họ tên là bắt buộc.";
  if (mode === "create" && form.password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
  if (form.roles.length === 0) return "Vui lòng chọn ít nhất 1 vai trò.";
  if (form.roles.includes("WAREHOUSE_STAFF") && form.warehouseIds.length === 0) {
    return "Nhân viên kho phải được gán ít nhất một kho.";
  }
  return null;
}

function toForm(user: ManagedUser): UserFormState {
  return {
    username: user.username,
    email: user.email ?? "",
    fullName: user.fullName ?? user.name ?? "",
    password: "",
    roles: getUserRoles(user.roles),
    isActive: isActiveUser(user),
    warehouseIds: user.warehouseIds ?? [],
  };
}

function warehouseLabelFromUser(user: ManagedUser) {
  const names = user.warehouseNames ?? [];
  if (names.length) return names.join(", ");
  const ids = user.warehouseIds ?? [];
  return ids.length ? `${ids.length} kho` : "Chưa gán kho";
}

export default function SecurityPage() {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [keyword, setKeyword] = useState("");
  const [role, setRole] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("");
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserFormState>(EMPTY_FORM);
  const [detailUserId, setDetailUserId] = useState<string | null>(null);
  const [resetUser, setResetUser] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportUsersPreviewResult | null>(null);

  const { data: currentUser } = useGetCurrentUserQuery();
  const { data, isLoading, isFetching, error, refetch } = useGetUsersQuery({
    page,
    size: pageSize,
    keyword,
    role,
    active: activeFilter === "" ? "" : activeFilter === "true",
  });
  const { data: statisticsData, isFetching: isStatsFetching, refetch: refetchStats } = useGetUserStatisticsQuery();
  const { data: rolesData } = useGetUserRolesQuery();
  const { data: warehousesData, isFetching: isWarehousesFetching } = useGetWarehousesQuery({ page: 0, size: 200, isActive: true });
  const { data: detailData, isFetching: isDetailLoading } = useGetUserDetailQuery(detailUserId ?? "", {
    skip: !detailUserId,
  });

  const [createUser, { isLoading: creating }] = useCreateUserMutation();
  const [updateUser, { isLoading: updating }] = useUpdateUserMutation();
  const [updateStatus, { isLoading: togglingStatus }] = useUpdateUserStatusMutation();
  const [resetPassword, { isLoading: resettingPassword }] = useResetUserPasswordMutation();
  const [previewImport, { isLoading: previewing }] = usePreviewImportUsersMutation();
  const [importUsers, { isLoading: importing }] = useImportUsersMutation();

  const users = data?.data?.content ?? [];
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;
  const statistics = statisticsData?.data;
  const roleOptions = useMemo(() => roleCodesFromOptions(rolesData?.data), [rolesData]);
  const warehouseOptions = warehousesData?.data?.content ?? [];
  const detail = detailData?.data;
  const detailUser = detail?.user;

  function refreshAll() {
    refetch();
    refetchStats();
  }

  function openCreate() {
    setFormMode("create");
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEdit(user: ManagedUser) {
    setFormMode("edit");
    setEditingUser(user);
    setForm(toForm(user));
    setFormOpen(true);
  }

  function toggleRole(nextRole: UserRole) {
    setForm((current) => {
      const exists = current.roles.includes(nextRole);
      return {
        ...current,
        roles: exists ? current.roles.filter((item) => item !== nextRole) : [...current.roles, nextRole],
      };
    });
  }

  function toggleWarehouse(warehouseId: string) {
    setForm((current) => {
      const exists = current.warehouseIds.includes(warehouseId);
      return {
        ...current,
        warehouseIds: exists
          ? current.warehouseIds.filter((item) => item !== warehouseId)
          : [...current.warehouseIds, warehouseId],
      };
    });
  }

  async function submitForm(event: React.FormEvent) {
    event.preventDefault();
    const message = validateUserForm(form, formMode);
    if (message) {
      toast.error(message);
      return;
    }

    const isSelf = editingUser?.id === currentUser?.id;
    if (formMode === "edit" && isSelf && !form.isActive) {
      toast.error("Bạn không thể tự khóa tài khoản của chính mình.");
      return;
    }
    if (formMode === "edit" && isSelf && getUserRoles(editingUser?.roles).includes("ADMIN") && !form.roles.includes("ADMIN")) {
      toast.error("Bạn không thể tự gỡ quyền ADMIN của chính mình.");
      return;
    }

    try {
      if (formMode === "create") {
        const res = await createUser({
          username: form.username.trim(),
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          password: form.password,
          roles: form.roles,
          warehouseIds: form.warehouseIds,
        }).unwrap();
        toast.success(res.message || "Đã tạo người dùng.");
      } else if (editingUser) {
        const res = await updateUser({
          id: editingUser.id,
          username: form.username.trim(),
          email: form.email.trim(),
          fullName: form.fullName.trim(),
          roles: form.roles,
          isActive: form.isActive,
          warehouseIds: form.warehouseIds,
        }).unwrap();
        toast.success(res.message || "Đã cập nhật người dùng.");
      }
      setFormOpen(false);
      refreshAll();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể lưu người dùng."));
    }
  }

  async function toggleUserStatus(user: ManagedUser) {
    const isSelf = user.id === currentUser?.id;
    const active = isActiveUser(user);
    if (isSelf && active) {
      toast.error("Bạn không thể tự khóa tài khoản của chính mình.");
      return;
    }
    const confirmed = window.confirm(active ? "Xác nhận khóa tài khoản này?" : "Xác nhận mở khóa tài khoản này?");
    if (!confirmed) return;

    try {
      const res = await updateStatus({ id: user.id }).unwrap();
      toast.success(res.message || (active ? "Đã khóa tài khoản." : "Đã mở khóa tài khoản."));
      refreshAll();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể cập nhật trạng thái tài khoản."));
    }
  }

  async function submitResetPassword(event: React.FormEvent) {
    event.preventDefault();
    if (!resetUser) return;
    if (newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      const res = await resetPassword({ id: resetUser.id, newPassword }).unwrap();
      toast.success(res.message || "Đã đặt lại mật khẩu.");
      setResetUser(null);
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể đặt lại mật khẩu."));
    }
  }

  async function runPreview() {
    if (!importFile) {
      toast.error("Vui lòng chọn file Excel.");
      return;
    }
    try {
      const res = await previewImport(importFile).unwrap();
      setPreview(res.data);
      toast.success(res.message || "Đã kiểm tra file import.");
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể preview file import."));
    }
  }

  async function runImport() {
    if (!importFile) {
      toast.error("Vui lòng chọn file Excel.");
      return;
    }
    try {
      const res = await importUsers(importFile).unwrap();
      toast.success(res.message || `Import hoàn tất: ${res.data?.successCount ?? 0} dòng thành công.`);
      setImportOpen(false);
      setImportFile(null);
      setPreview(null);
      refreshAll();
    } catch (err) {
      toast.error(apiErrMessage(err, "Không thể import người dùng."));
    }
  }

  const formIsSelf = editingUser?.id === currentUser?.id;
  const formSelfAdmin = formIsSelf && getUserRoles(editingUser?.roles).includes("ADMIN");

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Bảo mật & Phân quyền"
        description="Quản lý người dùng, vai trò và trạng thái truy cập hệ thống."
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" size="sm" onClick={refreshAll} disabled={isFetching || isStatsFetching}>
              <RefreshCw className={cn("mr-2 size-4", (isFetching || isStatsFetching) && "animate-spin")} />
              Làm mới
            </Button>
            <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
              <FileSpreadsheet className="mr-2 size-4" />
              Import Excel
            </Button>
            <Button size="sm" onClick={openCreate}>
              <Plus className="mr-2 size-4" />
              Thêm người dùng
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 md:gap-6">
        <StatCard label="Tổng user hệ thống" value={(statistics?.totalUsers ?? totalElements).toLocaleString("vi-VN")} icon={Users} showAccentBar={false} />
        <StatCard label="Đang hoạt động" value={(statistics?.activeUsers ?? 0).toLocaleString("vi-VN")} icon={ShieldCheck} iconClassName="text-emerald-500" showAccentBar={false} />
        <StatCard label="Quản trị viên" value={(statistics?.adminUsers ?? 0).toLocaleString("vi-VN")} icon={ShieldCheck} iconClassName="text-indigo-500" showAccentBar={false} />
        <StatCard label="Đã khóa / vô hiệu" value={(statistics?.inactiveUsers ?? 0).toLocaleString("vi-VN")} icon={Lock} iconClassName="text-rose-500" showAccentBar={false} />
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
              <TableRefreshButton isFetching={isFetching || isStatsFetching} onRefresh={refreshAll} />
              <Select
                value={role || "all"}
                onValueChange={(value) => {
                  const next = value ?? "all";
                  setRole(next === "all" ? "" : next);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-10 w-52 rounded-xl border-slate-200 dark:border-slate-700">
                  <span className="truncate text-sm">{role ? getRoleLabel(role) : "Tất cả vai trò"}</span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  {roleOptions.map((item) => (
                    <SelectItem key={item} value={item}>
                      {getRoleLabel(item)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={activeFilter || "all"}
                onValueChange={(value) => {
                  const next = value ?? "all";
                  setActiveFilter(next === "all" ? "" : (next as ActiveFilter));
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-10 w-44 rounded-xl border-slate-200 dark:border-slate-700">
                  <span className="truncate text-sm">
                    {activeFilter === "true" ? "Đang hoạt động" : activeFilter === "false" ? "Đã khóa / vô hiệu" : "Tất cả trạng thái"}
                  </span>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="true">Đang hoạt động</SelectItem>
                  <SelectItem value="false">Đã khóa / vô hiệu</SelectItem>
                </SelectContent>
              </Select>
            </div>
          }
        />

        <div className="overflow-x-auto">
          <Table className="min-w-[1100px]">
            <TableHeader className="bg-muted/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tài khoản</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Vai trò</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Kho thao tác</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Trạng thái</TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Ngày tạo</TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 6 }).map((_, row) => (
                  <TableRow key={`user-skeleton-${row}`}>
                    {Array.from({ length: 6 }).map((__, col) => (
                      <TableCell key={`${row}-${col}`} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách người dùng"
                      description={apiErrMessage(error)}
                      action={<Button variant="outline" size="sm" onClick={() => refetch()}>Thử lại</Button>}
                      className="py-12"
                    />
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="Chưa có người dùng"
                      description="Thử đổi bộ lọc hoặc thêm người dùng mới."
                      className="py-12"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const active = isActiveUser(user);
                  const roles = getUserRoles(user.roles);
                  const isSelf = user.id === currentUser?.id;
                  return (
                    <TableRow key={user.id} className="hover:bg-muted/50">
                      <TableCell className="px-4 py-3">
                        <div className="text-sm font-semibold text-foreground">{displayName(user)}</div>
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
                      <TableCell className="max-w-[260px] px-4 py-3 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <WarehouseIcon className="size-4 shrink-0 text-muted-foreground" />
                          <span className="truncate">{warehouseLabelFromUser(user)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex rounded-lg border px-2 py-1 text-xs font-semibold",
                            active
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300"
                              : "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300",
                          )}
                        >
                          {active ? "Hoạt động" : "Đã khóa / vô hiệu"}
                        </span>
                      </TableCell>
                      <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => setDetailUserId(user.id)}>
                            <Eye className="mr-1.5 size-3.5" />
                            Chi tiết
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={() => openEdit(user)}>
                            <Edit className="mr-1.5 size-3.5" />
                            Sửa
                          </Button>
                          <Button type="button" variant="outline" size="sm" className="h-8 px-2" onClick={() => setResetUser(user)}>
                            <KeyRound className="mr-1.5 size-3.5" />
                            Reset
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className={cn(
                              "h-8 px-2",
                              active ? "text-rose-600 hover:text-rose-700" : "text-emerald-600 hover:text-emerald-700",
                            )}
                            disabled={togglingStatus || (isSelf && active)}
                            onClick={() => void toggleUserStatus(user)}
                          >
                            {active ? <Lock className="mr-1.5 size-3.5" /> : <Unlock className="mr-1.5 size-3.5" />}
                            {active ? "Khóa" : "Mở khóa"}
                          </Button>
                        </div>
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
          pageSize={pageSize}
          canGoPrev={page > 0}
          canGoNext={totalPages > 0 && page < totalPages - 1}
          isLoading={isLoading}
          isError={Boolean(error)}
          isFetching={isFetching}
          onPrevPage={() => setPage((value) => Math.max(0, value - 1))}
          onNextPage={() => setPage((value) => value + 1)}
          onPageSizeChange={(nextSize) => {
            setPageSize(nextSize);
            setPage(0);
          }}
        />
      </div>

      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={submitForm}>
            <DialogHeader>
              <DialogTitle>{formMode === "create" ? "Thêm người dùng" : "Sửa người dùng"}</DialogTitle>
              <DialogDescription>
                {formMode === "create" ? "Tạo tài khoản mới và gán vai trò." : "Cập nhật thông tin tài khoản, không đổi mật khẩu tại đây."}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Username</label>
                <Input value={form.username} onChange={(event) => setForm((prev) => ({ ...prev, username: event.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <Input value={form.email} onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))} />
              </div>
              <div className="grid gap-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Họ tên</label>
                <Input value={form.fullName} onChange={(event) => setForm((prev) => ({ ...prev, fullName: event.target.value }))} />
              </div>
              {formMode === "create" ? (
                <div className="grid gap-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Mật khẩu</label>
                  <Input type="password" value={form.password} onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))} />
                </div>
              ) : null}
              <div className="grid gap-2">
                <label className="text-xs font-semibold text-muted-foreground">Vai trò</label>
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map((item) => {
                    const selected = form.roles.includes(item);
                    const disabled = formSelfAdmin && item === "ADMIN";
                    return (
                      <Button
                        key={item}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        size="sm"
                        disabled={disabled}
                        onClick={() => toggleRole(item)}
                      >
                        {getRoleLabel(item)}
                      </Button>
                    );
                  })}
                </div>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold text-muted-foreground">Kho được phép thao tác</label>
                  <span className="text-[11px] text-muted-foreground">
                    {form.warehouseIds.length ? `${form.warehouseIds.length} kho đã chọn` : "Chưa chọn kho"}
                  </span>
                </div>
                <div className="max-h-44 overflow-auto rounded-xl border border-border p-2">
                  {isWarehousesFetching ? (
                    <div className="p-3 text-sm text-muted-foreground">Đang tải danh sách kho…</div>
                  ) : warehouseOptions.length ? (
                    <div className="grid gap-2">
                      {warehouseOptions.map((warehouse) => {
                        const selected = form.warehouseIds.includes(warehouse.id);
                        return (
                          <button
                            key={warehouse.id}
                            type="button"
                            onClick={() => toggleWarehouse(warehouse.id)}
                            className={cn(
                              "flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                              selected
                                ? "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-900/60 dark:bg-indigo-950/30 dark:text-indigo-200"
                                : "border-transparent hover:bg-muted",
                            )}
                          >
                            <span className="min-w-0">
                              <span className="block truncate font-semibold">{warehouse.name}</span>
                              <span className="block truncate text-xs text-muted-foreground">{warehouse.code}</span>
                            </span>
                            <input type="checkbox" readOnly checked={selected} className="size-4" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-sm text-muted-foreground">Chưa có kho đang hoạt động.</div>
                  )}
                </div>
              </div>
              {formMode === "edit" ? (
                <label className="flex items-center gap-2 rounded-xl border border-border p-3 text-sm">
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    disabled={Boolean(formIsSelf)}
                    onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                  />
                  Tài khoản đang hoạt động
                </label>
              ) : null}
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setFormOpen(false)}>Hủy</Button>
              <Button type="submit" disabled={creating || updating}>
                {(creating || updating) ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Lưu
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(resetUser)} onOpenChange={(open) => !open && setResetUser(null)}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={submitResetPassword}>
            <DialogHeader>
              <DialogTitle>Đặt lại mật khẩu</DialogTitle>
              <DialogDescription>{resetUser ? `Tài khoản ${resetUser.username}` : ""}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input type="password" placeholder="Mật khẩu mới" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} />
              <Input type="password" placeholder="Xác nhận mật khẩu mới" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setResetUser(null)}>Hủy</Button>
              <Button type="submit" disabled={resettingPassword}>
                {resettingPassword ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Đặt lại
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detailUserId)} onOpenChange={(open) => !open && setDetailUserId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Chi tiết người dùng</DialogTitle>
            <DialogDescription>Thông tin tài khoản, quyền và lịch sử gần đây.</DialogDescription>
          </DialogHeader>
          {isDetailLoading ? (
            <div className="grid gap-3 py-6">
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : detailUser ? (
            <div className="space-y-4 py-2">
              <div className="rounded-xl border border-border p-4">
                <div className="text-base font-bold">{displayName(detailUser)}</div>
                <div className="mt-1 font-mono text-xs text-muted-foreground">{detailUser.username} · {detailUser.email}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {getUserRoles(detailUser.roles).map((item) => (
                    <Badge key={item} variant="secondary">{getRoleLabel(item)}</Badge>
                  ))}
                  <Badge variant={isActiveUser(detailUser) ? "default" : "destructive"}>
                    {isActiveUser(detailUser) ? "Hoạt động" : "Đã khóa / vô hiệu"}
                  </Badge>
                </div>
                <div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-sm text-muted-foreground">
                  <WarehouseIcon className="mt-0.5 size-4 shrink-0" />
                  <span>Kho thao tác: {warehouseLabelFromUser(detailUser)}</span>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard label="Số vai trò" value={(detail.statistics?.rolesCount ?? getUserRoles(detailUser.roles).length).toLocaleString("vi-VN")} icon={ShieldCheck} showAccentBar={false} />
                <StatCard label="Audit gần đây" value={(detail.statistics?.recentAuditCount ?? detail.recentAuditLogs?.length ?? 0).toLocaleString("vi-VN")} icon={FileSpreadsheet} showAccentBar={false} />
                <StatCard label="Ngày tạo" value={formatDate(detail.statistics?.createdAt ?? detailUser.createdAt)} icon={Users} showAccentBar={false} />
              </div>
              <div className="rounded-xl border border-border p-4">
                <div className="mb-3 text-sm font-bold">Lịch sử thao tác gần đây</div>
                {detail.recentAuditLogs?.length ? (
                  <div className="space-y-2">
                    {detail.recentAuditLogs.slice(0, 5).map((log, index) => (
                      <div key={String(log.id ?? index)} className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
                        {String(log.action ?? log.message ?? log.module ?? "Audit log")}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Chưa có lịch sử gần đây.</div>
                )}
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => openEdit(detailUser)}>Sửa</Button>
                <Button type="button" variant="outline" onClick={() => setResetUser(detailUser)}>Đặt lại mật khẩu</Button>
                <Button type="button" variant="outline" disabled={detailUser.id === currentUser?.id && isActiveUser(detailUser)} onClick={() => void toggleUserStatus(detailUser)}>
                  {isActiveUser(detailUser) ? "Khóa tài khoản" : "Mở khóa"}
                </Button>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={AlertCircle}
              title="Không tải được chi tiết người dùng"
              description="Vui lòng thử tải lại hoặc chọn người dùng khác."
              className="py-8"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={importOpen} onOpenChange={setImportOpen}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Import người dùng từ Excel</DialogTitle>
            <DialogDescription>Header cần có: username | email | fullName | password | roles | isActive.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input
              type="file"
              accept=".xlsx,.xls"
              onChange={(event) => {
                setImportFile(event.target.files?.[0] ?? null);
                setPreview(null);
              }}
            />
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={runPreview} disabled={previewing || !importFile}>
                {previewing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Upload className="mr-2 size-4" />}
                Preview
              </Button>
              <Button type="button" onClick={runImport} disabled={importing || !importFile || !preview}>
                {importing ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                Import
              </Button>
            </div>
            {preview ? (
              <div className="grid gap-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <StatCard label="Tổng dòng" value={preview.totalRows.toLocaleString("vi-VN")} icon={FileSpreadsheet} showAccentBar={false} />
                  <StatCard label="Hợp lệ" value={preview.successCount.toLocaleString("vi-VN")} icon={ShieldCheck} iconClassName="text-emerald-500" showAccentBar={false} />
                  <StatCard label="Lỗi" value={preview.failedCount.toLocaleString("vi-VN")} icon={AlertCircle} iconClassName="text-rose-500" showAccentBar={false} />
                </div>
                <div className="max-h-56 overflow-auto rounded-xl border border-border">
                  <Table>
                    <TableHeader><TableRow><TableHead>User hợp lệ</TableHead><TableHead>Email</TableHead><TableHead>Vai trò</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {preview.users.slice(0, 8).map((user) => (
                        <TableRow key={user.id || user.username}>
                          <TableCell>{user.username}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>{getUserRoles(user.roles).map(getRoleLabel).join(", ")}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {preview.errors.length ? (
                  <div className="max-h-56 overflow-auto rounded-xl border border-rose-200">
                    <Table>
                      <TableHeader><TableRow><TableHead>Dòng</TableHead><TableHead>Username</TableHead><TableHead>Lỗi</TableHead></TableRow></TableHeader>
                      <TableBody>
                        {preview.errors.map((item) => (
                          <TableRow key={`${item.rowNumber}-${item.username}`}>
                            <TableCell>{item.rowNumber}</TableCell>
                            <TableCell>{item.username || item.email || "--"}</TableCell>
                            <TableCell className="text-rose-600">{item.message}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setImportOpen(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
