import { AlertCircle } from "lucide-react";
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
import { formatDateTime } from "@/components/features/inventory/utils";

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
            <TableCell key={`sk-${i}-${j}`} className="p-3">
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

function getStockTone(item: StockExpanded) {
  const minQty = item.product?.minQty;
  if (item.qtyAvailable <= 0) return "critical";
  if (minQty == null || minQty <= 0) return "normal";
  if (item.qtyAvailable < minQty) return "warning";
  return "normal";
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
  const headerCellClass = "ui-label p-3";

  const content = (
    <>
      {isFetching && !isLoading ? (
        <p className="ui-updating-banner">
          Đang cập nhật dữ liệu…
        </p>
      ) : null}

      <div className="overflow-x-auto">
        <Table className="min-w-225 text-left">
          <TableHeader className="ui-table-header">
            <TableRow>
              <TableHead className={cn(headerCellClass, "w-12 text-center")}>
                STT
              </TableHead>
              <TableHead className={headerCellClass}>
                Kho
              </TableHead>
              <TableHead className={headerCellClass}>
                Vị trí
              </TableHead>
              <TableHead className={cn(headerCellClass, "min-w-45")}>
                Sản phẩm
              </TableHead>
              {/* <TableHead className={headerCellClass}>
                Lô
              </TableHead>
              <TableHead className={headerCellClass}>
                Hạn sử dụng
              </TableHead> */}
              <TableHead className={cn(headerCellClass, "text-center")}>
                Tồn tay
              </TableHead>
              <TableHead className={cn(headerCellClass, "text-center")}>
                Giữ chỗ
              </TableHead>
              <TableHead className={cn(headerCellClass, "text-center")}>
                Khả dụng
              </TableHead>
              <TableHead className={headerCellClass}>
                Cập nhật
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
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
                const productName = item.product?.name || item.productName || `Sản phẩm ${item.productId}`;
                const productSku = item.product?.sku || item.productSku || item.productId;
                const stockTone = getStockTone(item);
                return (
                  <TableRow
                    key={item.id}
                    className={cn(
                      "ui-table-row group",
                      stockTone === "critical" &&
                        "!bg-rose-100/70 hover:!bg-rose-100/90 dark:!bg-rose-950/28 dark:hover:!bg-rose-950/36",
                      stockTone === "warning" &&
                        "!bg-amber-100/65 hover:!bg-amber-100/85 dark:!bg-amber-950/24 dark:hover:!bg-amber-950/32",
                    )}
                  >
                    <TableCell className="p-3 text-center">
                      <span className="tabular-nums text-xs font-medium text-muted-foreground">
                        {page * pageSize + index + 1}
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <span className="text-sm font-medium text-foreground/85">
                        {item.warehouse?.name ?? item.warehouse?.code ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <span className="font-mono text-xs font-semibold text-muted-foreground">
                        {item.location?.code ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="space-y-0.5">
                        <div className="text-sm font-semibold text-foreground">
                          {productName}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {productSku}
                        </div>
                      </div>
                    </TableCell>
                    {/* <TableCell className="p-3">
                      <span className="text-xs text-muted-foreground">
                        {item.lotNumber || "Không lô"}
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(item.expiryDate)}
                      </span>
                    </TableCell> */}
                    <TableCell className="p-3 text-center">
                      <span className="tabular-nums text-sm font-bold text-foreground">
                        {item.qtyOnHand.toLocaleString("vi-VN")}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <span className="tabular-nums text-sm font-medium text-amber-600 dark:text-amber-400">
                        {item.qtyReserved.toLocaleString("vi-VN")}
                      </span>
                    </TableCell>
                    <TableCell className="p-3 text-center">
                      <span
                        className={cn(
                          "tabular-nums text-sm font-bold",
                          stockTone === "critical"
                            ? "text-rose-600 dark:text-rose-400"
                            : stockTone === "warning"
                              ? "text-amber-600 dark:text-amber-400"
                              : "text-emerald-600 dark:text-emerald-400",
                        )}
                      >
                        {item.qtyAvailable.toLocaleString("vi-VN")}
                      </span>
                    </TableCell>
                    <TableCell className="p-3">
                      <span className="text-xs text-muted-foreground">
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
    <div className="ui-surface overflow-hidden">
      {content}
    </div>
  );
}
