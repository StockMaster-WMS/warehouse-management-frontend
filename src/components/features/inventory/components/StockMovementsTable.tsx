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
  onPageSizeChange?: (size: number) => void;
  onRetry?: () => void;
};

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={`sk-${i}`}>
          {Array.from({ length: 9 }).map((__, j) => (
            <TableCell key={`sk-${i}-${j}`} className="p-3">
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
  onPageSizeChange,
  onRetry,
}: StockMovementsTableProps) {
  const headerCellClass = "ui-label p-3";

  return (
    <div className="ui-surface overflow-hidden">
      {isFetching && !isLoading ? (
        <p className="ui-updating-banner">
          Đang cập nhật dữ liệu…
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <Table className="min-w-[65rem] text-left">
          <TableHeader className="ui-table-header">
            <TableRow>
              <TableHead className={headerCellClass}>
                Loại
              </TableHead>
              <TableHead className={cn(headerCellClass, "min-w-48")}>
                Sản phẩm
              </TableHead>
              <TableHead className={headerCellClass}>
                Kho
              </TableHead>
              <TableHead className={headerCellClass}>
                Vị trí
              </TableHead>
              <TableHead className={headerCellClass}>
                Lô
              </TableHead>
              <TableHead className={cn(headerCellClass, "text-center")}>
                SL thay đổi
              </TableHead>
              <TableHead className={cn(headerCellClass, "text-center")}>
                SL sau
              </TableHead>
              <TableHead className={cn(headerCellClass, "text-center")}>
                Giữ chỗ ±
              </TableHead>
              <TableHead className={cn(headerCellClass, "text-right")}>
                Thời gian
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
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
                    description="Các thao tác nhập kho, xuất kho và giữ chỗ sẽ được ghi nhận tại đây."
                    className="py-10"
                  />
                </TableCell>
              </TableRow>
            ) : (
              items.map((item) => (
                <TableRow
                  key={item.id}
                  className="ui-table-row group"
                >
                  <TableCell className="p-3">
                    <MovementTypeBadge type={item.movementType} />
                  </TableCell>
                  <TableCell className="p-3">
                    <div className="space-y-0.5">
                      <div className="text-sm font-semibold text-foreground">
                        {item.productName || "Chưa có tên sản phẩm"}
                      </div>
                      <div className="font-mono text-xs text-muted-foreground">
                        {item.productSku || item.productId}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="p-3">
                    <span className="text-sm font-medium text-foreground/85">
                      {item.warehouseCode}
                    </span>
                  </TableCell>
                  <TableCell className="p-3">
                    <span className="font-mono text-xs font-semibold text-muted-foreground">
                      {item.locationCode}
                    </span>
                  </TableCell>
                  <TableCell className="p-3">
                    <span className="text-xs text-muted-foreground">
                      {item.lotNumber || "—"}
                    </span>
                  </TableCell>
                  <TableCell className="p-3 text-center">
                    <span
                      className={cn(
                        "tabular-nums text-sm font-bold",
                        item.qtyChange > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : item.qtyChange < 0
                            ? "text-rose-600 dark:text-rose-400"
                            : "text-muted-foreground",
                      )}
                    >
                      {item.qtyChange > 0 ? "+" : ""}
                      {item.qtyChange.toLocaleString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="p-3 text-center">
                    <span className="tabular-nums text-sm font-medium text-foreground">
                      {item.qtyAfter.toLocaleString("vi-VN")}
                    </span>
                  </TableCell>
                  <TableCell className="p-3 text-center">
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
                      <span className="text-xs text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="p-3 text-right">
                    <span className="text-xs text-muted-foreground">
                      {formatDateTimeFull(item.createdAt)}
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
          onPageSizeChange={onPageSizeChange}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrevPage={onPrevPage}
          onNextPage={onNextPage}
        />
      ) : null}
    </div>
  );
}
