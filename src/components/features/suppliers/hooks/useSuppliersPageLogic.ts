import { useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetSuppliersQuery } from "@/store/services/supplier.service";
import { type Supplier, getSupplierDisplayName, isSupplierActive } from "@/types/supplier";
import { SUPPLIERS_PAGE_SIZE } from "@/components/features/suppliers/constants";
import { buildSuppliersPageMeta } from "@/components/features/suppliers/utils";

export function useSuppliersPageLogic() {
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  const { data, isLoading, isFetching, isError, error, refetch } = useGetSuppliersQuery({
    page,
    size: SUPPLIERS_PAGE_SIZE,
    sort: "createdAt",
    sortDir: "desc",
    ...(debouncedKeyword ? { keyword: debouncedKeyword } : {}),
  });

  const pagedBody = data?.data;
  const rows = useMemo(() => pagedBody?.content ?? [], [pagedBody]);
  const paged = useMemo(() => buildSuppliersPageMeta(pagedBody, rows.length), [pagedBody, rows.length]);

  const totalPartners = pagedBody?.total_elements ?? 0;
  const activeCount = useMemo(() => rows.filter((supplier) => isSupplierActive(supplier.status)).length, [rows]);
  const inactiveCount = useMemo(() => rows.filter((supplier) => !isSupplierActive(supplier.status)).length, [rows]);

  const multiPage = (paged?.total_pages ?? 1) > 1;
  const canGoPrev = page > 0;
  const canGoNext = paged != null && paged.total_pages > 0 && page < paged.total_pages - 1;
  const hasAnyFilter = searchInput.trim().length > 0;

  const clearFilters = () => {
    setSearchInput("");
    setPage(0);
  };

  const openDeleteDialog = (supplier: Supplier) => {
    setDeleteTarget({ id: supplier.id, name: getSupplierDisplayName(supplier) });
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    toast.info(`Chưa cấu hình API xóa nhà cung cấp cho ${deleteTarget.name}`);
    setIsDeleteDialogOpen(false);
    setDeleteTarget(null);
  };

  return {
    searchInput,
    setSearchInput,
    page,
    setPage,

    rows,
    paged,
    totalPartners,
    activeCount,
    inactiveCount,
    multiPage,

    isLoading,
    isFetching,
    isError,
    error,
    refetch,

    canGoPrev,
    canGoNext,
    hasAnyFilter,
    clearFilters,

    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    deleteTarget,
    openDeleteDialog,
    handleDelete,
  };
}
