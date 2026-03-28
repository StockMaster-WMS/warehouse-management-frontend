"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import Link from "next/link";

import {
  Building2,
  Plus,
  MoreHorizontal,
  Phone,
  Mail,
  User,
  ExternalLink,
  Edit2,
  Trash2,
  PackageCheck,
  CalendarClock,
  X,
  AlertCircle,
  List,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { Supplier } from "@/types/supplier";
import {
  getSupplierDisplayName,
  isSupplierActive,
  supplierStatusLabel,
} from "@/types/supplier";

const PAGE_SIZE = 20;

export default function SuppliersPage() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");

  const { data, isLoading, isFetching, isError, error, refetch } = useGetSuppliersQuery({
    page,
    size: PAGE_SIZE,
    sort: "createdAt",
    sortDir: "desc",
    ...(debouncedKeyword ? { keyword: debouncedKeyword } : {}),
  });

  const pagedBody = data?.data;
  const rows = useMemo(() => pagedBody?.content ?? [], [pagedBody]);

  const paged = useMemo((): Pick<
    PagedResponse<Supplier>,
    "page" | "size" | "total_elements" | "total_pages"
  > | null => {
    if (!pagedBody || typeof pagedBody.page !== "number" || typeof pagedBody.total_pages !== "number") return null;
    return {
      page: pagedBody.page,
      size: pagedBody.size,
      total_elements: pagedBody.total_elements,
      total_pages: pagedBody.total_pages,
    };
  }, [pagedBody]);

  const totalPartners = pagedBody?.total_elements ?? 0;

  const activeCount = useMemo(() => rows.filter((s) => isSupplierActive(s.status)).length, [rows]);
  const inactiveCount = useMemo(() => rows.filter((s) => !isSupplierActive(s.status)).length, [rows]);
  const multiPage = (paged?.total_pages ?? 1) > 1;
  const canGoPrev = page > 0;
  const canGoNext = paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;

  const hasAnyFilter = searchInput.trim().length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Nhà cung cấp"
        description="Quản lý thông tin đối tác cung ứng và lịch sử giao dịch."
        actions={
          <Button
            render={<Link href="/suppliers/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm đối tác mới
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Tổng đối tác", value: String(totalPartners), icon: Building2, color: "text-indigo-500" },
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
            value: paged ? `${paged.page + 1}/${paged.total_pages} · ${paged.size}` : `${rows.length}`,
            icon: List,
            color: "text-blue-500",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <stat.icon className={`h-4 w-4 ${stat.color} opacity-70`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</div>
          </div>
        ))}
      </div>

      <SearchToolbar
        placeholder="Tìm kiếm (tên, mã, email liên hệ…) — gửi keyword lên API"
        value={searchInput}
        onValueChange={setSearchInput}
        right={
          hasAnyFilter ? (
            <Button
              type="button"
              variant="ghost"
              className="h-11 rounded-xl px-4 text-slate-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
              onClick={() => setSearchInput("")}
            >
              <X className="mr-2 h-4 w-4" />
              Xoá lọc
            </Button>
          ) : null
        }
      />

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu…
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="border-b border-slate-100 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/50">
              <tr>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Nhà cung cấp
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Liên hệ</th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Thanh toán / Giao hàng
                </th>
                <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Địa chỉ</th>
                <th className="px-6 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Trạng thái
                </th>
                <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, rowIndex) => (
                  <tr key={`supplier-skeleton-${rowIndex}`} className="hover:bg-transparent">
                    <td className="px-6 py-4">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="mt-2 h-3 w-28" />
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <Skeleton className="h-3 w-32" />
                      <Skeleton className="h-3 w-36" />
                      <Skeleton className="h-3 w-24" />
                    </td>
                    <td className="px-6 py-4 space-y-2">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </td>
                    <td className="px-6 py-4">
                      <Skeleton className="h-3 w-full max-w-[180px]" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Skeleton className="mx-auto h-5 w-16 rounded-full" />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Skeleton className="ml-auto h-8 w-8 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={AlertCircle}
                      title="Không tải được danh sách"
                      description={apiErrMessage(error)}
                      action={
                        <Button variant="outline" size="sm" onClick={() => refetch()}>
                          Thử lại
                        </Button>
                      }
                      className="py-10"
                    />
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyState
                      icon={Building2}
                      title="Chưa có nhà cung cấp"
                      description={
                        hasAnyFilter
                          ? "Không có kết quả khớp tìm kiếm. Thử từ khóa khác."
                          : "Thêm đối tác hoặc kiểm tra dữ liệu trên server."
                      }
                      className="py-10"
                    />
                  </td>
                </tr>
              ) : (
                rows.map((sup: Supplier) => {
                  const name = getSupplierDisplayName(sup);
                  const tax = sup.taxCode?.trim();
                  const sub = [sup.code, tax ? `MST ${tax}` : null].filter(Boolean).join(" • ");
                  const activeLike = isSupplierActive(sup.status);

                  return (
                    <tr
                      key={sup.id}
                      className="group transition-colors hover:bg-slate-50/50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold leading-tight text-slate-900 dark:text-white">{name}</span>
                          <span className="mt-1 font-mono text-[10px] font-medium text-slate-500">{sub || sup.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                            <User className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{sup.contactName ?? "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                            <Mail className="h-3 w-3 shrink-0 text-slate-400" />
                            <span className="truncate">{sup.contactEmail ?? "—"}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            <Phone className="h-3 w-3 shrink-0 text-slate-400" />
                            {sup.contactPhone ?? "—"}
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-xs text-slate-600 dark:text-slate-300">
                        <div>TT: {sup.paymentTerms != null ? `${sup.paymentTerms} ngày` : "—"}</div>
                        <div className="mt-0.5 text-slate-500">Lead: {sup.leadTimeDays != null ? `${sup.leadTimeDays} ngày` : "—"}</div>
                      </td>
                      <td className="max-w-[220px] px-6 py-4">
                        <span className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                          {sup.address ?? "—"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            activeLike
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {supplierStatusLabel(sup.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-lg">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
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
                            <DropdownMenuItem className="rounded-lg">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Lịch sử nhập hàng
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg text-rose-600 focus:text-rose-600"
                              onClick={() => {
                                setItemToDelete(name);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa đối tác
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          <div className="border-t border-slate-100 dark:border-slate-800">
            <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                {isLoading ? (
                  <span>Đang tải danh sách…</span>
                ) : isError ? (
                  <span className="text-rose-600 dark:text-rose-400">Không tải được dữ liệu trang này.</span>
                ) : paged ? (
                  <span>
                    Hiển thị {rows.length}/{paged.total_elements} nhà cung cấp
                    {paged.total_pages > 1
                      ? ` · Trang ${paged.page + 1}/${paged.total_pages} (size ${paged.size})`
                      : ""}
                  </span>
                ) : (
                  <span>{rows.length} bản ghi</span>
                )}
              </div>
              {paged && paged.total_pages > 1 ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGoPrev || isFetching}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Trước
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!canGoNext || isFetching}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          console.log("Deleted", itemToDelete);
        }}
        itemName={itemToDelete}
        title="Xóa nhà cung cấp"
        description="Bạn có chắc muốn xóa nhà cung cấp này? Mọi dữ liệu liên quan sẽ bị ảnh hưởng."
      />
    </div>
  );
}
