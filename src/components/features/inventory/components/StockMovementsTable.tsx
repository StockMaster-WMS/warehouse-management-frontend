import { AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { PaginationFooter } from "@/components/ui/pagination-footer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { StockMovementResponse } from "@/types/stock";
import { formatDateTimeFull } from "@/components/features/inventory/utils";

type MovementTypeBadgeProps = {
  type: StockMovementResponse["movementType"];
};

function MovementTypeBadge({ type }: MovementTypeBadgeProps) {
  switch (type) {
    case "INBOUND":
      return (
        <Badge className="border-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          Nhập kho
        </Badge>
      );
    case "OUTBOUND":
      return (
        <Badge variant="destructive">
          Xuất kho
        </Badge>
      );
    case "RESERVE":
      return (
        <Badge className="border-none bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          Giữ chỗ
        </Badge>
      );
    case "RELEASE":
      return (
        <Badge className="border-none bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
          Nhả chỗ
        </Badge>
      );
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
}

type StockMovementsTableProps = {
  items: StockMovementResponse[];
  page: number;
  pageSize: number;
  totalPages: number;
  totalElements: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isLoading: boolean;
  isFetching: boolean;
  errorMessage?: string | null;
  onPrevPage: () => void;
  onNextPage: () => void;
  onRetry?: () => void;
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

export function StockMovementsTable({
  items,
  page,
  pageSize,
  totalPages,
  totalElements,
  canGoPrev,
  canGoNext,
  isLoading,
  isFetching,
  errorMessage,
  onPrevPage,
  onNextPage,
  onRetry,
}: StockMovementsTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {isFetching && !isLoading ? (
        <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
          Đang cập nhật dữ liệu...
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <Table className="min-w-237.5 text-left">
          <TableHeader className="sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
            <TableRow>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Thời gian
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Loại
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Kho
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Vị trí
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Lô
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                SL thay đổi
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                SL sau
              </TableHead>
              <TableHead className="px-3 py-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Giữ chỗ ±
              </TableHead>
              <TableHead className="px-3 py-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Ghi chú
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <TableSkeleton />
            ) : errorMessage ? (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Không thể tải lịch sử biến động"
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
                <TableCell colSpan={9} className="p-0">
                  <EmptyState
                    icon={AlertCircle}
                    title="Chưa có lịch sử biến động"
                    description="Các thao tác nhập/xuất/giữ chỗ/nhả chỗ sẽ được ghi nhận tại đây."
                    className="py-10"
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className={cn(
                    "group transition-colors",
                    "odd:bg-white even:bg-slate-50/40 hover:bg-indigo-50/40 dark:odd:bg-slate-900 dark:even:bg-slate-900/70 dark:hover:bg-slate-800/70",
                  )}
                >
                  <TableCell className="px-3 py-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {formatDateTimeFull(item.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <MovementTypeBadge type={item.movementType} />
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.warehouseCode}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                      {item.locationCode}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {item.lotNumber || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <span
                      className={cn(
                        "tabular-nums text-sm font-bold",
                        item.qtyChange > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : item.qtyChange < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-slate-500",
                      )}
                    >
                      {item.qtyChange > 0 ? "+" : ""}
                      {item.qtyChange.toLocaleString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    <span className="tabular-nums text-sm font-medium text-slate-900 dark:text-white">
                      {item.qtyAfter.toLocaleString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="px-3 py-3 text-center">
                    {item.reservedChange !== 0 ? (
                      <span
                        className={cn(
                          "tabular-nums text-sm font-medium",
                          item.reservedChange > 0
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-blue-600 dark:text-blue-400",
                        )}
                      >
                        {item.reservedChange > 0 ? "+" : ""}
                        {item.reservedChange.toLocaleString("vi-VN")}
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-3 py-3">
                    <span className="text-xs text-slate-600 dark:text-slate-400">
                      {item.reason || "—"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && !errorMessage && totalElements > 0 ? (
        <PaginationFooter
          itemLabel="biến động"
          rowsCount={items.length}
          page={page}
          totalPages={totalPages}
          totalElements={totalElements}
          pageSize={pageSize}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
        />
      ) : null}
    </div>
  );
}
