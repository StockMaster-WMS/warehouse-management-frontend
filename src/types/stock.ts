import type { ApiResponse } from "@/types/api";

export interface Stock {
  id: string;
  productId: string;
  warehouseId?: string | null;
  locationId: string;
  qtyOnHand: number;
  qtyAvailable: number;
  qtyReserved?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type StockResponse = ApiResponse<Stock>;
