export type PickingItemStatus = "PENDING" | "PICKED";

export interface PickingItem {
  id: string;
  soItemId: string;
  productId: string;
  locationId: string;
  lotNumber?: string | null;
  qtyToPick: number;
  qtyPicked?: number | null;
  status: PickingItemStatus;
  pickSequence?: number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export type CreatePickingItemPayload = {
  soItemId: string;
  productId: string;
  locationId: string;
  qtyToPick: number;
  status: PickingItemStatus;
  qtyPicked?: number;
  pickSequence?: number;
};

/** Khớp UpdatePickingItemRequest (outbound-service): PUT bắt buộc đủ các trường, không chỉ qtyPicked/status. */
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

