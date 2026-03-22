import type { ApiResponse } from "@/types/api";

export type WarehouseSortField = "createdAt" | "name" | "code" | "isActive";
export type SortDirection = "asc" | "desc";

export interface Warehouse {
  id: string;
  code?: string;
  name: string;
  address?: string;
  timezone?: string;
  managerName?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  zonesCount?: number;
  binsCount?: number;
  fillRatePercent?: number;
  type?: string;
}

export interface WarehouseSummary {
  totalWarehouses: number;
  activeWarehouses: number;
  inactiveWarehouses: number;
  warehousesWithStock: number;
  highFillRateWarehouses: number;
}

export type WarehouseSummaryResponse = ApiResponse<WarehouseSummary>;
