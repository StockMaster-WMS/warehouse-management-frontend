import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { StockExpanded } from "@/types/stock";
import { formatDate, formatDateTime, daysUntilExpiry } from "@/components/features/inventory/utils";

type InventoryStockTableProps = {
  items: StockExpanded[];
  page: number;
  totalPages: number;
  totalElements: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLoading: boolean;
  isFetching: boolean;
  errorMessage?: string | null;
  pageSize: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onPageSizeChange?: (size: number) => void;
  onRetry?: () => void;
  noContainer?: boolean;
};

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={`sk-${i}`}>
          {Array.from({ length: 9 }).map((__, j) => (
            <TableCell key={`sk-${i}-${j}`} className="px-3 py-3">
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export function InventoryStockTable({
  items,
  page,
  totalPages,
  totalElements,
  canGoPrev,
  canGoNext,
  isLoading,
  isFetching,
  errorMessage,
  pageSize,
  onPrevPage,
  onNextPage,
  onPageSizeChange,
  onRetry,
  noContainer = false,
}: InventoryStockTableProps) {
  const content = (
    <>
      {isFetching && !isLoading ? (
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          Đang cập nhật dữ liệu...
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <Table className="min-w-225 text-left">
          <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <TableRow>
              <TableHead className="w-12 px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                STT
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kho
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Vị trí
              </TableHead>
              <TableHead className="min-w-45 px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Sản phẩm
              </TableHead>
              {/* <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lô
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Hạn sử dụng
              </TableHead> */}
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Tồn tay
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Giữ chỗ
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Khả dụng
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Cập nhật
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <TableSkeleton />
            ) : errorMessage ? (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải dữ liệu tồn kho"
                    description={errorMessage}
                    action={
                      onRetry ? (
                        <Button variant="outline" size="sm" onClick={onRetry}>
                          Thử lại
                        </Button>
                      ) : undefined
                    }
                    className="py-10"
                  />
                </TableCell>
              </TableRow>
            ) : items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Chưa có dữ liệu tồn kho"
                    description="Thử thay đổi bộ lọc hoặc thêm hàng vào kho."
                    className="py-10"
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => {
                const days = daysUntilExpiry(item.expiryDate);
                const isNearExpiry = days !== null && days <= 30;
                const isExpired = days !== null && days < 0;
                const isLow =
                  item.product?.minQty != null &&
                  item.qtyAvailable < item.product.minQty;

                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "group transition-colors",
                      "odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70",
                    )}
                  >
                    <TableCell className="px-3 py-3 text-center">
                      <span className="tabular-nums text-xs font-medium text-slate-500">
                        {page * pageSize + index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {item.warehouse?.name ?? item.warehouse?.code ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {item.location?.code ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.product?.name ?? "—"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.product?.sku ?? "—"}
                        </div>
                      </div>
                    </TableCell>
                    {/* <TableCell className="px-3 py-3">
                      <span className="text-xs text-slate-600 dark:text-slate-400">
                        {item.lotNumber || "—"}
                      </span>
                    </TableCell> */}
                    {/* <TableCell className="px-3 py-3">
                      {item.expiryDate ? (
                        <span
                          className={cn(
                            "text-xs font-medium",
                            isExpired
                              ? "text-rose-600 dark:text-rose-400"
                              : isNearExpiry
                                ? "text-amber-600 dark:text-amber-400"
                                : "text-slate-600 dark:text-slate-400",
                          )}
                        >
                          {formatDate(item.expiryDate)}
                          {isExpired ? (
                            <Badge variant="destructive" className="ml-1.5 text-[10px]">
                              Hết hạn
                            </Badge>
                          ) : isNearExpiry ? (
                            <Badge className="ml-1.5 border-none bg-amber-100 text-[10px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                              {days} ngày
                            </Badge>
                          ) : null}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </TableCell> */}
                    <TableCell className="px-3 py-3 text-center">
                      <span className="tabular-nums text-sm font-bold text-slate-900 dark:text-white">
                        {item.qtyOnHand.toLocaleString("vi-VN")}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      <span className="tabular-nums text-sm font-medium text-amber-600 dark:text-amber-400">
                        {item.qtyReserved.toLocaleString("vi-VN")}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      <span
                        className={cn(
                          "tabular-nums text-sm font-bold",
                          isLow
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {item.qtyAvailable.toLocaleString("vi-VN")}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <span className="text-xs text-slate-500">
                        {formatDateTime(item.updatedAt)}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && !errorMessage && totalElements > 0 ? (
        <PaginationFooter
          itemLabel="bản ghi"
          rowsCount={items.length}
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
          onPageSizeChange={onPageSizeChange}
        />
      ) : null}
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
