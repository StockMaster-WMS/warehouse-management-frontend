"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { AxiosError } from "axios";

import {
  Building2,
  MapPin,
  Plus,
  Boxes,
  LayoutDashboard,
  MoreVertical,
  ChevronRight,
  User,
  ThermometerSnowflake,
  X,
  Edit2,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowUpDown,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { DeleteConfirmDialog } from "@/components/features/DeleteConfirmDialog";
import { FilterGroup } from "@/components/features/FilterGroup";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { useWarehouseListQuery } from "@/hooks/useWarehouseListQuery";
import type { SortDirection, WarehouseSortField } from "@/types/warehouse";

const STATUS_LABEL_ALL = "Tất cả trạng thái";
const STATUS_LABEL_ACTIVE = "Đang hoạt động";
const STATUS_LABEL_INACTIVE = "Ngừng hoạt động";

const SORT_FIELD_LABELS: Record<string, WarehouseSortField> = {
  "Ngày tạo": "createdAt",
  "Tên kho": "name",
  "Mã kho": "code",
  "Trạng thái": "isActive",
};

const SORT_FIELD_OPTIONS = Object.keys(SORT_FIELD_LABELS);

const SORT_DIR_LABELS: Record<string, SortDirection> = {
  "Tăng dần": "asc",
  "Giảm dần": "desc",
};

const SORT_DIR_OPTIONS = Object.keys(SORT_DIR_LABELS);

function getErrorMessage(error: unknown) {
  const axiosError = error as AxiosError<{ message?: string }>;
  return (
    axiosError?.response?.data?.message ??
    axiosError?.message ??
    "Đã xảy ra lỗi khi tải danh sách kho."
  );
}

function getCapacityWidthClass(capacity: number) {
  if (capacity >= 100) return "w-full";
  if (capacity >= 95) return "w-[95%]";
  if (capacity >= 90) return "w-[90%]";
  if (capacity >= 80) return "w-[80%]";
  if (capacity >= 70) return "w-[70%]";
  if (capacity >= 60) return "w-[60%]";
  if (capacity >= 50) return "w-1/2";
  if (capacity >= 40) return "w-[40%]";
  if (capacity >= 30) return "w-[30%]";
  if (capacity >= 20) return "w-1/5";
  if (capacity >= 10) return "w-[10%]";
  if (capacity > 0) return "w-[5%]";
  return "w-0";
}

export default function WarehousesPage() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");

  const {
    warehouses,
    keyword,
    setKeyword,
    isActive,
    setIsActive,
    sort,
    setSort,
    sortDir,
    setSortDir,
    page,
    setPage,
    size,
    setSize,
    totalPages,
    totalElements,
    isPending,
    isFetching,
    isError,
    error,
    refetch,
    resetFilters,
  } = useWarehouseListQuery();

  const statusValue =
    isActive === true
      ? STATUS_LABEL_ACTIVE
      : isActive === false
        ? STATUS_LABEL_INACTIVE
        : STATUS_LABEL_ALL;

  const sortValue =
    SORT_FIELD_OPTIONS.find((label) => SORT_FIELD_LABELS[label] === sort) ??
    "Ngày tạo";

  const sortDirValue =
    SORT_DIR_OPTIONS.find((label) => SORT_DIR_LABELS[label] === sortDir) ??
    "Giảm dần";

  const hasAnyFilter =
    keyword.trim().length > 0 ||
    typeof isActive === "boolean" ||
    sort !== "createdAt" ||
    sortDir !== "desc";

  const paginationMeta = useMemo(() => {
    if (warehouses.length === 0) {
      return { from: 0, to: 0 };
    }
    const from = page * size + 1;
    const to = page * size + warehouses.length;
    return { from, to };
  }, [page, size, warehouses.length]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Danh sách kho"
        description="Hệ thống quản lý không gian lưu trữ và mạng lưới kho bãi."
        actions={
          <Button
            render={<Link href="/warehouses/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200 dark:shadow-none"
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm kho mới
          </Button>
        }
      />

      <SearchToolbar
        placeholder="Tìm theo tên kho hoặc địa chỉ..."
        className="max-w-2xl"
        value={keyword}
        onValueChange={setKeyword}
        filters={
          <FilterGroup
            hasAnyFilter={hasAnyFilter}
            onClear={resetFilters}
            filters={[
              {
                label: "trạng thái",
                placeholder: "Trạng thái",
                value: statusValue,
                onChange: (value) => {
                  if (value === STATUS_LABEL_ACTIVE) {
                    setIsActive(true);
                    return;
                  }
                  if (value === STATUS_LABEL_INACTIVE) {
                    setIsActive(false);
                    return;
                  }
                  setIsActive(undefined);
                },
                options: [STATUS_LABEL_ACTIVE, STATUS_LABEL_INACTIVE],
                width: "sm:w-[180px]",
              },
              {
                label: "sắp xếp",
                placeholder: "Sắp xếp",
                value: sortValue,
                onChange: (value) =>
                  setSort(SORT_FIELD_LABELS[value] ?? "createdAt"),
                options: SORT_FIELD_OPTIONS,
                width: "sm:w-[170px]",
              },
              {
                label: "thứ tự",
                placeholder: "Thứ tự",
                value: sortDirValue,
                onChange: (value) =>
                  setSortDir(SORT_DIR_LABELS[value] ?? "desc"),
                options: SORT_DIR_OPTIONS,
                width: "sm:w-[150px]",
              },
            ]}
          />
        }
      />

      <div className="space-y-4">
        {isFetching && !isPending ? (
          <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu...
          </p>
        ) : null}

        {isPending ? (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={`warehouse-loading-${index}`}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="space-y-3">
                  <Skeleton className="h-12 w-12 rounded-xl" />
                  <Skeleton className="h-6 w-52" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-2 w-full rounded-full" />
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <Skeleton className="h-14 w-full rounded-xl" />
                    <Skeleton className="h-14 w-full rounded-xl" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <EmptyState
              icon={AlertCircle}
              title="Không thể tải danh sách kho"
              description={getErrorMessage(error)}
              action={
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Thử lại
                </Button>
              }
              className="py-12"
            />
          </div>
        ) : warehouses.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <EmptyState
              icon={Building2}
              title={
                hasAnyFilter ? "Không có kho phù hợp bộ lọc" : "Chưa có kho nào"
              }
              description={
                hasAnyFilter
                  ? "Hãy thử đổi từ khóa, trạng thái hoặc cách sắp xếp."
                  : "Bắt đầu bằng cách thêm kho đầu tiên vào hệ thống."
              }
              action={
                hasAnyFilter ? (
                  <Button variant="outline" size="sm" onClick={resetFilters}>
                    <X className="mr-2 h-4 w-4" />
                    Xóa bộ lọc
                  </Button>
                ) : (
                  <Button
                    render={<Link href="/warehouses/new" />}
                    nativeButton={false}
                    size="sm"
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm kho mới
                  </Button>
                )
              }
              className="py-12"
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
              {warehouses.map((wh) => {
                const capacity = Math.max(
                  0,
                  Math.min(100, Math.round(wh.capacityPercent ?? 0)),
                );

                return (
                  <div
                    key={wh.id}
                    className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                          {wh.type?.toLowerCase().includes("lạnh") ? (
                            <ThermometerSnowflake className="h-6 w-6" />
                          ) : (
                            <Building2 className="h-6 w-6" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={`rounded-full border-none px-2 py-0.5 text-[10px] font-bold ${
                              wh.isActive
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                                : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                            }`}
                          >
                            {wh.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                          </Badge>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  className="h-8 w-8 rounded-full"
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              }
                            />
                            <DropdownMenuContent
                              align="end"
                              className="w-48 rounded-xl"
                            >
                              <DropdownMenuGroup>
                                <DropdownMenuLabel>
                                  Quản lý kho
                                </DropdownMenuLabel>
                              </DropdownMenuGroup>
                              <DropdownMenuItem
                                className="rounded-lg"
                                render={
                                  <Link href={`/warehouses/${wh.id}/edit`} />
                                }
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Sửa thông tin
                              </DropdownMenuItem>
                              <DropdownMenuItem className="rounded-lg">
                                Xem bản đồ kho
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="rounded-lg text-rose-600 focus:text-rose-600"
                                onClick={() => {
                                  setItemToDelete(wh.name);
                                  setIsDeleteDialogOpen(true);
                                }}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Xóa kho
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>

                      <div className="mt-4 space-y-1">
                        <h3 className="text-lg leading-tight font-bold text-slate-900 dark:text-white">
                          {wh.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                          <MapPin className="h-3.5 w-3.5" />
                          {wh.location || wh.address || "Chưa cập nhật địa chỉ"}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400">
                          {wh.code || "--"}
                        </div>
                      </div>

                      <div className="mt-6 space-y-3">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-bold">
                            <span className="text-slate-400 uppercase tracking-wider">
                              Tỷ lệ lấp đầy
                            </span>
                            <span
                              className={
                                capacity > 90
                                  ? "text-rose-500"
                                  : "text-slate-900 dark:text-white"
                              }
                            >
                              {capacity}%
                            </span>
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                            <div
                              className={`h-full transition-all ${getCapacityWidthClass(
                                capacity,
                              )} ${
                                capacity > 90 ? "bg-rose-500" : "bg-indigo-500"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                            <LayoutDashboard className="h-4 w-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] leading-none font-bold text-slate-400 uppercase">
                                Zones
                              </span>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {wh.zonesCount ?? "--"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-2.5 dark:bg-slate-800/50">
                            <Boxes className="h-4 w-4 text-slate-400" />
                            <div className="flex flex-col">
                              <span className="text-[10px] leading-none font-bold text-slate-400 uppercase">
                                Bins
                              </span>
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {wh.binsCount ?? "--"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto border-t border-slate-100 p-4 dark:border-slate-800/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 ring-2 ring-white dark:ring-slate-900">
                            <User className="h-4 w-4 text-slate-500" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] leading-none font-bold text-slate-400">
                              Quản lý
                            </span>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                              {wh.managerName || "--"}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 gap-1.5 text-xs text-indigo-600 transition-all hover:bg-indigo-50 dark:text-indigo-400"
                          render={<Link href={`/warehouses/${wh.id}/edit`} />}
                          nativeButton={false}
                        >
                          Chi tiết
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}

              <Button
                render={<Link href="/warehouses/new" />}
                nativeButton={false}
                className="flex min-h-75 h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-transparent text-slate-500 transition-all hover:border-indigo-400 hover:bg-indigo-50/30 hover:text-indigo-600 dark:border-slate-800"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                  <Plus className="h-6 w-6" />
                </div>
                <span className="mt-3 text-sm font-bold">
                  Tạo khu vực kho mới
                </span>
              </Button>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {paginationMeta.from}-{paginationMeta.to}
                </span>
                / {totalElements} kho
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2 py-1 dark:border-slate-800 dark:bg-slate-900">
                  <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">
                    Số dòng
                  </span>
                  <Select
                    value={String(size)}
                    onValueChange={(value) => setSize(Number(value))}
                  >
                    <SelectTrigger className="h-8 min-w-18 border-0 px-1 text-xs shadow-none focus-visible:ring-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {[10, 20, 50, 100].map((value) => (
                        <SelectItem key={value} value={String(value)}>
                          {value}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => setPage(Math.max(0, page - 1))}
                    disabled={page <= 0 || totalPages === 0 || isFetching}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex h-9 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
                    {totalPages === 0 ? 0 : page + 1}/{totalPages}
                    {isFetching ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 px-3"
                    onClick={() => setPage(page + 1)}
                    disabled={
                      totalPages === 0 || page + 1 >= totalPages || isFetching
                    }
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <DeleteConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          console.log("Deleted", itemToDelete);
        }}
        itemName={itemToDelete}
        title="Xóa kho hàng"
        description="Xóa kho hàng sẽ gỡ bỏ mọi thông tin truy xuất. Hãy chắc chắn kho đã trống trước khi thực hiện."
      />
    </div>
  );
}
