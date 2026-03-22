"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { getWarehouseList } from "@/services/warehouse/warehouse.service";
import type {
  SortDirection,
  WarehouseListParams,
  WarehouseSortField,
} from "@/types/warehouse";

export const DEFAULT_WAREHOUSE_PAGE = 0;
export const DEFAULT_WAREHOUSE_SIZE = 20;
export const DEFAULT_WAREHOUSE_SORT: WarehouseSortField = "createdAt";
export const DEFAULT_WAREHOUSE_SORT_DIR: SortDirection = "desc";

type ControllerOptions = {
  initialParams?: WarehouseListParams;
};

export function useWarehouseListQuery(options: ControllerOptions = {}) {
  const initialParams = options.initialParams;
  const [page, setPage] = useState(
    initialParams?.page ?? DEFAULT_WAREHOUSE_PAGE,
  );
  const [size, setSize] = useState(
    initialParams?.size ?? DEFAULT_WAREHOUSE_SIZE,
  );
  const [sort, setSort] = useState<WarehouseSortField>(
    initialParams?.sort ?? DEFAULT_WAREHOUSE_SORT,
  );
  const [sortDir, setSortDir] = useState<SortDirection>(
    initialParams?.sortDir ?? DEFAULT_WAREHOUSE_SORT_DIR,
  );
  const [keyword, setKeyword] = useState(initialParams?.keyword ?? "");
  const [isActive, setIsActive] = useState<boolean | undefined>(
    initialParams?.isActive,
  );

  const timezone = initialParams?.timezone;

  const debouncedKeyword = useDebounce(keyword.trim(), 400);

  const params = useMemo<WarehouseListParams>(
    () => ({
      page,
      size,
      sort,
      sortDir,
      keyword: debouncedKeyword || undefined,
      isActive,
      timezone,
    }),
    [page, size, sort, sortDir, debouncedKeyword, isActive, timezone],
  );

  const query = useQuery({
    queryKey: ["warehouse-list", params],
    queryFn: () => getWarehouseList(params),
    placeholderData: keepPreviousData,
  });

  const data = query.data;

  const totalPages = data?.total_pages ?? 0;
  const totalElements = data?.total_elements ?? 0;
  const content = data?.content ?? [];

  const updateKeyword = (value: string) => {
    setKeyword(value);
    setPage(DEFAULT_WAREHOUSE_PAGE);
  };

  const updateIsActive = (value: boolean | undefined) => {
    setIsActive(value);
    setPage(DEFAULT_WAREHOUSE_PAGE);
  };

  const updateSort = (value: WarehouseSortField) => {
    setSort(value);
    setPage(DEFAULT_WAREHOUSE_PAGE);
  };

  const updateSortDir = (value: SortDirection) => {
    setSortDir(value);
    setPage(DEFAULT_WAREHOUSE_PAGE);
  };

  const updateSize = (value: number) => {
    setSize(value);
    setPage(DEFAULT_WAREHOUSE_PAGE);
  };

  const resetFilters = () => {
    setKeyword("");
    setIsActive(undefined);
    setSort(DEFAULT_WAREHOUSE_SORT);
    setSortDir(DEFAULT_WAREHOUSE_SORT_DIR);
    setPage(DEFAULT_WAREHOUSE_PAGE);
    setSize(DEFAULT_WAREHOUSE_SIZE);
  };

  return {
    ...query,
    warehouses: content,
    page,
    size,
    sort,
    sortDir,
    keyword,
    isActive,
    totalPages,
    totalElements,
    setPage,
    setKeyword: updateKeyword,
    setIsActive: updateIsActive,
    setSort: updateSort,
    setSortDir: updateSortDir,
    setSize: updateSize,
    resetFilters,
  };
}
