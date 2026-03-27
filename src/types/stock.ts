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

export type StockRef = {
  id: string;
  code?: string | null;
  name?: string | null;
};

export type StockProductRef = {
  id: string;
  sku?: string | null;
  name?: string | null;
  minQty?: number | null;
  maxQty?: number | null;
  unitPrice?: number | null;
};

/** Stock expanded from backend: includes product/location/warehouse objects. */
export interface StockExpanded extends Stock {
  lotNumber?: string | null;
  expiryDate?: string | null;
  warehouse?: StockRef | null;
  location?: StockRef | null;
  product?: StockProductRef | null;
}

export type StockResponse = ApiResponse<Stock>;
