import { PaginationFooter } from "@/components/ui/pagination-footer";
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
    <PaginationFooter
      itemLabel="đơn hàng"
      rowsCount={rowsCount}
      page={page}
      totalElements={totalElements}
      totalPages={totalPages}
      canGoPrev={canGoPrev}
      canGoNext={canGoNext}
      isFetching={isFetching}
      onPrevPage={onPrevPage}
      onNextPage={onNextPage}
      pageSize={ORDERS_PAGE_SIZE}
    />
  );
}
