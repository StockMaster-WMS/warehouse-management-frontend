"use client";

import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

type PaginationFooterProps = {
    itemLabel: string;
    rowsCount: number;
    page: number;
    totalElements: number;
    totalPages: number;
    canGoPrev: boolean;
    canGoNext: boolean;
    isLoading?: boolean;
    isError?: boolean;
    isFetching?: boolean;
    errorText?: string;
    onPrevPage: () => void;
    onNextPage: () => void;
    pageSize?: number;
    pageSizeOptions?: number[];
    onPageSizeChange?: (size: number) => void;
};

export function PaginationFooter({
    itemLabel,
    rowsCount,
    page,
    totalElements,
    totalPages,
    canGoPrev,
    canGoNext,
    isLoading = false,
    isError = false,
    isFetching = false,
    errorText = "Không tải được dữ liệu trang này.",
    onPrevPage,
    onNextPage,
    pageSize,
    pageSizeOptions = [5, 20, 50, 100],
    onPageSizeChange,
}: PaginationFooterProps) {
    const hasSizeControl = typeof pageSize === "number" && !!onPageSizeChange;
    const start = rowsCount > 0 ? page * (pageSize ?? rowsCount) + 1 : 0;
    const end = rowsCount > 0 ? page * (pageSize ?? rowsCount) + rowsCount : 0;

    return (
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {isLoading ? (
                        <>Đang tải danh sách...</>
                    ) : isError ? (
                        <span className="text-rose-600 dark:text-rose-400">{errorText}</span>
                    ) : rowsCount > 0 ? (
                        <>
                            Hiển thị{" "}
                            <span className="tabular-nums font-semibold text-slate-700 dark:text-slate-200">
                                {start}-{end}
                            </span>{" "}
                            / <span className="tabular-nums">{totalElements}</span> {itemLabel}
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
                        <>Không có bản ghi · Tổng {totalElements} {itemLabel}</>
                    )}
                </p>

                <div className="flex items-center gap-2">
                    {hasSizeControl ? (
                        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-1 dark:border-slate-800 dark:bg-slate-900">
                            <Select
                                value={String(pageSize)}
                                onValueChange={(value) => onPageSizeChange(Number(value))}
                            >
                                <SelectTrigger className="h-7 min-w-16 border-0 px-1 text-xs shadow-none focus-visible:ring-0">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl">
                                    {pageSizeOptions.map((value) => (
                                        <SelectItem key={value} value={String(value)}>
                                            {value}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : null}

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canGoPrev || isFetching}
                        className="h-8 px-3 text-xs border-slate-200"
                        onClick={onPrevPage}
                    >
                        Trước
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!canGoNext || isFetching}
                        className="h-8 px-3 text-xs border-slate-200"
                        onClick={onNextPage}
                    >
                        Sau
                    </Button>
                    {isFetching ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : null}
                </div>
            </div>
        </div>
    );
}
