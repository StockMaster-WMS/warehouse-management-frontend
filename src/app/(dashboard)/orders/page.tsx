"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Truck,
  MapPin,
  History,
  AlertCircle,
  PackageX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { FilterGroup } from "@/components/features/FilterGroup";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetOrdersQuery } from "@/store/services/order.service";
import { orderStatusLabel, orderStatusColor } from "@/types/order";
import { apiErrMessage } from "@/types/api";

const PAGE_SIZE = 20;
const SKELETON_ROWS = 5;

const STATUS_FILTER_OPTIONS = ["Đang vận chuyển", "Chờ lấy hàng", "Đã giao"];
const STATUS_LABEL_TO_API: Record<string, string> = {
  "Đang vận chuyển": "IN_TRANSIT",
  "Chờ lấy hàng": "PENDING",
  "Đã giao": "DELIVERED",
};

function OrderListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <div
          key={`order-sk-${i}`}
          className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50"
        >
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <Skeleton className="h-4 w-20 rounded-full" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OrderPage() {
  const [query, setQuery] = useState("");
  const debouncedKeyword = useDebouncedValue(query.trim());
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [page, setPage] = useState(0);

  const apiStatus = STATUS_LABEL_TO_API[statusFilter] ?? "";

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, apiStatus]);

  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      keyword: debouncedKeyword || undefined,
      status: apiStatus || undefined,
    }),
    [page, debouncedKeyword, apiStatus],
  );

  const { data, error, isLoading, isFetching, refetch } = useGetOrdersQuery(listParams);
  const rows = useMemo(() => data?.data?.content ?? [], [data]);
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;
  const canGoPrev = page > 0;
  const canGoNext = totalPages > 0 && page < totalPages - 1;

  const hasAnyFilter = query.trim().length > 0 || statusFilter !== "Tất cả trạng thái";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("Tất cả trạng thái");
    setPage(0);
  };

  function formatRelativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "";
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Vừa xong";
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng & giao nhận"
        description="Quản lý hành trình vận chuyển và trạng thái đơn xuất kho."
        actions={
          <Button
            render={<Link href="/orders/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Hành trình mới
          </Button>
        }
      />

      <SearchToolbar
        placeholder="Tìm theo mã đơn, điểm giao hàng..."
        value={query}
        onValueChange={setQuery}
        filters={
          <FilterGroup
            hasAnyFilter={hasAnyFilter}
            onClear={clearFilters}
            filters={[
              {
                label: "trạng thái",
                placeholder: "Trạng thái",
                value: statusFilter,
                onChange: setStatusFilter,
                options: STATUS_FILTER_OPTIONS,
                width: "sm:w-[200px]",
              },
            ]}
          />
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ── Order list (2/3) ── */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Trình trạng giao hàng
              </h3>
              {isFetching && !isLoading && (
                <span className="text-[11px] font-medium text-slate-400">Đang cập nhật...</span>
              )}
            </div>

            {isLoading ? (
              <OrderListSkeleton />
            ) : error ? (
              <EmptyState
                icon={AlertCircle}
                title="Không thể tải đơn hàng"
                description={apiErrMessage(error, "Đã xảy ra lỗi khi tải danh sách đơn hàng.")}
                action={
                  <Button variant="outline" size="sm" onClick={() => refetch()}>
                    Thử lại
                  </Button>
                }
                className="py-10"
              />
            ) : rows.length === 0 ? (
              <EmptyState
                icon={PackageX}
                title={hasAnyFilter ? "Không có đơn hàng khớp bộ lọc" : "Chưa có đơn hàng nào"}
                description={
                  hasAnyFilter
                    ? "Thử đổi từ khóa hoặc bộ lọc trạng thái."
                    : "Bắt đầu bằng cách tạo hành trình giao hàng đầu tiên."
                }
                action={
                  hasAnyFilter ? (
                    <Button variant="outline" size="sm" onClick={clearFilters}>
                      Xóa bộ lọc
                    </Button>
                  ) : (
                    <Button
                      render={<Link href="/orders/new" />}
                      nativeButton={false}
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700"
                    >
                      Hành trình mới
                    </Button>
                  )
                }
                className="py-10"
              />
            ) : (
              <div className="flex flex-col gap-4">
                {rows.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg bg-slate-50/50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold">
                        <Truck className="h-5 w-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {item.code}
                        </span>
                        {item.destination && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-500">
                            <MapPin className="h-3 w-3" />
                            <span>{item.destination}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${orderStatusColor(item.status)}`}
                      >
                        {orderStatusLabel(item.status)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {formatRelativeTime(item.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && !error && (rows.length > 0 || totalElements > 0) && (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                {rows.length > 0 ? (
                  <>
                    Hiển thị{" "}
                    <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                      {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + rows.length}
                    </span>{" "}
                    / <span className="tabular-nums">{totalElements}</span> đơn hàng
                    {totalPages > 1 && (
                      <span className="text-slate-400">
                        {" "}· Trang{" "}
                        <span className="tabular-nums font-medium text-slate-600 dark:text-slate-300">
                          {page + 1}/{totalPages}
                        </span>
                      </span>
                    )}
                  </>
                ) : (
                  <>Không có bản ghi · Tổng {totalElements} đơn hàng</>
                )}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canGoPrev || isFetching}
                  className="h-8 px-3 text-xs border-slate-200"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!canGoNext || isFetching}
                  className="h-8 px-3 text-xs border-slate-200"
                  onClick={() => setPage((p) => p + 1)}
                >
                  Tiếp theo
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ── Activity sidebar (1/3) ── */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center gap-2 mb-4">
              <History className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Hoạt động mới nhất
              </h3>
            </div>
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="relative pl-4 border-l border-slate-100 dark:border-slate-800 pb-4 last:pb-0"
                >
                  <div className="absolute left-[-4.5px] top-1 h-2 w-2 rounded-full bg-indigo-600 ring-4 ring-white dark:ring-slate-950" />
                  <div className="text-[12px] font-bold text-emerald-600 mb-1">
                    Cập nhật lúc 10:45
                  </div>
                  <p className="text-[12px] text-slate-600 dark:text-slate-400 leading-tight">
                    Đơn hàng #ORD-7789 đã nhập kho trung chuyển tại Long An.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
