import type { ApiResponse, PagedResponse } from "@/types/api";

export type PurchaseOrderStatus = string;

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate?: string | null;
  status?: PurchaseOrderStatus | null;
  totalAmount?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePurchaseOrderPayload {
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate?: string;
  status?: string;
  totalAmount?: number;
}

export interface PoItem {
  id: string;
  purchaseOrderId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  orderedQty: number;
  receivedQty?: number | null;
  unitPrice?: number | null;
}

export interface CreatePoItemPayload {
  purchaseOrderId: string;
  lineNumber: number;
  productId: string;
  productSku: string;
  orderedQty: number;
  receivedQty?: number;
  unitPrice?: number;
}

export interface ReceivePoItemPayload {
  poItemId: string;
  purchaseOrderId: string;
  body: { qty: number; suggestedLocationId?: string };
}

export type PutawayTaskStatus = "PENDING" | "IN_PROGRESS" | "CANCELLED" | string;

export interface PutawayTask {
  id: string;
  poItemId?: string | null;
  purchaseOrderId?: string | null;
  status: PutawayTaskStatus;
  suggestedLocationId?: string | null;
  actualLocationId?: string | null;
  assigneeId?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PatchPutawayTaskPayload {
  id: string;
  body: {
    suggestedLocationId?: string | null;
    assigneeId?: string | null;
    status?: PutawayTaskStatus;
  };
}

export interface CompletePutawayPayload {
  id: string;
  body: { actualLocationId: string };
}

export type ReceivePoItemResponse = ApiResponse<{
  poItem: PoItem;
  putawayTask?: PutawayTask | null;
}>;

export type PurchaseOrderListResponse = ApiResponse<PurchaseOrder[] | PagedResponse<PurchaseOrder>>;
