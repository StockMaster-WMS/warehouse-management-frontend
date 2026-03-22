import type { ApiResponse, PagedResponse } from "@/types/api";

export type WarehouseSortField = "createdAt" | "name" | "code" | "isActive";
export type SortDirection = "asc" | "desc";

export interface WarehouseListParams {
  page?: number;
  size?: number;
  sort?: WarehouseSortField;
  sortDir?: SortDirection;
  keyword?: string;
  isActive?: boolean;
  timezone?: string;
}

export interface Warehouse {
  id: string;
  code?: string;
  name: string;
  address?: string;
  timezone?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  // UI compatibility fields mapped from backend contract.
  location?: string;
  managerName?: string;
  capacityPercent?: number;
  fillRatePercent?: number;
  zonesCount?: number;
  binsCount?: number;
  type?: string;
}

export interface WarehouseApiResponse {
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
}

export interface WarehouseSummary {
  totalWarehouses: number;
  activeWarehouses: number;
  inactiveWarehouses: number;
  warehousesWithStock: number;
  highFillRateWarehouses: number;
}

export type WarehouseListData = PagedResponse<Warehouse>;
export type WarehouseListResponse = ApiResponse<WarehouseListData>;
export type WarehouseSummaryResponse = ApiResponse<WarehouseSummary>;
