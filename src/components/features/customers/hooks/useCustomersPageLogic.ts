import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useDeleteCustomerMutation, useGetCustomersQuery } from "@/store/services/customer.service";
import { apiErrMessage, type PagedResponse } from "@/types/api";
import type { Customer } from "@/types/customer";
import {
  ALL_CUSTOMER_STATUS,
  CUSTOMER_STATUS_API_MAP,
  CUSTOMERS_PAGE_SIZE,
} from "@/components/features/customers/constants";

export function useCustomersPageLogic() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(CUSTOMERS_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState(ALL_CUSTOMER_STATUS);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const isActive = CUSTOMER_STATUS_API_MAP[statusFilter];

  const { data, isLoading, isFetching, isError, error, refetch } = useGetCustomersQuery({
    page,
    size: pageSize,
    keyword: debouncedKeyword || undefined,
    isActive,
  });

  const [deleteCustomer] = useDeleteCustomerMutation();

  const pagedBody = data?.data;
  const rows = useMemo(() => pagedBody?.content ?? [], [pagedBody]);

  const paged = useMemo((): Pick<
    PagedResponse<Customer>,
    "page" | "size" | "total_elements" | "total_pages"
  > | null => {
    if (!pagedBody || typeof pagedBody.page !== "number" || typeof pagedBody.total_pages !== "number") {
      return null;
    }

    return {
      page: pagedBody.page,
      size: pagedBody.size,
      total_elements: pagedBody.total_elements,
      total_pages: pagedBody.total_pages,
    };
  }, [pagedBody]);

  const canGoPrev = page > 0;
  const canGoNext = paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;

  const activeRowsCount = rows.filter((customer) => customer.isActive !== false).length;
  const inactiveRowsCount = rows.length - activeRowsCount;

  const hasAnyFilter = searchInput.trim().length > 0 || statusFilter !== ALL_CUSTOMER_STATUS;
  const advancedCount = Number(statusFilter !== ALL_CUSTOMER_STATUS);

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter(ALL_CUSTOMER_STATUS);
    setPage(0);
    setAdvancedOpen(false);
  };

  const openDeleteDialog = (target: { id: string; name: string }) => {
    setDeleteTarget(target);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    try {
      await deleteCustomer(deleteTarget.id).unwrap();
      toast.success(`Đã xóa khách hàng "${deleteTarget.name}"`);
    } catch (err) {
      toast.error(apiErrMessage(err));
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteTarget(null);
    }
  };

  return {
    searchInput,
    setSearchInput,
    page,
    setPage,
    pageSize,
    setPageSize,
    statusFilter,
    setStatusFilter,
    advancedOpen,
    setAdvancedOpen,

    rows,
    paged,
    activeRowsCount,
    inactiveRowsCount,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,

    canGoPrev,
    canGoNext,
    hasAnyFilter,
    advancedCount,
    clearFilters,

    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteTarget,
    openDeleteDialog,
    handleDelete,
  };
}
