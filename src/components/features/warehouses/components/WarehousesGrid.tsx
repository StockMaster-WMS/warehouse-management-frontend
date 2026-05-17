import Link from "next/link";
import {
  AlertCircle,
  Building2,
  ChevronRight,
  Edit2,
  MapPin,
  MoreVertical,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { Skeleton } from "@/components/ui/skeleton";
import { apiErrMessage } from "@/types/api";
import type { Warehouse } from "@/types/warehouse";

const viDateFormatter = new Intl.DateTimeFormat("vi-VN");

function formatDate(value?: string | null) {
  return value ? viDateFormatter.format(new Date(value)) : "—";
}

type WarehousesGridProps = {
  warehouses: Warehouse[];
  error: unknown;
  isLoading: boolean;
  isFetching: boolean;
  hasAnyFilter: boolean;
  totalElements: number;
  totalPages: number;
  page: number;
  pageSize: number;
  onRetry: () => void;
  onClearFilters: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSizeChange: (size: number) => void;
  onRequestDelete: (warehouse: Warehouse) => void;
  onRequestEdit: (warehouse: Warehouse) => void;
  onRequestCreate: () => void;
  noContainer?: boolean;
};

export function WarehousesGrid({
  warehouses,
  error,
  isLoading,
  isFetching,
  hasAnyFilter,
  totalElements,
  totalPages,
  page,
  pageSize,
  onRetry,
  onClearFilters,
  onPrevPage,
  onNextPage,
  onPageSizeChange,
  onRequestDelete,
  onRequestEdit,
  onRequestCreate,
  noContainer = false,
}: WarehousesGridProps) {
  const content = (
    <div className={noContainer ? "p-6" : ""}>
      {isLoading ? (
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
      ) : error ? (
        <EmptyState
          icon={AlertCircle}
          title="Không thể tải danh sách kho"
          description={apiErrMessage(error, "Đã xảy ra lỗi khi tải danh sách kho.")}
          action={
            <Button variant="outline" size="sm" onClick={onRetry}>
              Thử lại
            </Button>
          }
          className="py-12"
        />
      ) : warehouses.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={hasAnyFilter ? "Không có kho phù hợp bộ lọc" : "Chưa có kho nào"}
          description={
            hasAnyFilter
              ? "Hãy thử đổi từ khóa, trạng thái hoặc cách sắp xếp."
              : "Bắt đầu bằng cách thêm kho đầu tiên vào hệ thống."
          }
          action={
            hasAnyFilter ? (
              <Button variant="outline" size="sm" onClick={onClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Xóa bộ lọc
              </Button>
            ) : (
              <Button
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700"
                onClick={onRequestCreate}
              >
                <Plus className="mr-2 h-4 w-4" />
                Thêm kho mới
              </Button>
            )
          }
          className="py-12"
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {warehouses.map((warehouse) => {
              const createdDate = formatDate(warehouse.createdAt);

              return (
                <div
                  key={warehouse.id}
                  className="group relative flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:border-indigo-200 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`rounded-full border-none px-2 py-0.5 text-[10px] font-bold ${
                            warehouse.isActive
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                          }`}
                        >
                          {warehouse.isActive ? "Đang hoạt động" : "Ngừng hoạt động"}
                        </Badge>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-full">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <DropdownMenuContent align="end" className="w-48 rounded-xl">
                            <DropdownMenuGroup>
                              <DropdownMenuLabel>Quản lý kho</DropdownMenuLabel>
                            </DropdownMenuGroup>
                            <DropdownMenuItem
                              className="rounded-lg"
                              onClick={() => onRequestEdit(warehouse)}
                            >
                              <Edit2 className="mr-2 h-4 w-4" />
                              Sửa thông tin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="rounded-lg text-rose-600 focus:text-rose-600"
                              onClick={() => onRequestDelete(warehouse)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa kho
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1">
                      <h3 className="text-lg leading-tight font-bold text-slate-900 dark:text-white">{warehouse.name}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {warehouse.address || "Chưa cập nhật địa chỉ"}
                      </div>
                      <div className="text-[11px] font-semibold text-slate-400">{warehouse.code || "—"}</div>
                    </div>

                    <div className="mt-4 text-xs text-slate-400">
                      Ngày tạo: {createdDate}
                    </div>
                  </div>

                  <div className="mt-auto border-t border-slate-100 p-4 dark:border-slate-800/50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 ring-2 ring-white dark:ring-slate-900">
                          <User className="h-4 w-4 text-slate-500" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] leading-none font-bold text-slate-400">Quản lý</span>
                          <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{warehouse.managerName ?? "—"}</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 gap-1.5 text-xs text-indigo-600 transition-all hover:bg-indigo-50 dark:text-indigo-400"
                        onClick={() => onRequestEdit(warehouse)}
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
              className="flex min-h-75 h-full w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-transparent text-slate-500 transition-all hover:border-indigo-400 hover:bg-indigo-50/30 hover:text-indigo-600 dark:border-slate-800"
              onClick={onRequestCreate}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Plus className="h-6 w-6" />
              </div>
              <span className="mt-3 text-sm font-bold">Tạo khu vực kho mới</span>
            </Button>
          </div>

          <PaginationFooter
            itemLabel="kho"
            rowsCount={warehouses.length}
            page={page}
            totalElements={totalElements}
            totalPages={totalPages}
            canGoPrev={page > 0}
            canGoNext={totalPages > 0 && page + 1 < totalPages}
            isFetching={isFetching}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
            pageSize={pageSize}
            onPageSizeChange={onPageSizeChange}
          />
        </>
      )}
    </div>
  );

  if (noContainer) {
    return content;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
      {content}
    </div>
  );
}
