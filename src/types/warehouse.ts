import type { ApiResponse } from "@/types/api";

export type WarehouseSortField = "createdAt" | "name" | "code" | "isActive";
export type SortDirection = "asc" | "desc";

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  managerName: string | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseSummary {
  totalWarehouses: number;
  activeWarehouses: number;
  inactiveWarehouses: number;
  warehousesWithStock: number;
}

export interface CreateWarehouseRequest {
  code: string;
  name: string;
  address?: string;
  managerName?: string;
  timezone?: string;
  isActive?: boolean;
}

export type UpdateWarehouseRequest = CreateWarehouseRequest;

export type WarehouseSummaryResponse = ApiResponse<WarehouseSummary>;
