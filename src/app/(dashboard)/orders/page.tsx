"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  MapPin,
  AlertCircle,
  PackageX,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { SearchToolbar } from "@/components/ui/search-toolbar";
import { FilterGroup } from "@/components/features/FilterGroup";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetSalesOrdersQuery } from "@/store/services/order.service";
import { formatShippingShort, salesOrderStatusColor, salesOrderStatusLabel } from "@/types/sales-order";
import { apiErrMessage } from "@/types/api";

const PAGE_SIZE = 20;
const SKELETON_ROWS = 5;

const STATUS_FILTER_OPTIONS = [
  "Tất cả trạng thái",
  "Chờ xử lý",
  "Đang lấy hàng",
  "Đã lấy đủ",
  "Đã đóng gói",
  "Đã xuất kho",
];
const STATUS_LABEL_TO_API: Record<string, string> = {
  "Chờ xử lý": "PENDING",
  "Đang lấy hàng": "PICKING",
  "Đã lấy đủ": "PICKED",
  "Đã đóng gói": "PACKED",
  "Đã xuất kho": "SHIPPED",
};

function OrderTableSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <TableRow key={`order-sk-${i}`}>
          <TableCell className="px-3 py-3 text-center">
            <Skeleton className="mx-auto h-4 w-6" />
          </TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-3 w-full max-w-[240px]" /></TableCell>
          <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-5 w-24 rounded-full" /></TableCell>
          <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-3 w-20" /></TableCell>
          <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-8 w-20 rounded-lg" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function OrderPage() {
  const searchParams = useSearchParams();
  const createdId = searchParams.get("created") || "";
  const [query, setQuery] = useState("");
  const debouncedKeyword = useDebouncedValue(query.trim());
  const [statusFilter, setStatusFilter] = useState("Tất cả trạng thái");
  const [page, setPage] = useState(0);

  const apiStatus = STATUS_LABEL_TO_API[statusFilter] ?? "";

  const listParams = useMemo(
    () => ({
      page,
      size: PAGE_SIZE,
      keyword: debouncedKeyword || undefined,
      status: apiStatus || undefined,
    }),
    [page, debouncedKeyword, apiStatus],
  );

  const { data, error, isLoading, isFetching, refetch } = useGetSalesOrdersQuery(listParams);
  const rows = useMemo(() => data?.data?.content ?? [], [data]);
  const paged = data?.data as
    | {
        total_elements?: number;
        total_pages?: number;
        totalElements?: number;
        totalPages?: number;
      }
    | undefined;
  const totalElements = paged?.total_elements ?? paged?.totalElements ?? 0;
  const totalPages = paged?.total_pages ?? paged?.totalPages ?? 0;
  const canGoPrev = page > 0;
  const canGoNext = totalPages > 0 && page < totalPages - 1;

  const hasAnyFilter = query.trim().length > 0 || statusFilter !== "Tất cả trạng thái";

  useEffect(() => {
    if (!createdId) return;
    toast.success("Đã tạo đơn xuất. Bấm vào đơn để xem chi tiết và thêm sản phẩm.");
  }, [createdId]);

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("Tất cả trạng thái");
    setPage(0);
  };

  function formatRelativeTime(dateStr: string | null | undefined): string {
    if (!dateStr) return "—";
    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) return "—";
    return dt.toLocaleString("vi-VN");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Đơn hàng xuất kho"
        description="Quản lý đơn hàng và theo dõi tiến trình giao nhận."
        actions={
          <Button
            render={<Link href="/orders/new" />}
            nativeButton={false}
            size="sm"
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Tạo đơn xuất
          </Button>
        }
      />

      <SearchToolbar
        placeholder="Tìm theo số đơn, khách hàng, địa chỉ..."
        value={query}
        onValueChange={(value) => {
          setQuery(value);
          setPage(0);
        }}
        filters={
          <FilterGroup
            hasAnyFilter={hasAnyFilter}
            onClear={clearFilters}
            filters={[
              {
                label: "trạng thái",
                placeholder: "Trạng thái",
                value: statusFilter,
                onChange: (value) => {
                  setStatusFilter(value);
                  setPage(0);
                },
                options: STATUS_FILTER_OPTIONS,
                width: "sm:w-[200px]",
              },
            ]}
          />
        }
      />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {isFetching && !isLoading ? (
          <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
            Đang cập nhật dữ liệu...
          </p>
        ) : null}
        <div className="overflow-x-auto">
          <Table className="min-w-[980px] text-left">
            <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
              <TableRow>
                <TableHead className="w-12 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">STT</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Mã đơn</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Khách hàng</TableHead>
                <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Địa chỉ giao</TableHead>
                <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</TableHead>
                <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Tạo lúc</TableHead>
                <TableHead className="px-3 py-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <OrderTableSkeleton />
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
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
                  </TableCell>
                </TableRow>
              ) : rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
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
                            Tạo đơn xuất
                          </Button>
                        )
                      }
                      className="py-10"
                    />
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((item, index) => {
                  const highlight = Boolean(createdId && item.id === createdId);
                  return (
                    <TableRow
                      key={item.id}
                      className={`group transition-colors ${
                        highlight
                          ? "bg-indigo-50/60 ring-1 ring-indigo-200 dark:bg-indigo-950/20 dark:ring-indigo-900/40"
                          : "odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70"
                      }`}
                    >
                      <TableCell className="px-3 py-3 text-center">
                        <span className="tabular-nums text-xs font-medium text-slate-500 dark:text-slate-400">
                          {page * PAGE_SIZE + index + 1}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                        {item.soNumber || `SO-${item.id.slice(0, 8)}`}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-sm text-slate-700 dark:text-slate-200">
                        {item.customerName || "—"}
                      </TableCell>
                      <TableCell className="max-w-[320px] px-3 py-3">
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
                          <MapPin className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">
                            {item.shippingAddress ? formatShippingShort(item.shippingAddress) : "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-center">
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${salesOrderStatusColor(item.status)}`}>
                          {salesOrderStatusLabel(item.status)}
                        </span>
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right text-xs text-slate-500">
                        {formatRelativeTime(item.createdAt)}
                      </TableCell>
                      <TableCell className="px-3 py-3 text-right">
                        <Button
                          render={<Link href={`/orders/${item.id}`} />}
                          nativeButton={false}
                          variant="ghost"
                          size="sm"
                          className="text-indigo-600"
                        >
                          Chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {rows.length > 0 ? (
                <>
                  Hiển thị{" "}
                  <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                    {page * PAGE_SIZE + 1}–{page * PAGE_SIZE + rows.length}
                  </span>{" "}
                  / <span className="tabular-nums">{totalElements}</span> đơn hàng
                  {totalPages > 1 ? (
                    <span className="text-slate-400">
                      {" "}· Trang{" "}
                      <span className="tabular-nums font-medium text-slate-600 dark:text-slate-300">
                        {page + 1}/{totalPages}
                      </span>
                    </span>
                  ) : null}
                </>
              ) : (
                <>Không có bản ghi trên trang này · Tổng {totalElements} đơn hàng</>
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
        </div>
      </div>
    </div>
  );
}
