import { Button } from "@/components/ui/button";
import { ORDERS_PAGE_SIZE } from "@/components/features/orders/constants";

type OrdersPaginationFooterProps = {
  rowsCount: number;
  page: number;
  totalElements: number;
  totalPages: number;
  canGoPrev: boolean;
  canGoNext: boolean;
  isFetching: boolean;
  onPrevPage: () => void;
  onNextPage: () => void;
};

export function OrdersPaginationFooter({
  rowsCount,
  page,
  totalElements,
  totalPages,
  canGoPrev,
  canGoNext,
  isFetching,
  onPrevPage,
  onNextPage,
}: OrdersPaginationFooterProps) {
  return (
    <div className="border-t border-slate-100 p-4 dark:border-slate-800">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {rowsCount > 0 ? (
            <>
              Hiển thị <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">{page * ORDERS_PAGE_SIZE + 1}-{page * ORDERS_PAGE_SIZE + rowsCount}</span>
              {" "}/ <span className="tabular-nums">{totalElements}</span> đơn hàng
              {totalPages > 1 ? (
                <span className="text-slate-400">
                  {" "}· Trang <span className="tabular-nums font-medium text-slate-600 dark:text-slate-300">{page + 1}/{totalPages}</span>
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
            onClick={onPrevPage}
          >
            Trước
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canGoNext || isFetching}
            className="h-8 px-3 text-xs border-slate-200"
            onClick={onNextPage}
          >
            Tiếp theo
          </Button>
        </div>
      </div>
    </div>
  );
}
