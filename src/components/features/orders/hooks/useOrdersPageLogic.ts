"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  DEFAULT_OPERATION_DATE_PRESET,
  getOperationDateRange,
  type OperationDatePreset,
} from "@/lib/date-range";
import { useGetSalesOrdersQuery, useLazyGetSalesOrderBySoNumberQuery } from "@/store/services/order.service";
import { apiErrMessage } from "@/types/api";
import type { SalesOrder } from "@/types/sales-order";
import {
  ORDERS_PAGE_SIZE,
  ORDER_STATUS_LABEL_TO_API,
} from "@/components/features/orders/constants";

export function useOrdersPageLogic() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createdId = searchParams.get("created") || "";
  const [searchInput, setSearchInput] = useState("");
  const [soNumberLookup, setSoNumberLookup] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("Tất cả trạng thái");
  const [datePreset, setDatePreset] = useState<OperationDatePreset>(DEFAULT_OPERATION_DATE_PRESET);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(ORDERS_PAGE_SIZE);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [lookupByNumber, { isFetching: lookingUpByNumber }] = useLazyGetSalesOrderBySoNumberQuery();
  const debouncedKeyword = useDebouncedValue(searchInput.trim());
  const apiStatus = ORDER_STATUS_LABEL_TO_API[statusFilter] ?? "";
  const dateRange = useMemo(() => getOperationDateRange(datePreset), [datePreset]);

  const listParams = useMemo(
    () => ({
      page,
      size: pageSize,
      keyword: debouncedKeyword || undefined,
      status: apiStatus || undefined,
      ...dateRange,
    }),
    [page, pageSize, debouncedKeyword, apiStatus, dateRange],
  );

  const { data, error, isLoading, isFetching, refetch } = useGetSalesOrdersQuery(listParams);

  const rows: SalesOrder[] = useMemo(() => data?.data?.content ?? [], [data]);
  const totalElements = data?.data?.total_elements ?? 0;
  const totalPages = data?.data?.total_pages ?? 0;
  const canGoPrev = page > 0;
  const canGoNext = totalPages > 0 && page < totalPages - 1;

  const hasAnyFilter =
    searchInput.trim().length > 0 ||
    statusFilter !== "Tất cả trạng thái" ||
    datePreset !== DEFAULT_OPERATION_DATE_PRESET;
  const advancedCount =
    Number(statusFilter !== "Tất cả trạng thái") + Number(datePreset !== DEFAULT_OPERATION_DATE_PRESET);

  useEffect(() => {
    if (!createdId) return;
    toast.success("Da tao don xuat. Bam vao don de xem chi tiet va them san pham.");
  }, [createdId]);

  const clearFilters = () => {
    setSearchInput("");
    setStatusFilter("Tất cả trạng thái");
    setDatePreset(DEFAULT_OPERATION_DATE_PRESET);
    setPage(0);
  };

  const openOrderBySoNumber = async () => {
    const q = soNumberLookup.trim();
    if (!q) {
      toast.error("Nhap ma don (soNumber)");
      return;
    }
    try {
      const res = await lookupByNumber(q).unwrap();
      if (!res.success || !res.data?.id) {
        toast.error(res.message || "Khong tim thay don");
        return;
      }
      router.push(`/orders/${res.data.id}`);
    } catch (err) {
      toast.error(apiErrMessage(err, "Khong tim thay don theo ma."));
    }
  };

  return {
    createdId,
    searchInput,
    setSearchInput,
    soNumberLookup,
    setSoNumberLookup,
    statusFilter,
    setStatusFilter,
    datePreset,
    setDatePreset,
    page,
    setPage,
    pageSize,
    setPageSize,
    advancedOpen,
    setAdvancedOpen,
    lookingUpByNumber,
    openOrderBySoNumber,
    rows,
    error,
    isLoading,
    isFetching,
    refetch,
    totalElements,
    totalPages,
    canGoPrev,
    canGoNext,
    hasAnyFilter,
    advancedCount,
    clearFilters,
  };
}
