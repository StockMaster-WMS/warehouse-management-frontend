import { PaginationFooter } from "@/components/ui/pagination-footer";

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
    return (
        <PaginationFooter
            itemLabel="sản phẩm"
            rowsCount={Math.max(0, Math.min(pageSize, totalElements - page * pageSize))}
            page={page}
            totalElements={totalElements}
            totalPages={totalPages}
            canGoPrev={canGoPrev}
            canGoNext={canGoNext}
            isFetching={isFetching}
            onPrevPage={onPrevPage}
            onNextPage={onNextPage}
            pageSize={pageSize}
        />
    );
}
