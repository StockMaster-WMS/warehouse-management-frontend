export type PickingItemStatus = "PENDING" | "PICKED";

export interface PickingItem {
  id: string;
  soItemId: string;
  productId: string;
  locationId: string;
  warehouseId?: string | null;
  lotNumber?: string | null;
  qtyToPick: number;
  qtyPicked?: number | null;
  status: PickingItemStatus;
  pickSequence?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  salesOrderNumber?: string | null;
  assigneeId?: string | null;
  
  // Extended fields from detailed API
  productSku?: string | null;
  productCode?: string | null;
  productName?: string | null;
  barcodeEan13?: string | null;
  categoryName?: string | null;
  baseUnit?: string | null;
  
  locationCode?: string | null;
  locationName?: string | null;
  zone?: string | null;
  aisle?: string | null;
  shelf?: string | null;
  position?: string | null;
  
  qtyAvailable?: number | null;
}

export type CreatePickingItemPayload = {
  soItemId: string;
  productId: string;
  locationId: string;
  lotNumber?: string | null;
  qtyToPick: number;
  status: PickingItemStatus;
  qtyPicked?: number;
  pickSequence?: number;
};

export type UpdatePickingItemPayload = {
  id: string;
  soItemId: string;
  productId: string;
  locationId: string;
  qtyToPick: number;
  qtyPicked: number;
  status: PickingItemStatus;
  pickSequence?: number | null;
  lotNumber?: string | null;
};

