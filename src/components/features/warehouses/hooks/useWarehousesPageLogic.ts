import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";
import type { SortDirection, WarehouseSortField } from "@/types/warehouse";
import {
  SORT_DIR_LABELS,
  SORT_DIR_OPTIONS,
  SORT_FIELD_LABELS,
  SORT_FIELD_OPTIONS,
  STATUS_LABEL_ACTIVE,
  STATUS_LABEL_ALL,
  STATUS_LABEL_INACTIVE,
  WAREHOUSES_PAGE_SIZE,
} from "@/components/features/warehouses/constants";

export function useWarehousesPageLogic() {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(WAREHOUSES_PAGE_SIZE);
  const [sort, setSort] = useState<WarehouseSortField>("createdAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  useEffect(() => {
    setPage(0);
  }, [debouncedKeyword, isActive, sort, sortDir]);

  const listParams = useMemo(
    () => ({
      page,
      size,
      sort,
      sortDir,
      keyword: debouncedKeyword || undefined,
      isActive,
    }),
    [page, size, sort, sortDir, debouncedKeyword, isActive],
  );

  const { data, error, isLoading, isFetching, refetch } =
    useGetWarehousesQuery(listParams);

  const warehouses = useMemo(() => data?.data?.content ?? [], [data]);
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;

  const statusValue =
    isActive === true
      ? STATUS_LABEL_ACTIVE
      : isActive === false
        ? STATUS_LABEL_INACTIVE
        : STATUS_LABEL_ALL;

  const sortValue =
    SORT_FIELD_OPTIONS.find((label) => SORT_FIELD_LABELS[label] === sort) ??
    "Ngày tạo";

  const sortDirValue =
    SORT_DIR_OPTIONS.find((label) => SORT_DIR_LABELS[label] === sortDir) ??
    "Giảm dần";

  const hasAnyFilter =
    searchInput.trim().length > 0 ||
    typeof isActive === "boolean" ||
    sort !== "createdAt" ||
    sortDir !== "desc";

  const advancedCount =
    Number(typeof isActive === "boolean") + Number(sort !== "createdAt") + Number(sortDir !== "desc");

  const clearFilters = () => {
    setSearchInput("");
    setIsActive(undefined);
    setSort("createdAt");
    setSortDir("desc");
    setPage(0);
    setSize(WAREHOUSES_PAGE_SIZE);
  };

  const handleStatusChange = (value: string) => {
    if (value === STATUS_LABEL_ACTIVE) {
      setIsActive(true);
      return;
    }
    if (value === STATUS_LABEL_INACTIVE) {
      setIsActive(false);
      return;
    }
    setIsActive(undefined);
  };

  const openDeleteDialog = (warehouseName: string) => {
    setItemToDelete(warehouseName);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    toast.info(`Chưa cấu hình API xóa kho cho ${itemToDelete}`);
    setIsDeleteDialogOpen(false);
    setItemToDelete("");
  };

  return {
    isDeleteDialogOpen,
    setIsDeleteDialogOpen,
    itemToDelete,

    searchInput,
    setSearchInput,

    page,
    setPage,
    size,
    setSize,
    sort,
    setSort,
    sortDir,
    setSortDir,
    isActive,
    advancedOpen,
    setAdvancedOpen,

    listParams,
    warehouses,
    totalElements,
    totalPages,

    error,
    isLoading,
    isFetching,
    refetch,

    statusValue,
    sortValue,
    sortDirValue,
    hasAnyFilter,
    advancedCount,

    clearFilters,
    handleStatusChange,
    openDeleteDialog,
    handleDelete,
  };
}
