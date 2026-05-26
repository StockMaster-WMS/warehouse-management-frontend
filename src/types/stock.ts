import type { ApiResponse } from "@/types/api";

export interface Stock {
  id: string;
  productId: string;
  productSku?: string | null;
  productName?: string | null;
  warehouseId: string;
  locationId: string;
  locationCode?: string | null;
  warehouseCode?: string | null;
  lotNumber: string;
  expiryDate: string | null;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
  updatedAt: string;
}

export type WarehouseSummaryRef = {
  id: string;
  code: string;
  name: string;
};

export type LocationSummaryRef = {
  id: string;
  code: string;
  name: string;
};

export type ProductSummaryRef = {
  id: string;
  sku: string;
  name: string;
  minQty: number | null;
};

/** Stock expanded from backend: includes product/location/warehouse objects. */
export interface StockExpanded extends Stock {
  warehouse: WarehouseSummaryRef | null;
  location: LocationSummaryRef | null;
  product: ProductSummaryRef | null;
}

export interface StockSummaryResponse {
  totalSkus: number;
  totalQtyOnHand: number;
  totalQtyReserved: number;
  totalQtyAvailable: number;
  lowStockCount: number;
  nearExpiryCount: number;
}

export interface NearExpiryStockResponse {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  locationId: string;
  locationCode: string;
  productId: string;
  productSku?: string | null;
  productName?: string | null;
  lotNumber: string;
  expiryDate: string;
  daysLeft: number;
  qtyOnHand: number;
  qtyReserved: number;
  qtyAvailable: number;
}

export interface StockAdjustCommand {
  warehouseId: string;
  locationId: string;
  productId: string;
  lotNumber?: string;
  qtyDelta: number;
}

export interface StockReserveCommand {
  warehouseId: string;
  locationId: string;
  productId: string;
  lotNumber?: string;
  reservedDelta: number;
}

export interface StockMovementResponse {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  locationId: string;
  locationCode: string;
  productId: string;
  lotNumber: string;
  movementType: "INBOUND" | "OUTBOUND" | "RESERVE" | "RELEASE";
  qtyChange: number;
  qtyAfter: number;
  reservedChange: number;
  reservedAfter: number;
  reason: string | null;
  referenceType: string | null;
  referenceId: string | null;
  createdBy: string | null;
  createdAt: string;
}

export type StockResponse = ApiResponse<Stock>;
