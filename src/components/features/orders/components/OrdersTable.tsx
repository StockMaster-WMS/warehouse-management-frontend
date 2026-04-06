import Link from "next/link";
import { AlertCircle, MapPin, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ORDERS_PAGE_SIZE } from "@/components/features/orders/constants";
import { OrdersPaginationFooter } from "./OrdersPaginationFooter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiErrMessage } from "@/types/api";
import { formatShippingShort, salesOrderStatusColor, salesOrderStatusLabel, type SalesOrder } from "@/types/sales-order";
import { formatOrderCreatedAt } from "@/components/features/orders/utils";

const SKELETON_ROWS = 5;

function OrdersTableSkeleton() {
  return (
    <>
      {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
        <TableRow key={`order-sk-${i}`}>
          <TableCell className="px-3 py-3 text-center">
            <Skeleton className="mx-auto h-4 w-6" />
          </TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-4 w-28" /></TableCell>
          <TableCell className="px-3 py-3"><Skeleton className="h-3 w-full max-w-60" /></TableCell>
          <TableCell className="px-3 py-3 text-center"><Skeleton className="mx-auto h-5 w-24 rounded-full" /></TableCell>
          <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-3 w-20" /></TableCell>
          <TableCell className="px-3 py-3 text-right"><Skeleton className="ml-auto h-8 w-20 rounded-lg" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

type OrdersTableProps = {
  rows: SalesOrder[];
  page: number;
  createdId: string;
  hasAnyFilter: boolean;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  onRetry: () => void;
  onClearFilters: () => void;
  totalElements: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
  noContainer?: boolean;
};

export function OrdersTable({
  rows,
  page,
  createdId,
  hasAnyFilter,
  isLoading,
  isFetching,
  error,
  onRetry,
  onClearFilters,
  totalElements,
  totalPages,
  canGoPrev,
  canGoNext,
  onPrevPage,
  onNextPage,
  noContainer = false,
}: OrdersTableProps) {
  const content = (
    <>
      {isFetching && !isLoading ? (
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          Đang cập nhật dữ liệu...
        </p>
      ) : null}
      <div className="overflow-x-auto">
        <Table className="min-w-245 text-left">
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
              <OrdersTableSkeleton />
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải đơn hàng"
                    description={apiErrMessage(error, "Đã xảy ra lỗi khi tải danh sách đơn hàng.")}
                    action={
                      <Button variant="outline" size="sm" onClick={onRetry}>
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
                        <Button variant="outline" size="sm" onClick={onClearFilters}>
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
                        {page * ORDERS_PAGE_SIZE + index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm font-semibold text-slate-900 dark:text-white">
                      {item.soNumber || `SO-${item.id.slice(0, 8)}`}
                    </TableCell>
                    <TableCell className="px-3 py-3 text-sm text-slate-700 dark:text-slate-200">
                      {item.customerName || "-"}
                    </TableCell>
                    <TableCell className="max-w-80 px-3 py-3">
                      <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-300">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {item.shippingAddress ? formatShippingShort(item.shippingAddress) : "-"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${salesOrderStatusColor(item.status)}`}>
                        {salesOrderStatusLabel(item.status)}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right text-xs text-slate-500">
                      {formatOrderCreatedAt(item.createdAt)}
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

      <OrdersPaginationFooter
        rowsCount={rows.length}
        page={page}
        totalElements={totalElements}
        totalPages={totalPages}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        isFetching={isFetching}
        onPrevPage={onPrevPage}
        onNextPage={onNextPage}
      />
    </>
  );

  if (noContainer) {
    return content;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {content}
    </div>
  );
}
