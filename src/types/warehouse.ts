import type { ApiResponse } from "@/types/api";

export type WarehouseSortField = "createdAt" | "name" | "code" | "isActive";
export type SortDirection = "asc" | "desc";

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  address: string | null;
  managerName: string | null;
  managers?: WarehouseManager[] | null;
  timezone: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseManager {
  id: string;
  username: string;
  email?: string | null;
  fullName?: string | null;
  name?: string | null;
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
  managerIds?: string[];
  timezone?: string;
  isActive?: boolean;
}

export type UpdateWarehouseRequest = CreateWarehouseRequest;

export type WarehouseSummaryResponse = ApiResponse<WarehouseSummary>;
