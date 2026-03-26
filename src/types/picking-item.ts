export type PickingItemStatus = "PENDING" | "PICKED";

export interface PickingItem {
  id: string;
  soItemId: string;
  productId: string;
  locationId: string;
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

export type UpdatePickingItemPayload = {
  id: string;
  qtyPicked: number;
  status: PickingItemStatus;
};

