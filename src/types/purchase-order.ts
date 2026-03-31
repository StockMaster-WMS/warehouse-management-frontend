import type { ApiResponse, PagedResponse } from "@/types/api";

export type PurchaseOrderStatus =
  | "DRAFT"
  | "APPROVED"
  | "PARTIAL"
  | "COMPLETED"
  | "CANCELLED";

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  warehouseId: string;
  supplierName?: string | null;
  warehouseName?: string | null;
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
    supplierId: string;
    warehouseId: string;
    orderDate: string;
    expectedDate: string | null;
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
  unitPrice?: number;
}

export interface UpdatePoItemPayload {
  id: string;
  body: {
    productId?: string;
    productSku?: string;
    orderedQty?: number;
    unitPrice?: number | null;
  };
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
  inboundReceiptId?: string | null;
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
  zone?: string;
  aisle?: string;
  rack?: string;
  level?: number;
  bin?: string;
  locationType?: string;
  status?: string;
  isActive?: boolean;
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

export type PurchaseOrderListResponse = ApiResponse<
  PurchaseOrder[] | PagedResponse<PurchaseOrder>
>;
