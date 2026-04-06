"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

import {
  Building2,
  Plus,
  MoreHorizontal,
  Phone,
  User,
  Edit2,
  Trash2,
  ExternalLink,
  PackageCheck,
  CalendarClock,
  X,
  AlertCircle,
  List,
  ChevronLeft,
  ChevronRight,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useGetSuppliersQuery,
  useDeleteSupplierMutation,
  useChangeSupplierStatusMutation,
} from "@/store/services/supplier.service";
import { useGetPurchaseOrdersQuery } from "@/store/services/purchase-order.service";
import { apiErrMessage } from "@/types/api";
import type { Supplier, SupplierStatus } from "@/types/supplier";
import {
  getSupplierDisplayName,
  isSupplierActive,
  supplierStatusLabel,
  supplierStatusClass,
} from "@/types/supplier";

/* ── Status filter labels ── */
const STATUS_FILTER_LABEL: Record<string, string> = {
  "": "Tất cả",
  active: "Hoạt động",
  inactive: "Ngưng hoạt động",
  suspended: "Tạm ngưng",
};

/* ── PO Status helpers ── */
const PO_STATUS_LABEL: Record<string, string> = {
  DRAFT: "Nháp",
  APPROVED: "Đã duyệt",
  PARTIAL: "Nhận một phần",
  COMPLETED: "Hoàn tất",
  CANCELLED: "Đã hủy",
};

function poStatusClass(s: string): string {
  switch (s) {
    case "DRAFT":
      return "bg-slate-100 text-slate-600";
    case "APPROVED":
      return "bg-blue-100 text-blue-700";
    case "PARTIAL":
      return "bg-amber-100 text-amber-700";
    case "COMPLETED":
      return "bg-emerald-100 text-emerald-700";
    case "CANCELLED":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

const PAGE_SIZE = 20;

/* ══════════════════════════════════════════
   Purchase History Dialog
   ══════════════════════════════════════════ */
function PurchaseHistoryDialog({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier | null;
}) {
  const [page, setPage] = useState(0);

  const { data, isLoading } = useGetPurchaseOrdersQuery(
    {
      page,
      size: 10,
      supplierId: supplier?.id ?? "",
      sort: "createdAt",
      sortDir: "desc",
    },
    { skip: !supplier?.id || !open },
  );

  const rows = data?.data?.content ?? [];
  const totalPages = data?.data?.total_pages ?? 0;
  const totalElements = data?.data?.total_elements ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Lịch sử nhập hàng</DialogTitle>
          <DialogDescription>
            {supplier ? `${supplier.name} (${supplier.code})` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-96 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Mã PO</TableHead>
                <TableHead>Ngày đặt</TableHead>
                <TableHead>Ngày dự kiến</TableHead>
                <TableHead className="text-right">Tổng tiền</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={`po-skel-${i}`}>
                    <TableCell>
                      <Skeleton className="h-3 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-3 w-24" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="mx-auto h-5 w-20" />
                    </TableCell>
                  </TableRow>
                ))
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="py-10 text-center text-slate-500"
                  >
                    Chưa có đơn nhập hàng nào từ nhà cung cấp này.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell>
                      <Link
                        href={`/purchase-orders/${po.id}`}
                        className="font-mono text-xs font-medium text-indigo-600 hover:underline"
                      >
                        {po.poNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="text-xs">
                      {po.orderDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-xs">
                      {po.expectedDate ?? "—"}
                    </TableCell>
                    <TableCell className="text-right text-xs font-medium">
                      {po.totalAmount != null
                        ? Number(po.totalAmount).toLocaleString("vi-VN") + " đ"
                        : "—"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="secondary"
                        className={`font-normal ${poStatusClass(po.status ?? "")}`}
                      >
                        {PO_STATUS_LABEL[po.status ?? ""] ?? po.status ?? "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t pt-3 text-xs text-slate-500">
            <span>
              {totalElements} đơn · Trang {page + 1}/{totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="mr-1 h-3 w-3" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Sau
                <ChevronRight className="ml-1 h-3 w-3" />
              </Button>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════
   Change Status Dialog
   ══════════════════════════════════════════ */
function ChangeStatusDialog({
  open,
  onOpenChange,
  supplier,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier | null;
}) {
  const currentStatus = (
    supplier?.status ?? "ACTIVE"
  ).toUpperCase() as SupplierStatus;
  const [newStatus, setNewStatus] = useState<SupplierStatus>(currentStatus);
  const [changeStatus, { isLoading }] = useChangeSupplierStatusMutation();

  const handleSubmit = async () => {
    if (!supplier) return;
    try {
      const res = await changeStatus({
        id: supplier.id,
        status: newStatus,
      }).unwrap();
      if (!res.success) {
        toast.error(res.message || "Đổi trạng thái thất bại");
        return;
      }
      toast.success(
        `Đã chuyển trạng thái sang "${supplierStatusLabel(newStatus)}"`,
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) onOpenChange(false);
      }}
    >
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Đổi trạng thái</DialogTitle>
          <DialogDescription>
            {supplier ? `${supplier.name} (${supplier.code})` : ""}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-xs font-bold uppercase text-slate-500">
            Trạng thái mới
          </label>
          <Select
            value={newStatus}
            onValueChange={(v) => setNewStatus(v as SupplierStatus)}
          >
            <SelectTrigger>
              <span className="flex flex-1 truncate text-left">
                {supplierStatusLabel(newStatus)}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ACTIVE">Hoạt động</SelectItem>
              <SelectItem value="INACTIVE">Ngưng hoạt động</SelectItem>
              <SelectItem value="SUSPENDED">Tạm ngưng</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || newStatus.toUpperCase() === currentStatus}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Xác nhận
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════ */
export default function SuppliersPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");

  /* ── Dialogs state ── */
  const [deleteTarget, setDeleteTarget] = useState<Supplier | null>(null);
  const [statusTarget, setStatusTarget] = useState<Supplier | null>(null);
  const [historyTarget, setHistoryTarget] = useState<Supplier | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } =
    useGetSuppliersQuery({
      page,
      size: PAGE_SIZE,
      sort: "createdAt",
      sortDir: "desc",
      ...(debouncedKeyword ? { keyword: debouncedKeyword } : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
    });

  const [deleteSupplier] = useDeleteSupplierMutation();

  const pagedBody = data?.data;
  const rows = useMemo(() => pagedBody?.content ?? [], [pagedBody]);

  const totalPartners = pagedBody?.total_elements ?? 0;
  const totalPages = pagedBody?.total_pages ?? 0;
  const activeCount = useMemo(
    () => rows.filter((s) => isSupplierActive(s.status)).length,
    [rows],
  );
  const inactiveCount = useMemo(
    () => rows.filter((s) => !isSupplierActive(s.status)).length,
    [rows],
  );
  const multiPage = totalPages > 1;
  const canGoPrev = page > 0;
  const canGoNext = totalPages > 0 && page < totalPages - 1;
  const hasAnyFilter = searchInput.trim().length > 0 || statusFilter !== "";

  /* ── Delete handler ── */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteSupplier(deleteTarget.id).unwrap();
      if (!res.success) {
        toast.error(res.message || "Xóa nhà cung cấp thất bại");
        return;
      }
      toast.success(res.message || "Đã xóa nhà cung cấp");
    } catch (err) {
      toast.error(apiErrMessage(err));
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PageHeader
        title="Nhà cung cấp"
        description="Quản lý thông tin đối tác cung ứng và lịch sử giao dịch."
        actions={
          <Button
            render={<Link href="/suppliers/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 shadow-sm shadow-indigo-200 hover:bg-indigo-700 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm đối tác mới
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: "Tổng đối tác",
            value: String(totalPartners),
            icon: Building2,
            color: "text-indigo-500",
          },
          {
            label: multiPage ? "Hoạt động (trang này)" : "Đang hoạt động",
            value: String(activeCount),
            icon: PackageCheck,
            color: "text-emerald-500",
          },
          {
            label: multiPage ? "Ngưng (trang này)" : "Ngưng hoạt động",
            value: String(inactiveCount),
            icon: CalendarClock,
            color: "text-amber-500",
          },
          {
            label: "Trang / kích thước",
            value: pagedBody
              ? `${pagedBody.page + 1}/${totalPages} · ${pagedBody.size}`
              : `${rows.length}`,
            icon: List,
            color: "text-blue-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                {stat.label}
              </span>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {stat.value}
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="flex-1">
          <SearchToolbar
            placeholder="Tìm kiếm (tên, mã, MST, email…)"
            value={searchInput}
            onValueChange={(v) => {
              setSearchInput(v);
              setPage(0);
            }}
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-44">
            <Select
              value={statusFilter || "__all__"}
              onValueChange={(v) => {
                setStatusFilter(!v || v === "__all__" ? "" : v);
                setPage(0);
              }}
            >
              <SelectTrigger>
                <span className="flex flex-1 truncate text-left">
                  {STATUS_FILTER_LABEL[statusFilter] ?? "Tất cả"}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Tất cả</SelectItem>
                <SelectItem value="active">Hoạt động</SelectItem>
                <SelectItem value="inactive">Ngưng hoạt động</SelectItem>
                <SelectItem value="suspended">Tạm ngưng</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasAnyFilter && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:bg-rose-50 hover:text-rose-600"
              onClick={() => {
                setSearchInput("");
                setStatusFilter("");
                setPage(0);
              }}
            >
              <X className="mr-1 h-4 w-4" />
              Xóa lọc
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu…
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table className="min-w-200 text-left">
            <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Mã
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Tên nhà cung cấp
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  MST
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Người liên hệ
                </TableHead>
                <TableHead className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  SĐT
                </TableHead>
                <TableHead className="px-4 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Trạng thái
                </TableHead>
                <TableHead className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Hành động
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`skel-${i}`}>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-3 w-16" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-3 w-36" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-3 w-24" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-3 w-28" />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Skeleton className="h-3 w-24" />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Skeleton className="mx-auto h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                    </TableCell>
                  </TableRow>
                ))
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách"
                      description={apiErrMessage(error)}
                      action={
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => refetch()}
                        >
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={Building2}
                      title="Chưa có nhà cung cấp"
                      description={
                        hasAnyFilter
                          ? "Không có kết quả khớp. Thử từ khóa hoặc bộ lọc khác."
                          : "Thêm đối tác mới để bắt đầu."
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((sup: Supplier) => (
                  <TableRow
                    key={sup.id}
                    className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                  >
                    <TableCell className="px-4 py-3 font-mono text-xs font-medium">
                      {sup.code}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">
                        {getSupplierDisplayName(sup)}
                      </span>
                    </TableCell>
                    <TableCell className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {sup.taxCode ?? "—"}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <User className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">
                          {sup.contactName ?? "—"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300">
                        <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                        {sup.contactPhone ?? "—"}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Badge
                        variant="secondary"
                        className={`font-normal ${supplierStatusClass(sup.status)}`}
                      >
                        {supplierStatusLabel(sup.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          render={
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              className="h-8 w-8 rounded-lg"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        />
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl"
                        >
                          <DropdownMenuGroup>
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          </DropdownMenuGroup>
                          <DropdownMenuItem
                            className="rounded-lg"
                            render={<Link href={`/suppliers/${sup.id}/edit`} />}
                          >
                            <Edit2 className="mr-2 h-4 w-4" />
                            Sửa thông tin
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-lg"
                            onClick={() => setStatusTarget(sup)}
                          >
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Đổi trạng thái
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="rounded-lg"
                            onClick={() => setHistoryTarget(sup)}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Lịch sử nhập hàng
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="rounded-lg text-rose-600 focus:text-rose-600"
                            onClick={() => setDeleteTarget(sup)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa đối tác
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="text-xs text-slate-500">
                {isLoading ? (
                  "Đang tải…"
                ) : isError ? (
                  <span className="text-rose-600">Không tải được dữ liệu.</span>
                ) : (
                  <span>
                    Hiển thị {rows.length}/{totalPartners} nhà cung cấp
                    {totalPages > 1 &&
                      ` · Trang ${(pagedBody?.page ?? 0) + 1}/${totalPages}`}
                  </span>
                )}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canGoPrev || isFetching}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canGoNext || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(v) => {
          if (!v) setDeleteTarget(null);
        }}
        onConfirm={handleDelete}
        itemName={deleteTarget ? getSupplierDisplayName(deleteTarget) : ""}
        title="Xóa nhà cung cấp"
        description="Bạn có chắc muốn xóa nhà cung cấp này? Hành động này không thể hoàn tác."
      />

      {/* Change Status Dialog */}
      <ChangeStatusDialog
        key={statusTarget?.id ?? "__none__"}
        open={statusTarget !== null}
        onOpenChange={(v) => {
          if (!v) setStatusTarget(null);
        }}
        supplier={statusTarget}
      />

      {/* Purchase History Dialog */}
      <PurchaseHistoryDialog
        open={historyTarget !== null}
        onOpenChange={(v) => {
          if (!v) setHistoryTarget(null);
        }}
        supplier={historyTarget}
      />
    </div>
  );
}
