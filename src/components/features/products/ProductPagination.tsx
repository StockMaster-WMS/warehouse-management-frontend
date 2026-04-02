import { Button } from "@/components/ui/button";

interface ProductPaginationProps {
    page: number;
    totalElements: number;
    totalPages: number;
    pageSize: number;
    canGoPrev: boolean;
    canGoNext: boolean;
    isFetching: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
}

export function ProductPagination({
    page,
    totalElements,
    totalPages,
    pageSize,
    canGoPrev,
    canGoNext,
    isFetching,
    onPrevPage,
    onNextPage,
}: ProductPaginationProps) {
    const startItem = totalElements === 0 ? 0 : page * pageSize + 1;
    const endItem = startItem - 1 + Math.min(pageSize, totalElements - page * pageSize);

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-3">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {totalElements > 0 ? (
                            <>
                                Hiển thị{" "}
                                <span className="tabular-nums font-semibold text-slate-900 dark:text-white">
                                    {startItem}–{endItem}
                                </span>{" "}
                                / <span className="tabular-nums">{totalElements}</span> sản phẩm
                                {totalPages > 1 ? (
                                    <span className="text-slate-400">
                                        {" "}· Trang{" "}
                                        <span className="tabular-nums font-medium text-slate-700 dark:text-slate-200">
                                            {page + 1}/{totalPages}
                                        </span>
                                    </span>
                                ) : null}
                            </>
                        ) : (
                            <>Không có bản ghi trên trang này · Tổng {totalElements} sản phẩm</>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!canGoPrev || isFetching}
                        className="h-9 px-3 text-xs border-slate-200 bg-white dark:bg-slate-900"
                        onClick={onPrevPage}
                    >
                        Trước
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={!canGoNext || isFetching}
                        className="h-9 px-3 text-xs border-slate-200 bg-white dark:bg-slate-900"
                        onClick={onNextPage}
                    >
                        Tiếp theo
                    </Button>
                </div>
            </div>
        </div>
    );
}
