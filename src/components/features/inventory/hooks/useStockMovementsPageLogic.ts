import { useCallback, useMemo, useState } from "react";
import { useGetStockMovementsQuery } from "@/store/services/stock.service";
import { useGetWarehousesQuery } from "@/store/services/warehouse.service";

const MOVEMENTS_PAGE_SIZE = 20;

export function useStockMovementsPageLogic() {
  const [warehouseId, setWarehouseId] = useState("");
  const [movementType, setMovementType] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(0);

  // ── Advanced filter toggle ──
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const advancedCount = useMemo(() => {
    let count = 0;
    if (warehouseId) count++;
    if (movementType) count++;
    if (fromDate) count++;
    if (toDate) count++;
    return count;
  }, [warehouseId, movementType, fromDate, toDate]);

  const hasAnyFilter = !!(warehouseId || movementType || fromDate || toDate);

  const clearFilters = useCallback(() => {
    setWarehouseId("");
    setMovementType("");
    setFromDate("");
    setToDate("");
    setPage(0);
  }, []);

  const updateWarehouseId = useCallback((value: string) => {
    setWarehouseId(value);
    setPage(0);
  }, []);

  const updateMovementType = useCallback((value: string) => {
    setMovementType(value);
    setPage(0);
  }, []);

  const updateFromDate = useCallback((value: string) => {
    setFromDate(value);
    setPage(0);
  }, []);

  const updateToDate = useCallback((value: string) => {
    setToDate(value);
    setPage(0);
  }, []);

  const { data: warehousesRes, isLoading: isWarehousesLoading } = useGetWarehousesQuery({
    page: 0,
    size: 200,
    sort: "name",
    sortDir: "asc",
  });
  const warehouses = useMemo(() => warehousesRes?.data?.content ?? [], [warehousesRes]);

  const {
    data: movementsRes,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useGetStockMovementsQuery({
    page,
    size: MOVEMENTS_PAGE_SIZE,
    sort: "createdAt",
    sortDir: "desc",
    warehouseId: warehouseId || undefined,
    movementType: movementType || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  });

  const movements = useMemo(() => movementsRes?.data?.content ?? [], [movementsRes]);
  const totalElements = movementsRes?.data?.total_elements ?? 0;
  const totalPages = movementsRes?.data?.total_pages ?? 0;
  const canGoPrev = page > 0;
  const canGoNext = totalPages > 0 && page + 1 < totalPages;

  return {
    warehouseId,
    setWarehouseId: updateWarehouseId,
    movementType,
    setMovementType: updateMovementType,
    fromDate,
    setFromDate: updateFromDate,
    toDate,
    setToDate: updateToDate,
    warehouses,
    isWarehousesLoading,

    // Advanced filter
    advancedOpen,
    setAdvancedOpen,
    advancedCount,
    hasAnyFilter,
    clearFilters,

    movements,
    totalElements,
    totalPages,
    isLoading,
    isFetching,
    error,
    refetch,

    page,
    setPage,
    pageSize: MOVEMENTS_PAGE_SIZE,
    canGoPrev,
    canGoNext,
  };
}
