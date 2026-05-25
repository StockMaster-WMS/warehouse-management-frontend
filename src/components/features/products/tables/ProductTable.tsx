import { AlertCircle, Package } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ProductTableRow } from "./ProductTableRow";
import { ProductPagination } from "./ProductPagination";
import { Plus } from "lucide-react";
import { apiErrMessage } from "@/types/api";
import type { Product } from "@/types/product";

const SKELETON_ROWS = 6;
const COL_COUNT = 12;

interface ProductTableProps {
    products: Product[];
    isLoading: boolean;
    isFetching: boolean;
    error: unknown;
    hasAnyFilter: boolean;
    onRequestDelete: (target: { id: string; name: string }) => void;
    onRetry: () => void;
    onClearFilters: () => void;
    pageIndex: number;
    pageSize: number;
    page: number;
    totalElements: number;
    totalPages: number;
    canGoPrev: boolean;
    canGoNext: boolean;
    onPrevPage: () => void;
    onNextPage: () => void;
    onPageSizeChange?: (size: number) => void;
    noContainer?: boolean;
    canManageProducts?: boolean;
}

function ProductTableSkeleton() {
    return (
        <>
            {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
                <TableRow key={`product-skeleton-${i}`}>
                    <TableCell className="p-3 text-center">
                        <Skeleton className="mx-auto h-5 w-6 rounded" />
                    </TableCell>
                    <TableCell className="p-3">
                        <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="p-3">
                        <Skeleton className="h-4 w-full max-w-60" />
                    </TableCell>
                    <TableCell className="p-3">
                        <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="p-3">
                        <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="p-3 text-center">
                        <Skeleton className="mx-auto h-4 w-8" />
                    </TableCell>
                    <TableCell className="p-3 text-center">
                        <Skeleton className="mx-auto h-4 w-10" />
                    </TableCell>
                    <TableCell className="p-3 text-center">
                        <Skeleton className="mx-auto h-4 w-10" />
                    </TableCell>
                    <TableCell className="p-3 text-center">
                        <Skeleton className="mx-auto h-4 w-10" />
                    </TableCell>
                    <TableCell className="p-3 text-center">
                        <Skeleton className="mx-auto h-5 w-20 rounded-full" />
                    </TableCell>
                    <TableCell className="p-3">
                        <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell className="p-3 text-right">
                        <Skeleton className="ml-auto size-8 rounded-lg" />
                    </TableCell>
                </TableRow>
            ))}
        </>
    );
}

export function ProductTable({
    products,
    isLoading,
    isFetching,
    error,
    hasAnyFilter,
    onRequestDelete,
    onRetry,
    onClearFilters,
    pageIndex,
    pageSize,
    page,
    totalElements,
    totalPages,
    canGoPrev,
    canGoNext,
    onPrevPage,
    onNextPage,
    onPageSizeChange,
    noContainer = false,
    canManageProducts = false,
}: ProductTableProps) {
    const content = (
        <>
            {isFetching && !isLoading ? (
                <p className="border-b border-slate-100 bg-slate-50 px-6 py-2 text-xs font-medium text-slate-500 dark:border-slate-800 dark:bg-slate-900/40">
                    Đang cập nhật dữ liệu…
                </p>
            ) : null}
            <div className="overflow-x-auto">
                <Table className="min-w-0 text-left md:min-w-300">
                    <TableHeader className="hidden sticky top-0 z-10 border-b border-slate-100 bg-slate-50/90 text-xs font-semibold text-slate-500 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90 md:table-header-group">
                        <TableRow>
                            <TableHead className="w-12 p-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                STT
                            </TableHead>
                            <TableHead className="w-24 p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Mã hàng
                            </TableHead>
                            <TableHead className="min-w-50 p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Tên sản phẩm
                            </TableHead>
                            <TableHead className="w-32 p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Mã vạch
                            </TableHead>
                            <TableHead className="min-w-35 p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Nhóm hàng
                            </TableHead>
                            <TableHead className="w-16 p-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                ĐVT
                            </TableHead>
                            <TableHead className="w-25 p-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                NCC chính
                            </TableHead>
                            <TableHead className="w-24 p-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Tồn hiện tại
                            </TableHead>
                            <TableHead className="w-24 p-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Khả dụng
                            </TableHead>
                            <TableHead className="w-30 p-3 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Trạng thái
                            </TableHead>
                            <TableHead className="w-25 p-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                Cập nhật
                            </TableHead>
                            <TableHead className="w-12 p-3 text-right text-[11px] font-bold uppercase tracking-wider text-slate-400">
                                <span className="sr-only">Thao tác</span>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {isLoading ? (
                            <ProductTableSkeleton />
                        ) : error ? (
                            <TableRow>
                                <TableCell colSpan={COL_COUNT} className="p-0">
                                    <EmptyState
                                        icon={AlertCircle}
                                        title="Không thể tải dữ liệu sản phẩm"
                                        description={apiErrMessage(
                                            error,
                                            "Đã xảy ra lỗi khi tải danh sách sản phẩm."
                                        )}
                                        action={
                                            <Button variant="outline" size="sm" onClick={onRetry}>
                                                Thử lại
                                            </Button>
                                        }
                                        className="py-10"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : products.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={COL_COUNT} className="p-0">
                                    <EmptyState
                                        icon={Package}
                                        title={
                                            hasAnyFilter
                                                ? "Không có sản phẩm khớp bộ lọc"
                                                : "Chưa có sản phẩm nào"
                                        }
                                        description={
                                            hasAnyFilter
                                                ? "Thử đổi từ khóa, bộ lọc hoặc chuyển trang."
                                                : "Bắt đầu bằng cách tạo sản phẩm đầu tiên cho kho."
                                        }
                                        action={
                                            hasAnyFilter ? (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={onClearFilters}
                                                >
                                                    Xóa bộ lọc
                                                </Button>
                                            ) : (
                                                canManageProducts ? (
                                                    <Button
                                                        render={<Link href="/products/new" />}
                                                        nativeButton={false}
                                                        size="sm"
                                                        className="bg-indigo-600 hover:bg-indigo-700"
                                                    >
                                                        <Plus className="mr-2 size-4" />
                                                        Tạo sản phẩm
                                                    </Button>
                                                ) : null
                                            )
                                        }
                                        className="py-10"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            products.map((product, index) => (
                                <ProductTableRow
                                    key={product.id}
                                    product={product}
                                    rowNumber={pageIndex * pageSize + index + 1}
                                    onRequestDelete={onRequestDelete}
                                    canManageProducts={canManageProducts}
                                />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <ProductPagination
                page={page}
                totalElements={totalElements}
                totalPages={totalPages}
                pageSize={pageSize}
                canGoPrev={canGoPrev}
                canGoNext={canGoNext}
                isFetching={isFetching}
                onPrevPage={onPrevPage}
                onNextPage={onNextPage}
                onPageSizeChange={onPageSizeChange}
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
