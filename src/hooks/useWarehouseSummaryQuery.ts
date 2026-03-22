"use client";

import { useQuery } from "@tanstack/react-query";
import { getWarehouseSummary } from "@/services/warehouse/warehouse.service";

export function useWarehouseSummaryQuery() {
  return useQuery({
    queryKey: ["warehouse-summary"],
    queryFn: getWarehouseSummary,
  });
}
