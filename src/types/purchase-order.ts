import type { ApiResponse, PagedResponse } from "@/types/api";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "PENDING"
  | "APPROVED"
  | "RECEIVING"
  | "COMPLETED"
  | "CANCELLED";

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

export interface PurchaseOrderProgress {
  totalOrderedQty: number;
  totalReceivedQty: number;
  fullyReceived: boolean;
}

export interface PurchaseOrderDetail {
  purchaseOrder: PurchaseOrder;
  items: PoItem[];
  putawayTasks: PutawayTask[];
  progress: PurchaseOrderProgress;
}

export interface CreatePurchaseOrderRequest {
  supplierId: string;
  warehouseId: string;
  orderDate: string;
  expectedDate?: string;
  totalAmount?: number;
}

export type CreatePurchaseOrderPayload = CreatePurchaseOrderRequest;

export interface UpdatePurchaseOrderPayload {
  id: string;
  body: Partial<{
    poNumber: string;
    supplierId: string;
    warehouseId: string;
    orderDate: string;
    expectedDate: string | null;
    status: PurchaseOrderStatus;
    totalAmount: number | null;
  }>;
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

export interface UpdatePoItemPayload {
  id: string;
  purchaseOrderId: string;
  body: Partial<{
    lineNumber: number;
    productId: string;
    productSku: string;
    orderedQty: number;
    receivedQty: number;
    unitPrice: number | null;
  }>;
}

export interface ReceivePoItemPayload {
  poItemId: string;
  purchaseOrderId: string;
  body: { qty: number; suggestedLocationId?: string };
}

export type PutawayTaskStatus =
  | "PENDING"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

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

export interface LocationOption {
  id: string;
  warehouseId: string;
  code?: string;
  name?: string;
}

export interface StockSnapshot {
  id?: string;
  warehouseId?: string;
  locationId?: string;
  productId?: string;
  qty?: number;
  availableQty?: number;
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

export type PurchaseOrderListResponse = ApiResponse<
  PurchaseOrder[] | PagedResponse<PurchaseOrder>
>;
